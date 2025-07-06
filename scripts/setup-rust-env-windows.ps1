# Setup Rust environment for Windows builds
# This script sets up FFmpeg-related environment variables for Windows

param(
    [string]$FFmpegDir = "C:\ffmpeg"
)

# Check if FFmpeg directory exists
if (-not (Test-Path $FFmpegDir)) {
    Write-Error "FFmpeg directory not found at: $FFmpegDir"
    Write-Host "Please install FFmpeg or specify correct path with -FFmpegDir parameter"
    exit 1
}

# Set environment variables
$env:FFMPEG_DIR = $FFmpegDir
$env:FFMPEG_INCLUDE_DIR = "$FFmpegDir\include"
$env:FFMPEG_LIB_DIR = "$FFmpegDir\lib"
$env:FFMPEG_NO_PKG_CONFIG = "1"

# Set RUSTFLAGS for linking
$env:RUSTFLAGS = "-C link-arg=/LIBPATH:$FFmpegDir\lib"

# Display configured paths
Write-Host "FFmpeg environment configured:"
Write-Host "  FFMPEG_DIR: $env:FFMPEG_DIR"
Write-Host "  FFMPEG_INCLUDE_DIR: $env:FFMPEG_INCLUDE_DIR"
Write-Host "  FFMPEG_LIB_DIR: $env:FFMPEG_LIB_DIR"
Write-Host "  RUSTFLAGS: $env:RUSTFLAGS"

# Verify FFmpeg libraries exist
$requiredLibs = @("avcodec", "avformat", "avutil", "swscale", "swresample", "avfilter", "avdevice")
$missingLibs = @()

foreach ($lib in $requiredLibs) {
    $libPath = Join-Path $env:FFMPEG_LIB_DIR "$lib.lib"
    if (-not (Test-Path $libPath)) {
        $missingLibs += $lib
    }
}

if ($missingLibs.Count -gt 0) {
    Write-Warning "Missing FFmpeg libraries: $($missingLibs -join ', ')"
    Write-Host "Make sure FFmpeg is properly installed with all required libraries"
}
else {
    Write-Host "✅ All required FFmpeg libraries found"
}