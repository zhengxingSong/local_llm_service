# Chatbox 配置指南

本指南将帮助你配置 Chatbox 客户端连接到 Qwen AI Service。

## 下载 Chatbox

1. 访问 [Chatbox GitHub Releases](https://github.com/Bin-Huang/chatbox/releases)
2. 下载适合你操作系统的版本
3. 安装 Chatbox

## 配置步骤

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

### 3. 在 Chatbox 中配置

1. 打开 Chatbox
2. 点击设置（Settings）
3. 选择 "API Provider" → "Custom"（自定义）
4. 填写以下信息：

```
API Base URL: http://192.168.1.100:8000/v1
API Key: dummy
Model: Qwen3.5-9B-Q4_K_M.gguf
```

**注意**：
- 将 `192.168.1.100` 替换为你的实际 IP 地址
- API Key 可以填写任意字符串（服务未启用验证）

### 4. 测试连接

1. 在 Chatbox 中发送一条消息："你好"
2. 如果收到回复，说明配置成功！

## 功能支持

### ✅ 已支持功能

- 文本对话
- 流式响应
- 多轮对话
- 图像输入（Vision）
- 局域网多设备访问

### 🎯 使用图像功能

1. 在输入框旁边点击图像图标
2. 选择或拖拽图像文件
3. 输入提示词（例如："描述这张图片"）
4. 发送消息

支持的图像格式：
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- GIF (.gif)

最大文件大小：10MB

## 局域网多设备部署

### 在其他设备上使用 Chatbox

1. 确保所有设备连接到同一 Wi-Fi 网络
2. 在其他设备上安装 Chatbox
3. 使用相同的 API Base URL 配置

### 在手机/平板上使用

1. 从应用商店下载 Chatbox
2. 使用相同的配置
3. 享受移动端的 AI 助手！

## 故障排查

### 问题：无法连接到服务器

**解决方案**：
1. 检查 Qwen AI Service 是否正在运行：
   ```bash
   npm run pm2:monit
   ```
2. 检查防火墙设置，允许端口 8000
3. 确认 IP 地址正确（运行 `get-ip.bat`）
4. 尝试在浏览器访问 `http://localhost:8000/api/health`

### 问题：图像无法上传

**解决方案**：
1. 检查图像文件大小（最大 10MB）
2. 确认图像格式（JPEG, PNG, WebP, GIF）
3. 查看服务日志：
   ```bash
   view-logs.bat
   ```

### 问题：响应速度慢

**解决方案**：
1. 检查 llama.cpp 是否正常运行
2. 确认模型已加载
3. 查看系统资源使用情况

## 高级配置

### 自定义模型

在 Chatbox 中手动指定模型名称：

```
Model: Qwen3.5-9B-Q6_K.gguf
```

可用的模型列表：
- Qwen3.5-9B-Q4_K_M.gguf（推荐）
- Qwen3.5-9B-Q6_K.gguf（更高质量）
- Qwen3.5-9B-Q8_0.gguf（最高质量）

### 调整参数

在 Chatbox 设置中可以调整：
- Temperature（温度）：控制随机性（0-2）
- Max Tokens（最大令牌数）：限制响应长度
- Top P：核采样参数

## 安全提示

⚠️ **重要**：
- 当前配置未启用 API 密钥验证
- 仅在受信任的局域网中使用
- 不要将服务暴露到公网
- 如需启用安全验证，编辑 `config/default.yaml`：

```yaml
security:
  apiKey:
    enabled: true
    keys: ["your-secret-api-key"]
```

## 更新日志

### v1.0.0
- ✅ OpenAI 协议支持
- ✅ 流式响应
- ✅ 多模态（Vision）
- ✅ 局域网访问

## 获取帮助

如果遇到问题：
1. 查看 [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md)
2. 检查日志：`view-logs.bat`
3. 访问项目仓库寻求支持

---

**享受你的私有 AI 助手！** 🚀
