# GitHub Actions Workflows

## Overview

This repository contains optimized CI/CD workflows designed to handle the complex FFmpeg dependencies required by Timeline Studio.

## Workflows

### 1. `ci.yml` - Main CI Pipeline
**Purpose**: Complete testing and building across all platforms
**Triggers**: Push to main/develop, PRs to main
**Key Features**:
- Frontend testing with Bun
- Backend testing with optimized FFmpeg setup
- Cross-platform support (Linux, Windows, macOS)
- Intelligent caching for dependencies

### 2. `quick-check.yml` - Fast Validation
**Purpose**: Quick feedback for common issues
**Triggers**: Push to main/develop, PRs to main
**Key Features**:
- Lint and format checks
- Critical backend tests only
- Runs in under 5 minutes

### 3. `windows-build.yml` - Windows-Specific Build
**Purpose**: Dedicated Windows builds with enhanced FFmpeg handling
**Triggers**: Push to main, manual dispatch
**Key Features**:
- Optimized FFmpeg installation (avoids vcpkg hanging)
- Comprehensive environment verification
- Timeout protection
- Artifact uploads

## Windows FFmpeg Setup Strategy

The workflows implement a three-tier approach to FFmpeg installation on Windows:

1. **Primary**: GitHub releases (BtbN/FFmpeg-Builds) - fastest, includes dev headers
2. **Fallback**: Gyan.dev builds - reliable but slower
3. **Last Resort**: vcpkg build (disabled due to hanging issues)

### Key Environment Variables Set

```powershell
FFMPEG_DIR=C:\ffmpeg
FFMPEG_INCLUDE_DIR=C:\ffmpeg\include
FFMPEG_LIB_DIR=C:\ffmpeg\lib
FFMPEG_LINK_TYPE=dynamic
FFMPEG_NO_PKG_CONFIG=1
BINDGEN_EXTRA_CLANG_ARGS=-IC:\ffmpeg\include
PKG_CONFIG_PATH=C:\ffmpeg\lib\pkgconfig
```

## Troubleshooting Common Issues

### Issue: "fatal error: '/usr/include/libavcodec/avfft.h' file not found"
**Cause**: ffmpeg-sys-next trying to use Unix paths on Windows
**Solution**: Set `BINDGEN_EXTRA_CLANG_ARGS` and `FFMPEG_INCLUDE_DIR` environment variables

### Issue: Workflows hanging during FFmpeg installation
**Cause**: vcpkg FFmpeg build taking too long or getting stuck
**Solution**: Workflows now use prebuilt binaries with 15-minute timeout

### Issue: Missing FFmpeg development headers
**Cause**: Runtime-only FFmpeg package downloaded
**Solution**: Workflows verify presence of critical headers and libraries

## Caching Strategy

1. **Rust Dependencies**: Cached by Cargo.lock hash
2. **FFmpeg (Windows)**: Cached separately for maximum reuse
3. **Node Dependencies**: Cached by bun.lockb hash

## Manual Testing

To test Windows builds manually:
1. Go to Actions tab
2. Select "Windows Build (Optimized)"
3. Click "Run workflow"
4. Monitor the "FFmpeg Installation Verification" step for issues

## Performance Metrics

| Workflow | Typical Duration | Platform |
|----------|------------------|----------|
| quick-check | 3-5 minutes | Ubuntu |
| ci.yml (Linux) | 8-12 minutes | Ubuntu |
| ci.yml (macOS) | 10-15 minutes | macOS |
| ci.yml (Windows) | 15-25 minutes | Windows |
| windows-build.yml | 20-30 minutes | Windows |

## Adding New Dependencies

When adding new system dependencies:

1. **Linux**: Add to `apt-get install` list in ci.yml
2. **macOS**: Add to `brew install` list in ci.yml  
3. **Windows**: Add setup steps to Windows dependency section

Always test changes in a PR first to avoid breaking the main workflow.