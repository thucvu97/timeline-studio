# Windows CI Build Issues - Troubleshooting Guide

## Problem
The Windows builds on GitHub Actions are timing out during `npm ci` with the error:
```
Terminate batch job (Y/N)? 
^C
Error: The operation was canceled.
```

## Solutions Applied

### 1. Improved npm Configuration
Updated all workflows to use better npm settings for Windows:
```yaml
- name: Install dependencies from lockfile
  run: |
    npm config set fetch-timeout 300000
    npm config set fetch-retries 5
    npm ci --prefer-offline --no-audit --no-fund
```

**What this does:**
- `fetch-timeout: 300000` - Increases timeout to 5 minutes per package
- `fetch-retries: 5` - Retries failed downloads 5 times
- `--prefer-offline` - Uses cached packages when available
- `--no-audit` - Skips security audit (faster)
- `--no-fund` - Skips funding messages (faster)

### 2. Alternative: Bun-based Workflow
Created `lint-js-bun.yml` as an alternative that uses Bun instead of npm:
- Bun is significantly faster on Windows
- Better handling of large dependency trees
- Can be triggered manually via workflow_dispatch

### 3. Additional Recommendations

If issues persist, try these solutions:

#### A. Use npm cache action
```yaml
- name: Cache node modules
  uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

#### B. Split Windows jobs
Run Windows CI only for critical paths:
```yaml
matrix:
  os: [ubuntu-latest]  # Remove windows-latest for non-critical workflows
```

#### C. Use setup-node with specific npm version
```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    npm-version: '9.x'  # Use specific npm version
```

#### D. Clear npm cache before install
```yaml
- name: Clear npm cache on Windows
  if: matrix.os == 'windows-latest'
  run: npm cache clean --force
```

## Monitoring

Watch these workflows:
- `lint-js.yml` - Main JS/TS linting
- `lint-rs.yml` - Rust linting (includes npm for frontend)
- `check-all.yml` - Combined checks

## When to Use Bun Workflow

Use the Bun-based workflow (`lint-js-bun.yml`) when:
1. Regular npm CI continues to fail on Windows
2. You need faster CI runs
3. Testing compatibility with Bun

Trigger it manually from Actions tab → "Lint Node.js (Bun)" → Run workflow