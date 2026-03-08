# 模型切换指南

## 当前配置

### 服务架构

```
┌─────────────────────────────────────┐
│   Qwen AI Service (Node.js)         │
│   Port: 8000                        │
│   - API 网关                         │
│   - OpenAI 协议                      │
│   - Tools 管理                       │
└──────────┬──────────────────────────┘
           │ HTTP 请求
           ▼
┌─────────────────────────────────────┐
│   llama.cpp (C++)                   │
│   Port: 8001                        │
│   - 模型推理                         │
│   - GPU 加速                         │
│   - 一次加载一个模型                  │
└─────────────────────────────────────┘
```

### 当前加载的模型

| 属性 | 值 |
|------|-----|
| **模型名称** | Qwen3.5-9B-Q6_K.gguf |
| **模型大小** | 7.5 GB |
| **量化级别** | Q6_K (6-bit) |
| **质量** | 最高质量 |
| **路径** | D:\LLM Model\Qwen-3.5\models\gguf\Qwen3.5-9B-Q6_K.gguf |

### 可用模型列表

| 模型文件 | 大小 | 量化级别 | 描述 | 推荐场景 |
|---------|------|---------|------|---------|
| **Qwen3.5-9B-Q6_K.gguf** | 7.5GB | Q6_K | 6-bit，最高质量 | 生产环境，需要最佳质量 |
| **Qwen3.5-9B-Q4_K_M.gguf** | 5.7GB | Q4_M | 4-bit，平衡 | 日常使用，质量与速度平衡 |
| **Qwen3.5-9B-IQ4_XS.gguf** | 5.2GB | IQ4_XS | 实验性4-bit | 最快速度，测试环境 |

---

## 如何切换模型

### 方法 1: 使用 PowerShell 脚本（推荐）

```powershell
# 切换到 Q4_K_M 模型（5.7GB，平衡）
cd "D:\LLM Model\Qwen-3.5\scripts"
.\switch-model.ps1 -Model "Qwen3.5-9B-Q4_K_M.gguf"

# 切换到 IQ4_XS 模型（5.2GB，最快）
.\switch-model.ps1 -Model "Qwen3.5-9B-IQ4_XS.gguf"

# 切换回默认 Q6_K 模型（7.5GB，最高质量）
.\switch-model.ps1 -Model "Qwen3.5-9B-Q6_K.gguf"
```

### 方法 2: 使用批处理脚本

```batch
REM 切换到 Q4_K_M 模型
cd "D:\LLM Model\Qwen-3.5\scripts"
switch-model.bat Qwen3.5-9B-Q4_K_M.gguf

REM 切换到 IQ4_XS 模型
switch-model.bat Qwen3.5-9B-IQ4_XS.gguf

REM 切换回默认模型
switch-model.bat Qwen3.5-9B-Q6_K.gguf
```

### 方法 3: 手动切换

```batch
# 1. 停止 llama.cpp
taskkill /F /IM llama-server.exe

# 2. 启动新的 llama.cpp
cd "D:\dev\llama.cpp"
llama-server.exe -m "D:\LLM Model\Qwen-3.5\models\gguf\YOUR_MODEL.gguf" --host 0.0.0.0 --port 8001 --ctx-size 8192 -ngl 99 --n-gpu-layers 99
```

---

## 配置文件

### 修改默认模型

编辑 `D:\LLM Model\Qwen-3.5\service\config\default.yaml`:

```yaml
models:
  directory: "D:\\LLM Model\\Qwen-3.5\\models\\gguf"
  default: "Qwen3.5-9B-Q4_K_M.gguf"  # 修改这里
  available:
    - name: "Qwen3.5-9B-Q6_K.gguf"
      filename: "Qwen3.5-9B-Q6_K.gguf"
      size: "7.5GB"
      description: "6-bit quantization, best quality"
    - name: "Qwen3.5-9B-Q4_K_M.gguf"
      filename: "Qwen3.5-9B-Q4_K_M.gguf"
      size: "5.7GB"
      description: "4-bit quantization, balanced"
    - name: "Qwen3.5-9B-IQ4_XS.gguf"
      filename: "Qwen3.5-9B-IQ4_XS.gguf"
      size: "5.2GB"
      description: "Experimental 4-bit, fastest"
```

---

## 验证模型切换

### 1. 检查 llama.cpp 状态

```bash
# 健康检查
curl http://localhost:8001/health

# 查看当前加载的模型
curl http://localhost:8001/props | findstr "model_path"
```

### 2. 通过 API 测试

```bash
# 测试聊天
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"Qwen3.5-9B-Q4_K_M.gguf","messages":[{"role":"user","content":"你好"}],"max_tokens":20}'
```

### 3. 查看日志

```bash
# llama.cpp 日志
cat "D:\LLM Model\Qwen-3.5\llamacpp.log"

# Qwen AI Service 日志
cat "D:\LLM Model\Qwen-3.5\service\logs\service.log"
```

---

## 性能对比

| 模型 | 加载时间 | 首token延迟 | 推理速度 | 内存占用 | 推荐用途 |
|------|---------|------------|---------|---------|---------|
| Q6_K | ~30秒 | ~2秒 | ~8 t/s | 7.5GB | 生产环境，质量优先 |
| Q4_M | ~20秒 | ~1.5秒 | ~12 t/s | 5.7GB | 日常使用，平衡 |
| IQ4_XS | ~15秒 | ~1秒 | ~15 t/s | 5.2GB | 测试，速度优先 |

*注：以上数据基于 RTX 4060 8GB GPU*

---

## 常见问题

### Q: 为什么需要重启 llama.cpp 才能切换模型？

A: llama.cpp 会在启动时将整个模型加载到 GPU 内存中。由于 GPU 内存有限（8GB），一次只能加载一个模型。要切换模型，必须先卸载当前模型（停止进程），然后加载新模型。

### Q: 切换模型会影响 Qwen AI Service 吗？

A: 不会。Qwen AI Service 会自动重试连接到 llama.cpp。在 llama.cpp 重启期间（约20-30秒），API 请求会等待或返回错误，但服务本身不会崩溃。

### Q: 能同时加载多个模型吗？

A: 在当前配置下不能。您的 GPU（RTX 4060 8GB）只能容纳一个9B模型的量化版本。要同时加载多个模型，需要：
- 更大的 GPU 内存（16GB+）
- 使用更小的模型
- 或者使用 CPU 推理（速度很慢）

### Q: 如何在 Web UI 中选择模型？

A: Web UI 会显示配置文件中定义的所有模型，但实际加载的模型取决于 llama.cpp 当前加载的模型。使用 `switch-model.ps1` 切换模型后，Web UI 可以继续使用相同的 API 端点。

---

## 快速命令参考

```bash
# 查看可用模型
ls "D:\LLM Model\Qwen-3.5\models\gguf\*.gguf"

# 切换到最快模型（测试）
cd "D:\LLM Model\Qwen-3.5\scripts"
.\switch-model.ps1 -Model "Qwen3.5-9B-IQ4_XS.gguf"

# 切换到平衡模型（日常使用）
.\switch-model.ps1 -Model "Qwen3.5-9B-Q4_K_M.gguf"

# 切换到最高质量模型（生产）
.\switch-model.ps1 -Model "Qwen3.5-9B-Q6_K.gguf"

# 检查当前模型
curl http://localhost:8001/props | grep model_path

# 重启 Qwen AI Service（不需要，会自动重连）
cd "D:\LLM Model\Qwen-3.5\service"
npm run start
```

---

**最后更新**: 2026-03-04
**状态**: ✅ 配置完成
**当前模型**: Qwen3.5-9B-Q6_K.gguf
