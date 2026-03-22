# OpenClaw Skill Tester

🧪 CLI tool to test and validate OpenClaw skills - automated quality checks, dependency verification, and testing reports.

## Why?

With 5,400+ skills in the OpenClaw ecosystem, it's hard to know which ones work reliably. This tool helps:

- **Skill developers**: Test your skills before publishing
- **Skill users**: Verify a skill works before installing
- **CI/CD**: Automate skill quality checks

## Features (Phase 1 - CLI)

- ✅ Validate skill structure (SKILL.md, dependencies)
- ✅ Check for required files and metadata
- ✅ Test skill execution in isolated environment
- ✅ Generate quality reports with scores
- ✅ Support for batch testing multiple skills

## Installation

```bash
npm install -g openclaw-skill-tester
```

**Package:** https://www.npmjs.com/package/openclaw-skill-tester

## Usage

### Test a Single Skill

```bash
openclaw-skill-tester test ./path/to/skill
```

### Batch Testing

Test multiple skills in a directory:

```bash
openclaw-skill-tester test ./skills --batch
```

### JSON Output

```bash
openclaw-skill-tester test ./skill --report json
```

### CI/CD Integration

Exit with code 1 if tests fail (perfect for CI pipelines):

```bash
openclaw-skill-tester test ./skill --ci
```

### GitHub Actions Example

```yaml
name: Test Skill Quality
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install -g openclaw-skill-tester
      - run: openclaw-skill-tester test . --ci
```

### Web Interface (Phase 3)

Run the web server locally:

```bash
git clone https://github.com/alex-vbcoding/openclaw-skill-tester.git
cd openclaw-skill-tester
npm install
npm run web
```

Then open http://localhost:3000 to see skill rankings and test results!

## Roadmap

**Phase 1** (Complete ✅): CLI tool
- [x] Project setup
- [x] Skill structure validation
- [x] Quality scoring (0-100)
- [x] Report generation (text + JSON)
- [x] Batch testing
- [x] CI/CD integration
- [x] Security checks (credentials, dangerous patterns)
- [x] Published to npm v0.1.0

**Phase 2** (Complete ✅): Advanced testing
- [x] Basic execution tests (npm install + run)
- [x] Dependency conflict detection
- [x] Security vulnerability scanning (npm audit)
- [x] Performance benchmarks (size, load time)
- [x] Dependency analysis
- [x] --no-execution and --no-performance flags

**Phase 3** (Complete ✅): Web interface
- [x] Web server (Express + SQLite)
- [x] Database for test results
- [x] Beautiful responsive UI
- [x] Skill rankings page
- [x] Recent tests display
- [x] Directory upload functionality
- [x] Real-time test execution
- [x] Automatic page refresh with results
- [ ] Community ratings (future enhancement)
- [ ] Public deployment (future)

## Contributing

Contributions welcome! This project is maintained by Alex Chen (alex@metaleap.so).

## License

MIT

---

**Status**: 🚧 Active development - first commit $(date +%Y-%m-%d)
