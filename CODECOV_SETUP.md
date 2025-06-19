# Codecov Setup Guide

## 🚀 Quick Start

### 1. Set up Codecov GitHub App
1. Go to https://github.com/apps/codecov
2. Click "Configure" and add your repository
3. Make sure `chatman-media/timeline-studio` is selected

### 2. Get your Codecov token
1. Go to https://app.codecov.io/gh/chatman-media/timeline-studio/settings
2. If repository not found, click "Add a repository" and search for `timeline-studio`
3. Copy your upload token (starts with a long string)

### 3. Set up GitHub Secret
1. Go to https://github.com/chatman-media/timeline-studio/settings/secrets/actions
2. Create new secret named `CODECOV_TOKEN`
3. Paste your token value

### 4. Upload coverage locally

```bash
# Set your token locally
export CODECOV_TOKEN=your_token_here

# Generate coverage reports
bun run test:coverage
bun run test:coverage:rust

# Upload to Codecov
bun run test:coverage:upload
```

## 📊 Viewing Coverage

- Frontend coverage: https://codecov.io/gh/chatman-media/timeline-studio?flag=frontend
- Backend coverage: https://codecov.io/gh/chatman-media/timeline-studio?flag=backend

## 🆘 Repository not found error?

If you get "Repository not found" error:

1. **Make sure Codecov GitHub App is installed**:
   - Go to https://github.com/apps/codecov
   - Click "Configure"
   - Select your organization or personal account
   - Make sure `timeline-studio` repository is selected

2. **Add repository in Codecov dashboard**:
   - Go to https://app.codecov.io/gh
   - Click "Add a repository" 
   - Search for `chatman-media/timeline-studio`
   - Click to add it

3. **Try alternative upload script**:
   ```bash
   # Use curl-based uploader
   ./scripts/upload-coverage-curl.sh
   ```

## 🔧 Troubleshooting

### Coverage not showing up?

1. **Check if workflow is running**:
   - Go to https://github.com/chatman-media/timeline-studio/actions/workflows/coverage.yml
   - Check if the workflow is enabled and running on push to main

2. **Verify token is correct**:
   ```bash
   # Test upload with verbose output
   ./scripts/upload-coverage.sh
   ```

3. **Check Codecov webhook**:
   - Go to https://codecov.io/gh/chatman-media/timeline-studio/settings
   - Verify GitHub integration is connected

### Badge shows "unknown"?

The badges will show "unknown" until:
1. Coverage data is successfully uploaded
2. Codecov processes the data (takes 1-2 minutes)
3. At least one successful upload from the main branch

### Manual badge URLs

If automatic badges don't work, use these direct URLs:

```markdown
[![Frontend Coverage](https://codecov.io/gh/chatman-media/timeline-studio/branch/main/graph/badge.svg?flag=frontend)](https://codecov.io/gh/chatman-media/timeline-studio)
[![Backend Coverage](https://codecov.io/gh/chatman-media/timeline-studio/branch/main/graph/badge.svg?flag=backend)](https://codecov.io/gh/chatman-media/timeline-studio)
```

## 📝 Notes

- Coverage is uploaded automatically on push to `main` branch
- Pull requests will show coverage diff
- The `codecov.yml` configures separate flags for frontend/backend
- Coverage files are gitignored and should not be committed