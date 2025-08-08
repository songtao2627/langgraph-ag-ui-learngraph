# 前端 SSE 处理：从原生到现代框架

## 概述

本文档展示了如何在前端处理 Server-Sent Events，从最基础的原生 JavaScript 到现代框架的实现方式。

## 1. 原生 JavaScript 实现

### 基础 EventSource 用法

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>SSE 基础示例</title>
    <style>
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .message-box { border: 1px solid #ddd; height: 400px; overflow-y: auto; padding: 10px; margin: 10px 0; }
        .message { margin: 5px 0; padding: 8px; border-radius: 4px; }
        .user { background: #e3f2fd; text-align: right; }
        .ai { background: #f3e5f5; }
        .error { background: #ffebee; color: #c62828; }
        .status { background: #e8f5e8; color: #2e7d32; }
        .input-area { display: flex; gap: 10px; margin: 10px 0; }
        .input-area input { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
        .input-area button { padding: 10px 20px; background: #2196f3; color: white; border: none; border-radius: 4px; cursor: pointer; }
        .input-area button:disabled { background: #ccc; cursor: not-allowed; }
    </style>
</head>
<body>
    <div class="container">
        <h1>AI 聊天 - SSE 实现</h1>
        
        <div class="input-area">
            <input type="text" id="messageInput" placeholder="输入你的消息..." />
            <button id="sendBtn" onclick="sendMessage()">发送</button>
            <button onclick="clearMessages()">清空</button>
        </div>
        
        <div id="status">状态: 准备就绪</div>
        <div id="messageBox" class="message-box"></div>
    </div>

    <script>
        let eventSource = null;
        let isStreaming = false;
        
        const messageBox = document.getElementById('messageBox');
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        const statusDiv = document.getElementById('status');

        // 添加消息到界面
        function addMessage(content, type = 'ai', isStreaming = false) {
            let messageDiv = document.querySelector('.message.streaming');
            
            if (isStreaming && messageDiv) {
                // 更新流式消息
                messageDiv.textContent = content;
            } else {
                // 创建新消息
                messageDiv = document.createElement('div');
                messageDiv.className = `message ${type}`;
                if (isStreaming) {
                    messageDiv.classList.add('streaming');
                }
                messageDiv.textContent = content;
                messageBox.appendChild(messageDiv);
            }
            
            messageBox.scrollTop = messageBox.scrollHeight;
            return messageDiv;
        }

        // 更新状态
        function updateStatus(status) {
            statusDiv.textContent = `状态: ${status}`;
        }

        // 发送消息
        async function sendMessage() {
            const message = messageInput.value.trim();
            if (!message || isStreaming) return;

            // 添加用户消息
            addMessage(message, 'user');
            messageInput.value = '';
            
            // 设置发送状态
            isStreaming = true;
            sendBtn.disabled = true;
            updateStatus('AI 正在思考...');

            try {
                // 方式1: 使用 EventSource (推荐)
                await sendWithEventSource(message);
                
                // 方式2: 使用 Fetch + ReadableStream (手动处理)
                // await sendWithFetch(message);
                
            } catch (error) {
                addMessage(`错误: ${error.message}`, 'error');
            } finally {
                isStreaming = false;
                sendBtn.disabled = false;
                updateStatus('准备就绪');
            }
        }

        // 方式1: 使用 EventSource
        async function sendWithEventSource(message) {
            return new Promise((resolve, reject) => {
                // 先发送消息到服务器
                fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message })
                });

                // 监听 SSE 流
                const eventSource = new EventSource(`/api/chat/stream?message=${encodeURIComponent(message)}`);
                let streamingContent = '';

                eventSource.onopen = function() {
                    updateStatus('接收 AI 回复中...');
                };

                eventSource.onmessage = function(event) {
                    try {
                        const data = JSON.parse(event.data);
                        
                        switch (data.type) {
                            case 'start':
                                streamingContent = '';
                                addMessage('', 'ai', true);
                                break;
                                
                            case 'chunk':
                                streamingContent += data.content;
                                addMessage(streamingContent, 'ai', true);
                                break;
                                
                            case 'end':
                                // 移除流式标记
                                const streamingDiv = document.querySelector('.message.streaming');
                                if (streamingDiv) {
                                    streamingDiv.classList.remove('streaming');
                                }
                                eventSource.close();
                                resolve();
                                break;
                                
                            case 'error':
                                addMessage(`AI 错误: ${data.content}`, 'error');
                                eventSource.close();
                                reject(new Error(data.content));
                                break;
                        }
                    } catch (e) {
                        console.error('解析 SSE 数据失败:', e);
                    }
                };

                eventSource.onerror = function(event) {
                    eventSource.close();
                    reject(new Error('SSE 连接错误'));
                };
            });
        }

        // 方式2: 使用 Fetch + ReadableStream 手动处理
        async function sendWithFetch(message) {
            const response = await fetch('/api/chat/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let streamingContent = '';

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    
                    if (done) break;

                    // 解码数据块
                    buffer += decoder.decode(value, { stream: true });

                    // 处理完整的 SSE 消息
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || ''; // 保留不完整的行

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6); // 移除 'data: ' 前缀
                            if (data.trim()) {
                                try {
                                    const parsed = JSON.parse(data);
                                    
                                    switch (parsed.type) {
                                        case 'start':
                                            streamingContent = '';
                                            addMessage('', 'ai', true);
                                            break;
                                            
                                        case 'chunk':
                                            streamingContent += parsed.content;
                                            addMessage(streamingContent, 'ai', true);
                                            break;
                                            
                                        case 'end':
                                            const streamingDiv = document.querySelector('.message.streaming');
                                            if (streamingDiv) {
                                                streamingDiv.classList.remove('streaming');
                                            }
                                            return;
                                            
                                        case 'error':
                                            throw new Error(parsed.content);
                                    }
                                } catch (parseError) {
                                    console.error('解析 JSON 失败:', parseError);
                                }
                            }
                        }
                    }
                }
            } finally {
                reader.releaseLock();
            }
        }

        // 清空消息
        function clearMessages() {
            messageBox.innerHTML = '';
        }

        // 回车发送
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // 页面加载完成后聚焦输入框
        window.onload = function() {
            messageInput.focus();
        };
    </script>
