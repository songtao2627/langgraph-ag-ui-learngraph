# 环境变量配置指南

本文档说明如何配置和使用环境变量来管理AI-UI项目的各种设置。

## 快速开始

1. 复制环境变量模板文件：
   ```bash
   cp .env.example .env
   ```

2. 编辑 `.env` 文件，填入你的实际配置值。

3. 启动应用，配置将自动加载。

## 环境变量说明

### AI模型配置

| 变量名 | 说明 | 默认值 | 必需 |
|--------|------|--------|------|
| `MOONSHOT_API_KEY` | Moonshot (Kimi) API密钥 | 无 | 否* |
| `OPENAI_API_KEY` | OpenAI API密钥 | 无 | 否* |
| `OLLAMA_BASE_URL` | Ollama服务地址 | `http://localhost:11434` | 否 |
| `DEFAULT_MODEL_TEMPERATURE` | 默认模型温度 | `0.7` | 否 |
| `DEFAULT_MODEL_MAX_RETRIES` | 默认最大重试次数 | `3` | 否 |

*注：至少需要配置一个AI提供者的API密钥，否则将使用模拟模型。

### 应用配置

| 变量名 | 说明 | 默认值 | 必需 |
|--------|------|--------|------|
| `APP_ENV` | 运行环境 | `development` | 否 |
| `HOST` | 服务器监听地址 | `0.0.0.0` | 否 |
| `PORT` | 服务器端口 | `8000` | 否 |
| `LOG_LEVEL` | 日志级别 | `INFO` | 否 |

### CORS配置

| 变量名 | 说明 | 默认值 | 必需 |
|--------|------|--------|------|
| `ALLOWED_ORIGINS` | 允许的跨域源（逗号分隔） | `http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173` | 否 |

## 配置示例

### 开发环境配置
```bash
# AI模型配置
MOONSHOT_API_KEY=sk-your-moonshot-api-key-here

# 应用配置
APP_ENV=development
LOG_LEVEL=DEBUG
HOST=127.0.0.1
PORT=8000

# CORS配置
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 生产环境配置
```bash
# AI模型配置
MOONSHOT_API_KEY=sk-your-moonshot-api-key-here
OPENAI_API_KEY=sk-your-openai-api-key-here

# 应用配置
APP_ENV=production
LOG_LEVEL=INFO
HOST=0.0.0.0
PORT=8000

# CORS配置
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## AI提供者优先级

系统会按以下优先级选择AI提供者：

1. **Moonshot (Kimi)** - 如果设置了 `MOONSHOT_API_KEY`
2. **OpenAI** - 如果设置了 `OPENAI_API_KEY`
3. **Ollama** - 如果能连接到Ollama服务
4. **模拟模型** - 作为最后的备选方案

## 测试配置

运行配置测试脚本来验证环境变量是否正确加载：

```bash
cd backend
python test_env_config.py
```

## 安全注意事项

1. **永远不要将 `.env` 文件提交到版本控制系统**
2. **在生产环境中使用强密码和安全的API密钥**
3. **定期轮换API密钥**
4. **限制CORS允许的源，避免使用通配符**

## 故障排除

### 常见问题

1. **AI模型无法工作**
   - 检查API密钥是否正确设置
   - 验证API密钥是否有效
   - 查看应用日志获取详细错误信息

2. **CORS错误**
   - 确保前端地址包含在 `ALLOWED_ORIGINS` 中
   - 检查协议（http/https）和端口是否匹配

3. **Ollama连接失败**
   - 确保Ollama服务正在运行
   - 检查 `OLLAMA_BASE_URL` 是否正确

### 调试命令

```bash
# 查看当前环境变量
python -c "from app.config import settings; print(settings.__dict__)"

# 测试AI模型连接
python test_env_config.py

# 查看应用状态
curl http://localhost:8000/api/status
```

## 更多信息

- [FastAPI配置文档](https://fastapi.tiangolo.com/advanced/settings/)
- [python-dotenv文档](https://github.com/theskumar/python-dotenv)
- [Moonshot API文档](https://platform.moonshot.cn/docs)
- [OpenAI API文档](https://platform.openai.com/docs)