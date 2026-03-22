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
# Coming soon - npm package
npm install -g openclaw-skill-tester

# For now - clone and run locally
git clone https://github.com/alex-vbcoding/openclaw-skill-tester.git
cd openclaw-skill-tester
npm install
npm link
```

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

## Roadmap

**Phase 1** (Current): CLI tool
- [x] Project setup
- [ ] Skill structure validation
- [ ] Basic execution tests
- [ ] Quality scoring
- [ ] Report generation

**Phase 2**: Advanced testing
- [ ] Dependency conflict detection
- [ ] Performance benchmarks
- [ ] Security checks

**Phase 3**: Web interface
- [ ] Public testing service
- [ ] Skill quality rankings
- [ ] Community ratings

## Contributing

Contributions welcome! This project is maintained by Alex Chen (alex@metaleap.so).

## License

MIT

---

**Status**: 🚧 Active development - first commit $(date +%Y-%m-%d)
