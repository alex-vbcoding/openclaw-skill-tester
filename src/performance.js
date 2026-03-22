const fs = require('fs-extra');
const path = require('path');

/**
 * Calculate package size metrics
 */
async function measureSize(skillPath) {
  try {
    let totalSize = 0;
    let fileCount = 0;

    async function walkDir(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        // Skip node_modules and .git
        if (entry.name === 'node_modules' || entry.name === '.git') {
          continue;
        }

        if (entry.isDirectory()) {
          await walkDir(fullPath);
        } else {
          const stats = await fs.stat(fullPath);
          totalSize += stats.size;
          fileCount++;
        }
      }
    }

    await walkDir(skillPath);

    const sizeKB = Math.round(totalSize / 1024);
    const sizeMB = (totalSize / 1024 / 1024).toFixed(2);

    return {
      passed: true,
      message: `${fileCount} files, ${sizeKB < 1024 ? sizeKB + ' KB' : sizeMB + ' MB'}`,
      metrics: {
        totalBytes: totalSize,
        sizeKB,
        sizeMB: parseFloat(sizeMB),
        fileCount
      },
      warnings: sizeKB > 10240 ? ['Package is large (>10MB), consider optimization'] : []
    };
  } catch (error) {
    return {
      passed: false,
      message: `Size measurement failed: ${error.message}`,
      metrics: null
    };
  }
}

/**
 * Measure load time of the skill
 */
async function measureLoadTime(skillPath) {
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
    const entryPath = path.resolve(skillPath, entryPoint);

    if (!await fs.pathExists(entryPath)) {
      return {
        passed: false,
        message: 'Entry point not found',
        skipped: false
      };
    }

    // Measure load time
    const start = process.hrtime.bigint();
    delete require.cache[entryPath];
    require(entryPath);
    const end = process.hrtime.bigint();

    const loadTimeMs = Number(end - start) / 1000000; // Convert to ms

    return {
      passed: loadTimeMs < 1000, // Should load in <1 second
      message: `Load time: ${loadTimeMs.toFixed(2)}ms`,
      metrics: {
        loadTimeMs: parseFloat(loadTimeMs.toFixed(2))
      },
      warnings: loadTimeMs > 500 ? ['Slow load time (>500ms)'] : [],
      skipped: false
    };
  } catch (error) {
    return {
      passed: false,
      message: `Load time measurement failed: ${error.message}`,
      skipped: false
    };
  }
}

/**
 * Check dependencies count and depth
 */
async function analyzeDependencies(skillPath) {
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
    
    const deps = Object.keys(pkg.dependencies || {}).length;
    const devDeps = Object.keys(pkg.devDependencies || {}).length;
    const total = deps + devDeps;

    const warnings = [];
    if (deps > 20) {
      warnings.push(`Many dependencies (${deps}), consider reducing`);
    }
    if (devDeps > 30) {
      warnings.push(`Many devDependencies (${devDeps})`);
    }

    return {
      passed: deps <= 50, // Reasonable limit
      message: `${deps} dependencies, ${devDeps} devDependencies`,
      metrics: {
        dependencies: deps,
        devDependencies: devDeps,
        total
      },
      warnings,
      skipped: false
    };
  } catch (error) {
    return {
      passed: false,
      message: `Dependency analysis failed: ${error.message}`,
      skipped: false
    };
  }
}

module.exports = {
  measureSize,
  measureLoadTime,
  analyzeDependencies
};