</body>
</html>
```

## 2. 现代 JavaScript (ES6+) 实现

### 使用 Class 和 Promise 的现代化实现

```javascript
class SSEChatClient {
    constructor(options = {}) {
        this.baseUrl = options.baseUrl || '';
        this.onMessage = options.onMessage || (() => {});
        this.onError = options.onError || (() => {});
        this.onStatusChange = options.onStatusChange || (() => {});
        
        this.isStreaming = false;
        this.eventSource = null;
    }

    // 发送消息并处理流式响应
    async sendMessage(message) {
        if (this.isStreaming) {
            throw new Error('正在处理中，请稍候...');
        }

        this.isStreaming = true;
        this.onStatusChange('sending');

        try {
            // 使用现代的 async/await 语法
            await this.streamResponse(message);
        } catch (error) {
            this.onError(error.message);
            throw error;
        } finally {
            this.isStreaming = false;
            this.onStatusChange('ready');
        }
    }

    // 流式响应处理
    async streamResponse(message) {
        const response = await fetch(`${this.baseUrl}/api/chat/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message }),
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return this.processStream(response);
    }

    // 处理流数据
    async processStream(response) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                
                // 处理完整的 SSE 消息
                const { processedLines, remainingBuffer } = this.parseSSEBuffer(buffer);
                buffer = remainingBuffer;

                for (const data of processedLines) {
                    await this.handleSSEData(data);
                }
            }
        } finally {
            reader.releaseLock();
        }
    }

    // 解析 SSE 缓冲区
    parseSSEBuffer(buffer) {
        const lines = buffer.split('\n');
        const remainingBuffer = lines.pop() || '';
        const processedLines = [];

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data.trim()) {
                    try {
                        processedLines.push(JSON.parse(data));
                    } catch (e) {
                        console.warn('解析 SSE 数据失败:', e);
                    }
                }
            }
        }

        return { processedLines, remainingBuffer };
    }

    // 处理 SSE 数据
    async handleSSEData(data) {
        switch (data.type) {
            case 'start':
                this.onStatusChange('streaming');
                this.onMessage({ type: 'start', content: '' });
                break;

            case 'chunk':
                this.onMessage({ type: 'chunk', content: data.content });
                break;

            case 'end':
                this.onMessage({ type: 'end', content: data.content || '' });
                this.onStatusChange('completed');
                break;

            case 'error':
                this.onError(data.content);
                break;

            default:
                console.warn('未知的 SSE 数据类型:', data.type);
        }
    }

    // 停止流式传输
    stop() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
        this.isStreaming = false;
        this.onStatusChange('stopped');
    }
}

// 使用示例
const chatClient = new SSEChatClient({
    baseUrl: 'http://localhost:8000',
    onMessage: (data) => {
        console.log('收到消息:', data);
        // 更新 UI
    },
    onError: (error) => {
        console.error('聊天错误:', error);
        // 显示错误信息
    },
    onStatusChange: (status) => {
        console.log('状态变化:', status);
        // 更新状态显示
    }
});

// 发送消息
document.getElementById('sendBtn').addEventListener('click', async () => {
    const message = document.getElementById('messageInput').value;
    try {
        await chatClient.sendMessage(message);
    } catch (error) {
        console.error('发送失败:', error);
    }
});
```

## 3. React Hook 实现

```jsx
import { useState, useCallback, useRef } from 'react';

// 自定义 Hook
function useSSEChat(baseUrl = '') {
    const [messages, setMessages] = useState([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState(null);
    const [status, setStatus] = useState('ready');
    
    const streamingMessageRef = useRef('');
    const streamingIdRef = useRef(null);

    const addMessage = useCallback((content, type = 'ai') => {
        const message = {
            id: Date.now() + Math.random(),
            content,
            type,
            timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, message]);
        return message.id;
    }, []);

    const updateStreamingMessage = useCallback((content) => {
        setMessages(prev => 
            prev.map(msg => 
                msg.id === streamingIdRef.current 
                    ? { ...msg, content }
                    : msg
            )
        );
    }, []);

    const sendMessage = useCallback(async (message) => {
        if (isStreaming) return;

        // 添加用户消息
        addMessage(message, 'user');
        
        // 重置状态
        setError(null);
        setIsStreaming(true);
        setStatus('sending');
        streamingMessageRef.current = '';

        try {
            const response = await fetch(`${baseUrl}/api/chat/stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message }),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            // 创建流式消息占位符
            streamingIdRef.current = addMessage('', 'ai');
            setStatus('streaming');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data.trim()) {
                            try {
                                const parsed = JSON.parse(data);
                                
                                if (parsed.type === 'chunk') {
                                    streamingMessageRef.current += parsed.content;
                                    updateStreamingMessage(streamingMessageRef.current);
                                } else if (parsed.type === 'end') {
                                    setStatus('completed');
                                    return;
                                } else if (parsed.type === 'error') {
                                    throw new Error(parsed.content);
                                }
                            } catch (parseError) {
                                console.warn('解析失败:', parseError);
                            }
                        }
                    }
                }
            }
        } catch (err) {
            setError(err.message);
            setStatus('error');
        } finally {
            setIsStreaming(false);
            streamingIdRef.current = null;
        }
    }, [isStreaming, baseUrl, addMessage, updateStreamingMessage]);

    const clearMessages = useCallback(() => {
        setMessages([]);
        setError(null);
    }, []);

    return {
        messages,
        isStreaming,
        error,
        status,
        sendMessage,
        clearMessages
    };
}

