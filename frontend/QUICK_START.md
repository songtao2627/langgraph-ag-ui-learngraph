# 流式聊天快速开始

## 1. 基本使用

### 使用流式聊天 Hook

```typescript
import { useStreamingChat } from './hooks/useChatStream';

function MyChat() {
  const {
    sendStreamingMessage,
    conversations,
    currentConversationId,
    isStreaming,
    streamingMessage,
    error
  } = useStreamingChat();

  const handleSend = async (message: string) => {
    await sendStreamingMessage(message);
  };

  return (
    <div>
      {/* 显示消息 */}
      {conversations.find(c => c.id === currentConversationId)?.messages.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}
      
      {/* 显示流式消息 */}
      {isStreaming && <div>{streamingMessage}|</div>}
      
      {/* 输入框 */}
      <input 
        onKeyPress={(e) => e.key === 'Enter' && handleSend(e.target.value)}
        disabled={isStreaming}
      />
    </div>
  );
}
```

### 使用现成的流式聊天组件

```typescript
import { StreamingChatInterface } from './components/Chat/StreamingChatInterface';

function App() {
  return (
    <div className="h-screen">
      <StreamingChatInterface />
    </div>
  );
}
```

## 2. 自定义回调

```typescript
const chat = useStreamingChat({
  onMessageStart: (conversationId) => {
    console.log('开始接收消息');
  },
  onMessageChunk: (chunk, conversationId) => {
    console.log('接收到:', chunk);
  },
  onMessageComplete: (message) => {
    console.log('消息完成:', message);
  },
  onError: (error) => {
    console.error('错误:', error);
  }
});
```

## 3. 测试流式功能

访问应用并选择"流式测试"模式，可以：
- 测试不同长度的消息
- 查看实时日志
- 验证错误处理

## 4. 后端要求

确保后端运行在 `http://localhost:8000` 并提供 `/api/chat/stream` 端点。

## 5. 环境变量

在 `.env` 文件中设置：
```
VITE_API_BASE_URL=http://localhost:8000
```

## 6. 故障排除

- 检查后端是否运行
- 确认 CORS 配置正确
- 查看浏览器控制台错误
- 使用测试页面验证功能