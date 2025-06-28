# FFmpeg Setup Script for Windows
# This script downloads and configures FFmpeg for Timeline Studio

$ErrorActionPreference = "Stop"

Write-Host "Setting up FFmpeg for Timeline Studio..." -ForegroundColor Green

# Check if running as Administrator (skip in CI)
if ($env:CI -ne "true") {
    if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
        Write-Host "This script requires Administrator privileges. Please run as Administrator." -ForegroundColor Red
        exit 1
    }
}

# Create directory for FFmpeg
$ffmpegDir = "C:\ffmpeg"
if (!(Test-Path $ffmpegDir)) {
    New-Item -ItemType Directory -Path $ffmpegDir -Force | Out-Null
}

# Download FFmpeg
Write-Host "Downloading FFmpeg..." -ForegroundColor Yellow
$ffmpegUrl = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-full-shared.7z"
$downloadPath = "$env:TEMP\ffmpeg-release-full-shared.7z"

try {
    Invoke-WebRequest -Uri $ffmpegUrl -OutFile $downloadPath -UseBasicParsing
} catch {
    Write-Host "Failed to download FFmpeg. Error: $_" -ForegroundColor Red
    exit 1
}

# Extract FFmpeg
Write-Host "Extracting FFmpeg..." -ForegroundColor Yellow
if (!(Get-Command "7z" -ErrorAction SilentlyContinue)) {
    # In CI, 7z should be available
    if ($env:CI -eq "true") {
        Write-Host "7-Zip not found in CI environment" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "7-Zip not found. Installing via Chocolatey..." -ForegroundColor Yellow
    if (!(Get-Command "choco" -ErrorAction SilentlyContinue)) {
        Write-Host "Chocolatey not found. Please install Chocolatey first: https://chocolatey.org/install" -ForegroundColor Red
        exit 1
    }
    choco install 7zip -y
}

# Extract to temp folder first
$tempExtract = "$env:TEMP\ffmpeg-extract"
if (Test-Path $tempExtract) {
    Remove-Item $tempExtract -Recurse -Force
}
7z x $downloadPath -o"$tempExtract" -y

# Find the extracted folder (it has a version in the name)
$extractedFolder = Get-ChildItem $tempExtract -Directory | Select-Object -First 1

# Copy contents to C:\ffmpeg
Write-Host "Installing FFmpeg to $ffmpegDir..." -ForegroundColor Yellow
Copy-Item "$($extractedFolder.FullName)\*" -Destination $ffmpegDir -Recurse -Force

# Cleanup
Remove-Item $downloadPath -Force
Remove-Item $tempExtract -Recurse -Force

# Set environment variables
Write-Host "Setting environment variables..." -ForegroundColor Yellow

# FFMPEG_DIR
[System.Environment]::SetEnvironmentVariable('FFMPEG_DIR', $ffmpegDir, 'Machine')

# PKG_CONFIG_PATH
$pkgConfigPath = "$ffmpegDir\lib\pkgconfig"
[System.Environment]::SetEnvironmentVariable('PKG_CONFIG_PATH', $pkgConfigPath, 'Machine')

# Add to PATH
$currentPath = [System.Environment]::GetEnvironmentVariable('PATH', 'Machine')
if ($currentPath -notlike "*$ffmpegDir\bin*") {
    $newPath = "$currentPath;$ffmpegDir\bin"
    [System.Environment]::SetEnvironmentVariable('PATH', $newPath, 'Machine')
}

# Install pkg-config if not present
if (!(Get-Command "pkg-config" -ErrorAction SilentlyContinue)) {
    Write-Host "Installing pkg-config..." -ForegroundColor Yellow
    if (Get-Command "choco" -ErrorAction SilentlyContinue) {
        choco install pkgconfiglite -y
    } else {
        Write-Host "Warning: pkg-config not found and Chocolatey not available to install it." -ForegroundColor Yellow
        Write-Host "Please install pkg-config manually: choco install pkgconfiglite" -ForegroundColor Yellow
    }
}

# Verify installation
Write-Host "`nVerifying FFmpeg installation..." -ForegroundColor Green
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

try {
    $ffmpegVersion = & "$ffmpegDir\bin\ffmpeg.exe" -version 2>&1 | Select-Object -First 1
    Write-Host "FFmpeg installed successfully: $ffmpegVersion" -ForegroundColor Green
} catch {
    Write-Host "Warning: Could not verify FFmpeg installation. You may need to restart your shell." -ForegroundColor Yellow
}

Write-Host "`nFFmpeg setup complete!" -ForegroundColor Green
Write-Host "Environment variables set:" -ForegroundColor Cyan
Write-Host "  FFMPEG_DIR = $ffmpegDir" -ForegroundColor Cyan
Write-Host "  PKG_CONFIG_PATH = $pkgConfigPath" -ForegroundColor Cyan
Write-Host "  PATH updated with: $ffmpegDir\bin" -ForegroundColor Cyan
Write-Host "`nPlease restart your terminal or IDE for the changes to take effect." -ForegroundColor Yellow