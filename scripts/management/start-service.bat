@echo off
echo ========================================
echo  Qwen AI Service - Starting...
echo ========================================
echo.

REM Build the project
echo [1/3] Building TypeScript...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)

REM Start with PM2
echo [2/3] Starting PM2 service...
call npm run pm2:start
if %errorlevel% neq 0 (
    echo ERROR: PM2 start failed!
    pause
    exit /b 1
)

REM Show status
echo [3/3] Service status:
call npm run pm2:monit

echo.
echo ========================================
echo  Service started successfully!
echo  API: http://localhost:8000
echo  OpenAI: http://localhost:8000/v1
echo  Anthropic: http://localhost:8000/v1
echo ========================================
echo.
echo Press any key to exit...
pause >nul
