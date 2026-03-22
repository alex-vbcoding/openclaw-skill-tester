#!/usr/bin/env node

const { Command } = require('commander');
const { testSkill } = require('../src/tester');
const { version } = require('../package.json');

const program = new Command();

program
  .name('openclaw-skill-tester')
  .description('CLI tool to test and validate OpenClaw skills')
  .version(version);

program
  .command('test <skillPath>')
  .description('Test a skill and generate quality report')
  .option('-r, --report <format>', 'Report format (json|text)', 'text')
  .option('--ci', 'CI mode - exit with code 1 if tests fail')
  .option('-b, --batch', 'Treat skillPath as directory containing multiple skills')
  .option('--no-execution', 'Skip execution tests (install/load/smoke)')
  .option('--no-performance', 'Skip performance tests (size/load time/deps)')
  .action(async (skillPath, options) => {
    try {
      if (options.batch) {
        await testBatch(skillPath, options);
      } else {
        const result = await testSkill(skillPath, options);
        
        if (options.report === 'json') {
          console.log(JSON.stringify(result, null, 2));
        } else {
          printTextReport(result);
        }
        
        if (options.ci && !result.passed) {
          process.exit(1);
        }
      }
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

async function testBatch(directory, options) {
  const fs = require('fs-extra');
  const path = require('path');
  
  const entries = await fs.readdir(directory);
  const results = [];
  let totalPassed = 0;
  let totalFailed = 0;
  
  for (const entry of entries) {
    const skillPath = path.join(directory, entry);
    const stat = await fs.stat(skillPath);
    
    if (stat.isDirectory()) {
      try {
        const result = await testSkill(skillPath, { ...options, report: 'json' });
        results.push(result);
        
        if (result.passed) {
          totalPassed++;
        } else {
          totalFailed++;
        }
      } catch (e) {
        results.push({
          skillName: entry,
          skillPath,
          error: e.message,
          passed: false
        });
        totalFailed++;
      }
    }
  }
  
  if (options.report === 'json') {
    console.log(JSON.stringify({
      summary: { total: results.length, passed: totalPassed, failed: totalFailed },
      results
    }, null, 2));
  } else {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Batch Test Summary');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`Total: ${results.length} | Passed: ${totalPassed} | Failed: ${totalFailed}\n`);
    
    results.forEach(r => {
      const icon = r.passed ? '✅' : '❌';
      const score = r.score !== undefined ? ` (${r.score}/100)` : '';
      console.log(`${icon} ${r.skillName}${score}`);
      if (r.error) {
        console.log(`   Error: ${r.error}`);
      }
    });
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }
  
  if (options.ci && totalFailed > 0) {
    process.exit(1);
  }
}

function printTextReport(result) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 OpenClaw Skill Test Report');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log(`Skill: ${result.skillName}`);
  console.log(`Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Quality Score: ${result.score}/100\n`);
  
  console.log('Test Results:');
  result.tests.forEach(test => {
    const icon = test.passed ? '✓' : '✗';
    console.log(`  ${icon} ${test.name}: ${test.message}`);
  });
  
  if (result.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    result.warnings.forEach(w => console.log(`  - ${w}`));
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

program.parse();
