# PowerShell script to clean up test binaries before Tauri build
# This prevents issues in CI/CD where test binaries might be bundled

Write-Host "🧹 Cleaning up test binaries before build..." -ForegroundColor Yellow

# List of test binaries to remove
$TestBinaries = @(
    "test_specta.exe",
    "test_specta"
)

# Target directories to check
$TargetDirs = @(
    "src-tauri\target\debug",
    "src-tauri\target\release",
    "src-tauri\target\x86_64-pc-windows-msvc\debug",
    "src-tauri\target\x86_64-pc-windows-msvc\release"
)

$CleanedCount = 0

foreach ($targetDir in $TargetDirs) {
    if (Test-Path $targetDir) {
        Write-Host "📁 Checking $targetDir..." -ForegroundColor Cyan
        foreach ($binary in $TestBinaries) {
            $binaryPath = Join-Path $targetDir $binary
            if (Test-Path $binaryPath) {
                Write-Host "🗑️  Removing test binary: $binaryPath" -ForegroundColor Red
                Remove-Item $binaryPath -Force
                $CleanedCount++
            }
        }
    }
}

if ($CleanedCount -eq 0) {
    Write-Host "✅ No test binaries found to clean" -ForegroundColor Green
} else {
    Write-Host "✅ Cleaned up $CleanedCount test binaries" -ForegroundColor Green
}

Write-Host "🎯 Test binary cleanup completed" -ForegroundColor Yellow