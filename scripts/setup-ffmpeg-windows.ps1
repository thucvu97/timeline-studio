# Script to setup FFmpeg headers for Windows builds
# This creates Unix-style symlinks for compatibility with ffmpeg-sys-next

Write-Host "Setting up FFmpeg headers for Windows..."

# Check if FFmpeg is installed
if (-not (Test-Path "C:\ffmpeg\include\libavcodec\avcodec.h")) {
    Write-Host "ERROR: FFmpeg not found at C:\ffmpeg"
    Write-Host "Please install FFmpeg first"
    exit 1
}

Write-Host "FFmpeg found at C:\ffmpeg"

# Create Unix-style directory structure
Write-Host "Creating Unix-style directory structure..."
New-Item -ItemType Directory -Force -Path "C:\usr\include" | Out-Null

# List of FFmpeg libraries
$ffmpegLibs = @(
    "libavcodec",
    "libavformat", 
    "libavutil",
    "libavfilter",
    "libavdevice",
    "libswscale",
    "libswresample",
    "libpostproc"
)

# Create symbolic links
foreach ($lib in $ffmpegLibs) {
    $sourcePath = "C:\ffmpeg\include\$lib"
    $targetPath = "C:\usr\include\$lib"
    
    if (Test-Path $sourcePath) {
        # Remove existing link if present
        if (Test-Path $targetPath) {
            Remove-Item $targetPath -Force -Recurse -ErrorAction SilentlyContinue
        }
        
        # Create new symbolic link
        New-Item -ItemType SymbolicLink -Force -Path $targetPath -Target $sourcePath | Out-Null
        Write-Host "✓ Created symlink for $lib"
    } else {
        Write-Host "⚠ $lib not found at $sourcePath"
    }
}

# Verify critical headers
Write-Host ""
Write-Host "Verifying critical headers..."
$criticalHeaders = @(
    "C:\usr\include\libavcodec\avcodec.h",
    "C:\usr\include\libavcodec\avfft.h",
    "C:\usr\include\libswscale\swscale.h"
)

foreach ($header in $criticalHeaders) {
    if (Test-Path $header) {
        Write-Host "✓ Found: $header"
    } else {
        Write-Host "✗ Missing: $header"
    }
}

# Set environment variables for GitHub Actions
if ($env:GITHUB_ENV) {
    Write-Host ""
    Write-Host "Setting GitHub Actions environment variables..."
    
    # Update BINDGEN_EXTRA_CLANG_ARGS to include all paths
    Add-Content -Path $env:GITHUB_ENV -Value "BINDGEN_EXTRA_CLANG_ARGS=-IC:\ffmpeg\include -IC:/ffmpeg/include -I/usr/include -IC:\usr\include"
}

Write-Host ""
Write-Host "FFmpeg setup completed!"