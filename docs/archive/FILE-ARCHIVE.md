# Qwen AI Service - 项目文件归档

本文档提供项目中所有文件的完整清单和说明。

---

## 📁 项目结构总览

```
D:\LLM Model\Qwen-3.5\service\
├── 📂 src/                      # 源代码 (25 个文件)
├── 📂 web/                      # Web 界面 (1 个文件)
├── 📂 test/                     # 测试文件 (2 个文件)
├── 📂 examples/                 # 客户端示例 (3 个文件)
├── 📂 config/                   # 配置文件 (1 个文件)
├── 📂 logs/                     # 日志目录 (自动生成)
├── 📂 dist/                     # 编译输出 (自动生成)
├── 📄 *.md                      # 文档文件 (9 个)
├── 📄 *.bat                     # 批处理脚本 (4 个)
├── 📄 *.json                    # 配置文件 (3 个)
└── 📄 *.js                      # JS 配置 (1 个)
```

---

## 📂 核心源代码 (`src/`)

### 入口文件

#### `main.ts`
**用途**: 应用程序入口点
**功能**:
- 创建 Fastify 服务器实例
- 注册所有路由
- 启动 HTTP 服务器
- 错误处理

**依赖**: `server.ts`, `config/index.ts`

---

#### `server.ts`
**用途**: 服务器框架配置
**功能**:
- Fastify 插件注册
- CORS 配置
- WebSocket 支持
- 全局错误处理
- 健康检查端点

**依赖**: `routes/`, `config/`

---

### 📂 配置管理 (`config/`)

#### `index.ts`
**用途**: 配置加载器
**功能**:
- 加载 YAML 配置
- 环境变量解析
- 配置验证
- 默认值设置

**依赖**: `types/config.ts`

---

### 📂 路由 (`routes/`)

#### 管理路由 `admin/`

**`health.ts`**
- **端点**: `GET /api/health`
- **功能**: 健康检查
- **返回**: 服务状态、版本、运行时间

**`models.ts`**
- **端点**:
  - `GET /api/models` - 模型列表
  - `POST /api/models/load` - 加载模型
  - `POST /api/models/unload` - 卸载模型
- **功能**: 模型管理

**`tools.ts`**
- **端点**:
  - `GET /api/tools` - 工具列表
  - `POST /api/tools/call` - 调用工具
- **功能**: 工具管理

#### OpenAI 路由 `openai/`

**`chat.ts`**
- **端点**:
  - `POST /v1/chat/completions` - 聊天补全
  - `GET /v1/models` - 模型列表
- **功能**: OpenAI 协议兼容
- **特性**:
  - 支持流式和非流式响应
  - 自动请求转换
  - SSE 格式输出

#### Anthropic 路由 `anthropic/`

**`messages.ts`**
- **端点**:
  - `POST /v1/messages` - 消息 API
  - `GET /v1/models` - 模型列表
- **功能**: Anthropic 协议兼容

---

### 📂 服务层 (`services/`)

#### `llama-client.ts`
**用途**: llama.cpp HTTP 客户端
**功能**:
- HTTP 请求封装
- 自动重试机制
- 超时处理
- 流式传输支持
- 日志记录

**关键方法**:
- `chat()`: 非流式聊天
- `chatStream()`: 流式聊天
- `getModels()`: 获取模型列表
- `getHealth()`: 健康检查

**依赖**: `axios`, `types/llama.ts`

---

#### `model-scanner.ts`
**用途**: GGUF 模型扫描器
**功能**:
- 扫描模型目录
- 解析 GGUF 元数据
- 提取模型信息
- 缓存扫描结果

**支持的格式**: GGUF

---

#### `model-manager.ts`
**用途**: 模型生命周期管理
**功能**:
- 模型加载队列
- 模型卸载
- 内存管理
- 并发控制

---

### 📂 转换器 (`transformers/`)

#### `openai.ts`
**用途**: OpenAI 协议转换
**功能**:
- `openaiToLlama()`: OpenAI → llama.cpp
- `llamaToOpenai()`: llama.cpp → OpenAI
- `llamaChunkToOpenai()`: 流式块转换

**特性**:
- 完全兼容 OpenAI API 格式
- 支持流式和非流式
- 自动处理工具调用

---

#### `anthropic.ts`
**用途**: Anthropic 协议转换
**功能**:
- `anthropicToLlama()`: Anthropic → llama.cpp
- `llamaToAnthropic()`: llama.cpp → Anthropic

**特性**:
- 完全兼容 Anthropic API 格式
- 支持流式响应
- 处理工具使用

---

### 📂 工具系统 (`tools/`)

#### `registry.ts`
**用途**: 工具注册表
**功能**:
- 工具注册
- 工具查询
- 工具验证
- 工具元数据管理

---

