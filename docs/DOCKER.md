# Docker 部署指南

## 🚀 快速开始

### 前置要求

- Docker Engine 20.10+ 或 Docker Desktop
- Docker Compose 2.0+
- NVIDIA GPU（可选，用于加速）
- 8GB+ 可用内存
- 模型文件已下载

### 5 分钟启动

#### 1. 准备模型文件

确保你的 GGUF 模型文件在 `models/` 目录中：

```bash
# 检查模型文件
ls ./models/Qwen3.5-9B-Q4_K_M.gguf
```

#### 2. 创建配置文件

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑配置（可选）
nano .env
```

#### 3. 启动服务

```bash
# 一键启动（首次会自动构建镜像）
docker-compose up -d

# 查看启动日志
docker-compose logs -f

# 等待两个服务都变为 healthy（约 1 分钟）
docker-compose ps
```

#### 4. 验证服务

```bash
# 检查 AI 服务健康状态
curl http://localhost:8000/api/health

# 检查 llama.cpp 状态
curl http://localhost:8001/health
```

## 🎮 管理命令

### 基础命令

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 重启服务
docker-compose restart

# 查看服务状态
docker-compose ps

# 查看日志（所有服务）
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f qwen-service
docker-compose logs -f llama-cpp
```

### 高级命令

```bash
# 重新构建镜像
docker-compose build --no-cache

# 重新构建并启动
docker-compose up -d --build

# 进入容器 shell
docker-compose exec qwen-service sh
docker-compose exec llama-cpp sh

# 查看资源使用情况
docker stats qwen-ai-service llama-cpp-server

# 完全清理（包括数据卷）
docker-compose down -v

# 查看服务详细信息
docker inspect qwen-ai-service
```

## ⚙️ 配置说明

### 环境变量 (.env)

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `MODELS_PATH` | `./models` | 模型文件目录路径 |
| `LLAMA_MODEL` | `Qwen3.5-9B-Q4_K_M.gguf` | 默认模型文件名 |
| `HOST_PORT` | `8000` | AI 服务外部端口 |
| `LLAMA_PORT` | `8001` | llama.cpp 外部端口（可选） |
| `LLAMA_CTX_SIZE` | `8192` | 上下文大小 |
| `LLAMA_GPU_LAYERS` | `35` | GPU 层数（更多=更快） |
| `LOG_LEVEL` | `info` | 日志级别 |

### 自定义模型路径

**Windows (Docker Desktop with WSL2)**:
```env
MODELS_PATH=D:\\LLM Model\\Qwen-3.5\\models\\gguf
```

**Linux/macOS**:
```env
MODELS_PATH=/path/to/models
```

**相对路径**（推荐）:
```env
MODELS_PATH=./models
```

### GPU 配置

如果有 NVIDIA GPU，确保安装了 NVIDIA Container Toolkit：

```bash
# 安装 NVIDIA Container Toolkit
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list

sudo apt-get update && sudo apt-get install -y nvidia-docker2
sudo systemctl restart docker
```

调整 `LLAMA_GPU_LAYERS` 以优化性能：
- `35`: 适中（9B Q4 模型）
- `40-45`: 更快（需要更多显存）
- `0`: 仅 CPU 模式

## 📱 Chatbox 集成

### 配置步骤

1. **启动 Docker 服务**
   ```bash
   docker-compose up -d
   ```

2. **获取 IP 地址**
   ```bash
   # Linux/macOS
   hostname -I | awk '{print $1}'

   # Windows (PowerShell)
   Get-NetIPAddress -AddressFamily IPv4 | Select-Object IPAddress
   ```

3. **在 Chatbox 中配置**

   打开 Chatbox 设置，填写：

   ```
   API Provider: Custom
   API Base URL: http://YOUR_IP:8000/v1
   API Key: dummy
   Model: Qwen3.5-9B-Q4_K_M.gguf
   ```

   **示例**：
   ```
   API Base URL: http://192.168.1.100:8000/v1
   API Key: dummy
   Model: Qwen3.5-9B-Q4_K_M.gguf
   ```

4. **测试连接**

   在 Chatbox 中发送："你好"，应该能收到回复。

### 局域网多设备使用

1. 确保所有设备在同一网络
2. 在其他设备上安装 Chatbox
3. 使用相同的 API Base URL 配置
4. 享受多设备 AI 助手！

### Chatbox 功能支持

✅ **完全支持**：
- 文本对话
- 流式响应（打字机效果）
- 多轮对话（上下文记忆）
- 图像输入（Vision）
- 自定义参数（Temperature, Max Tokens）

## 🔧 故障排查

### 容器无法启动

```bash
# 查看详细错误日志
docker-compose logs qwen-service
docker-compose logs llama-cpp

# 检查配置是否正确
docker-compose config

# 重新构建镜像
docker-compose build --no-cache
docker-compose up -d
```

### llama.cpp 连接失败

```bash
# 检查 llama.cpp 健康状态
curl http://localhost:8001/health

# 查看网络连接
docker network inspect qwen-network

# 检查模型文件是否正确挂载
docker-compose exec llama-cpp ls /models
```

### GPU 未启用

```bash
# 检查 NVIDIA Docker 运行时
docker run --rm --gpus all nvidia/cuda:12.3.0-base-ubuntu22.04 nvidia-smi

# 查看容器 GPU 使用情况
docker-compose exec llama-cpp nvidia-smi
```

### 端口冲突

如果 8000 或 8001 端口被占用，修改 `.env`：

```env
HOST_PORT=8080
LLAMA_PORT=8081
```

然后重启：
```bash
docker-compose down
docker-compose up -d
```

### 模型文件未找到

```bash
# 检查挂载路径
docker-compose exec qwen-service ls /app/models

# 进入容器查看
docker-compose exec qwen-service sh
ls /app/models
exit
```

## 📊 监控和维护

### 查看资源使用

```bash
# 实时资源监控
docker stats qwen-ai-service llama-cpp-server

# 详细容器信息
docker inspect qwen-ai-service
```

### 日志管理

```bash
# 查看最近 100 行日志
docker-compose logs --tail=100 qwen-service

# 导出日志到文件
docker-compose logs qwen-service > qwen-service.log

# 查看日志文件
ls -lh ./logs/
```

### 数据备份

```bash
# 备份模型文件
tar czf models-backup.tar.gz ./models

# 备份配置
tar czf config-backup.tar.gz ./config .env
```

## 🚀 性能优化

### 调整资源限制

编辑 `docker-compose.yml`：

```yaml
services:
  qwen-service:
    deploy:
      resources:
        limits:
          cpus: '4.0'
          memory: 8G
```

### GPU 层数优化

根据显存大小调整 `LLAMA_GPU_LAYERS`：

| 显存 | 推荐 GPU 层数 |
|------|--------------|
| 8GB  | 30-35        |
| 12GB | 40-43        |
| 16GB+ | 45-50       |

### 上下文大小

```env
# 更大的上下文 = 更长的对话
LLAMA_CTX_SIZE=16384  # 需要 16GB+ 内存
```

## 🔐 安全建议

1. **不要暴露 llama.cpp 端口**（注释掉 `LLAMA_PORT`）
2. **启用 API Key**（编辑 `config/docker.yaml`）
3. **仅在可信网络使用**
4. **定期更新镜像**

```bash
# 更新镜像
docker-compose pull
docker-compose up -d
```

## 📚 更多资源

- [llama.cpp 文档](https://github.com/ggerganov/llama.cpp)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [Chatbox 下载](https://github.com/Bin-Huang/chatbox/releases)
