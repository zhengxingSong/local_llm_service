@echo off
echo ========================================
echo  Qwen AI Service - Restarting...
echo ========================================
echo.

call npm run pm2:restart

echo.
echo ========================================
echo  Service restarted!
echo ========================================
echo.
pause
