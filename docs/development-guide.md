# 开发指南

本文档提供AI-UI最小化项目的详细开发指南，帮助开发者快速上手和深入理解项目架构。

## 项目概述

AI-UI最小化项目是一个教学导向的全栈应用，展示如何构建现代AI对话界面。项目采用前后端分离架构，注重代码简洁性和学习友好性。

## 架构设计

### 整体架构
```
┌─────────────────┐    HTTP API     ┌──────────────────┐
│   React Frontend │ ◄─────────────► │  Python Backend  │
│                 │                 │                  │
│  - Chat UI      │                 │  - LangGraph     │
│  - State Mgmt   │                 │  - FastAPI       │
│  - Error Handle │                 │  - AI Logic      │
└─────────────────┘                 └──────────────────┘
```

### 技术选型理由

**后端技术栈:**
- **Python**: 丰富的AI生态系统
- **LangGraph**: 专业的AI工作流编排
- **FastAPI**: 现代、高性能的Web框架
- **Pydantic**: 强大的数据验证

**前端技术栈:**
- **React**: 成熟的UI框架
- **TypeScript**: 类型安全保障
- **Vite**: 快速的开发体验
- **Tailwind CSS**: 高效的样式开发

## 开发环境设置

### 系统要求
- Python 3.11+
- Node.js 18+
- Git

### 初始化项目
```bash
# 1. 克隆项目
git clone <repository-url>
cd ai-ui-minimal-project

# 2. 设置后端环境
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt

# 3. 设置前端环境
cd ../frontend
npm install

# 4. 启动开发服务器
# 终端1 - 后端
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 终端2 - 前端
cd frontend
npm run dev
```

### 环境验证
验证环境是否正确设置：

```bash
# 验证Python环境
python --version  # 应显示 Python 3.11+

# 验证Node.js环境
node --version     # 应显示 v18+
npm --version      # 应显示对应的npm版本

# 验证前端构建
cd frontend
npm run build      # 应成功构建到dist目录

# 验证后端基础功能
cd backend
python -c "import fastapi, pydantic; print('Backend dependencies OK')"
```

## 代码结构详解

### 后端结构
```
backend/
├── app/
│   ├── main.py          # FastAPI应用入口
│   ├── chat/            # 对话模块
│   │   ├── workflow.py  # LangGraph工作流
│   │   └── handlers.py  # 消息处理器
│   ├── models/          # 数据模型
│   │   ├── chat.py      # 对话模型
│   │   └── base.py      # 基础模型
│   └── utils/           # 工具函数
│       └── helpers.py   # 辅助函数
└── requirements.txt     # 依赖管理
```

### 前端结构
```
frontend/src/
├── components/          # React组件
│   ├── Chat/           # 对话组件
│   ├── UI/             # 通用组件
│   └── Layout/         # 布局组件
├── hooks/              # 自定义Hooks
├── services/           # API服务
├── types/              # 类型定义
└── assets/             # 静态资源
```

## 开发工作流

### 1. 功能开发流程
1. **需求分析**: 明确功能需求和用户故事
2. **设计API**: 定义前后端接口契约
3. **后端开发**: 实现API和业务逻辑
4. **前端开发**: 实现UI和用户交互
5. **集成测试**: 验证前后端协作
6. **文档更新**: 更新相关文档

### 2. 代码规范

**Python代码规范:**
```python
# 使用类型注解
def process_message(message: str) -> ChatResponse:
    """处理用户消息并返回AI回复"""
    pass

# 使用Pydantic模型
class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
```

**TypeScript代码规范:**
```typescript
// 使用接口定义类型
interface Message {
  id: string;
  content: string;
  type: 'user' | 'ai';
  timestamp: Date;
}

// 使用函数式组件
const ChatMessage: React.FC<{ message: Message }> = ({ message }) => {
  return <div>{message.content}</div>;
};
```

### 3. Git工作流
```bash
# 创建功能分支
git checkout -b feature/chat-interface

# 提交代码
git add .
git commit -m "feat: implement chat interface component"

# 推送分支
git push origin feature/chat-interface

# 创建Pull Request
```

## 调试指南

### 后端调试
```bash
# 启动调试模式
uvicorn app.main:app --reload --log-level debug

# 查看API文档
# http://localhost:8000/docs

# 测试API端点
curl -X POST "http://localhost:8000/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'
```

### 前端调试
```bash
# 启动开发服务器
npm run dev

# 使用浏览器开发者工具
# - Console: 查看日志和错误
# - Network: 监控API请求
# - React DevTools: 检查组件状态
```

## 测试策略

