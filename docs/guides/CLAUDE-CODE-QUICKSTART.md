# Claude Code 快速启动指南

## ✅ 好消息！

**Anthropic API 流式响应已经完全实现！** 你现在就可以使用 Claude Code 了！

## 🚀 3 步启动

### Step 1: 启动服务

```bash
cd "D:\LLM Model\Qwen-3.5\service"
start-service.bat
```

等待看到：
```
✅ Service started successfully!
API: http://localhost:8000
```

### Step 2: 配置环境变量

**Windows PowerShell:**
```powershell
$env:ANTHROPIC_BASE_URL="http://localhost:8000/v1"
$env:ANTHROPIC_API_KEY="dummy"
```

**Windows CMD:**
```cmd
set ANTHROPIC_BASE_URL=http://localhost:8000/v1
set ANTHROPIC_API_KEY=dummy
```

**永久配置（推荐）:**

**Windows PowerShell（添加到 $PROFILE）:**
```powershell
notepad $PROFILE
```

添加以下内容：
```powershell
$env:ANTHROPIC_BASE_URL="http://localhost:8000/v1"
$env:ANTHROPIC_API_KEY="dummy"
```

**Windows CMD（永久环境变量）:**
```cmd
setx ANTHROPIC_BASE_URL "http://localhost:8000/v1"
setx ANTHROPIC_API_KEY "dummy"
```

### Step 3: 启动 Claude Code

```bash
claude-code
```

## 🎯 验证连接

在 Claude Code 中输入：

```
你好，请介绍一下你自己。
```

如果收到回复，说明连接成功！✅

## 📱 局域网使用

### 获取 IP 地址

```bash
get-ip.bat
```

你会看到类似：
```
IPv4 Address: . . . . . . . . . . . : 192.168.1.100
```

### 在其他设备上使用

**配置环境变量（使用你的 IP）:**
```bash
export ANTHROPIC_BASE_URL="http://192.168.1.100:8000/v1"
export ANTHROPIC_API_KEY="dummy"
```

## 🔧 测试脚本

创建 `test-claude.py`:

```python
import anthropic

client = anthropic.Anthropic(
    base_url="http://localhost:8000/v1",
    api_key="dummy"
)

print("🧪 测试 1: 非流式响应")
response = client.messages.create(
    model="Qwen3.5-9B-Q4_K_M.gguf",
    max_tokens=100,
    messages=[{"role": "user", "content": "Say Hello!"}]
)
print(f"✅ 响应: {response.content[0].text}\n")

print("🧪 测试 2: 流式响应")
print("流式输出: ", end="")
with client.messages.stream(
    model="Qwen3.5-9B-Q4_K_M.gguf",
    max_tokens=100,
    messages=[{"role": "user", "content": "Count to 5"}]
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)
print("\n✅ 所有测试通过！")
```

运行测试：
```bash
python test-claude.py
```

## 🎨 高级功能

### 流式响应（Python）

```python
import anthropic

client = anthropic.Anthropic(
    base_url="http://localhost:8000/v1",
    api_key="dummy"
)

# 方式 1: 使用 stream
with client.messages.stream(
    model="Qwen3.5-9B-Q4_K_M.gguf",
    max_tokens=1024,
    messages=[{"role": "user", "content": "讲个故事"}]
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)

# 方式 2: 使用 async iterator
stream = client.messages.create(
    model="Qwen3.5-9B-Q4_K_M.gguf",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello!"}],
    stream=True,
)

async for event in stream:
    if event.type == "content_block_delta":
        print(event.delta.text)
```

### 系统提示

```python
message = client.messages.create(
    model="Qwen3.5-9B-Q4_K_M.gguf",
    max_tokens=1024,
    system="你是一个专业的 Python 程序员助手。",
    messages=[
        {"role": "user", "content": "如何使用列表推导式？"}
    ]
)
```

### 图像输入（Vision）

```python
import anthropic
import base64

client = anthropic.Anthropic(
    base_url="http://localhost:8000/v1",
    api_key="dummy"
)

# 读取图像
with open("image.jpg", "rb") as f:
    image_data = base64.b64encode(f.read()).decode()

# 发送带图像的消息
message = client.messages.create(
    model="Qwen3.5-9B-Q4_K_M.gguf",
    max_tokens=1024,
    messages=[{
        "role": "user",
        "content": [
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/jpeg",
                    "data": image_data
                }
            },
            {
                "type": "text",
                "text": "描述这张图片"
            }
        ]
    }]
)

print(message.content[0].text)
```

## 📊 支持的功能

| 功能 | 状态 | 说明 |
|-----|------|------|
| ✅ 文本对话 | 完全支持 | 单轮和多轮对话 |
| ✅ 流式响应 | 完全支持 | SSE 格式 |
| ✅ 系统提示 | 完全支持 | system 参数 |
| ✅ 多模态 | 完全支持 | 图像输入 |
| ✅ 工具调用 | 基础支持 | tool_use |
| ✅ 局域网 | 完全支持 | 多设备访问 |

## 🔍 故障排查

### 问题 1: 连接超时

```bash
# 检查服务状态
npm run pm2:monit

# 查看日志
view-logs.bat

# 测试端点
curl http://localhost:8000/api/health
```

### 问题 2: 流式响应卡住

```bash
# 检查 llama.cpp 是否运行
# 查看服务日志
view-logs.bat
```

### 问题 3: 环境变量未生效

```bash
# Windows PowerShell - 验证环境变量
echo $env:ANTHROPIC_BASE_URL
echo $env:ANTHROPIC_API_KEY

# Windows CMD - 验证环境变量
echo %ANTHROPIC_BASE_URL%
echo %ANTHROPIC_API_KEY%
```

### 问题 4: IP 地址错误

```bash
# 重新获取 IP
get-ip.bat

# 测试 IP 连接
curl http://<YOUR_IP>:8000/api/health
```

## 📚 更多资源

- [CLAUDE-CODE-SETUP.md](CLAUDE-CODE-SETUP.md) - 完整配置指南
- [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) - 部署指南
- [ANTHROPIC-STREAMING-STATUS.md](ANTHROPIC-STREAMING-STATUS.md) - 流式实现详情

## 🎉 开始使用

一切就绪！现在你可以：

1. ✅ 使用 Claude Code 进行编程辅助
2. ✅ 享受流式响应的流畅体验
3. ✅ 使用多模态功能（图像识别）
4. ✅ 在局域网内多设备访问

---

**准备好了吗？启动 Claude Code 开始你的 AI 编程之旅！** 🚀👨‍💻

```bash
claude-code
```
