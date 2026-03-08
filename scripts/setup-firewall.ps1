# Windows Firewall Configuration Script for Qwen AI Service

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Qwen AI Service - Firewall Setup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "[ERROR] This script requires administrator privileges!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please right-click and select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Host "Running with administrator privileges" -ForegroundColor Green
Write-Host ""

# Remove existing rule if exists
$existingRule = Get-NetFirewallRule -DisplayName "Qwen AI Service" -ErrorAction SilentlyContinue
if ($existingRule) {
    Write-Host "Removing existing firewall rule..." -ForegroundColor Yellow
    Remove-NetFirewallRule -DisplayName "Qwen AI Service"
    Write-Host "Existing rule removed" -ForegroundColor Green
    Write-Host ""
}

# Add new firewall rule
Write-Host "Adding firewall rule for Qwen AI Service..." -ForegroundColor Yellow

try {
    New-NetFirewallRule -DisplayName "Qwen AI Service" `
        -Direction Inbound `
        -LocalPort 8000 `
        -Protocol TCP `
        -Action Allow `
        -Profile Domain,Private `
        -Description "Allow inbound connections to Qwen AI Service (Port 8000)" `
        -ErrorAction Stop

    Write-Host "Firewall rule added successfully!" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to add firewall rule: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Host ""
Write-Host "Firewall Configuration Summary:" -ForegroundColor Cyan
Write-Host "  Rule Name: Qwen AI Service" -ForegroundColor White
Write-Host "  Port: 8000 (TCP)" -ForegroundColor White
Write-Host "  Profiles: Domain, Private" -ForegroundColor White
Write-Host "  Action: Allow" -ForegroundColor White
Write-Host ""

# Get local IP address
Write-Host "Your network configuration:" -ForegroundColor Cyan
$ipAddresses = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" }
foreach ($ip in $ipAddresses) {
    Write-Host "  $($ip.InterfaceAlias): $($ip.IPAddress)" -ForegroundColor White
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "Firewall setup completed!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Other devices can now access the service at:" -ForegroundColor Yellow
Write-Host "  http://<YOUR_IP>:8000/api/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