### 后端测试
```python
# 单元测试示例
import pytest
from app.chat.workflow import ChatWorkflow

def test_chat_workflow():
    workflow = ChatWorkflow()
    response = workflow.process_message("Hello")
    assert response.message is not None
```

### 前端测试
```typescript
// 组件测试示例
import { render, screen } from '@testing-library/react';
import ChatMessage from './ChatMessage';

test('renders message content', () => {
  const message = { id: '1', content: 'Hello', type: 'user', timestamp: new Date() };
  render(<ChatMessage message={message} />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

## 性能优化

### 后端优化
- 使用异步编程模式
- 实现适当的缓存策略
- 优化数据库查询
- 监控API响应时间

### 前端优化
- 使用React.memo避免不必要的重渲染
- 实现虚拟滚动处理大量消息
- 使用懒加载优化初始加载时间
- 压缩和优化静态资源

## 部署指南

### 开发环境部署
```bash
# 后端
uvicorn app.main:app --host 0.0.0.0 --port 8000

# 前端
npm run build
npm run preview
```

### 生产环境部署
```bash
# 使用Docker部署
docker-compose up -d

# 或使用传统方式
# 后端: gunicorn + nginx
# 前端: 静态文件服务器
```

## 常见问题

### Q: CORS错误如何解决？
A: 确保后端正确配置CORS中间件，允许前端域名访问。

### Q: API请求失败怎么办？
A: 检查网络连接、API端点URL和请求格式是否正确。

### Q: 如何添加新的AI功能？
A: 在LangGraph工作流中添加新节点，更新API接口和前端UI。

## 扩展指南

### 添加新功能
1. 更新需求文档
2. 设计API接口
3. 实现后端逻辑
4. 开发前端界面
5. 编写测试用例
6. 更新文档

### 集成新的AI模型
1. 安装相关依赖
2. 更新LangGraph配置
3. 修改工作流逻辑
4. 测试模型性能
5. 更新文档说明

## 教学功能

### 教学文档系统
项目包含完整的教学文档系统，帮助开发者理解每个功能的实现过程：

**docs/teaching-log.md**: 主要的教学日志文档，记录：
- 需求变更的完整分析过程
- 技术选择的理由和对比
- 详细的实现步骤和代码解释
- 关键学习点和最佳实践
- 常见问题和解决方案

### Kiro IDE 钩子集成
项目配置了多个自动化钩子来提升开发和学习体验：

#### 1. Q&A转教学文档钩子
**文件**: `.kiro/hooks/qa-to-teaching-doc.kiro.hook`
**触发条件**: 当 `docs/teaching-log.md` 被编辑时
**功能**: 自动将问答对话转换为结构化的教学文档

```json
{
  "when": {
    "type": "fileEdited",
    "patterns": ["docs/teaching-log.md"]
  },
  "then": {
    "type": "askAgent",
    "prompt": "将Q&A对话转换为教学文档格式..."
  }
}
```

#### 2. Git提交文档钩子
**文件**: `.kiro/hooks/git-commit-docs.kiro.hook`
**功能**: Git提交时自动更新相关文档

#### 3. 服务器启动检查钩子
**文件**: `.kiro/hooks/server-startup-check.kiro.hook`
**功能**: 服务器启动时进行健康检查

### 教学文档编写规范

当添加新功能时，请按以下格式更新教学文档：

```markdown
## 第N次需求变更：功能名称

### 📅 时间
YYYY年MM月DD日

### 🎯 用户需求
详细描述用户的具体需求

### 🤔 问题分析
- 技术挑战分析
- 架构影响评估
- 解决方案对比

### 💡 解决方案设计
- 技术选择理由
- 架构设计图
- 实现策略

### 🔧 实现步骤
详细的代码实现过程

### 📝 关键学习点
- 核心概念解释
- 最佳实践总结
- 常见陷阱提醒

### 🧪 测试策略
测试方法和验证步骤

### 🎓 最佳实践总结
经验总结和建议

### 🔮 后续优化方向
未来改进建议
```

## 学习资源

### 项目内教学资源
- **docs/teaching-log.md**: 完整的开发教学日志
- **代码注释**: 详细的内联代码解释
- **测试用例**: 功能验证和学习示例
- **配置文件**: 环境设置和部署指南

### 官方文档
- [FastAPI文档](https://fastapi.tiangolo.com/)
- [LangGraph文档](https://langchain-ai.github.io/langgraph/)
- [React文档](https://react.dev/)
- [TypeScript文档](https://www.typescriptlang.org/)

### 推荐教程
- Python异步编程
- React Hooks深入理解
- TypeScript最佳实践
- AI应用开发指南
- Server-Sent Events (SSE) 实现
- 流式响应最佳实践