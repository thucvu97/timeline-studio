# CI/CD Setup for Timeline Studio

This document provides instructions for setting up Continuous Integration and Deployment for Timeline Studio.

## Windows CI/CD Setup

### GitHub Actions Configuration

For Windows builds in GitHub Actions, add the following setup steps before building:

```yaml
- name: Install FFmpeg and dependencies (Windows)
  if: runner.os == 'Windows'
  run: |
    # Install vcpkg
    git clone https://github.com/Microsoft/vcpkg.git C:\vcpkg
    C:\vcpkg\bootstrap-vcpkg.bat
    C:\vcpkg\vcpkg.exe integrate install
    
    # Install FFmpeg
    C:\vcpkg\vcpkg.exe install ffmpeg:x64-windows
    
    # Install pkg-config
    choco install pkgconfiglite
    
    # Set environment variables
    echo "VCPKG_ROOT=C:\vcpkg" | Out-File -FilePath $env:GITHUB_ENV -Encoding utf8 -Append

- name: Build Tauri Application
  env:
    VCPKG_ROOT: C:\vcpkg
  run: |
    bun run tauri build
```

### Alternative: Pre-built Dependencies

If vcpkg installation is too slow, you can use pre-built FFmpeg:

```yaml
- name: Setup FFmpeg (Windows - Fast)
  if: runner.os == 'Windows'
  run: |
    # Download pre-built FFmpeg
    Invoke-WebRequest -Uri "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl-shared.zip" -OutFile "ffmpeg.zip"
    Expand-Archive -Path "ffmpeg.zip" -DestinationPath "C:\"
    Rename-Item "C:\ffmpeg-master-latest-win64-gpl-shared" "C:\ffmpeg"
    
    # Download pkg-config
    Invoke-WebRequest -Uri "https://download.gnome.org/binaries/win64/dependencies/pkg-config_0.26-1_win64.zip" -OutFile "pkg-config.zip"
    Expand-Archive -Path "pkg-config.zip" -DestinationPath "C:\pkg-config"
    
    # Set environment variables
    echo "FFMPEG_DIR=C:\ffmpeg" | Out-File -FilePath $env:GITHUB_ENV -Encoding utf8 -Append
    echo "PKG_CONFIG_PATH=C:\ffmpeg\lib\pkgconfig" | Out-File -FilePath $env:GITHUB_ENV -Encoding utf8 -Append
    echo "C:\ffmpeg\bin" | Out-File -FilePath $env:GITHUB_PATH -Encoding utf8 -Append
    echo "C:\pkg-config\bin" | Out-File -FilePath $env:GITHUB_PATH -Encoding utf8 -Append
```

## macOS CI/CD Setup

```yaml
- name: Install FFmpeg (macOS)
  if: runner.os == 'macOS'
  run: |
    brew install ffmpeg pkg-config
```

## Linux CI/CD Setup

```yaml
- name: Install FFmpeg (Linux)
  if: runner.os == 'Linux'
  run: |
    sudo apt-get update
    sudo apt-get install -y ffmpeg libavcodec-dev libavformat-dev libavutil-dev libavfilter-dev libavdevice-dev libswscale-dev libswresample-dev pkg-config
```

## Complete GitHub Actions Workflow Example

```yaml
name: Build and Test

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]

    steps:
    - uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'

    - name: Setup Bun
      uses: oven-sh/setup-bun@v1

    - name: Setup Rust
      uses: dtolnay/rust-toolchain@stable

    - name: Install FFmpeg (Linux)
      if: runner.os == 'Linux'
      run: |
        sudo apt-get update
        sudo apt-get install -y ffmpeg libavcodec-dev libavformat-dev libavutil-dev libavfilter-dev libavdevice-dev libswscale-dev libswresample-dev pkg-config

    - name: Install FFmpeg (macOS)
      if: runner.os == 'macOS'
      run: |
        brew install ffmpeg pkg-config

    - name: Install FFmpeg (Windows)
      if: runner.os == 'Windows'
      run: |
        # Use vcpkg for reliable builds
        git clone https://github.com/Microsoft/vcpkg.git C:\vcpkg
        C:\vcpkg\bootstrap-vcpkg.bat
        C:\vcpkg\vcpkg.exe integrate install
        C:\vcpkg\vcpkg.exe install ffmpeg:x64-windows
        choco install pkgconfiglite
        echo "VCPKG_ROOT=C:\vcpkg" | Out-File -FilePath $env:GITHUB_ENV -Encoding utf8 -Append

    - name: Install dependencies
      run: bun install

    - name: Run tests
      run: bun run test

    - name: Build application
      env:
        VCPKG_ROOT: ${{ runner.os == 'Windows' && 'C:\vcpkg' || '' }}
      run: bun run tauri build
```

## Docker Alternative

For more consistent builds, consider using Docker:

```dockerfile
# Windows Server Core with FFmpeg
FROM mcr.microsoft.com/windows/servercore:ltsc2022

# Install dependencies
RUN powershell -Command \
    Set-ExecutionPolicy Bypass -Scope Process -Force; \
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; \
    iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))

RUN choco install -y nodejs rust ffmpeg pkgconfiglite

# Set working directory
WORKDIR C:\timeline-studio

# Copy source
COPY . .

# Build
RUN bun install && bun run tauri build
```

## Troubleshooting CI Issues

### 1. "ffmpeg-sys-next build failed"
- Ensure vcpkg is properly integrated
- Check that environment variables are set correctly
- Verify pkg-config is in PATH

### 2. "Could not find Vcpkg tree"
- Set VCPKG_ROOT environment variable
- Run vcpkg integrate install
- Restart the build

### 3. "pkg-config command could not be found"
- Install pkgconfiglite on Windows
- Add pkg-config to PATH
- Set PKG_CONFIG_PATH for FFmpeg libraries

### 4. Build timeout
- Consider using pre-built FFmpeg instead of vcpkg
- Cache vcpkg installation between builds
- Use matrix strategy to parallelize builds