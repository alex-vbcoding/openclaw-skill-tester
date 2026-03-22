const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

/**
 * Check for dependency conflicts and vulnerabilities
 */
async function checkDependencyConflicts(skillPath) {
  const packageJsonPath = path.join(skillPath, 'package.json');
  
  if (!await fs.pathExists(packageJsonPath)) {
    return {
      passed: true,
      message: 'No package.json (not a Node.js skill)',
      skipped: true
    };
  }

  const issues = [];
  const warnings = [];

  try {
    const pkg = await fs.readJson(packageJsonPath);
    
    // Check for conflicting peer dependencies
    if (pkg.peerDependencies) {
      for (const [dep, version] of Object.entries(pkg.peerDependencies)) {
        if (pkg.dependencies && pkg.dependencies[dep]) {
          warnings.push(`${dep} is both a dependency and peerDependency`);
        }
      }
    }

    // Check for deprecated packages (common ones)
    const deprecatedPackages = [
      'request', 'node-uuid', 'colors', 'npmlog'
    ];
    
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies
    };

    for (const dep of deprecatedPackages) {
      if (allDeps[dep]) {
        warnings.push(`Using deprecated package: ${dep}`);
      }
    }

    // Check for wildcard versions (dangerous)
    for (const [dep, version] of Object.entries(allDeps)) {
      if (version === '*' || version === 'latest') {
        issues.push(`Wildcard version for ${dep}: "${version}" (use specific versions)`);
      }
    }

    // Try npm ls to check for conflicts (if node_modules exists)
    const nodeModulesPath = path.join(skillPath, 'node_modules');
    if (await fs.pathExists(nodeModulesPath)) {
      try {
        await execAsync('npm ls --json', { cwd: skillPath });
      } catch (error) {
        // npm ls exits with error if there are conflicts
        if (error.stdout) {
          const output = JSON.parse(error.stdout);
          if (output.problems) {
            output.problems.forEach(p => warnings.push(p));
          }
        }
      }
    }

    return {
      passed: issues.length === 0,
      message: issues.length === 0 ? 'No dependency conflicts' : issues.join('; '),
      warnings,
      skipped: false
    };
  } catch (error) {
    return {
      passed: false,
      message: `Dependency check failed: ${error.message}`,
      skipped: false
    };
  }
}

/**
 * Check for security vulnerabilities using npm audit
 */
async function checkSecurityVulnerabilities(skillPath) {
  const packageJsonPath = path.join(skillPath, 'package.json');
  
  if (!await fs.pathExists(packageJsonPath)) {
    return {
      passed: true,
      message: 'No package.json (not a Node.js skill)',
      skipped: true
    };
  }

  const nodeModulesPath = path.join(skillPath, 'node_modules');
  if (!await fs.pathExists(nodeModulesPath)) {
    return {
      passed: true,
      message: 'Dependencies not installed, skipping audit',
      skipped: true
    };
  }

  try {
    const { stdout } = await execAsync('npm audit --json', { 
      cwd: skillPath,
      timeout: 10000 
    });
    
    const audit = JSON.parse(stdout);
    const vulnCount = audit.metadata?.vulnerabilities || {};
    const total = Object.values(vulnCount).reduce((sum, count) => sum + count, 0);

    if (total === 0) {
      return {
        passed: true,
        message: 'No security vulnerabilities found',
        skipped: false
      };
    }

    const critical = vulnCount.critical || 0;
    const high = vulnCount.high || 0;

    return {
      passed: critical === 0 && high === 0,
      message: `Found ${total} vulnerabilities (${critical} critical, ${high} high)`,
      vulnerabilities: vulnCount,
      skipped: false
    };
  } catch (error) {
    // npm audit exits with error if vulnerabilities found
    if (error.stdout) {
      try {
        const audit = JSON.parse(error.stdout);
        const vulnCount = audit.metadata?.vulnerabilities || {};
        const critical = vulnCount.critical || 0;
        const high = vulnCount.high || 0;
        const total = Object.values(vulnCount).reduce((sum, count) => sum + count, 0);

        return {
          passed: critical === 0 && high === 0,
          message: `Found ${total} vulnerabilities (${critical} critical, ${high} high)`,
          vulnerabilities: vulnCount,
          skipped: false
        };
      } catch (parseError) {
        return {
          passed: false,
          message: `Security audit failed: ${error.message}`,
          skipped: false
        };
      }
    }

    return {
      passed: true,
      message: 'Security audit skipped (npm audit unavailable)',
      skipped: true
    };
  }
}

module.exports = {
  checkDependencyConflicts,
  checkSecurityVulnerabilities
};
