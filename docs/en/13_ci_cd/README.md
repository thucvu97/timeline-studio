# 13. CI/CD

Timeline Studio continuous integration and deployment documentation.

## 📋 Contents

*Documentation files will be added here*

## 🔄 CI/CD Processes

### Continuous Integration
- Automated tests on every commit
- Code quality checks (lint, format)
- Cross-platform builds
- Security dependency scanning

### Continuous Deployment
- Automated release builds
- Distribution packages for Windows, macOS, Linux
- GitHub Releases publishing
- Documentation updates

## 🚀 GitHub Actions Workflows

### Main Workflows
- **ci.yml** - Main CI pipeline
- **quick-check.yml** - Quick validation
- **windows-build.yml** - Specialized Windows build

### Release Workflows
- **release.yml** - Release creation
- **nightly.yml** - Nightly builds for testing

## 🛠️ Setup

```bash
# Local check before push
bun run check:all

# Run tests locally
bun run test:ci
```

---

[← To Testing](../12_testing/README.md) | [To QA →](../14_quality_assurance/README.md)