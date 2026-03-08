# 目录结构说明

本文档详细说明 Qwen AI Service 的目录组织结构。

## 📂 根目录结构

```
service/
├── src/                      # 源代码目录
├── config/                   # 配置文件
├── test/                     # 测试文件
├── scripts/                  # 脚本工具
├── docs/                     # 项目文档
├── examples/                 # 使用示例
├── docker/                   # Docker 相关
├── dist/                     # 编译输出（生成）
├── coverage/                 # 测试覆盖率报告（生成）
├── logs/                     # 日志文件（运行时）
├── node_modules/             # 依赖包（安装）
├── models/                   # 模型文件（运行时）
└── [配置文件]                # 根目录配置
```

---

## 📁 核心目录详解

### 1. `src/` - 源代码

应用程序的 TypeScript 源代码。

```
src/
├── main.ts                   # 应用程序入口点
├── server.ts                 # Fastify 服务器配置
├── config/                   # 配置管理
│   └── index.ts              # 配置加载器
├── routes/                   # API 路由定义
│   ├── admin/                # 管理端点
│   │   ├── health.ts         # 健康检查
│   │   ├── models.ts         # 模型管理
│   │   └── tools.ts          # 工具管理
│   ├── openai/               # OpenAI 协议
│   │   └── chat.ts           # 聊天补全端点
│   └── anthropic/            # Anthropic 协议
│       └── messages.ts       # 消息端点
├── services/                 # 业务逻辑服务
│   ├── llama-client.ts       # llama.cpp 客户端
│   ├── model-manager.ts      # 模型管理器
│   └── model-scanner.ts      # 模型扫描器
├── transformers/             # 请求/响应转换
│   ├── openai.ts             # OpenAI 格式转换
│   ├── anthropic.ts          # Anthropic 格式转换
│   ├── openai-vision.ts      # OpenAI Vision 转换
│   └── anthropic-vision.ts   # Anthropic Vision 转换
├── multimodal/               # 多模态处理
│   └── image-processor.ts    # 图像处理器
├── tools/                    # 工具系统
│   ├── registry.ts           # 工具注册表
│   ├── builtin.ts            # 内置工具
│   ├── parser.ts             # 工具调用解析
│   └── engine.ts             # 工具执行引擎
├── utils/                    # 工具函数
│   ├── logger.ts             # 日志工具
│   ├── openai-streaming.ts   # OpenAI 流式响应
│   └── anthropic-streaming.ts # Anthropic 流式响应
└── types/                    # TypeScript 类型定义
    ├── config.ts             # 配置类型
    ├── openai.ts             # OpenAI 类型
    ├── anthropic.ts          # Anthropic 类型
    ├── llama.ts              # llama.cpp 类型
    ├── vision.ts             # Vision 类型
    └── common.ts             # 通用类型
```

**关键文件说明**：
- `main.ts` - 应用程序启动点，注册路由和启动服务器
- `server.ts` - Fastify 服务器配置，包含中间件和错误处理
- `routes/` - 所有 API 端点定义，按协议分类
- `services/` - 核心业务逻辑，与后端 llama.cpp 通信
- `transformers/` - 在不同 API 格式之间转换
- `tools/` - 函数调用（Function Calling）实现

---

### 2. `config/` - 配置文件

应用程序配置文件。

```
config/
└── default.yaml              # 默认配置
```

**配置项**：
- `server` - 服务器配置（host, port, CORS）
- `llama` - llama.cpp 后端配置
- `models` - 模型路径和默认模型
- `tools` - 工具配置
- `multimodal` - 多模态配置
- `logging` - 日志配置
- `security` - 安全配置

---

### 3. `scripts/` - 脚本工具

管理和测试脚本。

```
scripts/
├── management/               # 管理脚本
│   ├── start-service.bat     # 启动服务
│   ├── stop-service.bat      # 停止服务
│   ├── restart-service.bat   # 重启服务
│   ├── view-logs.bat         # 查看日志
│   ├── get-ip.bat            # 获取 IP 地址
│   ├── start-clean.bat       # 清理启动
│   ├── start-llamacpp-gpu.bat # 启动 llama.cpp GPU
│   └── setup-firewall.bat    # 配置防火墙
└── test/                     # 测试脚本
    ├── test-anthropic-stream.js # 测试 Anthropic 流式
    └── test-openai-chat.js       # 测试 OpenAI 聊天
```

**使用方式**：
```bash
# 启动服务
scripts/management/start-service.bat

# 查看日志
scripts/management/view-logs.bat
```

---

### 4. `docs/` - 项目文档

所有文档文件（除 README.md 外）。

```
docs/
├── README.md                 # 文档导航
├── CHANGELOG.md              # 变更日志
├── DOCKER.md                 # Docker 部署指南
├── DIRECTORY-STRUCTURE.md    # 本文件
├── guides/                   # 使用指南
│   ├── DEPLOYMENT-GUIDE.md   # 部署指南
│   ├── CHATBOX-SETUP.md      # Chatbox 配置
│   ├── CLAUDE-CODE-SETUP.md  # Claude Code 配置
│   ├── CLAUDE-CODE-QUICKSTART.md # 快速开始
│   ├── GITHUB-SETUP.md       # GitHub 设置
│   └── ANTHROPIC-STREAMING-STATUS.md # 流式状态
└── archive/                  # 历史文档
    ├── ARCHITECTURE.md       # 架构文档
    ├── INSTALL.md            # 安装指南
    └── [其他归档文档]
```

