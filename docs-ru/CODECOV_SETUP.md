# Codecov Setup Guide

## Overview

This project uses Codecov for code coverage reporting with the following setup:
- **Frontend**: JavaScript/TypeScript coverage using Vitest
- **Backend**: Rust coverage using cargo-llvm-cov
- **Integration**: Codecov Vite plugin for bundle analysis

## Configuration

### 1. Vite Plugin Configuration

The Codecov Vite plugin is configured in `vitest.config.ts`:

```typescript
import { codecovVitePlugin } from "@codecov/vite-plugin"

export default defineConfig({
  plugins: [
    react(),
    codecovVitePlugin({
      enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
      bundleName: "timeline-studio",
      uploadToken: process.env.CODECOV_TOKEN,
    }),
  ],
  // ... rest of config
})
```

### 2. Coverage Settings

Coverage is configured in `vitest.config.ts`:

```typescript
coverage: {
  provider: "v8",
  reporter: ["text", "json", "html", "lcov"],
  exclude: [
    "node_modules/**",
    "src/test/**",
    "dist/**",
    "**/*.d.ts",
    "**/*.config.{js,ts}",
    "**/vite-env.d.ts",
    "**/*.test.{ts,tsx}",
    "**/__mocks__/**",
    "**/mocks/**",
    "src/components/ui/**", // UI components excluded
  ],
  include: ["src/**/*.{ts,tsx}"],
  reportsDirectory: "./coverage",
}
```

## Running Coverage Locally

### Frontend Coverage
```bash
# Run tests with coverage
npm run test:coverage

# Generate and upload coverage report
npm run test:coverage:report
```

### Backend Coverage
```bash
# Run Rust tests with coverage
npm run test:coverage:rust

# Generate and upload Rust coverage report
npm run test:coverage:rust:report
```

### Manual Upload
```bash
# Upload existing coverage files
./scripts/upload-coverage.sh
```

## GitHub Actions Integration

The `.github/workflows/test-coverage.yml` workflow automatically:
1. Runs tests with coverage on every push to main and PR
2. Uploads coverage using the Vite plugin (with CODECOV_TOKEN)
3. Falls back to standard Codecov action if needed
4. Handles both frontend and backend coverage

## Environment Variables

- `CODECOV_TOKEN`: Required for uploading coverage reports
  - Set in GitHub repository secrets
  - Available in CI environment
  - Used by both Vite plugin and upload scripts

## Bundle Analysis

When `CODECOV_TOKEN` is available, the Vite plugin also provides:
- Bundle size analysis
- Dependency tracking
- Performance metrics

These are visible in the Codecov dashboard under the "Bundle Analysis" tab.

## Badges

Coverage badges in README.md:
```markdown[![Frontend Coverage](https://img.shields.io/codecov/c/github/chatman-media/timeline-studio?flag=frontend&style=flat-square&label=frontend%20coverage)](https://codecov.io/gh/chatman-media/timeline-studio)
[![Backend Coverage](https://img.shields.io/codecov/c/github/chatman-media/timeline-studio?flag=backend&style=flat-square&label=backend%20coverage)](https://codecov.io/gh/chatman-media/timeline-studio)
```

## Troubleshooting

### Coverage Not Showing
1. Ensure repository is activated in Codecov dashboard
2. Check that `CODECOV_TOKEN` is set in GitHub secrets
3. Verify coverage files are generated (`./coverage/lcov.info`)

### Vite Plugin Issues
- The plugin requires `CODECOV_TOKEN` to be set
- Bundle analysis only works when token is available
- Check console output for plugin initialization messages

### Manual Testing
Test the plugin locally:
```bash
CODECOV_TOKEN=your_token_here npm run test:coverage
```