# Qwen AI Service - 项目导航总览

本文档提供项目的快速导航指南，帮助你快速找到需要的文件和信息。

---

## 🚀 快速开始

### 我想...

#### 🏃 快速启动服务
```bash
cd "D:\LLM Model\Qwen-3.5\service"
.\start-clean.bat
```
📖 详见: [快速启动指南](#快速启动指南)

#### 🔧 配置 GPU 加速
📖 查看: [GPU-SETUP-SUMMARY.md](GPU-SETUP-SUMMARY.md)

#### 🌐 设置局域网访问
```bash
# 以管理员身份运行
.\setup-firewall.bat
```
📖 详见: [LAN-ACCESS-GUIDE.md](LAN-ACCESS-GUIDE.md)

#### 🐛 遇到问题
📖 查看: [故障排除](#故障排除)

---

## 📚 文档导航

### 核心文档

| 文档 | 用途 | 阅读时间 |
|------|------|----------|
| [README.md](README.md) | 项目介绍和使用指南 | 10 min |
| [ARCHITECTURE.md](ARCHITECTURE.md) | 系统架构和技术设计 | 15 min |
| [INSTALL.md](INSTALL.md) | 安装和配置步骤 | 5 min |
| [CHANGELOG.md](CHANGELOG.md) | 版本更新历史 | 10 min |

### 总结文档

| 文档 | 用途 |
|------|------|
| [PROJECT-SUMMARY.md](PROJECT-SUMMARY.md) | 项目完成情况总结 |
| [FINAL-SUMMARY.md](FINAL-SUMMARY.md) | 最终项目总结 |
| [COMPLETION-REPORT.md](COMPLETION-REPORT.md) | 功能完成报告 |
| [PROGRESS.md](PROGRESS.md) | 开发进度报告 |

### 专项文档

| 文档 | 用途 |
|------|------|
| [GPU-SETUP-SUMMARY.md](GPU-SETUP-SUMMARY.md) | GPU 加速配置 |
| [LAN-ACCESS-GUIDE.md](LAN-ACCESS-GUIDE.md) | 局域网访问设置 |
| [FILE-ARCHIVE.md](FILE-ARCHIVE.md) | 完整文件归档 |

---

## 📂 源代码导航

### 入口点

**📄 [src/main.ts](src/main.ts)** - 应用程序入口
- 启动服务器
- 注册路由
- 初始化服务

### 路由层 (API 端点)

**管理端点** (`routes/admin/`)
- **[health.ts](src/routes/admin/health.ts)** - `GET /api/health`
- **[models.ts](src/routes/admin/models.ts)** - 模型管理
- **[tools.ts](src/routes/admin/tools.ts)** - 工具管理

**OpenAI 协议** (`routes/openai/`)
- **[chat.ts](src/routes/openai/chat.ts)** - `POST /v1/chat/completions`

**Anthropic 协议** (`routes/anthropic/`)
- **[messages.ts](src/routes/anthropic/messages.ts)** - `POST /v1/messages`

### 服务层

**[llama-client.ts](src/services/llama-client.ts)** - llama.cpp 客户端
- HTTP 请求封装
- 流式传输支持
- 自动重试机制

**[model-manager.ts](src/services/model-manager.ts)** - 模型管理
- 模型加载/卸载
- 队列管理
- 缓存控制

**[model-scanner.ts](src/services/model-scanner.ts)** - 模型扫描
- GGUF 文件扫描
- 元数据解析

### 转换器

**[openai.ts](src/transformers/openai.ts)** - OpenAI 协议转换
- OpenAI ↔ llama.cpp
- 流式块处理

**[anthropic.ts](src/transformers/anthropic.ts)** - Anthropic 协议转换
- Anthropic ↔ llama.cpp

### 工具系统

**[registry.ts](src/tools/registry.ts)** - 工具注册表
**[parser.ts](src/tools/parser.ts)** - 调用解析器
**[engine.ts](src/tools/engine.ts)** - 执行引擎
**[builtin.ts](src/tools/builtin.ts)** - 内置工具 (7 个)

### 类型定义

**[types/](src/types/)** - TypeScript 类型定义
- `config.ts` - 配置类型
- `openai.ts` - OpenAI API 类型
- `anthropic.ts` - Anthropic API 类型
- `llama.ts` - llama.cpp 类型
- `common.ts` - 通用类型

---

## 🌐 Web 界面

### 📄 [web/index.html](web/index.html)

**功能**:
- 聊天界面
- 流式/阻塞模式切换
- 模型选择
- Markdown 渲染
- 深色主题

**访问**: http://localhost:8000/

---

## 🧪 测试

### 测试文件

- **[test/unit/registry.test.ts](test/unit/registry.test.ts)** - 工具注册表测试
- **[test/integration/api.test.ts](test/integration/api.test.ts)** - API 集成测试

### 运行测试

```bash
npm test
```

---

## 📖 客户端示例

### Python

**[examples/python_openai.py](examples/python_openai.py)**
- OpenAI SDK 使用示例
- 流式输出示例
- 多轮对话示例

**[examples/python_anthropic.py](examples/python_anthropic.py)**
- Anthropic SDK 使用示例
- 工具调用示例

### JavaScript

**[examples/javascript.mjs](examples/javascript.mjs)**
- Fetch API 调用示例
- 流式响应处理

---

## ⚙️ 配置文件

### 服务配置

**[config/default.yaml](config/default.yaml)**
- 服务器端口: 8000
- llama.cpp 地址: http://localhost:8001
- 默认模型
- 超时设置
- 日志级别

### 构建配置

**[tsconfig.json](tsconfig.json)** - TypeScript 编译配置
**[package.json](package.json)** - 依赖和脚本
**[jest.config.json](jest.config.json)** - 测试配置
**[ecosystem.config.js](ecosystem.config.js)** - PM2 配置

---

## 🚀 启动脚本

| 脚本 | 用途 | 说明 |
|------|------|------|
| [start-clean.bat](start-clean.bat) | 一键启动 | 推荐：启动完整服务 |
| [start-llamacpp-gpu.bat](start-llamacpp-gpu.bat) | llama.cpp 启动 | 独立启动 llama.cpp (GPU) |
| [restart-service.bat](restart-service.bat) | 重启 API | 重启 Node.js 服务 |
| [setup-firewall.bat](setup-firewall.bat) | 防火墙配置 | 需要管理员权限 |

---

## 🔍 API 端点速查

### 管理端点

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api/health` | GET | 健康检查 |
| `/api/models` | GET | 模型列表 |
| `/api/models/load` | POST | 加载模型 |
| `/api/models/unload` | POST | 卸载模型 |
| `/api/tools` | GET | 工具列表 |
| `/api/tools/call` | POST | 调用工具 |

### OpenAI 协议

| 端点 | 方法 | 功能 |
|------|------|------|
| `/v1/chat/completions` | POST | 聊天补全 |
| `/v1/models` | GET | 模型列表 |

### Anthropic 协议

| 端点 | 方法 | 功能 |
|------|------|------|
| `/v1/messages` | POST | 消息 API |
| `/v1/models` | GET | 模型列表 |

---

## 🛠️ 常用命令

### 开发

```bash
# 安装依赖
npm install

# 编译 TypeScript
npm run build

# 监听模式编译
npm run build:watch

# 开发模式启动
npm run dev

# 生产模式启动
npm run pm2:start

# 停止服务
npm run pm2:stop

# 重启服务
npm run pm2:restart

# 查看日志
npm run pm2:logs
```

### 测试

```bash
# 运行所有测试
npm test

# 测试覆盖率
npm run test:coverage

# 监听模式
npm run test:watch
```

### 构建

```bash
# 清理构建文件
npm run clean

# 完整构建
npm run build

# 构建并启动
npm run start
```

---

## 📊 项目统计

| 指标 | 数值 |
|------|------|
| **版本** | 1.2.0 |
| **完成度** | 85% |
| **源代码文件** | 25 |
| **测试文件** | 2 |
| **文档文件** | 10 |
| **代码行数** | ~4,500 |
| **测试覆盖率** | ~40% |

---

## 🎯 功能特性

### ✅ 已实现

- ✅ OpenAI API 兼容
- ✅ Anthropic API 兼容
- ✅ 流式传输 (SSE)
- ✅ 模型管理
- ✅ Tools 支持 (7 个工具)
- ✅ GPU 加速
- ✅ 局域网访问
- ✅ Web 聊天界面
- ✅ Markdown 渲染
- ✅ 日志系统
- ✅ PM2 进程管理

### ⏸️ 待实现

- ⏸️ MCP 协议支持
- ⏸️ API Key 认证
- ⏸️ 速率限制
- ⏸️ E2E 测试
- ⏸️ 监控面板

---

## 🔧 故障排除

### 常见问题

#### Q: 服务无法启动
**A**:
1. 检查端口占用: `netstat -ano | findstr :8000`
2. 检查日志: `logs/` 目录
3. 确认 llama.cpp 是否运行在端口 8001

#### Q: GPU 未启用
**A**:
1. 确认 CUDA DLLs 已复制
2. 检查环境变量: `GGML_CUDA=1`
3. 查看 GPU 配置: [GPU-SETUP-SUMMARY.md](GPU-SETUP-SUMMARY.md)

#### Q: 局域网无法访问
**A**:
1. 运行防火墙脚本: `setup-firewall.bat`
2. 检查 Windows 防火墙设置
3. 确认网络在同一局域网

#### Q: 流式模式不工作
**A**:
1. 刷新浏览器 (Ctrl+F5)
2. 检查浏览器控制台错误
3. 确认 API 已重启

### 调试技巧

**查看日志**:
```bash
# 实时查看日志
Get-Content logs\combined-*.log -Wait -Tail 50
```

**测试 API**:
```bash
# 健康检查
curl http://localhost:8000/api/health

# 聊天测试
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d "{\"model\":\"Qwen3.5-9B-Q4_K_M.gguf\",\"messages\":[{\"role\":\"user\",\"content\":\"Hi\"}]}"
```

**检查进程**:
```bash
# 查看运行中的进程
tasklist | findstr "node llama-server"

# 查看端口占用
netstat -ano | findstr ":8000 :8001"
```

---

## 📞 获取帮助

### 文档资源

1. 📖 [README.md](README.md) - 从这里开始
2. 🏗️ [ARCHITECTURE.md](ARCHITECTURE.md) - 了解架构
3. 📝 [CHANGELOG.md](CHANGELOG.md) - 查看更新
4. 📂 [FILE-ARCHIVE.md](FILE-ARCHIVE.md) - 文件索引

### 外部资源

- **Fastify**: https://fastify.dev/docs/latest/
- **TypeScript**: https://www.typescriptlang.org/docs/
- **llama.cpp**: https://github.com/ggerganov/llama.cpp
- **OpenAI API**: https://platform.openai.com/docs/api-reference
- **Anthropic API**: https://docs.anthropic.com/claude/reference

---

## 🎓 学习路径

### 初学者

1. 阅读 [README.md](README.md.md)
2. 查看 [INSTALL.md](INSTALL.md)
3. 运行 `start-clean.bat`
4. 打开 http://localhost:8000/
5. 尝试发送消息

### 开发者

1. 阅读 [ARCHITECTURE.md](ARCHITECTURE.md)
2. 查看 [FILE-ARCHIVE.md](FILE-ARCHIVE.md)
3. 学习源代码结构
4. 运行示例代码
5. 修改和测试

### 高级用户

1. 配置 GPU 加速
2. 设置局域网访问
3. 编写自定义工具
4. 集成到其他应用
5. 性能优化

---

## 📝 版本历史

- **v1.2.0** (2026-03-05) - 流式传输、GPU 优化
- **v1.1.0** (2026-03-04) - Tools 支持、Web UI
- **v1.0.0** (2026-03-04) - 首次发布

详见: [CHANGELOG.md](CHANGELOG.md)

---

## 🎉 快速链接

**快速开始**:
- [启动服务](#快速启动指南)
- [Web 界面](http://localhost:8000/)
- [API 文档](README.md#api-端点)

**配置**:
- [GPU 加速](GPU-SETUP-SUMMARY.md)
- [局域网访问](LAN-ACCESS-GUIDE.md)
- [服务配置](config/default.yaml)

**开发**:
- [架构设计](ARCHITECTURE.md)
- [文件归档](FILE-ARCHIVE.md)
- [客户端示例](examples/)

---

**最后更新**: 2026-03-05
**当前版本**: 1.2.0
**项目状态**: ✅ 生产就绪
