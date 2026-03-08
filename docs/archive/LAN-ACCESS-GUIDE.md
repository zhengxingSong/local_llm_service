# 局域网访问配置指南

## 网络信息

您的局域网IP地址: **192.168.1.2**

## 快速配置步骤

### 方法1: 使用配置脚本（推荐）

1. **以管理员身份运行防火墙配置脚本**
   ```bash
   右键点击 setup-firewall.bat
   选择 "以管理员身份运行"
   ```

2. **完成配置后即可访问**

---

### 方法2: 手动配置防火墙

如果脚本无法运行，请手动添加防火墙规则：

#### Windows 防火墙设置

1. 打开 **Windows Defender 防火墙** -> **高级设置**
2. 点击左侧 **入站规则** -> **新建规则...**
3. 配置规则：
   - **规则类型**: 端口
   - **协议和端口**: TCP，特定本地端口：8000, 8001
   - **操作**: 允许连接
   - **配置文件**: 全选（域、专用、公用）
   - **名称**: Qwen AI Service

#### 使用 PowerShell (管理员)

```powershell
# 添加端口8000规则
New-NetFirewallRule -DisplayName 'Qwen AI - API (8000)' -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow

# 添加端口8001规则
New-NetFirewallRule -DisplayName 'Qwen AI - llama.cpp (8001)' -Direction Inbound -LocalPort 8001 -Protocol TCP -Action Allow
```

---

## 访问地址

配置完成后，局域网内其他设备可以通过以下地址访问：

### 主地址
```
http://192.168.1.2:8000/
```

### 各服务地址
| 服务 | 本地访问 | 局域网访问 |
|------|----------|------------|
| Web UI | http://localhost:8000/ | http://192.168.1.2:8000/ |
| API | http://localhost:8000/api/ | http://192.168.1.2:8000/api/ |
| llama.cpp | http://localhost:8001 | http://192.168.1.2:8001 |

### 示例API调用（局域网）
```bash
# 健康检查
curl http://192.168.1.2:8000/api/health

# 获取模型列表
curl http://192.168.1.2:8000/api/models

# 对话完成 (OpenAI格式)
curl -X POST http://192.168.1.2:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "Qwen3.5-9B-Q4_K_M.gguf",
    "messages": [{"role": "user", "content": "你好"}]
  }'
```

---

## 故障排除

### 1. 确认服务正在运行

在本机运行：
```bash
netstat -ano | findstr :8000
netstat -ano | findstr :8001
```

应该看到 LISTENING 状态。

### 2. 测试本地访问
```bash
curl http://localhost:8000/api/health
```

### 3. 检查防火墙状态
```bash
# 查看防火墙规则
netsh advfirewall firewall show rule name="Qwen AI Service - API (8000)"

# 或者使用PowerShell
Get-NetFirewallRule -DisplayName "Qwen AI*"
```

### 4. 检查网络连通性

从局域网其他设备：
```bash
# Windows
ping 192.168.1.2

# 或测试端口
telnet 192.168.1.2 8000
```

### 5. 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 无法访问 | 防火墙阻止 | 运行 setup-firewall.bat (管理员) |
| 无法访问 | 路由器AP隔离 | 关闭AP隔离功能 |
| 无法访问 | IP地址变更 | 重新获取IP地址 |
| 速度慢 | 网络带宽 | 检查网络质量 |
| CORS错误 | 浏览器限制 | 使用相同域名或代理 |

### 6. 确认设备在同一网络

确保两台设备在同一个网段（192.168.1.x）：

**Windows设备IP**: 192.168.1.2
**其他设备IP**: 192.168.1.x

查看其他设备IP：
- Windows: `ipconfig`
- Android: 设置 -> 网络 -> 状态
- iOS: 设置 -> Wi-Fi -> (i) 图标

---

## 安全建议

### 公用网络环境
如果在公用网络（如公司、咖啡厅），建议：

1. **仅专用网络访问**
   ```powershell
   # 仅允许专用网络访问
   New-NetFirewallRule -DisplayName "Qwen AI - API" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow -Profile Private
   ```

2. **添加API密钥认证**
   - 编辑 `config/default.yaml`
   - 启用 `security.apiKey.enabled: true`
   - 设置密钥

3. **使用VPN**
   - 部署VPN服务器
   - 通过VPN访问更安全

---

## 高级配置

### 固定IP地址

避免IP变更导致无法访问：

1. 打开 **网络连接** -> **属性**
2. **Internet 协议版本 4 (TCP/IPv4)** -> **属性**
3. 选择 **使用下面的IP地址**：
   ```
   IP地址: 192.168.1.2
   子网掩码: 255.255.255.0
   默认网关: 192.168.1.1
   ```

### 端口转发（路由器配置）

如果需要从外网访问（不推荐，有安全风险）：

1. 登录路由器管理界面（通常是 192.168.1.1）
2. 找到 **端口转发** / **虚拟服务器**
3. 添加规则：
   - 外部端口: 8000
   - 内部IP: 192.168.1.2
   - 内部端口: 8000
   - 协议: TCP

⚠️ **警告**: 暴露到公网有安全风险，建议：
- 使用强密码/API密钥
- 启用HTTPS
- 使用VPN
- 定期更新服务

---

## 配置文件更新

如需修改监听地址（默认已配置为0.0.0.0，无需修改）：

**config/default.yaml**:
```yaml
server:
  host: "0.0.0.0"  # 监听所有网络接口
  port: 8000
```

---

## 测试清单

- [ ] 服务正常运行（本机可访问 http://localhost:8000）
- [ ] 防火墙规则已添加
- [ ] 获取本机IP地址（192.168.1.2）
- [ ] 局域网设备在同一网段
- [ ] 局域网设备可ping通本机
- [ ] 局域网设备可访问 http://192.168.1.2:8000
- [ ] Web UI可正常使用
- [ ] API调用正常

---

**配置日期**: 2026-03-05
**当前IP**: 192.168.1.2
**状态**: 待配置防火墙规则
