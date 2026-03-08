# Quick Test Script for Qwen AI Service

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Qwen AI Service - Quick Test" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Change to service directory
$servicePath = Join-Path $PSScriptRoot "service"
Set-Location $servicePath

Write-Host "Running tests..." -ForegroundColor Yellow
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "[ERROR] Dependencies not installed!" -ForegroundColor Red
    Write-Host "Run: npm install" -ForegroundColor Yellow
    Read-Host "Press any key to exit"
    exit 1
}

# Check if dist exists
if (-not (Test-Path "dist")) {
    Write-Host "[WARNING] dist not found, building..." -ForegroundColor Yellow
    npm run build
    Write-Host ""
}

# Check if llama.cpp is running
Write-Host "Checking llama.cpp..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8001/health" -TimeoutSec 2
    Write-Host "llama.cpp is running" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] llama.cpp is not responding!" -ForegroundColor Red
    Write-Host "Some tests may fail" -ForegroundColor Yellow
    Write-Host ""
}

# Run tests
Write-Host "Running unit tests..." -ForegroundColor Cyan
npm test -- test/unit 2>&1 | Select-String -Pattern "PASS|FAIL|Tests:" | ForEach-Object { Write-Host $_ }

Write-Host ""
Write-Host "Running integration tests..." -ForegroundColor Cyan
npm test -- test/integration 2>&1 | Select-String -Pattern "PASS|FAIL|Tests:" | ForEach-Object { Write-Host $_ }

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "Tests completed!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "For detailed results, run: npm test" -ForegroundColor Yellow
Write-Host ""
