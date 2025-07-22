# Design Document

## Overview

AI-UI最小化项目采用前后端分离架构，后端使用Python + LangGraph构建AI对话服务，前端使用React + TypeScript构建用户界面。项目设计注重代码简洁性和学习友好性，每个组件都有清晰的职责分工。

## Architecture

```
┌─────────────────┐    HTTP/WebSocket    ┌──────────────────┐
│   React Frontend │ ◄─────────────────► │  Python Backend  │
│                 │                      │                  │
│  - Chat UI      │                      │  - LangGraph     │
│  - State Mgmt   │                      │  - FastAPI       │
│  - Error Handle │                      │  - AI Logic      │
└─────────────────┘                      └──────────────────┘
```

### Technology Stack

**Backend:**
- Python 3.11+
- LangGraph (AI workflow orchestration)
- FastAPI (Web framework)
- Pydantic (Data validation)
- uvicorn (ASGI server)

**Frontend:**
- React 18
- TypeScript
- Vite (Build tool)
- Tailwind CSS (Styling)
- Axios (HTTP client)

## Components and Interfaces

### Backend Components

#### 1. LangGraph Workflow
```python
# 核心AI对话流程
class ChatWorkflow:
    - process_message(user_input: str) -> AIResponse
    - handle_context(conversation_history: List[Message])
    - generate_response() -> str
```

#### 2. FastAPI Application
```python
# REST API endpoints
- POST /api/chat - 处理对话请求
- GET /api/health - 健康检查
- GET /api/status - 服务状态
```

#### 3. Message Models
```python
class ChatRequest:
    message: str
    conversation_id: Optional[str]

class ChatResponse:
    response: str
    conversation_id: str
    timestamp: datetime
```

### Frontend Components

#### 1. Chat Interface
```typescript
// 主对话组件
interface ChatInterface {
  messages: Message[]
  onSendMessage: (message: string) => void
  isLoading: boolean
}
```

#### 2. Message Components
```typescript
// 消息显示组件
interface MessageBubble {
  message: Message
  type: 'user' | 'ai'
}

interface MessageInput {
  onSubmit: (message: string) => void
  disabled: boolean
}
```

#### 3. State Management
```typescript
// 应用状态管理
interface AppState {
  messages: Message[]
  isLoading: boolean
  error: string | null
  conversationId: string | null
}
```

## Data Models

### Message Model
```typescript
interface Message {
  id: string
  content: string
  type: 'user' | 'ai'
  timestamp: Date
  conversationId: string
}
```

### API Response Models
```typescript
interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
}

interface ChatAPIResponse {
  response: string
  conversationId: string
  processingTime: number
}
```

## Error Handling

### Backend Error Handling
1. **Input Validation**: Pydantic模型验证请求数据
2. **LangGraph Errors**: 捕获AI处理异常并返回友好消息
3. **HTTP Errors**: 标准HTTP状态码和错误响应
4. **Logging**: 结构化日志记录所有错误和请求

### Frontend Error Handling
1. **Network Errors**: 网络请求失败的重试机制
2. **API Errors**: 显示后端返回的错误消息
3. **Validation Errors**: 前端输入验证和提示
4. **Fallback UI**: 错误状态下的降级界面

## Testing Strategy

### Backend Testing
1. **Unit Tests**: 
   - LangGraph workflow逻辑测试
   - API endpoint功能测试
   - 数据模型验证测试

2. **Integration Tests**:
   - 完整对话流程测试
   - API与LangGraph集成测试

### Frontend Testing
1. **Component Tests**:
   - React组件渲染测试
   - 用户交互测试
   - 状态管理测试

2. **E2E Tests**:
   - 完整对话流程测试
   - 错误处理场景测试

## Development Workflow

### 项目结构
```
ai-ui-minimal-project/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI应用入口
│   │   ├── chat/            # 对话相关模块
│   │   ├── models/          # 数据模型
│   │   └── utils/           # 工具函数
│   ├── requirements.txt     # Python依赖
│   └── README.md           # 后端文档
├── frontend/
│   ├── src/
│   │   ├── components/      # React组件
│   │   ├── hooks/          # 自定义Hooks
│   │   ├── services/       # API服务
│   │   └── types/          # TypeScript类型
│   ├── package.json        # Node.js依赖
│   └── README.md          # 前端文档
├── docs/                   # 项目文档
└── README.md              # 主文档
```

### 开发环境设置
1. **Backend**: Python虚拟环境 + pip安装依赖
2. **Frontend**: Node.js + npm/yarn安装依赖
3. **开发服务器**: 后端uvicorn，前端Vite dev server
4. **热重载**: 两端都支持代码修改后自动重载

## Security Considerations

1. **CORS配置**: 正确配置跨域请求
2. **输入验证**: 前后端都进行输入验证
3. **错误信息**: 不暴露敏感的系统信息
4. **API限流**: 防止API滥用的基本限流机制

## Performance Considerations

1. **响应时间**: LangGraph处理优化，目标响应时间<3秒
2. **前端优化**: React组件懒加载，避免不必要的重渲染
3. **缓存策略**: 对话历史的本地缓存
4. **资源管理**: 合理的内存和CPU使用