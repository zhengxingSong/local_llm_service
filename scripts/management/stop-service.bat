@echo off
echo ========================================
echo  Qwen AI Service - Stopping...
echo ========================================
echo.

call npm run pm2:stop

echo.
echo ========================================
echo  Service stopped!
echo ========================================
echo.
pause
