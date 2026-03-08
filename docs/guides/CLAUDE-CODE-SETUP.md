# Claude Code 配置指南

本指南将帮助你配置 Claude Code 连接到 Qwen AI Service。

## 前提条件

- Qwen AI Service 正在运行
- 已安装 Claude Code
- 了解基本的 JSON 配置

## 快速开始

### 1. 启动 Qwen AI Service

```bash
cd "D:\LLM Model\Qwen-3.5\service"
start-service.bat
```

### 2. 获取本地 IP 地址

```bash
get-ip.bat
```

记下显示的 IPv4 地址（例如：`192.168.1.100`）

### 3. 配置 Claude Code

Claude Code 支持多种配置方式：

#### 方法 A：环境变量配置（推荐）

在命令行中设置环境变量：

```bash
# Windows PowerShell
$env:ANTHROPIC_API_KEY="dummy"
$env:ANTHROPIC_BASE_URL="http://192.168.1.100:8000/v1"

# Windows CMD
set ANTHROPIC_API_KEY=dummy
set ANTHROPIC_BASE_URL=http://192.168.1.100:8000/v1

# Linux/Mac
export ANTHROPIC_API_KEY="dummy"
export ANTHROPIC_BASE_URL="http://192.168.1.100:8000/v1"
```

然后启动 Claude Code：

```bash
claude-code
```

#### 方法 B：配置文件

创建或编辑 `~/.claude/settings.json`：

```json
{
  "apiKey": "dummy",
  "baseURL": "http://192.168.1.100:8000/v1",
  "defaultModel": "Qwen3.5-9B-Q4_K_M.gguf"
}
```

**注意**：将 `192.168.1.100` 替换为你的实际 IP 地址。

#### 方法 C：命令行参数

```bash
claude-code --api-key dummy --base-url http://192.168.1.100:8000/v1
```

### 4. 验证连接

在 Claude Code 中测试：

```
你好，请介绍一下你自己。
```

如果收到回复，说明配置成功！

## 功能支持

### ✅ 已支持功能

- **文本对话** - 完整支持
- **流式响应** - ✅ 核心功能，完全兼容
- **多轮对话** - 自动管理上下文
- **系统提示** - 支持
- **工具调用** - 支持基础工具
- **多模态** - 图像输入支持

### 📝 Claude Code 特定功能

#### 流式响应

Qwen AI Service 完全实现了 Anthropic 的 SSE 流式格式：

```
event: message_start
data: {"type":"message_start",...}

event: content_block_delta
data: {"type":"content_block_delta",...}

event: message_stop
data: {"type":"message_stop"}
```

#### 工具使用

支持 Anthropic 的工具调用格式：

```python
import anthropic

client = anthropic.Anthropic(
    base_url="http://192.168.1.100:8000/v1",
    api_key="dummy"
)

response = client.messages.create(
    model="Qwen3.5-9B-Q4_K_M.gguf",
    max_tokens=1024,
    tools=[
        {
            "name": "get_weather",
            "description": "获取天气信息",
            "input_schema": {
                "type": "object",
                "properties": {
                    "location": {"type": "string"}
                }
            }
        }
    ],
    messages=[{
        "role": "user",
        "content": "北京天气怎么样？"
    }]
)
```

#### 图像输入（Vision）

```python
import anthropic
import base64

client = anthropic.Anthropic(
    base_url="http://192.168.1.100:8000/v1",
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
```

## API 端点

### Messages API

```
POST http://192.168.1.100:8000/v1/messages
```

### Models API

```
GET http://192.168.1.100:8000/v1/models
```

## 高级配置

### 自定义模型

在 `~/.claude/settings.json` 中指定：

```json
{
  "defaultModel": "Qwen3.5-9B-Q6_K.gguf"
}
```

可用的模型：
- `Qwen3.5-9B-Q4_K_M.gguf`（推荐，平衡质量和速度）
- `Qwen3.5-9B-Q6_K.gguf`（更高质量）
- `Qwen3.5-9B-Q8_0.gguf`（最高质量）

### 参数调整

```json
{
  "temperature": 0.7,
  "maxTokens": 4096,
  "topP": 0.9
}
```

## Python SDK 示例

### 基础对话

