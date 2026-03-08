# Qwen AI Service - 架构设计文档

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Web UI  │  │   CLI    │  │  Python  │  │  cURL    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTP/WebSocket
┌─────────────────────────────────────────────────────────────┐
│                  API Gateway Layer                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Node.js + Fastify Server                  │  │
│  │  ┌────────────────┐    ┌────────────────┐           │  │
│  │  │ OpenAI Router  │    │ Anthropic      │           │  │
│  │  │ /v1/chat/*     │    │ Router         │           │  │
│  │  │ /v1/models     │    │ /v1/messages   │           │  │
│  │  └────────────────┘    └────────────────┘           │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │         Request Transformer                  │   │  │
│  │  │   OpenAI/Anthropic → llama.cpp format        │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Model      │  │    Tools     │  │     MCP      │      │
│  │   Manager    │  │    Engine    │  │    Client    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
          ↓                  ↓                  ↓
┌─────────────────────────────────────────────────────────────┐
│                  Backend Layer                              │
│  ┌──────────────────┐    ┌──────────────────┐             │
│  │   llama.cpp      │    │   External       │             │
│  │   Server         │    │   MCP Services   │             │
│  │   (localhost)    │    │   (HTTP/WS)      │             │
│  └──────────────────┘    └──────────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

## 技术栈

### 核心技术
- **运行时**: Node.js 20 LTS
- **语言**: TypeScript 5.3+
- **框架**: Fastify 4.25+
- **进程管理**: PM2

### 主要依赖
```json
{
  "web": "fastify@^4.25.0",
  "client": "axios@^1.6.0",
  "logging": "winston@^3.11.0",
  "config": "js-yaml@^4.1.0",
  "openai": "openai@^4.20.0",
  "anthropic": "@anthropic-ai/sdk@^0.17.0",
  "tools": "jsonschema@^1.4.0"
}
```

## 目录结构

```
service/
├── src/
│   ├── server.ts                 # 主服务器入口
│   ├── config/                   # 配置管理
│   │   ├── index.ts             # 配置加载器
│   │   ├── schema.ts            # 配置验证
│   │   └── default.yaml         # 默认配置
│   ├── routes/                   # API 路由
│   │   ├── openai/              # OpenAI 协议路由
│   │   │   ├── index.ts
│   │   │   ├── chat.ts
│   │   │   └── models.ts
│   │   ├── anthropic/           # Anthropic 协议路由
│   │   │   ├── index.ts
│   │   │   └── messages.ts
│   │   ├── admin/               # 管理路由
│   │   │   ├── models.ts        # 模型管理
│   │   │   ├── tools.ts         # 工具管理
│   │   │   └── health.ts        # 健康检查
│   │   └── mcp/                 # MCP 协议路由
│   │       ├── server.ts        # MCP 服务器端点
│   │       └── client.ts        # MCP 客户端端点
│   ├── services/                 # 业务逻辑
│   │   ├── llama-client.ts      # llama.cpp 客户端
│   │   ├── model-manager.ts     # 模型管理器
│   │   ├── tool-engine.ts       # 工具执行引擎
│   │   ├── mcp-server.ts        # MCP 服务器
│   │   └── mcp-client.ts        # MCP 客户端
│   ├── transformers/             # 请求转换器
│   │   ├── openai.ts            # OpenAI 格式转换
│   │   ├── anthropic.ts         # Anthropic 格式转换
│   │   └── common.ts            # 通用转换
│   ├── tools/                    # 内置工具
│   │   ├── registry.ts          # 工具注册表
│   │   ├── weather.ts           # 天气工具
│   │   ├── search.ts            # 搜索工具
│   │   └── filesystem.ts        # 文件系统工具
│   ├── middleware/               # 中间件
│   │   ├── auth.ts              # 认证（可选）
│   │   ├── logging.ts           # 日志
│   │   ├── error-handler.ts     # 错误处理
│   │   └── rate-limit.ts        # 速率限制
│   ├── utils/                    # 工具函数
│   │   ├── logger.ts            # 日志工具
│   │   ├── validator.ts         # 验证器
│   │   └── helpers.ts           # 辅助函数
│   └── types/                    # TypeScript 类型
│       ├── openai.ts            # OpenAI 类型定义
│       ├── anthropic.ts         # Anthropic 类型定义
│       ├── llama.ts             # llama.cpp 类型
│       └── config.ts            # 配置类型
├── test/                         # 测试
│   ├── unit/                    # 单元测试
│   ├── integration/             # 集成测试
│   └── load/                    # 负载测试
├── logs/                         # 日志目录
├── config/                       # 配置文件
│   ├── default.yaml             # 默认配置
│   └── production.yaml          # 生产配置
├── docs/                         # 文档
│   ├── API.md                   # API 文档
│   └── DEPLOY.md                # 部署文档
├── scripts/                      # 脚本
│   ├── start.sh                 # 启动脚本
│   ├── stop.sh                  # 停止脚本
│   └── setup-firewall.ps1       # 防火墙配置
├── ecosystem.config.js           # PM2 配置
├── package.json
├── tsconfig.json
└── README.md
```

## API 端点设计

### OpenAI 协议
```
POST   /v1/chat/completions          # 聊天补全
POST   /v1/completions               # 文本补全
GET    /v1/models                    # 模型列表
POST   /v1/moderations               # 内容审核（可选）
```

### Anthropic 协议
```
POST   /v1/messages                  # 消息 API
POST   /v1/messages/batches          # 批量处理
GET    /v1/models                    # 模型列表
POST   /v1/tokens                    # Token 计数
```

### 管理端点
```
GET    /api/health                   # 健康检查
GET    /api/models                   # 可用模型列表
GET    /api/models/current           # 当前模型
POST   /api/models/load              # 加载模型
POST   /api/models/unload            # 卸载模型
GET    /api/tools                    # 工具列表
POST   /api/tools/register           # 注册工具
DELETE /api/tools/:name              # 删除工具
GET    /api/mcp/servers              # MCP 服务器列表
POST   /api/mcp/connect              # 连接 MCP 服务
DELETE /api/mcp/:id                  # 断开 MCP 服务
```

## 数据流

### 请求处理流程
```
1. Client Request
   ↓
2. API Gateway (Fastify)
   ↓
3. Middleware (Auth, Logging, Rate Limit)
   ↓
4. Router (OpenAI/Anthropic)
   ↓
5. Request Transformer (normalize format)
   ↓
6. Service Layer (Model Manager, Tools, MCP)
   ↓
7. Backend Client (llama.cpp / MCP Services)
   ↓
8. Response Transformer (format response)
   ↓
9. Client Response
```

### Tools 调用流程
```
1. User Request with Tool Description
   ↓
2. LLM generates tool call
   ↓
3. Tool Parser extracts call
   ↓
4. Tool Executor validates parameters
   ↓
5. Tool Handler executes
   ↓
6. Result returned to LLM
   ↓
7. LLM formats response
   ↓
8. Final response to user
```

## 配置管理

### 配置结构 (YAML)
```yaml
server:
  host: "0.0.0.0"
  port: 8000
  cors:
    origin: "*"
    credentials: true

llama:
  baseUrl: "http://localhost:8001"
  timeout: 300000
  maxRetries: 3

models:
  directory: "../models/gguf"
  default: "Qwen3.5-9B-Q6_K.gguf"
  autoUnload: false
  preload: []

tools:
  enabled: true
  builtin:
    - weather
    - search
    - filesystem
  custom: []

mcp:
  enabled: true
  servers:
    - name: "filesystem"
      url: "http://localhost:3000"
      enabled: true

logging:
  level: "info"
  file: "./logs/service.log"
  console: true
  maxSize: "100M"
  maxFiles: 10

security:
  apiKey:
    enabled: false
    header: "x-api-key"
  rateLimit:
    enabled: true
    requestsPerMinute: 60
```

## 错误处理

### 错误类型
```typescript
enum ErrorCode {
  // 通用错误
  INTERNAL_ERROR = 500,
  NOT_FOUND = 404,
  BAD_REQUEST = 400,

  // 模型错误
  MODEL_NOT_FOUND = 1001,
  MODEL_LOAD_FAILED = 1002,
  MODEL_ALREADY_LOADED = 1003,

  // 工具错误
  TOOL_NOT_FOUND = 2001,
  TOOL_EXECUTION_FAILED = 2002,
  INVALID_TOOL_PARAMETERS = 2003,

  // MCP 错误
  MCP_CONNECTION_FAILED = 3001,
  MCP_SERVER_NOT_FOUND = 3002,
}
```

## 性能优化

### 策略
1. **连接池**: 复用 HTTP 连接到 llama.cpp
2. **请求队列**: 限制并发请求数
3. **响应缓存**: 缓存相同请求（可选）
4. **流式响应**: 支持 Server-Sent Events

### 并发控制
```typescript
const CONCURRENT_LIMIT = 5; // 同时处理 5 个请求
const QUEUE_SIZE = 100;      // 队列最多 100 个请求
```

## 安全考虑

1. **API Key 认证**（可选）
2. **CORS 配置**: 仅允许局域网访问
3. **请求验证**: 严格验证输入参数
4. **速率限制**: 防止滥用
5. **日志脱敏**: 不记录敏感信息

## 监控指标

- 请求总数（按端点分组）
- 响应时间（P50, P95, P99）
- 错误率
- GPU 使用率
- 模型加载/卸载次数
- Tools 调用统计

---

**版本**: 1.0.0
**最后更新**: 2026-03-04
**作者**: Claude + User
