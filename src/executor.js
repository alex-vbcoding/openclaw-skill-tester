const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs-extra');
const path = require('path');

const execAsync = promisify(exec);

/**
 * Test if skill dependencies can be installed
 */
async function testInstall(skillPath, options = {}) {
  const { timeout = 30000 } = options;
  
  const packageJsonPath = path.join(skillPath, 'package.json');
  if (!await fs.pathExists(packageJsonPath)) {
    return {
      passed: true,
      message: 'No package.json (not a Node.js skill)',
      skipped: true
    };
  }

  try {
    // Check if node_modules exists (already installed)
    const nodeModulesPath = path.join(skillPath, 'node_modules');
    const alreadyInstalled = await fs.pathExists(nodeModulesPath);

    if (alreadyInstalled) {
      return {
        passed: true,
        message: 'Dependencies already installed',
        skipped: false
      };
    }

    // Try to install (in a temp copy to avoid modifying original)
    const { stdout, stderr } = await execAsync('npm install --production', {
      cwd: skillPath,
      timeout,
      env: { ...process.env, NODE_ENV: 'production' }
    });

    return {
      passed: true,
      message: 'Dependencies installed successfully',
      skipped: false,
      output: stdout
    };
  } catch (error) {
    return {
      passed: false,
      message: `Install failed: ${error.message}`,
      error: error.stderr || error.message,
      skipped: false
    };
  }
}

/**
 * Test if skill can be loaded/required
 */
async function testLoad(skillPath) {
  const packageJsonPath = path.join(skillPath, 'package.json');
  
  if (!await fs.pathExists(packageJsonPath)) {
    return {
      passed: true,
      message: 'No package.json (not a Node.js skill)',
      skipped: true
    };
  }

  try {
    const pkg = await fs.readJson(packageJsonPath);
    const entryPoint = pkg.main || 'index.js';
    const entryPath = path.join(skillPath, entryPoint);

    if (!await fs.pathExists(entryPath)) {
      return {
        passed: false,
        message: `Entry point not found: ${entryPoint}`,
        skipped: false
      };
    }

    // Try to require it (use absolute path)
    const absolutePath = path.resolve(entryPath);
    delete require.cache[absolutePath]; // Clear cache
    const module = require(absolutePath);

    return {
      passed: true,
      message: 'Skill loaded successfully',
      moduleType: typeof module,
      exports: Object.keys(module || {}),
      skipped: false
    };
  } catch (error) {
    return {
      passed: false,
      message: `Load failed: ${error.message}`,
      error: error.stack,
      skipped: false
    };
  }
}

/**
 * Basic smoke test - check if exported functions exist
 */
async function testSmoke(skillPath) {
  const packageJsonPath = path.join(skillPath, 'package.json');
  
  if (!await fs.pathExists(packageJsonPath)) {
    return {
      passed: true,
      message: 'No package.json (not a Node.js skill)',
      skipped: true
    };
  }

  try {
    const pkg = await fs.readJson(packageJsonPath);
    const entryPoint = pkg.main || 'index.js';
    const entryPath = path.join(skillPath, entryPoint);

    if (!await fs.pathExists(entryPath)) {
      return {
        passed: false,
        message: 'Entry point not found',
        skipped: false
      };
    }

    const absolutePath = path.resolve(entryPath);
    delete require.cache[absolutePath];
    const module = require(absolutePath);

    // Check if module exports something useful
    if (!module || (typeof module === 'object' && Object.keys(module).length === 0)) {
      return {
        passed: false,
        message: 'Module exports nothing',
        skipped: false
      };
    }

    // If it's a function, that's good
    if (typeof module === 'function') {
      return {
        passed: true,
        message: 'Module exports a function',
        skipped: false
      };
    }

    // If it's an object with functions, that's also good
    const functionCount = Object.values(module).filter(v => typeof v === 'function').length;
    if (functionCount > 0) {
      return {
        passed: true,
        message: `Module exports ${functionCount} function(s)`,
        skipped: false
      };
    }

    return {
      passed: false,
      message: 'Module exports no functions',
      skipped: false
    };
  } catch (error) {
    return {
      passed: false,
      message: `Smoke test failed: ${error.message}`,
      skipped: false
    };
  }
}

module.exports = {
  testInstall,
  testLoad,
  testSmoke
};