// React 组件
function ChatComponent() {
    const [inputMessage, setInputMessage] = useState('');
    const { messages, isStreaming, error, status, sendMessage, clearMessages } = useSSEChat();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || isStreaming) return;

        await sendMessage(inputMessage.trim());
        setInputMessage('');
    };

    return (
        <div className="chat-container">
            <div className="messages">
                {messages.map(msg => (
                    <div key={msg.id} className={`message ${msg.type}`}>
                        {msg.content}
                    </div>
                ))}
            </div>
            
            {error && (
                <div className="error">错误: {error}</div>
            )}
            
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="输入消息..."
                    disabled={isStreaming}
                />
                <button type="submit" disabled={isStreaming || !inputMessage.trim()}>
                    {isStreaming ? '发送中...' : '发送'}
                </button>
            </form>
            
            <div className="status">状态: {status}</div>
        </div>
    );
}
```

## 4. Vue 3 Composition API 实现

```vue
<template>
  <div class="chat-container">
    <div class="messages" ref="messagesContainer">
      <div 
        v-for="message in messages" 
        :key="message.id"
        :class="['message', message.type]"
      >
        {{ message.content }}
      </div>
    </div>
    
    <div v-if="error" class="error">
      错误: {{ error }}
    </div>
    
    <form @submit.prevent="handleSubmit">
      <input
        v-model="inputMessage"
        type="text"
        placeholder="输入消息..."
        :disabled="isStreaming"
      />
      <button 
        type="submit" 
        :disabled="isStreaming || !inputMessage.trim()"
      >
        {{ isStreaming ? '发送中...' : '发送' }}
      </button>
    </form>
    
    <div class="status">状态: {{ status }}</div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'

