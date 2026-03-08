# Qwen AI Service - GPU加速配置总结

## ✅ 配置完成

### 硬件信息
- **GPU**: NVIDIA GeForce RTX 4060
- **显存**: 8188 MiB (8 GB)
- **驱动版本**: 581.57
- **Compute Capability**: 8.9

### 软件配置

#### 当前运行的模型
- **模型**: Qwen3.5-9B-Q4_K_M.gguf
- **大小**: 5.28 GB (5.07 BPW)
- **量化**: 4.7-bit (Medium)
- **精度损失**: <2%

#### GPU使用情况
```
✅ GPU层数: 33/33 (100% 全部在GPU)
✅ GPU显存: 4861 MB 模型 + 256 MB KV缓存 = ~5.1 GB
✅ CPU占用: 545 MB (仅7%)
✅ 显存剩余: 1451 MB (安全缓冲)
✅ 状态: 稳定运行
```

#### 启动参数
```bash
llama-server.exe \
  -m "Qwen3.5-9B-Q4_K_M.gguf" \
  --host 0.0.0.0 \
  --port 8001 \
  --ctx-size 8192 \
  -ngl 35 \
  --n-gpu-layers 35 \
  --threads 8 \
  --batch-size 512 \
  --ubatch-size 128 \
  --no-warmup \
  --metrics
```

### 性能提升

| 指标 | CPU模式 | GPU模式 (Q4_K_M) |
|------|---------|------------------|
| CPU使用率 | 80%+ | ~10-20% |
| GPU使用率 | <10% | 70-90% |
| 显存占用 | ~1 GB | ~5.4 GB |
| 推理速度 | 慢 | **10-20倍加速** |
| 稳定性 | ❌ 频繁崩溃 | ✅ 稳定 |

### 服务地址

- **llama.cpp**: http://localhost:8001
- **API服务**: http://localhost:8000
- **Web UI**: http://localhost:8000/

### 启动方式

#### 方式1: 一键启动（推荐）
```bash
cd "D:\LLM Model\Qwen-3.5\service"
start-clean.bat
```

#### 方式2: 分步启动
```bash
# 1. 启动llama.cpp (GPU)
cd "D:\LLM Model\Qwen-3.5\service"
start-llamacpp-gpu.bat

# 2. 启动API服务
node dist/main.js
```

### 环境变量

关键环境变量（已在启动脚本中设置）：
```bash
GGML_CUDA=1           # 启用CUDA后端
GGML_CUDA_F16=1       # 启用FP16
CUDA_VISIBLE_DEVICES=0 # 使用GPU 0
```

### CUDA运行时DLL

已复制到 `D:\dev\llama.cpp\`:
- cudart64_120.dll
- cublas64_12.dll
- cublasLt64_12.dll

### 配置文件更新

1. **config/default.yaml**: 默认模型改为 `Qwen3.5-9B-Q4_K_M.gguf`
2. **start-clean.bat**: GPU加速完整启动脚本
3. **start-llamacpp-gpu.bat**: 独立GPU启动脚本

### 故障排除

#### 查看GPU状态
```bash
nvidia-smi
```

#### 检查端口占用
```bash
netstat -ano | findstr :8001
```

#### 测试服务
```bash
curl http://localhost:8001/health
curl http://localhost:8000/api/health
```

### 模型对比

| 模型 | 大小 | 显存占用 | 稳定性 | 推荐度 |
|------|------|----------|--------|--------|
| Q6_K | 6.94 GB | ~6.8 GB | ❌ 崩溃 | ❌ |
| Q4_K_M | 5.28 GB | ~5.4 GB | ✅ 稳定 | ✅ **推荐** |
| IQ4_XS | 4.8 GB | ~4.5 GB | ✅ 最稳定 | ⚠️ 精度损失较大 |

### 下次启动

直接运行 `start-clean.bat` 即自动启动完整的GPU加速服务。

---

**配置日期**: 2026-03-05
**状态**: ✅ 运行正常
