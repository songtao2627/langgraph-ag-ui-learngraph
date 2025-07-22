# AI-UI 最小化学习项目

这是一个AI-UI最小化学习项目，旨在帮助开发者理解如何构建一个完整的AI对话界面。项目包含前端React应用和后端LangGraph服务，提供简洁易懂的代码结构和详细的学习文档。

## 项目结构

```
ai-ui-minimal-project/
├── backend/                 # Python后端服务
│   ├── app/
│   │   ├── main.py         # FastAPI应用入口
│   │   ├── chat/           # 对话相关模块
│   │   ├── models/         # 数据模型
│   │   └── utils/          # 工具函数
│   ├── requirements.txt    # Python依赖
│   └── README.md          # 后端文档
├── frontend/               # React前端应用
│   ├── src/
│   │   ├── components/     # React组件
│   │   ├── hooks/         # 自定义Hooks
│   │   ├── services/      # API服务
│   │   └── types/         # TypeScript类型
│   ├── package.json       # Node.js依赖
│   └── README.md         # 前端文档
├── docs/                  # 项目文档
└── README.md             # 主文档
```

## 技术栈

### 后端
- Python 3.11+
- LangGraph (AI workflow orchestration)
- FastAPI (Web framework)
- Pydantic (Data validation)
- uvicorn (ASGI server)

### 前端
- React 18
- TypeScript
- Vite (Build tool)
- Tailwind CSS (Styling)
- Axios (HTTP client)

## 快速开始

### 环境要求
- Python 3.11+
- Node.js 18+
- npm 或 yarn

### 安装和运行

#### 1. 克隆项目
```bash
git clone <repository-url>
cd ai-ui-minimal-project
```

#### 2. 设置后端
```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

#### 3. 设置前端
```bash
cd frontend
npm install
```

#### 4. 运行开发服务器

**启动后端服务器:**
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**启动前端开发服务器:**
```bash
cd frontend
npm run dev
```

访问 http://localhost:5173 查看应用

## 开发指南

### 后端开发
- API文档: http://localhost:8000/docs
- 健康检查: http://localhost:8000/api/health
- 主要API端点: POST /api/chat

### 前端开发
- 开发服务器: http://localhost:5173
- 支持热重载
- TypeScript类型检查
- ESLint代码检查

## 学习资源

### 核心概念
1. **LangGraph**: AI工作流编排框架
2. **FastAPI**: 现代Python Web框架
3. **React Hooks**: 状态管理和副作用处理
4. **TypeScript**: 类型安全的JavaScript

### 扩展指南
- 添加新的AI功能
- 自定义UI组件
- 集成其他AI模型
- 部署到生产环境

## 贡献

欢迎提交Issue和Pull Request来改进这个学习项目。

## 许可证

MIT License