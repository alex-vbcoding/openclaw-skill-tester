const fs = require('fs-extra');
const path = require('path');
const {
  validateDependencies,
  checkSecurity,
  validateSkillMd,
  validateStructure
} = require('./validators');
const {
  testInstall,
  testLoad,
  testSmoke
} = require('./executor');
const {
  checkDependencyConflicts,
  checkSecurityVulnerabilities
} = require('./dependency-checker');
const {
  measureSize,
  measureLoadTime,
  analyzeDependencies
} = require('./performance');

async function testSkill(skillPath, options = {}) {
  const result = {
    skillName: path.basename(skillPath),
    skillPath,
    passed: true,
    score: 0,
    tests: [],
    warnings: []
  };

  // Test 1: Check if skill directory exists
  const dirExists = await fs.pathExists(skillPath);
  addTest(result, 'Directory exists', dirExists, 
    dirExists ? 'Skill directory found' : 'Skill directory not found');
  
  if (!dirExists) {
    result.passed = false;
    return result;
  }

  // Test 2: Check for SKILL.md
  const skillMdPath = path.join(skillPath, 'SKILL.md');
  const hasSkillMd = await fs.pathExists(skillMdPath);
  addTest(result, 'SKILL.md exists', hasSkillMd,
    hasSkillMd ? 'Found SKILL.md' : 'Missing SKILL.md (required)');
  
  if (!hasSkillMd) {
    result.passed = false;
    return result;
  }

  // Test 3: Validate SKILL.md structure
  const skillMdContent = await fs.readFile(skillMdPath, 'utf-8');
  const hasTitle = /^#\s+.+/m.test(skillMdContent);
  const hasDescription = skillMdContent.length > 50;
  
  addTest(result, 'SKILL.md has title', hasTitle,
    hasTitle ? 'Title found' : 'Missing skill title');
  
  addTest(result, 'SKILL.md has description', hasDescription,
    hasDescription ? 'Description present' : 'Description too short');

  // Test 4: Check for package.json (if it's a Node.js skill)
  const packageJsonPath = path.join(skillPath, 'package.json');
  const hasPackageJson = await fs.pathExists(packageJsonPath);
  
  if (hasPackageJson) {
    try {
      const pkg = await fs.readJson(packageJsonPath);
      addTest(result, 'Valid package.json', true, 'Valid JSON structure');
      
      if (!pkg.name) {
        result.warnings.push('package.json missing "name" field');
      }
      if (!pkg.version) {
        result.warnings.push('package.json missing "version" field');
      }
    } catch (e) {
      addTest(result, 'Valid package.json', false, `Invalid JSON: ${e.message}`);
    }
  }

  // Test 5: Check for README
  const readmePath = path.join(skillPath, 'README.md');
  const hasReadme = await fs.pathExists(readmePath);
  
  if (!hasReadme) {
    result.warnings.push('No README.md found (recommended)');
  } else {
    addTest(result, 'README.md exists', true, 'Documentation found');
  }

  // Test 6: Validate dependencies
  const depsCheck = await validateDependencies(skillPath);
  if (depsCheck.warnings) {
    result.warnings.push(...depsCheck.warnings);
  }
  addTest(result, 'Dependencies validation', depsCheck.passed, depsCheck.message);

  // Test 7: Security checks
  const securityCheck = await checkSecurity(skillPath);
  if (securityCheck.warnings) {
    result.warnings.push(...securityCheck.warnings);
  }
  addTest(result, 'Security check', securityCheck.passed, securityCheck.message);

  // Test 8: Advanced SKILL.md validation
  const skillMdCheck = await validateSkillMd(skillPath);
  if (skillMdCheck.warnings) {
    result.warnings.push(...skillMdCheck.warnings);
  }
  addTest(result, 'SKILL.md structure', skillMdCheck.passed, skillMdCheck.message);

  // Test 9: Project structure recommendations
  const structureCheck = await validateStructure(skillPath);
  if (structureCheck.warnings) {
    result.warnings.push(...structureCheck.warnings);
  }

  // Execution tests (Phase 2) - optional, controlled by option
  if (options.execution !== false) {
    // Test 10: Dependency installation
    const installCheck = await testInstall(skillPath);
    if (!installCheck.skipped) {
      addTest(result, 'Dependency installation', installCheck.passed, installCheck.message);
    }

    // Test 11: Module loading
    const loadCheck = await testLoad(skillPath);
    if (!loadCheck.skipped) {
      addTest(result, 'Module loading', loadCheck.passed, loadCheck.message);
    }

    // Test 12: Smoke test
    const smokeCheck = await testSmoke(skillPath);
    if (!smokeCheck.skipped) {
      addTest(result, 'Smoke test', smokeCheck.passed, smokeCheck.message);
    }

    // Test 13: Dependency conflicts
    const conflictCheck = await checkDependencyConflicts(skillPath);
    if (!conflictCheck.skipped) {
      if (conflictCheck.warnings) {
        result.warnings.push(...conflictCheck.warnings);
      }
      addTest(result, 'Dependency conflicts', conflictCheck.passed, conflictCheck.message);
    }

    // Test 14: Security vulnerabilities
    const securityAudit = await checkSecurityVulnerabilities(skillPath);
    if (!securityAudit.skipped) {
      addTest(result, 'Security audit', securityAudit.passed, securityAudit.message);
      if (securityAudit.vulnerabilities) {
        result.securityVulnerabilities = securityAudit.vulnerabilities;
      }
    }
  }

  // Performance tests (always run, lightweight)
  if (options.performance !== false) {
    // Test 15: Package size
    const sizeCheck = await measureSize(skillPath);
    if (sizeCheck.warnings) {
      result.warnings.push(...sizeCheck.warnings);
    }
    addTest(result, 'Package size', sizeCheck.passed, sizeCheck.message);
    if (sizeCheck.metrics) {
      result.sizeMetrics = sizeCheck.metrics;
    }

    // Test 16: Load time (only if execution tests are enabled)
    if (options.execution !== false) {
      const loadTimeCheck = await measureLoadTime(skillPath);
      if (!loadTimeCheck.skipped) {
        if (loadTimeCheck.warnings) {
          result.warnings.push(...loadTimeCheck.warnings);
        }
        addTest(result, 'Load time', loadTimeCheck.passed, loadTimeCheck.message);
        if (loadTimeCheck.metrics) {
          result.performanceMetrics = loadTimeCheck.metrics;
        }
      }
    }

    // Test 17: Dependency analysis
    const depsAnalysis = await analyzeDependencies(skillPath);
    if (!depsAnalysis.skipped) {
      if (depsAnalysis.warnings) {
        result.warnings.push(...depsAnalysis.warnings);
      }
      addTest(result, 'Dependency analysis', depsAnalysis.passed, depsAnalysis.message);
      if (depsAnalysis.metrics) {
        result.dependencyMetrics = depsAnalysis.metrics;
      }
    }
  }

  // Calculate score
  const passedTests = result.tests.filter(t => t.passed).length;
  const totalTests = result.tests.length;
  result.score = Math.round((passedTests / totalTests) * 100);
  
  // Mark as failed if critical tests didn't pass
  const criticalFails = result.tests.filter(t => 
    !t.passed && (t.name.includes('exists') || t.name.includes('SKILL.md'))
  );
  
  if (criticalFails.length > 0) {
    result.passed = false;
  }

  return result;
}

function addTest(result, name, passed, message) {
  result.tests.push({ name, passed, message });
}

module.exports = { testSkill };
