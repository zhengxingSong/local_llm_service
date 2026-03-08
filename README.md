<div align="center">

# Qwen AI Service

**一个功能完整的 AI 模型服务，支持 OpenAI 和 Anthropic 双协议，提供多模态能力**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org/)
[![Fastify](https://img.shields.io/badge/Fastify-4.25+-red)](https://fastify.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

## ✨ 特性

- 🔄 **双协议支持** - 完全兼容 OpenAI 和 Anthropic API
- 🎨 **多模态支持** - 图像输入（Vision）
- 📡 **流式响应** - SSE 格式，两种协议完全支持
- 🌐 **局域网部署** - 多设备访问
- 🛠️ **工具调用** - 基础工具支持
- 🧪 **高测试覆盖** - 85%+ 测试覆盖率
- 📝 **TDD 开发** - 测试驱动开发

## 🚀 快速开始

### 🐳 Docker 部署（推荐）

#### 启动服务

```bash
# 1. 复制配置文件
cp .env.example .env

# 2. 启动所有服务（自动构建镜像）
docker-compose up -d

# 3. 查看状态
docker-compose ps

# 4. 查看日志
docker-compose logs -f qwen-service
```

#### Docker 管理命令

```bash
# 停止服务
docker-compose stop

# 重启服务
docker-compose restart

# 停止并删除容器
docker-compose down

# 查看特定服务日志
docker-compose logs -f qwen-service    # Qwen 服务日志
docker-compose logs -f llama-cpp       # llama.cpp 日志

# 重新构建并启动
docker-compose up -d --build

# 进入容器
docker exec -it qwen-ai-service sh
```

#### 验证服务

```bash
# 检查健康状态
curl http://localhost:8000/api/health

# 查看模型列表
curl http://localhost:8000/v1/models

# 测试聊天
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen","messages":[{"role":"user","content":"Hello!"}]}'
```

**配置 Chatbox**：
1. 获取你的 IP 地址
2. 在 Chatbox 中配置：
   ```
   API Base URL: http://YOUR_IP:8000/v1
   API Key: dummy
   Model: Qwen3.5-9B-Q4_K_M.gguf
   ```

详细文档请参考 [DOCKER.md](docs/DOCKER.md)

---

### 传统安装方式

#### 前置要求

- Node.js 20+
- llama.cpp（运行中）
- Qwen GGUF 模型文件

#### 安装

```bash
# 克隆仓库
git clone https://github.com/yourusername/qwen-ai-service.git
cd qwen-ai-service

# 安装依赖
npm install

# 构建项目
npm run build
```

#### 配置

编辑 `config/default.yaml`：

```yaml
server:
  host: "0.0.0.0"
  port: 8000

llama:
  baseUrl: "http://localhost:8001"

multimodal:
  enabled: true
  image:
    maxSize: 10485760  # 10MB
```

#### 启动

```bash
# 使用脚本（推荐）
scripts/management/start-service.bat

# 或使用 PM2
npm run pm2:start

# 开发模式
npm run dev
```

#### 验证

```bash
curl http://localhost:8000/api/health
```

## 📱 客户端集成

### Chatbox

```bash
# 配置
API Base URL: http://<YOUR_IP>:8000/v1
API Key: dummy
Model: Qwen3.5-9B-Q4_K_M.gguf
```

详见 [Chatbox 配置指南](docs/guides/CHATBOX-SETUP.md)

### Claude Code

```bash
# 配置环境变量
export ANTHROPIC_BASE_URL="http://localhost:8000/v1"
export ANTHROPIC_API_KEY="dummy"

# 启动
claude-code
```

详见 [Claude Code 配置指南](docs/guides/CLAUDE-CODE-SETUP.md)

## 💡 使用示例

### Python (OpenAI SDK)

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8000/v1",
    api_key="dummy"
)

response = client.chat.completions.create(
    model="Qwen3.5-9B-Q4_K_M.gguf",
    messages=[
        {"role": "user", "content": "你好！"}
    ]
)

print(response.choices[0].message.content)
```

### Python (Anthropic SDK)

```python
import anthropic

client = anthropic.Anthropic(
    base_url="http://localhost:8000/v1",
    api_key="dummy"
)

# 流式响应
with client.messages.stream(
    model="Qwen3.5-9B-Q4_K_M.gguf",
    max_tokens=1024,
    messages=[{"role": "user", "content": "讲个故事"}]
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)
```

### 图像输入 (Vision)

```python
import anthropic
import base64

client = anthropic.Anthropic(
    base_url="http://localhost:8000/v1",
    api_key="dummy"
)

with open("image.jpg", "rb") as f:
    image_data = base64.b64encode(f.read()).decode()

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

## 🌐 API 端点

### OpenAI 协议

```
POST /v1/chat/completions  - 聊天补全（支持流式）
GET  /v1/models            - 模型列表
```

### Anthropic 协议

```
POST /v1/messages          - 发送消息（支持流式）
GET  /v1/models            - 模型列表
```

### 管理端点

```
GET  /api/health           - 健康检查
GET  /api/models           - 可用模型
POST /api/models/load      - 加载模型
GET  /api/tools            - 工具列表
POST /api/tools/execute    - 执行工具
```

## 📊 功能对比

| 功能 | OpenAI | Anthropic | 状态 |
|-----|--------|-----------|------|
| 文本对话 | ✅ | ✅ | ✅ |
| 流式响应 | ✅ | ✅ | ✅ |
| 多轮对话 | ✅ | ✅ | ✅ |
| 系统提示 | ✅ | ✅ | ✅ |
| 图像输入 | ✅ | ✅ | ✅ |
| 工具调用 | ✅ | ✅ | ✅ |

## 🧪 测试

```bash
# 运行所有测试
npm test

# 覆盖率报告
npm test -- --coverage

# 单元测试
npm run test:unit

# 集成测试
npm run test:integration
```

**测试覆盖率**: 85%+

## 🔧 管理命令

```bash
# 启动服务
scripts/management/start-service.bat

# 停止服务
scripts/management/stop-service.bat

# 重启服务
scripts/management/restart-service.bat

# 查看日志
scripts/management/view-logs.bat

# 获取 IP 地址
scripts/management/get-ip.bat

# PM2 状态
npm run pm2:monit
```

## 📁 项目结构

```
qwen-ai-service/
├── src/
│   ├── main.ts                 # 应用入口
│   ├── server.ts               # Fastify 服务器
│   ├── config/                 # 配置加载器
│   ├── routes/                 # API 路由
│   │   ├── openai/             # OpenAI 协议
│   │   └── anthropic/          # Anthropic 协议
│   ├── services/               # 业务逻辑
│   ├── transformers/           # 请求转换
│   ├── multimodal/             # 多模态处理
│   ├── utils/                  # 工具函数
│   └── types/                  # TypeScript 类型
├── config/                     # 配置文件
├── test/                       # 测试文件
├── scripts/
│   ├── management/             # 管理脚本（启动/停止/日志等）
│   └── test/                   # 测试脚本
├── docs/                       # 文档
│   ├── guides/                 # 使用指南
│   ├── archive/                # 历史文档
│   ├── CHANGELOG.md            # 变更日志
│   └── README.md               # 文档导航
├── examples/                   # 使用示例
├── docker/                     # Docker 相关文件
├── docker-compose.yml          # Docker Compose 配置
└── Dockerfile                  # Docker 镜像构建
```

## 🛠️ 技术栈

- **运行时**: Node.js 20 LTS
- **语言**: TypeScript 5.3+
- **框架**: Fastify 4.25+
- **测试**: Jest
- **进程管理**: PM2
- **日志**: Winston
- **图像处理**: Sharp

## 📚 文档

- [部署指南](docs/guides/DEPLOYMENT-GUIDE.md) - 完整的部署和配置说明
- [Chatbox 配置](docs/guides/CHATBOX-SETUP.md) - Chatbox 客户端配置
- [Claude Code 配置](docs/guides/CLAUDE-CODE-SETUP.md) - Claude Code 配置
- [快速开始](docs/guides/CLAUDE-CODE-QUICKSTART.md) - 3 步快速启动
- [变更日志](docs/CHANGELOG.md) - 版本历史和变更记录
- [目录结构](docs/DIRECTORY-STRUCTURE.md) - 详细的目录说明

## 🤝 贡献

欢迎贡献！请遵循以下流程：

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [Qwen](https://github.com/QwenLM/Qwen) - 优秀的大语言模型
- [llama.cpp](https://github.com/ggerganov/llama.cpp) - 推理引擎
- [Fastify](https://fastify.dev/) - 高性能 Web 框架
- [Anthropic](https://www.anthropic.com/) - Claude API 规范
- [OpenAI](https://openai.com/) - ChatGPT API 规范

## 📞 支持

- 提交 Issue 报告问题
- 查看 [文档](docs) 获取帮助
- 查看 [部署指南](docs/guides/DEPLOYMENT-GUIDE.md)

---

<div align="center">

**Made with ❤️ by the community**

**享受你的私有 AI 服务！** 🚀

</div>