#### `parser.ts`
**用途**: 工具调用解析器
**功能**:
- 解析 LLM 输出
- 提取工具调用
- 参数验证
- 错误处理

---

#### `engine.ts`
**用途**: 工具执行引擎
**功能**:
- 工具调用执行
- 结果格式化
- 错误处理
- 异步执行

---

#### `builtin.ts`
**用途**: 内置工具实现
**内置工具**:
1. `get_weather` - 天气查询
2. `web_search` - 网络搜索
3. `calculator` - 数学计算
4. `get_datetime` - 日期时间
5. `read_file` - 读取文件
6. `list_directory` - 列出目录
7. `write_file` - 写入文件

---

### 📂 类型定义 (`types/`)

#### `index.ts`
**用途**: 类型定义导出
**内容**: 导出所有类型模块

---

#### `config.ts`
**用途**: 配置类型定义
**类型**:
- `ServiceConfig`
- `LlamaConfig`
- `LogConfig`

---

#### `openai.ts`
**用途**: OpenAI API 类型
**类型**:
- `OpenAIChatRequest`
- `OpenAIChatResponse`
- `OpenAIMessage`

---

#### `anthropic.ts`
**用途**: Anthropic API 类型
**类型**:
- `AnthropicMessageRequest`
- `AnthropicMessageResponse`
- `AnthropicMessage`

---

#### `llama.ts`
**用途**: llama.cpp 类型
**类型**:
- `LlamaChatRequest`
- `LlamaChatResponse`
- `LlamaModelsResponse`

---

#### `common.ts`
**用途**: 通用类型定义
**类型**:
- `Message`
- `Tool`
- `ModelInfo`

---

### 📂 工具函数 (`utils/`)

#### `logger.ts`
**用途**: Winston 日志配置
**功能**:
- 文件日志
- 控制台日志
- 日志级别控制
- 日志轮转

---

## 🌐 Web 界面 (`web/`)

### `index.html`
**用途**: Web 聊天界面
**功能**:
- 聊天消息显示
- 流式/阻塞模式切换
- 模型选择
- Markdown 渲染
- 响应式设计

**技术栈**:
- 纯 HTML/CSS/JavaScript
- marked.js (Markdown)
- Fetch API

**特性**:
- 深色主题
- 代码高亮
- 表格样式
- 自动滚动

---

## 🧪 测试文件 (`test/`)

### 单元测试 `unit/`

#### `registry.test.ts`
**用途**: 工具注册表测试
**覆盖**:
- 工具注册
- 工具查询
- 工具验证
- 错误处理

---

### 集成测试 `integration/`

#### `api.test.ts`
**用途**: API 端点测试
**覆盖**:
- 健康检查
- 聊天端点
- 模型管理
- 工具调用

---

## 📚 客户端示例 (`examples/`)

### `python_openai.py`
**用途**: Python OpenAI SDK 示例
**功能**:
- 聊天补全
- 流式输出
- 多轮对话

**依赖**: `openai` Python 包

---

### `python_anthropic.py`
**用途**: Python Anthropic SDK 示例
**功能**:
- 消息 API
- 流式输出
- 工具使用

**依赖**: `anthropic` Python 包

---

### `javascript.mjs`
**用途**: JavaScript 示例
**功能**:
- Fetch API 调用
- 流式响应处理
- 错误处理

**依赖**: 无 (原生 Fetch API)

---

## ⚙️ 配置文件

### `package.json`
**用途**: Node.js 项目配置
**内容**:
- 项目元数据
- 依赖包列表
- 脚本命令
- 版本信息

**主要依赖**:
- `fastify`: Web 框架
- `axios`: HTTP 客户端
- `winston`: 日志框架
- `typescript`: TypeScript 编译器

---

### `tsconfig.json`
**用途**: TypeScript 编译配置
**配置**:
- 目标 ES2020
- 模块系统: ESNext
- 严格模式启用
- 路径别名

---

### `jest.config.json`
**用途**: Jest 测试配置
**配置**:
- 测试环境: node
- 覆盖率阈值: 80%
- 测试文件匹配模式

---

### `ecosystem.config.js`
**用途**: PM2 进程管理配置
**配置**:
- 应用名称
- 启动脚本
- 实例数量
- 自动重启
- 日志配置

---

### `config/default.yaml`
**用途**: 服务默认配置
**配置项**:
- 服务器端口
- llama.cpp 地址
- 日志级别
- 模型路径
- 超时设置

---

## 🚀 启动脚本

### `start-clean.bat`
**用途**: 一键启动脚本
**功能**:
- 启动 llama.cpp (GPU 加速)
- 启动 API 服务
- 环境变量设置
- 窗口管理

**启动顺序**:
1. 设置 CUDA 环境变量
2. 启动 llama-server.exe (端口 8001)
3. 启动 Node.js API (端口 8000)

---

