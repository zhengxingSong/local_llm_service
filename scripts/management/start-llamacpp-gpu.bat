@echo off
REM llama.cpp GPU加速启动脚本
REM 针对RTX 4060优化 - Q4_K_M模型

echo ================================================
echo Qwen3.5-9B-Q4_K_M with GPU Acceleration
echo ================================================
echo.

REM 强制启用CUDA后端
set GGML_CUDA=1
set GGML_CUDA_F16=1
set CUDA_VISIBLE_DEVICES=0

REM 模型配置
set MODEL_PATH=D:\LLM Model\Qwen-3.5\models\gguf\Qwen3.5-9B-Q4_K_M.gguf
set HOST=0.0.0.0
set PORT=8001
set CTX_SIZE=8192
set NGL=35

echo Configuration:
echo   Model: Qwen3.5-9B-Q4_K_M.gguf (4.7-bit量化)
echo   Size: 5.3 GB
echo   Server: %HOST%:%PORT%
echo   Context: %CTX_SIZE% tokens
echo   GPU Layers: 35 (Full GPU Offload)
echo   CUDA: Enabled
echo   Threads: 8
echo   Batch Size: 512
echo.

REM 检查模型文件
if not exist "%MODEL_PATH%" (
    echo [ERROR] Model file not found: %MODEL_PATH%
    pause
    exit /b 1
)

REM 检查llama-server
if not exist "D:\dev\llama.cpp\llama-server.exe" (
    echo [ERROR] llama-server.exe not found at D:\dev\llama.cpp\
    pause
    exit /b 1
)

echo Starting llama.cpp with GPU acceleration...
echo ================================================
echo.

cd /d "D:\dev\llama.cpp"

start "llama.cpp GPU Server" llama-server.exe ^
  -m "%MODEL_PATH%" ^
  --host %HOST% ^
  --port %PORT% ^
  --ctx-size %CTX_SIZE% ^
  -ngl %NGL% ^
  --n-gpu-layers %NGL% ^
  --threads 8 ^
  --batch-size 512 ^
  --ubatch-size 128 ^
  --no-warmup ^
  --metrics

echo.
echo Server starting in background...
echo You can test it with: curl http://localhost:%PORT%/health
echo.
echo To stop the server, use Task Manager and end llama-server.exe
echo.
pause
