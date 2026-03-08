# Start script for Qwen AI Service

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Qwen AI Service - Starting..." -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js 20+ from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Change to service directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$servicePath = Split-Path -Parent $scriptPath
Set-Location $servicePath

Write-Host "Service directory: $servicePath" -ForegroundColor Yellow
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Check if dist exists
if (-not (Test-Path "dist")) {
    Write-Host "Building project..." -ForegroundColor Yellow
    npm run build
    Write-Host ""
}

# Check if llama.cpp is running
Write-Host "Checking llama.cpp service..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8001/health" -TimeoutSec 2
    Write-Host "llama.cpp is running: $($response.status)" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] llama.cpp is not responding!" -ForegroundColor Red
    Write-Host "Please start llama.cpp first:" -ForegroundColor Yellow
    Write-Host "  cd ..\scripts\llama-cpp"
    Write-Host "  .\start-llamacpp-gpu.bat"
    Write-Host ""
    $choice = Read-Host "Continue anyway? (y/n)"
    if ($choice -ne "y") {
        exit 1
    }
}

Write-Host ""
Write-Host "Starting Qwen AI Service..." -ForegroundColor Green
Write-Host ""

# Start the service
npm run dev
