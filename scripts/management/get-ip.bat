@echo off
echo ========================================
echo  Getting Local IP Address...
echo ========================================
echo.

ipconfig | findstr /I "IPv4"

echo.
echo ========================================
echo  Use this IP to configure Chatbox:
echo  API Base URL: http://<YOUR_IP>:8000/v1
echo ========================================
echo.
pause
