@echo off
echo ================================================
echo Qwen AI Service - GPU Accelerated Startup
echo ================================================
echo.

echo Step 1: Stopping existing services...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do (
    echo   Stopping Node.js service (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8001') do (
    echo   Stopping llama.cpp (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)

timeout /t 2 /nobreak >nul

echo.
echo Step 2: Starting llama.cpp with GPU acceleration...
echo   - CUDA: Enabled
echo   - Model: Q4_K_M (4.7-bit quantization, 5.3GB)
echo   - GPU Layers: 33/33 (Full offload)
echo   - VRAM: ~5.4GB / 8GB

set GGML_CUDA=1
set GGML_CUDA_F16=1

cd /d "D:\dev\llama.cpp"
start "llama.cpp GPU" llama-server.exe ^
  -m "D:\LLM Model\Qwen-3.5\models\gguf\Qwen3.5-9B-Q4_K_M.gguf" ^
  --host 0.0.0.0 ^
  --port 8001 ^
  --ctx-size 8192 ^
  -ngl 35 ^
  --n-gpu-layers 35 ^
  --threads 8 ^
  --batch-size 512 ^
  --ubatch-size 128 ^
  --no-warmup ^
  --metrics

timeout /t 5 /nobreak >nul

echo.
echo Step 3: Starting Node.js API service...
cd /d "D:\LLM Model\Qwen-3.5\service"
start "Qwen AI Service" node dist/main.js

timeout /t 2 /nobreak >nul

echo.
echo ================================================
echo Services Started!
echo ================================================
echo   llama.cpp: http://localhost:8001 (GPU)
echo   API Service: http://localhost:8000
echo   Web UI: http://localhost:8000/
echo.
echo To stop all services, close the windows or use Task Manager
echo ================================================
pause
