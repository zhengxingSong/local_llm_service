# Qwen AI Service - 完整部署指南

本指南将帮助你在 Windows 上部署 Qwen AI Service，支持局域网内多设备访问。

## 目录

- [系统要求](#系统要求)
- [快速开始](#快速开始)
- [详细安装步骤](#详细安装步骤)
- [配置选项](#配置选项)
- [服务管理](#服务管理)
- [前端集成](#前端集成)
- [故障排查](#故障排查)
- [性能优化](#性能优化)

## 系统要求

### 硬件要求

- **CPU**: 支持 AVX2 的现代 CPU
- **RAM**: 建议 16GB+ （Qwen 3.5 9B 模型需要约 8-10GB）
- **GPU**: 可选，NVIDIA GPU 可加速推理
- **存储**: 至少 20GB 可用空间

### 软件要求

- **操作系统**: Windows 10/11
- **Node.js**: v20.0.0 或更高版本
- **llama.cpp**: 已编译并运行
- **模型文件**: GGUF 格式的 Qwen 模型

## 快速开始

### 1. 安装依赖

```bash
cd "D:\LLM Model\Qwen-3.5\service"
npm install
```

### 2. 配置服务

编辑 `config/default.yaml`：

```yaml
server:
  host: "0.0.0.0"  # 允许局域网访问
  port: 8000

llama:
  baseUrl: "http://localhost:8001"  # llama.cpp 地址
```

### 3. 构建项目

```bash
npm run build
```

### 4. 启动服务

**方式一：使用脚本（推荐）**

```bash
start-service.bat
```

**方式二：使用 PM2**

```bash
npm run pm2:start
```

**方式三：开发模式**

```bash
npm run dev
```

### 5. 验证服务

在浏览器访问：

```
http://localhost:8000/api/health
```

应该看到：

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456
}
```

## 详细安装步骤

### Step 1: 安装 Node.js

1. 下载 Node.js LTS: https://nodejs.org/
2. 运行安装程序
3. 验证安装：

```bash
node --version  # 应显示 v20.x.x
npm --version
```

### Step 2: 安装项目依赖

```bash
cd "D:\LLM Model\Qwen-3.5\service"
npm install
```

这将安装以下依赖：
- fastify - Web 框架
- @fastify/cors - CORS 支持
- @fastify/websocket - WebSocket 支持
- axios - HTTP 客户端
- winston - 日志库
- sharp - 图像处理
- 其他工具库

### Step 3: 配置 llama.cpp

确保 llama.cpp 正在运行并监听端口 8001：

```bash
# 启动 llama.cpp（示例）
llama-server.exe --model Qwen3.5-9B-Q4_K_M.gguf --port 8001
```

### Step 4: 配置服务

编辑 `config/default.yaml`：

```yaml
# 服务器配置
server:
  host: "0.0.0.0"  # 0.0.0.0 允许局域网访问
  port: 8000
  cors:
    origin: "*"  # 允许所有来源（生产环境建议限制）
    credentials: true

# llama.cpp 配置
llama:
  baseUrl: "http://localhost:8001"
  timeout: 300000  # 5 分钟超时
  maxRetries: 3
  retryDelay: 1000

# 模型配置
models:
  directory: "D:\LLM Model\Qwen-3.5\models\gguf"
  default: "Qwen3.5-9B-Q4_K_M.gguf"
  autoUnload: false
  preload: []

# 多模态配置
multimodal:
  enabled: true
  image:
    maxSize: 10485760  # 10MB
    maxWidth: 2048
    maxHeight: 2048
    allowedFormats:
      - image/jpeg
      - image/png
      - image/webp
      - image/gif
```

### Step 5: 配置防火墙

**Windows 防火墙配置**

运行防火墙配置脚本：

```bash
setup-firewall.bat
```

或手动添加入站规则：

1. 打开 Windows Defender 防火墙
2. 高级设置 → 入站规则 → 新建规则
3. 规则类型：端口
4. 协议：TCP，特定本地端口：8000
5. 操作：允许连接
6. 配置文件：全选
7. 名称：Qwen AI Service

### Step 6: 构建和启动

```bash
# 构建项目
npm run build

# 启动服务（PM2）
npm run pm2:start

# 查看状态
npm run pm2:monit
```

## 配置选项

### 环境变量

可以通过环境变量覆盖配置：

```bash
# Windows CMD
set PORT=8000
set NODE_ENV=production

# Windows PowerShell
$env:PORT = "8000"
$env:NODE_ENV = "production"
```

### 日志配置

在 `config/default.yaml` 中配置日志：

```yaml
logging:
  level: "info"  # error, warn, info, debug
  file: "./logs/service.log"
  console: true
  maxSize: "100M"
  maxFiles: 10
```

### 性能配置

```yaml
performance:
  concurrentLimit: 5  # 并发请求限制
  queueSize: 100      # 请求队列大小
  timeout: 120000     # 请求超时（2分钟）
```

### 安全配置

```yaml
security:
  apiKey:
    enabled: false  # 启用 API 密钥验证
    header: "x-api-key"
    keys: ["your-secret-key-1", "your-secret-key-2"]
  rateLimit:
    enabled: true
    requestsPerMinute: 60
    burst: 100
```

## 服务管理

### 启动服务

```bash
# 使用 PM2（推荐）
npm run pm2:start

# 或使用脚本
start-service.bat

# 或开发模式
npm run dev
```

### 停止服务

```bash
npm run pm2:stop
# 或
stop-service.bat
```

### 重启服务

```bash
npm run pm2:restart
# 或
restart-service.bat
```

### 查看日志

```bash
npm run pm2:logs
# 或
view-logs.bat
```

### 查看状态

```bash
npm run pm2:monit
```

### 开机自启

PM2 会自动配置开机自启。如需手动配置：

```bash
npm run pm2:save
npm run pm2:startup
```

## 前端集成

### Chatbox（推荐用于日常使用）

详见 [CHATBOX-SETUP.md](CHATBOX-SETUP.md)

**快速配置**：
- API Base URL: `http://<YOUR_IP>:8000/v1`
- API Key: `dummy`
- Model: `Qwen3.5-9B-Q4_K_M.gguf`

### Claude Code（推荐用于编程）

详见 [CLAUDE-CODE-SETUP.md](CLAUDE-CODE-SETUP.md)

**快速配置**：
```bash
export ANTHROPIC_BASE_URL="http://<YOUR_IP>:8000/v1"
export ANTHROPIC_API_KEY="dummy"
claude-code
```

### 自定义客户端

支持任何兼容 OpenAI 或 Anthropic API 的客户端。

## 局域网访问

### 获取本地 IP

```bash
get-ip.bat
```

### 从其他设备访问

1. 确保设备在同一 Wi-Fi 网络
2. 使用服务器的 IP 地址访问：
   ```
   http://192.168.1.100:8000/api/health
   ```

3. 在客户端配置中使用此 IP

### 测试局域网连接

```bash
# 在服务器上
curl http://localhost:8000/api/health

# 在局域网内其他设备上
curl http://192.168.1.100:8000/api/health
```

## API 端点

### OpenAI 协议

```
POST /v1/chat/completions  - 聊天补全
GET  /v1/models            - 模型列表
```

### Anthropic 协议

```
POST /v1/messages          - 发送消息
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

## 故障排查

### 问题：服务无法启动

**检查项**：
1. Node.js 版本是否正确（`node --version`）
2. 端口 8000 是否被占用：
   ```bash
   netstat -ano | findstr :8000
   ```
3. llama.cpp 是否运行在端口 8001
4. 查看错误日志：
   ```bash
   type logs\error.log
   ```

### 问题：无法连接到服务

**检查项**：
1. 防火墙是否允许端口 8000
2. 服务是否正在运行：
   ```bash
   npm run pm2:monit
   ```
3. 配置文件中的 host 是否为 `0.0.0.0`
4. 测试本地连接：
   ```bash
   curl http://localhost:8000/api/health
   ```

### 问题：模型无法加载

**检查项**：
1. 模型文件路径是否正确
2. llama.cpp 是否正常运行
3. 查看服务日志中的错误信息

### 问题：图像功能不工作

**检查项**：
1. `sharp` 依赖是否安装：
   ```bash
   npm list sharp
   ```
2. 重新安装依赖：
   ```bash
   npm install
   ```
3. 检查图像文件大小和格式

### 问题：响应速度慢

**优化建议**：
1. 使用量化程度更高的模型（Q4_K_M）
2. 减少 `max_tokens` 值
3. 启用 GPU 加速（如有 NVIDIA GPU）
4. 增加 `concurrentLimit` 并发限制

## 性能优化

### 模型选择

| 模型 | 大小 | 速度 | 质量 | 推荐场景 |
|-----|------|------|------|---------|
| Q4_K_M | ~6GB | 快 | 良好 | 日常使用 |
| Q6_K | ~7GB | 中 | 很好 | 编程助手 |
| Q8_0 | ~9GB | 慢 | 最好 | 高质量需求 |

### GPU 加速

如果有 NVIDIA GPU：

1. 安装 CUDA
2. 使用支持 CUDA 的 llama.cpp
3. 在 llama.cpp 启动参数中添加：
   ```bash
   --gpu-layers 35  # 将 35 层加载到 GPU
   ```

### 内存优化

```yaml
performance:
  concurrentLimit: 3      # 减少并发
  queueSize: 50          # 减少队列
```

### 日志级别

生产环境使用 warn 或 error：

```yaml
logging:
  level: "warn"
```

## 更新服务

```bash
# 1. 停止服务
npm run pm2:stop

# 2. 拉取更新
git pull

# 3. 安装新依赖
npm install

# 4. 重新构建
npm run build

# 5. 重启服务
npm run pm2:start
```

## 卸载

```bash
# 1. 停止并删除 PM2 进程
npm run pm2:stop
npm run pm2:delete

# 2. 删除 PM2 配置
pm2 delete all

# 3. 删除防火墙规则
# 手动在 Windows 防火墙中删除

# 4. 删除项目文件（可选）
```

## 安全建议

### 生产环境

1. **启用 API 密钥验证**
   ```yaml
   security:
     apiKey:
       enabled: true
       keys: ["strong-secret-key"]
   ```

2. **限制 CORS 来源**
   ```yaml
   server:
     cors:
       origin: "http://your-domain.com"
   ```

3. **启用 HTTPS**（推荐）
   - 使用反向代理（Nginx）
   - 配置 SSL 证书

4. **限制速率**
   ```yaml
   security:
     rateLimit:
       enabled: true
       requestsPerMinute: 30
   ```

5. **定期更新**
   - 保持依赖最新
   - 关注安全公告

## 支持的资源

- [README.md](README.md) - 项目介绍
- [ARCHITECTURE.md](ARCHITECTURE.md) - 架构文档
- [CHATBOX-SETUP.md](CHATBOX-SETUP.md) - Chatbox 配置
- [CLAUDE-CODE-SETUP.md](CLAUDE-CODE-SETUP.md) - Claude Code 配置

## 许可证

MIT License

---

**部署完成后，享受你的私有 AI 服务！** 🚀
