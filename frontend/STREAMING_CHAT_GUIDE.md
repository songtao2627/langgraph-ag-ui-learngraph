# 流式聊天功能使用指南

## 概述

本项目现在支持流式聊天功能，可以实时显示AI的响应内容，提供更好的用户体验。

## 技术实现

### 后端流式响应

后端使用 FastAPI 的 `StreamingResponse` 和 Server-Sent Events (SSE) 技术：

```python
@router.post("/stream")
async def chat_stream(request: ChatRequest, http_request: Request):
    async def generate_sse():
        async for chunk in chat_workflow.process_message_stream(request):
            chunk_data = chunk.model_dump()
            yield f"data: {json.dumps(chunk_data, ensure_ascii=False)}\n\n"
    
    return StreamingResponse(
        generate_sse(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )
```

### 前端流式处理

前端使用 Fetch API 和 ReadableStream 处理流式响应：

```typescript
async sendStreamingMessage(request: ChatRequest, callbacks: StreamCallbacks) {
  const response = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    // 处理 SSE 数据
    const chunk = JSON.parse(data);
    callbacks.onChunk?.(chunk);
  }
}
```

## 使用方法

### 1. 使用流式聊天 Hook

```typescript
import { useStreamingChat } from '../hooks/useChatStream';

const MyComponent = () => {
  const {
    conversations,
    currentConversationId,
    isStreaming,
    streamingMessage,
    sendStreamingMessage,
    // ... 其他方法
  } = useStreamingChat({
    onMessageStart: (conversationId) => {
      console.log('开始接收消息');
    },
    onMessageChunk: (chunk, conversationId) => {
      console.log('接收到数据块:', chunk);
    },
    onMessageComplete: (message) => {
      console.log('消息接收完成:', message);
    },
    onError: (error) => {
      console.error('流式错误:', error);
    }
  });

  const handleSendMessage = async (content: string) => {
    await sendStreamingMessage(content);
  };

  return (
    <div>
      {/* 渲染消息列表 */}
      {conversations.map(conv => (
        <div key={conv.id}>
          {conv.messages.map(msg => (
            <div key={msg.id}>{msg.content}</div>
          ))}
        </div>
      ))}
      
      {/* 显示正在流式传输的消息 */}
      {isStreaming && (
        <div className="streaming-message">
          {streamingMessage}
          <span className="cursor">|</span>
        </div>
      )}
    </div>
  );
};
```

### 2. 使用流式聊天组件

```typescript
import { StreamingChatInterface } from './components/Chat/StreamingChatInterface';

const App = () => {
  return (
    <div className="h-screen">
      <StreamingChatInterface />
    </div>
  );
};
```

## 数据流格式

### StreamChunk 类型

```typescript
interface StreamChunk {
  type: 'start' | 'chunk' | 'end' | 'error';
  content: string;
  conversation_id: string;
  timestamp: string;
  metadata?: Record<string, any>;
}
```

### 流式数据示例

```json
// 开始
{"type": "start", "content": "", "conversation_id": "conv_123", "timestamp": "2024-01-01T12:00:00Z"}

// 数据块
{"type": "chunk", "content": "Hello", "conversation_id": "conv_123", "timestamp": "2024-01-01T12:00:01Z"}
{"type": "chunk", "content": " world", "conversation_id": "conv_123", "timestamp": "2024-01-01T12:00:02Z"}

// 结束
{"type": "end", "content": "", "conversation_id": "conv_123", "timestamp": "2024-01-01T12:00:03Z"}
```

## 功能特性

### 1. 实时响应显示
- AI响应内容实时显示
- 打字机效果
- 响应过程中显示光标动画

### 2. 流控制
- 可以随时停止流式传输
- 错误处理和重试机制
- 网络断开自动重连

### 3. 用户体验优化
- 自动滚动到最新消息
- 流式传输状态指示
- 禁用输入防止重复发送

### 4. 错误处理
- 网络错误处理
- 解析错误处理
- 超时处理

## 最佳实践

### 1. 性能优化
```typescript
// 使用 useCallback 避免不必要的重渲染
const handleChunk = useCallback((chunk: string) => {
  // 处理数据块
}, []);

// 使用 useMemo 缓存计算结果
const processedMessages = useMemo(() => {
  return messages.map(processMessage);
}, [messages]);
```

### 2. 错误处理
```typescript
const {
  sendStreamingMessage,
  error,
  clearError
} = useStreamingChat({
  onError: (error) => {
    // 记录错误
    console.error('Streaming error:', error);
    
    // 显示用户友好的错误信息
    showNotification('消息发送失败，请重试');
  }
});
```

### 3. 用户体验
```typescript
// 显示加载状态
{isStreaming && (
  <div className="loading-indicator">
    <span>AI正在思考...</span>
    <button onClick={stopStreaming}>停止</button>
  </div>
)}

// 自动滚动
useEffect(() => {
  scrollToBottom();
}, [streamingMessage]);
```

## 故障排除

### 1. 连接问题
- 检查网络连接
- 确认后端服务运行正常
- 检查 CORS 配置

### 2. 数据解析问题
- 检查 SSE 数据格式
- 确认 JSON 解析正确
- 查看浏览器控制台错误

### 3. 性能问题
- 限制消息历史长度
- 使用虚拟滚动处理大量消息
- 优化重渲染

## 扩展功能

### 1. 添加消息类型
```typescript
// 支持更多消息类型
interface ExtendedStreamChunk extends StreamChunk {
  type: 'start' | 'chunk' | 'end' | 'error' | 'thinking' | 'tool_call';
  tool_name?: string;
  tool_args?: any;
}
```

### 2. 添加流控制
```typescript
// 支持暂停和恢复
const useStreamingChatWithControl = () => {
  const [isPaused, setIsPaused] = useState(false);
  
  const pauseStream = () => setIsPaused(true);
  const resumeStream = () => setIsPaused(false);
  
  return { pauseStream, resumeStream, isPaused };
};
```

### 3. 添加消息编辑
```typescript
// 支持编辑和重新发送
const editAndResend = async (messageId: string, newContent: string) => {
  // 编辑消息
  updateMessage(messageId, newContent);
  
  // 重新发送
  await sendStreamingMessage(newContent);
};
```

这个流式聊天功能为用户提供了更好的交互体验，特别适合长文本生成和实时对话场景。