// 响应式状态
const messages = ref([])
const inputMessage = ref('')
const isStreaming = ref(false)
const error = ref(null)
const status = ref('ready')
const messagesContainer = ref(null)

// 流式消息相关
let streamingMessageRef = ''
let streamingIdRef = null

// 添加消息
const addMessage = (content, type = 'ai') => {
  const message = {
    id: Date.now() + Math.random(),
    content,
    type,
    timestamp: new Date().toISOString()
  }
  messages.value.push(message)
  scrollToBottom()
  return message.id
}

// 更新流式消息
const updateStreamingMessage = (content) => {
  const index = messages.value.findIndex(msg => msg.id === streamingIdRef)
  if (index !== -1) {
    messages.value[index].content = content
  }
}

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 发送消息
const sendMessage = async (message) => {
  if (isStreaming.value) return

  // 添加用户消息
  addMessage(message, 'user')
  
  // 重置状态
  error.value = null
  isStreaming.value = true
  status.value = 'sending'
  streamingMessageRef = ''

  try {
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    // 创建流式消息占位符
    streamingIdRef = addMessage('', 'ai')
    status.value = 'streaming'

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data.trim()) {
            try {
              const parsed = JSON.parse(data)
              
              if (parsed.type === 'chunk') {
                streamingMessageRef += parsed.content
                updateStreamingMessage(streamingMessageRef)
                scrollToBottom()
              } else if (parsed.type === 'end') {
                status.value = 'completed'
                return
              } else if (parsed.type === 'error') {
                throw new Error(parsed.content)
              }
            } catch (parseError) {
              console.warn('解析失败:', parseError)
            }
          }
        }
      }
    }
  } catch (err) {
    error.value = err.message
    status.value = 'error'
  } finally {
    isStreaming.value = false
    streamingIdRef = null
  }
}

// 处理表单提交
const handleSubmit = async () => {
  if (!inputMessage.value.trim() || isStreaming.value) return

  await sendMessage(inputMessage.value.trim())
  inputMessage.value = ''
}
</script>

<style scoped>
.chat-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.messages {
  border: 1px solid #ddd;
  height: 400px;
  overflow-y: auto;
  padding: 10px;
  margin: 10px 0;
}

.message {
  margin: 5px 0;
  padding: 8px;
  border-radius: 4px;
}

.message.user {
  background: #e3f2fd;
  text-align: right;
}

.message.ai {
  background: #f3e5f5;
}

.error {
  background: #ffebee;
  color: #c62828;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
}

form {
  display: flex;
  gap: 10px;
  margin: 10px 0;
}

input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  padding: 10px 20px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.status {
  margin: 10px 0;
  font-size: 14px;
  color: #666;
}
</style>
```

## 总结

这些示例展示了从原生 JavaScript 到现代框架的 SSE 处理方式：

1. **原生 JavaScript**: 最基础的实现，直接使用 EventSource 或 Fetch API
2. **现代 JavaScript**: 使用 ES6+ 语法，Class 和 Promise 让代码更清晰
3. **React Hook**: 利用 React 的状态管理和生命周期
4. **Vue Composition API**: 使用 Vue 3 的响应式系统

每种方式都有其适用场景，选择时需要考虑：
- 项目复杂度
- 团队技术栈
- 维护成本
- 性能要求

核心原理都是一样的：建立 HTTP 连接，解析 SSE 格式的数据流，更新 UI 状态。