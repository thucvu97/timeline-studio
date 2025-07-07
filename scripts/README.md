# Scripts Directory

This directory contains various utility scripts for the Timeline Studio project.

## Build and Cleanup Scripts

### `cleanup-test-binaries.sh` / `cleanup-test-binaries.ps1`
**Purpose**: Clean up test binaries before Tauri builds to prevent CI/CD bundling issues.

**What it does**:
- Removes `test_specta` and `test_specta.exe` from all target directories
- Cleans cache files and dependency files that reference test binaries
- Regenerates `Cargo.lock` if test binary references are found
- Disables source files by renaming them (e.g., `test_specta.rs` → `test_specta.rs.disabled`)

**When to use**:
- Automatically called in CI/CD environments
- Can be run manually before builds if needed
- Helpful when switching between development and release builds

**Usage**:
```bash
# Unix/Linux/macOS
./scripts/cleanup-test-binaries.sh

# Windows PowerShell
.\scripts\cleanup-test-binaries.ps1
```

### FFmpeg Setup Scripts
- `setup-ffmpeg-macos.sh` - FFmpeg setup for macOS
- `setup-ffmpeg-linux.sh` - FFmpeg setup for Linux
- `setup-ffmpeg-windows.ps1` - FFmpeg setup for Windows
- `setup-rust-env-windows.ps1` - Rust environment setup for Windows

### Other Utilities
- `version-sync.mjs` - Synchronize version across package.json and Cargo.toml
- `generate-docs.js` - Documentation generation
- `rust-coverage.sh` - Rust test coverage reporting
- `upload-coverage.sh` - Coverage upload to services

## Notes

**test_specta Binary**: This is a development-only binary used for TypeScript type generation with Specta. It should never be included in release builds or CI/CD bundles. The cleanup scripts ensure it's properly removed from build artifacts.