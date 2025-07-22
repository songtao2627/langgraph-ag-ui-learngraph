# AI-UI Minimal Project - Backend

基于Python + LangGraph的AI对话后端服务。

## 技术栈

- **Python 3.11+**: 主要编程语言
- **FastAPI**: Web框架，提供REST API
- **LangGraph**: AI工作流编排
- **Pydantic**: 数据验证和序列化
- **uvicorn**: ASGI服务器

## 项目结构

```
backend/
├── app/
│   ├── main.py          # FastAPI应用入口
│   ├── chat/            # 对话相关模块
│   ├── models/          # 数据模型
│   └── utils/           # 工具函数
├── requirements.txt     # Python依赖
└── README.md           # 本文档
```

## 安装和运行

### 1. 创建虚拟环境

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 2. 安装依赖

```bash
pip install -r requirements.txt
```

### 3. 运行开发服务器

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

服务器将在 http://localhost:8000 启动

### 4. 查看API文档

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API端点

- `GET /` - 根路径，返回欢迎消息
- `GET /api/health` - 健康检查
- `POST /api/chat` - 对话端点（将在后续任务中实现）

## 开发指南

### 代码结构说明

- `main.py`: FastAPI应用的主入口文件
- `chat/`: 包含LangGraph工作流和对话处理逻辑
- `models/`: Pydantic数据模型定义
- `utils/`: 通用工具函数

### 开发最佳实践

1. 使用Pydantic进行数据验证
2. 遵循FastAPI的异步编程模式
3. 为所有API端点添加适当的错误处理
4. 使用类型注解提高代码可读性

## 测试

```bash
# 运行测试（将在后续任务中添加测试文件）
pytest
```

## 部署

生产环境部署建议：

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```