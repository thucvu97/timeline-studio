# Windows dependencies installation script for Timeline Studio
# This script installs required dependencies for building on Windows

Write-Host "Installing Windows dependencies for Timeline Studio..." -ForegroundColor Green

# Check if running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "This script requires administrator privileges. Please run as administrator." -ForegroundColor Red
    exit 1
}

# Install Chocolatey if not present
if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Chocolatey..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
}

# Install pkg-config
Write-Host "Installing pkg-config..." -ForegroundColor Yellow
choco install pkgconfiglite -y

# Install vcpkg
Write-Host "Installing vcpkg..." -ForegroundColor Yellow
if (!(Test-Path "C:\vcpkg")) {
    git clone https://github.com/Microsoft/vcpkg.git C:\vcpkg
    Set-Location C:\vcpkg
    .\bootstrap-vcpkg.bat
    .\vcpkg integrate install
}

# Install FFmpeg via vcpkg
Write-Host "Installing FFmpeg..." -ForegroundColor Yellow
Set-Location C:\vcpkg
.\vcpkg install ffmpeg:x64-windows

# Set environment variables
Write-Host "Setting environment variables..." -ForegroundColor Yellow
[System.Environment]::SetEnvironmentVariable('VCPKG_ROOT', 'C:\vcpkg', 'Machine')
[System.Environment]::SetEnvironmentVariable('PKG_CONFIG_PATH', 'C:\vcpkg\installed\x64-windows\lib\pkgconfig', 'Machine')
[System.Environment]::SetEnvironmentVariable('FFMPEG_DIR', 'C:\vcpkg\installed\x64-windows', 'Machine')

# Update PATH
$currentPath = [System.Environment]::GetEnvironmentVariable('PATH', 'Machine')
if ($currentPath -notlike "*C:\vcpkg\installed\x64-windows\bin*") {
    [System.Environment]::SetEnvironmentVariable('PATH', "$currentPath;C:\vcpkg\installed\x64-windows\bin", 'Machine')
}

Write-Host "Windows dependencies installed successfully!" -ForegroundColor Green
Write-Host "Please restart your terminal for environment variables to take effect." -ForegroundColor Yellow