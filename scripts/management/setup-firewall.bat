@echo off
echo Configuring Windows Firewall for Qwen AI Service...
echo.

netsh advfirewall firewall add rule name="Qwen AI API 8000" dir=in action=allow protocol=TCP localport=8000
netsh advfirewall firewall add rule name="Qwen AI llama 8001" dir=in action=allow protocol=TCP localport=8001

echo.
echo Firewall rules added successfully!
echo.
echo Your LAN IP: 192.168.1.2
echo Access from other devices: http://192.168.1.2:8000/
echo.
pause
