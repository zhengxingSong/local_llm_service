# ⚡ 快速安装指南

## 5 分钟启动 Qwen AI Service

### 前置条件
- ✅ Node.js 20+ 已安装
- ✅ llama.cpp 已运行在 `localhost:8001`
- ✅ Windows PowerShell (管理员权限用于防火墙配置)

---

## 📦 安装步骤

### 步骤 1: 安装依赖 (2 分钟)

```bash
cd "D:\LLM Model\Qwen-3.5\service"
npm install
```

### 步骤 2: 启动服务 (1 分钟)

**开发模式**:
```powershell
cd "D:\LLM Model\Qwen-3.5\service"
.\scripts\start.ps1
```

**生产模式**:
```bash
cd "D:\LLM Model\Qwen-3.5\service"
npm run build
npm run pm2:start
```

### 步骤 3: 测试服务 (1 分钟)

**Python**:
```bash
python examples/python_openai.py
```

**cURL**:
```bash
curl http://localhost:8000/api/health
```

### 步骤 4: 配置局域网访问 (可选, 1 分钟)

```powershell
# 右键 - 以管理员身份运行 PowerShell
powershell -ExecutionPolicy Bypass -File "D:\LLM Model\Qwen-3.5\service\scripts\setup-firewall.ps1"
```

---

## 🎯 验证安装

### 检查 1: 服务运行

```bash
curl http://localhost:8000/api/health
```

**预期输出**:
```json
{
  "status": "ok",
  "timestamp": "2026-03-04T...",
  "uptime": ...
}
```

### 检查 2: 模型列表

```bash
curl http://localhost:8000/api/models
```

### 检查 3: API 测试

**Python**:
```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8000/v1",
    api_key="dummy"
)

response = client.chat.completions.create(
    model="Qwen3.5-9B-Q6_K.gguf",
    messages=[{"role": "user", "content": "你好"}]
)

print(response.choices[0].message.content)
```

---

## 🔧 常见问题

### Q1: 端口 8000 被占用？
```powershell
# 查找占用进程
netstat -ano | findstr :8000

# 终止进程
taskkill /PID <PID> /F
```

### Q2: 无法连接到 llama.cpp？
```powershell
# 检查 llama.cpp 是否运行
curl http://localhost:8001/health

# 启动 llama.cpp
cd "D:\LLM Model\Qwen-3.5\scripts\llama-cpp"
.\start-llamacpp-gpu.bat
```

### Q3: 防火墙配置失败？
```powershell
# 确保以管理员身份运行
# 右键 PowerShell - "以管理员身份运行"
```

---

## 📚 下一步

- 📖 阅读 [完整文档](README.md)
- 🏗️ 了解 [架构设计](ARCHITECTURE.md)
- 📊 查看 [项目进度](PROGRESS.md)
- 🚀 查看 [项目总结](PROJECT-SUMMARY.md)

---

## 💡 提示

- 首次运行会自动安装依赖
- 建议使用开发模式测试，生产模式部署
- 局域网访问需要配置防火墙
- 查看 PM2 日志: `npm run pm2:logs`

---

**安装时间**: ~5 分钟
**难度**: ⭐⭐ (简单)
**支持**: 查看 [故障排除](README.md#故障排除)