```python
import anthropic

client = anthropic.Anthropic(
    base_url="http://192.168.1.100:8000/v1",
    api_key="dummy"
)

message = client.messages.create(
    model="Qwen3.5-9B-Q4_K_M.gguf",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "你好"}
    ]
)

print(message.content)
```

### 流式响应

```python
import anthropic

client = anthropic.Anthropic(
    base_url="http://192.168.1.100:8000/v1",
    api_key="dummy"
)

with client.messages.stream(
    model="Qwen3.5-9B-Q4_K_M.gguf",
    max_tokens=1024,
    messages=[{"role": "user", "content": "讲个故事"}]
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)
```

### 系统提示

```python
message = client.messages.create(
    model="Qwen3.5-9B-Q4_K_M.gguf",
    max_tokens=1024,
    system="你是一个专业的程序员助手。",
    messages=[
        {"role": "user", "content": "如何使用 Python?"}
    ]
)
```

## JavaScript SDK 示例

```javascript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  baseURL: 'http://192.168.1.100:8000/v1',
  apiKey: 'dummy',
});

const message = await client.messages.create({
  model: 'Qwen3.5-9B-Q4_K_M.gguf',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Hello!' }],
});

console.log(message.content);
```

## 故障排查

### 问题：连接超时

**解决方案**：
1. 检查服务是否运行：
   ```bash
   npm run pm2:monit
   ```
2. 验证 IP 地址正确
3. 测试端点：
   ```bash
   curl http://192.168.1.100:8000/api/health
   ```

### 问题：流式响应卡住

**解决方案**：
1. 查看服务日志：
   ```bash
   view-logs.bat
   ```
2. 检查 llama.cpp 是否正常
3. 尝试非流式模式测试

### 问题：工具调用不工作

**解决方案**：
1. 确认工具已启用（`config/default.yaml`）
2. 检查工具格式是否正确
3. 查看日志中的错误信息

## 协议兼容性

Qwen AI Service 完全兼容 Anthropic API 规范：

| 功能 | 状态 | 备注 |
|-----|------|------|
| Messages API | ✅ | 完全支持 |
| 流式响应 | ✅ | SSE 格式正确 |
| 工具使用 | ✅ | tool_use/tool_result |
| 系统提示 | ✅ | system 参数 |
| 多模态 | ✅ | image 内容块 |
| 模型列表 | ✅ | /v1/models |

## 性能优化

### 并发请求

服务支持并发处理，默认限制为 5 个并发请求。

可在 `config/default.yaml` 中调整：

```yaml
performance:
  concurrentLimit: 10  # 增加到 10
```

### 响应速度

- 使用量化程度更高的模型（Q4_K_M）
- 减少 `max_tokens` 值
- 启用流式响应获得更好的体验

## 安全提示

⚠️ **重要**：
- 当前配置未启用 API 密钥验证
- 仅在受信任的局域网中使用
- 不要将服务暴露到公网
- 生产环境请启用验证：

```yaml
security:
  apiKey:
    enabled: true
    header: "x-api-key"
    keys: ["your-secret-key"]
```

## 测试脚本

创建测试文件 `test-claude.py`：

```python
import anthropic

client = anthropic.Anthropic(
    base_url="http://192.168.1.100:8000/v1",
    api_key="dummy"
)

print("Testing Claude Code connection...")

# Test 1: Basic chat
print("\n=== Test 1: Basic Chat ===")
response = client.messages.create(
    model="Qwen3.5-9B-Q4_K_M.gguf",
    max_tokens=100,
    messages=[{"role": "user", "content": "Say 'Hello!'"}]
)
print(response.content[0].text)

# Test 2: Streaming
print("\n=== Test 2: Streaming ===")
with client.messages.stream(
    model="Qwen3.5-9B-Q4_K_M.gguf",
    max_tokens=100,
    messages=[{"role": "user", "content": "Count to 5"}]
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)
print()

print("\n✅ All tests passed!")
```

运行测试：

```bash
python test-claude.py
```

## 更多资源

- [Anthropic API 文档](https://docs.anthropic.com/)
- [Claude Code GitHub](https://github.com/anthropics/claude-code)
- [项目部署指南](DEPLOYMENT-GUIDE.md)

---

**开始使用你的私有 AI 编程助手！** 🚀👨‍💻