### `start-llamacpp-gpu.bat`
**用途**: llama.cpp GPU 启动脚本
**功能**:
- CUDA 环境变量设置
- GPU 层数配置
- 模型参数优化

**关键参数**:
- `-ngl 35`: GPU 层数
- `--n-gpu-layers 35`: 显式 GPU 层
- `--batch-size 512`: 批处理大小

---

### `restart-service.bat`
**用途**: 重启 API 服务
**功能**:
- 停止现有服务
- 重新启动服务
- 保持 llama.cpp 运行

---

### `setup-firewall.bat`
**用途**: Windows 防火墙配置
**功能**:
- 添加端口 8000 规则
- 添加端口 8001 规则
- 显示本机 IP 地址

**使用**: 需要管理员权限

---

## 📖 文档文件 (`*.md`)

### 核心文档

#### `README.md`
**用途**: 项目主文档
**内容**:
- 项目介绍
- 快速开始
- API 使用
- 配置说明
- 故障排除

---

#### `ARCHITECTURE.md`
**用途**: 架构设计文档
**内容**:
- 系统架构
- 技术栈
- 模块设计
- 数据流
- 扩展性设计

---

#### `CHANGELOG.md`
**用途**: 更新日志
**内容**:
- 版本历史
- 新增功能
- 修复问题
- 技术细节

---

#### `INSTALL.md`
**用途**: 安装指南
**内容**:
- 环境要求
- 依赖安装
- 配置步骤
- 启动验证

---

### 总结文档

#### `PROJECT-SUMMARY.md`
**用途**: 项目总结
**内容**:
- 完成情况
- 功能列表
- 工作量统计
- 技术亮点

---

#### `FINAL-SUMMARY.md`
**用途**: 最终总结
**内容**:
- 项目成果
- 文件清单
- 测试指南
- 下一步建议

---

#### `COMPLETION-REPORT.md`
**用途**: 完成报告
**内容**:
- 任务完成情况
- 功能测试结果
- 性能指标
- 已知限制

---

#### `PROGRESS.md`
**用途**: 进度报告
**内容**:
- 阶段进度
- 任务列表
- 时间统计
- 待办事项

---

### 专项文档

#### `GPU-SETUP-SUMMARY.md`
**用途**: GPU 配置总结
**内容**:
- 硬件信息
- 驱动版本
- 模型配置
- 性能对比
- 故障排除

---

#### `LAN-ACCESS-GUIDE.md`
**用途**: 局域网访问指南
**内容**:
- 防火墙配置
- IP 地址设置
- 访问测试
- 安全建议

---

#### `FILE-ARCHIVE.md`
**用途**: 文件归档 (本文档)
**内容**:
- 完整文件清单
- 文件用途说明
- 依赖关系
- 组织结构

---

## 📊 文件统计

### 按类型分类

| 类型 | 数量 | 说明 |
|------|------|------|
| TypeScript 源码 | 25 | src/ 目录 |
| Web 文件 | 1 | web/ 目录 |
| 测试文件 | 2 | test/ 目录 |
| 示例代码 | 3 | examples/ 目录 |
| 配置文件 | 5 | JSON/YAML/JS |
| 批处理脚本 | 4 | .bat 文件 |
| 文档文件 | 10 | .md 文件 |
| **总计** | **50+** | |

### 按功能分类

| 功能模块 | 文件数 | 主要文件 |
|----------|--------|----------|
| 路由层 | 5 | routes/**/*.ts |
| 服务层 | 3 | services/*.ts |
| 转换器 | 2 | transformers/*.ts |
| 工具系统 | 4 | tools/*.ts |
| 类型定义 | 6 | types/*.ts |
| 配置管理 | 2 | config/*, *.yaml |
| Web 界面 | 1 | web/index.html |
| 测试 | 2 | test/**/*.ts |
| 文档 | 10 | *.md |

---

## 🔗 依赖关系图

```
main.ts
  ├─→ server.ts
  │    ├─→ routes/**/*.ts
  │    │    ├─→ services/llama-client.ts
  │    │    ├─→ services/model-manager.ts
  │    │    ├─→ transformers/openai.ts
  │    │    └─→ transformers/anthropic.ts
  │    └─→ config/index.ts
  └─→ types/*.ts
```

---

## 📝 维护建议

### 定期维护

1. **日志清理**: 定期清理 `logs/` 目录
2. **依赖更新**: 每月检查 `npm outdated`
3. **文档更新**: 重大变更后更新文档
4. **备份**: 定期备份 `config/` 和重要配置

### 文件组织

- ✅ 保持模块化结构
- ✅ 遵循命名约定
- ✅ 及时更新文档
- ✅ 删除过时文件

---

**最后更新**: 2026-03-05
**版本**: 1.2.0
**总文件数**: 50+
**代码行数**: ~4,500 行
