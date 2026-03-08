# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-03-06

### Added

#### Core Features
- ✨ **双协议支持** - 完全实现 OpenAI 和 Anthropic API 兼容
  - OpenAI Chat Completions API (`/v1/chat/completions`)
  - Anthropic Messages API (`/v1/messages`)
  - 模型列表端点 (`/v1/models`)
  - 管理端点 (`/api/health`, `/api/models`, `/api/tools`)

- 📡 **流式响应** - 两种协议的 SSE 流式实现
  - OpenAI: `data:` 格式流式输出
  - Anthropic: `event:` 格式流式输出（6 种事件类型）
  - 完全兼容 Claude Code 的流式需求

- 🎨 **多模态支持** - 图像输入（Vision）功能
  - 支持 URL 图像下载
  - 支持 Base64 编码（两种格式）
  - 图像格式验证（JPEG, PNG, WebP, GIF）
  - 自动尺寸调整（最大 2048x2048）
  - 文件大小限制（10MB）
  - 超时保护（30秒）

- 🛠️ **工具调用系统**
  - 工具注册表
  - 工具执行引擎
  - 内置工具（天气、搜索、文件系统）
  - OpenAI Function Calling 支持
  - Anthropic Tool Use 支持

- 🌐 **局域网部署**
  - 多设备访问支持
  - CORS 配置
  - 防火墙配置脚本
  - IP 获取工具
  - PM2 进程管理

#### Code Quality
- 🧪 **测试覆盖** - 85%+ 测试覆盖率
  - 168+ 单元测试和集成测试
  - TDD 开发方法
  - Jest 测试框架
  - 自动化测试运行

- 📝 **类型安全** - 完整的 TypeScript 类型定义
  - OpenAI API 类型
  - Anthropic API 类型
  - Vision 类型
  - Llama.cpp 类型

#### Developer Experience
- 🔧 **管理脚本**
  - `start-service.bat` - 一键启动
  - `stop-service.bat` - 停止服务
  - `restart-service.bat` - 重启服务
  - `view-logs.bat` - 查看日志
  - `get-ip.bat` - 获取 IP 地址

- 📚 **完整文档**
  - 部署指南
  - Chatbox 配置指南
  - Claude Code 配置指南
  - 快速启动指南
  - API 使用示例

### Changed

#### Breaking Changes
- 无破坏性更改

### Deprecated

- 无弃用功能

### Removed

- 🗑️ **Web UI** - 移除内置 Web 界面
  - 原因：推荐使用 Chatbox 或 Claude Code 等专业客户端
  - 替代方案：使用开源的 Chatbox 客户端

- 🗑️ **测试文件** - 移除临时测试文件
  - `test-server.js`
  - `test-switch-route.js`

### Fixed

- 🐛 修复流式响应的 SSE 格式问题
- 🐛 修复图像处理的内存泄漏
- 🐛 修复 CORS 配置
- 🐛 修复 PM2 日志轮转

### Security

- 🔒 添加速率限制配置（可选启用）
- 🔒 添加 API 密钥验证（可选启用）
- 🔒 添加图像文件大小限制
- 🔒 添加图像格式验证

---

## [0.2.0] - 2024-03-05

### Added

- 模型动态加载/卸载功能
- 模型自动切换功能
- GPU 支持（llama.cpp GPU 版本）
- 局域网访问指南

### Changed

- 优化模型加载速度
- 改进错误处理

---

## [0.1.0] - 2024-03-04

### Added

- 🎉 **初始版本**
  - 基础 OpenAI API 支持
  - 基础 Anthropic API 支持
  - 文本对话功能
  - 健康检查端点
  - 模型列表端点
  - PM2 进程管理
  - 日志系统

---

## 版本说明

### [1.0.0] - 生产就绪版本

完整功能实现，包括：
- ✅ 双协议支持（OpenAI + Anthropic）
- ✅ 流式响应（两种协议）
- ✅ 多模态（Vision）
- ✅ 工具调用
- ✅ 局域网部署
- ✅ 高测试覆盖（85%+）
- ✅ 完整文档

### [0.2.0] - 模型管理版本

增强的模型管理功能：
- 动态模型加载
- 模型自动切换
- GPU 支持

### [0.1.0] - 初始版本

基础功能：
- 文本对话
- 双协议基础支持
- 基本端点

---

## 贡献者

- 主开发者：社区贡献
- 特别感谢：
  - Qwen 团队 - 优秀的大语言模型
  - llama.cpp 团队 - 推理引擎
  - Fastify 团队 - Web 框架
  - Anthropic 团队 - Claude API 规范
  - OpenAI 团队 - ChatGPT API 规范

---

## 许可证

MIT License - 详见 [LICENSE](LICENSE)

---

## 链接

- [GitHub Repository](https://github.com/yourusername/qwen-ai-service)
- [Issue Tracker](https://github.com/yourusername/qwen-ai-service/issues)
- [Documentation](docs/)

---

**注意**: 本项目采用语义化版本控制。对于版本号的定义：
- MAJOR 版本：不兼容的 API 变更
- MINOR 版本：向后兼容的功能新增
- PATCH 版本：向后兼容的问题修复
