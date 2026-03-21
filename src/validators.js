const fs = require('fs-extra');
const path = require('path');

/**
 * Validate skill dependencies are properly declared
 */
async function validateDependencies(skillPath) {
  const packageJsonPath = path.join(skillPath, 'package.json');
  
  if (!await fs.pathExists(packageJsonPath)) {
    return { passed: true, message: 'No package.json (not a Node.js skill)' };
  }

  try {
    const pkg = await fs.readJson(packageJsonPath);
    const issues = [];

    // Check if dependencies are declared
    const hasAnyDeps = pkg.dependencies || pkg.devDependencies || pkg.peerDependencies;
    
    if (!hasAnyDeps) {
      issues.push('No dependencies declared');
    }

    // Check for common required fields
    if (!pkg.main && !pkg.bin) {
      issues.push('Missing "main" or "bin" entry point');
    }

    if (issues.length > 0) {
      return { 
        passed: false, 
        message: issues.join('; '),
        warnings: issues
      };
    }

    return { passed: true, message: 'Dependencies properly declared' };
  } catch (e) {
    return { passed: false, message: `Error reading package.json: ${e.message}` };
  }
}

/**
 * Check for security issues in skill files
 */
async function checkSecurity(skillPath) {
  const warnings = [];
  
  // Check for suspicious patterns in SKILL.md
  const skillMdPath = path.join(skillPath, 'SKILL.md');
  if (await fs.pathExists(skillMdPath)) {
    const content = await fs.readFile(skillMdPath, 'utf-8');
    
    // Check for hardcoded credentials
    if (/password\s*=|api[_-]?key\s*=|secret\s*=/i.test(content)) {
      warnings.push('Potential hardcoded credentials in SKILL.md');
    }
    
    // Check for eval/exec patterns
    if (/eval\(|exec\(|system\(/i.test(content)) {
      warnings.push('Potentially dangerous code execution patterns');
    }
  }

  return {
    passed: warnings.length === 0,
    message: warnings.length === 0 ? 'No security issues detected' : warnings.join('; '),
    warnings
  };
}

/**
 * Validate SKILL.md has required sections
 */
async function validateSkillMd(skillPath) {
  const skillMdPath = path.join(skillPath, 'SKILL.md');
  
  if (!await fs.pathExists(skillMdPath)) {
    return { passed: false, message: 'SKILL.md not found' };
  }

  const content = await fs.readFile(skillMdPath, 'utf-8');
  const issues = [];

  // Check for required sections
  if (!/^#\s+.+/m.test(content)) {
    issues.push('Missing title (# heading)');
  }

  if (content.length < 100) {
    issues.push('Description too short (<100 chars)');
  }

  if (!/##\s*usage/i.test(content)) {
    issues.push('Missing Usage section (recommended)');
  }

  if (!/##\s*installation/i.test(content) && !/##\s*setup/i.test(content)) {
    issues.push('Missing Installation/Setup section (recommended)');
  }

  return {
    passed: issues.length === 0,
    message: issues.length === 0 ? 'SKILL.md properly structured' : issues.join('; '),
    warnings: issues
  };
}

/**
 * Check for common files and structure
 */
async function validateStructure(skillPath) {
  const warnings = [];
  
  // Recommended files
  const recommendedFiles = [
    { file: 'LICENSE', message: 'No LICENSE file (recommended for open source)' },
    { file: '.gitignore', message: 'No .gitignore (recommended)' },
    { file: 'CHANGELOG.md', message: 'No CHANGELOG.md (recommended for versioning)' }
  ];

  for (const { file, message } of recommendedFiles) {
    if (!await fs.pathExists(path.join(skillPath, file))) {
      warnings.push(message);
    }
  }

  return {
    passed: true, // These are recommendations, not failures
    message: warnings.length === 0 ? 'Good project structure' : 'Missing recommended files',
    warnings
  };
}

module.exports = {
  validateDependencies,
  checkSecurity,
  validateSkillMd,
  validateStructure
};
