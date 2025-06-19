# Windows npm install script with timeout and retry logic
param(
    [int]$TimeoutSeconds = 300,
    [int]$MaxRetries = 3
)

$ErrorActionPreference = "Stop"

# Configure npm for better Windows performance
Write-Host "Configuring npm for Windows..." -ForegroundColor Cyan
npm config set fetch-timeout 300000
npm config set fetch-retries 5
npm config set prefer-offline true
npm config set audit false
npm config set fund false
npm config set progress false
npm config set loglevel error

# Function to run npm install with timeout
function Install-NpmDependencies {
    param([int]$Attempt)
    
    Write-Host "`nAttempt $Attempt of $MaxRetries to install dependencies..." -ForegroundColor Yellow
    
    $job = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        npm ci --prefer-offline --no-audit --no-fund --no-progress 2>&1
    }
    
    $completed = Wait-Job $job -Timeout $TimeoutSeconds
    
    if ($completed) {
        $result = Receive-Job $job
        Remove-Job $job
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Dependencies installed successfully!" -ForegroundColor Green
            return $true
        } else {
            Write-Host "npm install failed with exit code: $LASTEXITCODE" -ForegroundColor Red
            Write-Host $result
            return $false
        }
    } else {
        Write-Host "npm install timed out after $TimeoutSeconds seconds" -ForegroundColor Red
        Stop-Job $job
        Remove-Job $job -Force
        return $false
    }
}

# Clear npm cache if needed
if ($env:CLEAR_NPM_CACHE -eq "true") {
    Write-Host "Clearing npm cache..." -ForegroundColor Cyan
    npm cache clean --force
}

# Try to install dependencies with retries
$success = $false
for ($i = 1; $i -le $MaxRetries; $i++) {
    if (Install-NpmDependencies -Attempt $i) {
        $success = $true
        break
    }
    
    if ($i -lt $MaxRetries) {
        Write-Host "Waiting 10 seconds before retry..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
    }
}

if (-not $success) {
    Write-Host "`nAll attempts failed. Trying alternative approach with Bun..." -ForegroundColor Magenta
    
    # Try with Bun as fallback
    if (Get-Command bun -ErrorAction SilentlyContinue) {
        Write-Host "Installing with Bun..." -ForegroundColor Cyan
        bun install --frozen-lockfile
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Dependencies installed successfully with Bun!" -ForegroundColor Green
            exit 0
        }
    }
    
    Write-Host "`nFailed to install dependencies after all attempts" -ForegroundColor Red
    exit 1
}

exit 0