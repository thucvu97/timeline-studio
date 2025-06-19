# PowerShell script to check imports in batches on Windows
# This avoids the timeout issue with processing all files at once

$ErrorActionPreference = "Stop"

Write-Host "Checking import order in batches..."

# Get all TypeScript files
$files = Get-ChildItem -Path "src" -Recurse -Include "*.ts","*.tsx" | Where-Object { $_.FullName -notmatch "__tests__|__mocks__|\.test\.|\.spec\." }

# Process in batches of 50 files
$batchSize = 50
$totalFiles = $files.Count
$batches = [Math]::Ceiling($totalFiles / $batchSize)

Write-Host "Found $totalFiles files to check in $batches batches"

$hasErrors = $false

for ($i = 0; $i -lt $batches; $i++) {
    $start = $i * $batchSize
    $end = [Math]::Min(($i + 1) * $batchSize - 1, $totalFiles - 1)
    
    $batchFiles = $files[$start..$end]
    $fileList = ($batchFiles | ForEach-Object { $_.FullName }) -join " "
    
    Write-Host "Checking batch $($i + 1)/$batches (files $($start + 1)-$($end + 1))..."
    
    # Run ESLint on this batch
    $result = & npx eslint $fileList --rule "import/order: warn" --max-warnings 0 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Import order issues found in batch $($i + 1)" -ForegroundColor Yellow
        Write-Host $result
        $hasErrors = $true
    }
}

if ($hasErrors) {
    Write-Host "Import order check failed. Run 'npm run format:imports:windows' locally to fix." -ForegroundColor Red
    exit 1
} else {
    Write-Host "All imports are properly ordered!" -ForegroundColor Green
    exit 0
}