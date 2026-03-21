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
  .action(async (skillPath, options) => {
    try {
      const result = await testSkill(skillPath, options);
      
      if (options.report === 'json') {
        console.log(JSON.stringify(result, null, 2));
      } else {
        printTextReport(result);
      }
      
      if (options.ci && !result.passed) {
        process.exit(1);
      }
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

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