---

### 5. `test/` - 测试文件

Jest 测试套件。

```
test/
├── unit/                     # 单元测试
│   ├── routes/               # 路由测试
│   ├── services/             # 服务测试
│   └── utils/                # 工具函数测试
├── integration/              # 集成测试
│   ├── api/                  # API 端点测试
│   └── streaming/            # 流式响应测试
└── e2e/                      # 端到端测试
    └── scenarios/            # 完整场景测试
```

**运行测试**：
```bash
npm test                      # 所有测试
npm run test:unit             # 仅单元测试
npm run test:integration      # 仅集成测试
npm test -- --coverage        # 带覆盖率报告
```

---

### 6. `examples/` - 使用示例

客户端集成示例代码。

```
examples/
├── python/                   # Python 示例
│   ├── openai_client.py      # OpenAI SDK 示例
│   ├── anthropic_client.py   # Anthropic SDK 示例
│   └── vision_example.py     # 图像输入示例
├── javascript/               # JavaScript 示例
│   ├── openai.js             # OpenAI fetch 示例
│   └── anthropic.js          # Anthropic fetch 示例
└── curl/                     # cURL 示例
    ├── openai.sh             # OpenAI API 示例
    └── anthropic.sh          # Anthropic API 示例
```

---

### 7. `docker/` - Docker 相关

Docker 构建和部署文件。

```
docker/
├── entrypoint.sh             # 容器启动脚本
└── healthcheck.sh            # 健康检查脚本
```

**相关文件**（根目录）：
- `Dockerfile` - Docker 镜像构建配置
- `docker-compose.yml` - 多容器编排配置

---

### 8. 生成目录

以下目录在构建或运行时生成，不应手动编辑：

| 目录 | 说明 | 何时生成 |
|------|------|----------|
| `dist/` | TypeScript 编译输出 | `npm run build` |
| `coverage/` | 测试覆盖率报告 | `npm test -- --coverage` |
| `logs/` | 应用程序日志 | 运行时 |
| `node_modules/` | npm 依赖包 | `npm install` |
| `bin/` | 可执行文件 | `npm install` |
| `var/` | 运行时数据 | 运行时 |

---

## 🔧 根目录配置文件

```
service/
├── package.json              # Node.js 项目配置
├── package-lock.json         # 依赖版本锁定
├── tsconfig.json             # TypeScript 配置
├── jest.config.json          # Jest 测试配置
├── ecosystem.config.js       # PM2 进程管理配置
├── .env.example              # 环境变量模板
├── .env                      # 环境变量（本地）
├── .dockerignore             # Docker 忽略文件
├── .gitignore                # Git 忽略文件
├── Dockerfile                # Docker 镜像配置
├── docker-compose.yml        # Docker Compose 配置
├── LICENSE                   # 许可证
└── README.md                 # 项目说明
```

---

## 📊 文件分类

### 源代码
- `.ts` - TypeScript 源文件
- `.js` - 编译后的 JavaScript（在 `dist/`）

### 配置
- `.yaml` - YAML 配置文件
- `.json` - JSON 配置文件
- `.env` - 环境变量

### 脚本
- `.bat` - Windows 批处理脚本
- `.sh` - Bash 脚本
- `.ps1` - PowerShell 脚本

### 文档
- `.md` - Markdown 文档

### 测试
- `.test.ts` - 单元测试
- `.spec.ts` - 规范测试
- `.e2e.ts` - 端到端测试

---

## 🎯 快速定位

| 我想... | 文件位置 |
|---------|----------|
| 修改 API 端点 | `src/routes/` |
| 添加新工具 | `src/tools/builtin.ts` |
| 更改服务器配置 | `config/default.yaml` |
| 查看日志 | `scripts/management/view-logs.bat` |
| 启动服务 | `scripts/management/start-service.bat` |
| 运行测试 | `npm test` |
| 查看部署文档 | `docs/guides/DEPLOYMENT-GUIDE.md` |
| 了解变更历史 | `docs/CHANGELOG.md` |
| 集成到客户端 | `examples/` |
| Docker 部署 | `docker-compose.yml` |

---

## 📝 维护建议

### 添加新功能
1. 在 `src/` 对应子目录添加代码
2. 在 `test/` 添加测试
3. 在 `docs/guides/` 添加使用文档
4. 更新 `docs/CHANGELOG.md`

### 添加新脚本
1. 管理脚本 → `scripts/management/`
2. 测试脚本 → `scripts/test/`

### 添加新文档
1. 指南 → `docs/guides/`
2. 归档 → `docs/archive/`
3. 根目录仅保留 `README.md`

---

**最后更新**: 2026-03-08
**维护者**: Qwen AI Service Team
