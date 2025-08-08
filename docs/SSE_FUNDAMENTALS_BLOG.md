# Server-Sent Events (SSE) 技术本质解析

## 前言

在现代 Web 开发中，实时通信变得越来越重要。从聊天应用到实时数据推送，我们需要服务器能够主动向客户端发送数据。Server-Sent Events (SSE) 就是解决这个问题的一种简单而优雅的方案。

本文将从最基础的原理开始，逐步展示 SSE 在不同技术栈中的实现，帮助你理解这项技术的本质。

## 什么是 Server-Sent Events？

SSE 是 HTML5 标准的一部分，它允许服务器向客户端推送数据。与 WebSocket 不同，SSE 是**单向的**（服务器到客户端），基于标准的 HTTP 协议。

### SSE 的核心特征

1. **基于 HTTP**：使用标准的 HTTP 连接
2. **单向通信**：只能服务器向客户端发送数据
3. **自动重连**：客户端会自动重新连接
4. **简单的文本格式**：使用简单的文本协议
5. **原生浏览器支持**：现代浏览器原生支持

## SSE 协议格式

SSE 使用非常简单的文本格式：

```
data: 这是一条消息
data: 这是另一条消息

data: {"type": "message", "content": "JSON格式的数据"}

event: custom-event
data: 自定义事件的数据

id: 123
data: 带ID的消息（用于断线重连）

retry: 3000
data: 设置重连间隔为3秒
```

**关键规则**：
- 每行以字段名开头，后跟冒号和值
- `data:` 字段包含实际数据
- 空行表示消息结束
- 支持多行数据（多个 `data:` 行）

## 前端实现：从原生 JavaScript 开始

### 1. 最简单的 HTML + JavaScript 实现

```html
<!DOCTYPE html>
<html>
<head>
    <title>SSE 基础示例</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        #messages { border: 1px solid #ccc; padding: 10px; height: 300px; overflow-y: auto; }
        .message { margin: 5px 0; padding: 5px; background: #f0f0f0; }
        .error { background: #ffebee; color: #c62828; }
        .status { background: #e8f5e8; color: #2e7d32; }
    </style>
</head>
<body>
    <h1>Server-Sent Events 示例</h1>
    
    <div>
        <input type="text" id="messageInput" placeholder="输入消息..." style="width: 300px;">
        <button onclick="sendMessage()">发送消息</button>
        <button onclick="connectSSE()">连接 SSE</button>
        <button onclick="disconnectSSE()">断开连接</button>
    </div>
    
    <div id="status">状态: 未连接</div>
    <div id="messages"></div>

    <script>
        let eventSource = null;
        const messagesDiv = document.getElementById('messages');
        const statusDiv = document.getElementById('status');

        function addMessage(content, type = 'message') {
            const div = document.createElement('div');
            div.className = `message ${type}`;
            div.innerHTML = `<strong>${new Date().toLocaleTimeString()}</strong>: ${content}`;
            messagesDiv.appendChild(div);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        function updateStatus(status) {
            statusDiv.textContent = `状态: ${status}`;
        }

        function connectSSE() {
            if (eventSource) {
                eventSource.close();
            }

            // 创建 EventSource 连接
            eventSource = new EventSource('/api/sse-stream');

            // 监听连接打开
            eventSource.onopen = function(event) {
                updateStatus('已连接');
                addMessage('SSE 连接已建立', 'status');
            };

            // 监听消息
            eventSource.onmessage = function(event) {
                try {
                    const data = JSON.parse(event.data);
                    addMessage(`收到消息: ${data.content || data.message || event.data}`);
                } catch (e) {
                    addMessage(`收到文本: ${event.data}`);
                }
            };

            // 监听错误
            eventSource.onerror = function(event) {
                updateStatus('连接错误');
                addMessage('连接发生错误，正在重试...', 'error');
            };

            // 监听自定义事件
            eventSource.addEventListener('chat-message', function(event) {
                const data = JSON.parse(event.data);
                addMessage(`聊天消息: ${data.content}`, 'status');
            });
        }

        function disconnectSSE() {
            if (eventSource) {
                eventSource.close();
                eventSource = null;
                updateStatus('已断开');
                addMessage('SSE 连接已断开', 'status');
            }
        }

        function sendMessage() {
            const input = document.getElementById('messageInput');
            const message = input.value.trim();
            
            if (!message) return;

            // 发送消息到服务器（触发 SSE 响应）
            fetch('/api/send-message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message })
            })
            .then(response => response.json())
            .then(data => {
                addMessage(`发送成功: ${message}`, 'status');
                input.value = '';
            })
            .catch(error => {
                addMessage(`发送失败: ${error.message}`, 'error');
            });
        }

        // 页面加载时自动连接
        window.onload = function() {
            connectSSE();
        };

        // 页面卸载时断开连接
        window.onbeforeunload = function() {
            disconnectSSE();
        };
    </script>
</body>
</html>
```

### 2. 使用 Fetch API 手动处理 SSE 流

```html
<!DOCTYPE html>
<html>
<head>
    <title>手动 SSE 处理</title>
</head>
<body>
    <h1>手动处理 SSE 流</h1>
    <div id="messages"></div>
    <button onclick="startManualSSE()">开始手动 SSE</button>

    <script>
        async function startManualSSE() {
            try {
                const response = await fetch('/api/manual-sse-stream', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message: 'Hello SSE' })
                });

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

                while (true) {
                    const { done, value } = await reader.read();
                    
                    if (done) break;

                    // 解码数据块
                    buffer += decoder.decode(value, { stream: true });

                    // 处理完整的 SSE 消息
                    const lines = buffer.split('\n');
                    buffer = lines.pop(); // 保留不完整的行

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6); // 移除 'data: ' 前缀
                            if (data.trim()) {
                                try {
                                    const parsed = JSON.parse(data);
                                    addMessage(`手动解析: ${parsed.content}`);
                                } catch (e) {
                                    addMessage(`手动解析: ${data}`);
                                }
                            }
                        }
                    }
                }
            } catch (error) {
                addMessage(`错误: ${error.message}`);
            }
        }

        function addMessage(content) {
            const div = document.createElement('div');
            div.textContent = `${new Date().toLocaleTimeString()}: ${content}`;
            document.getElementById('messages').appendChild(div);
        }
    </script>
</body>
</html>
```

## 后端实现：多框架对比

### 1. FastAPI (Python)

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import json
import asyncio
from datetime import datetime

app = FastAPI()

@app.get("/api/sse-stream")
async def sse_stream():
    """标准 SSE 端点"""
    async def generate():
        for i in range(10):
            # 基本消息
            yield f"data: {json.dumps({'message': f'消息 {i}', 'timestamp': datetime.now().isoformat()})}\n\n"
            await asyncio.sleep(1)
        
        # 自定义事件
        yield f"event: custom-event\n"
        yield f"data: {json.dumps({'type': 'custom', 'content': '自定义事件'})}\n\n"
        
        # 结束消息
        yield f"data: {json.dumps({'message': '流结束', 'type': 'end'})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
        }
    )

@app.post("/api/manual-sse-stream")
async def manual_sse_stream(request: dict):
    """手动 SSE 流处理"""
    async def generate():
        message = request.get('message', 'Hello')
        
        # 开始事件
        yield f"data: {json.dumps({'type': 'start', 'content': '开始处理'})}\n\n"
        
        # 模拟处理过程
        for i, char in enumerate(message):
            yield f"data: {json.dumps({'type': 'chunk', 'content': char, 'index': i})}\n\n"
            await asyncio.sleep(0.1)
        
        # 结束事件
        yield f"data: {json.dumps({'type': 'end', 'content': '处理完成'})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )

@app.post("/api/send-message")
async def send_message(request: dict):
    """接收消息并触发 SSE 事件"""
    # 这里可以将消息存储到队列中，然后通过 SSE 推送给其他客户端
    return {"status": "success", "message": "消息已接收"}
```

### 2. Spring Boot (Java)

```java
@RestController
@RequestMapping("/api")
public class SSEController {

    @GetMapping(value = "/sse-stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter sseStream() {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        
        // 异步发送数据
        CompletableFuture.runAsync(() -> {
            try {
                for (int i = 0; i < 10; i++) {
                    Map<String, Object> data = new HashMap<>();
                    data.put("message", "消息 " + i);
                    data.put("timestamp", Instant.now().toString());
                    
                    emitter.send(SseEmitter.event()
                        .data(data)
                        .name("message"));
                    
                    Thread.sleep(1000);
                }
                
                // 发送自定义事件
                Map<String, Object> customData = new HashMap<>();
                customData.put("type", "custom");
                customData.put("content", "自定义事件");
                
                emitter.send(SseEmitter.event()
                    .data(customData)
                    .name("custom-event"));
                
                emitter.complete();
                
            } catch (Exception e) {
                emitter.completeWithError(e);
            }
        });
        
        return emitter;
    }

    @PostMapping("/manual-sse-stream")
    public ResponseEntity<StreamingResponseBody> manualSseStream(@RequestBody Map<String, String> request) {
        String message = request.getOrDefault("message", "Hello");
        
        StreamingResponseBody stream = outputStream -> {
            try (PrintWriter writer = new PrintWriter(outputStream)) {
                // 开始事件
                writer.printf("data: %s\n\n", 
                    new ObjectMapper().writeValueAsString(
                        Map.of("type", "start", "content", "开始处理")));
                writer.flush();
                
                // 逐字符发送
                for (int i = 0; i < message.length(); i++) {
                    Map<String, Object> data = Map.of(
                        "type", "chunk",
                        "content", String.valueOf(message.charAt(i)),
                        "index", i
                    );
                    writer.printf("data: %s\n\n", 
                        new ObjectMapper().writeValueAsString(data));
                    writer.flush();
                    Thread.sleep(100);
                }
                
                // 结束事件
                writer.printf("data: %s\n\n", 
                    new ObjectMapper().writeValueAsString(
                        Map.of("type", "end", "content", "处理完成")));
                writer.flush();
                
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        };
        
        return ResponseEntity.ok()
            .header("Content-Type", "text/event-stream")
            .header("Cache-Control", "no-cache")
            .header("Connection", "keep-alive")
            .body(stream);
    }
}
```

### 3. Express.js (Node.js)

```javascript
const express = require('express');
const app = express();

app.use(express.json());

// 标准 SSE 端点
app.get('/api/sse-stream', (req, res) => {
    // 设置 SSE 头部
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
    });

    let counter = 0;
    const interval = setInterval(() => {
        const data = {
            message: `消息 ${counter}`,
            timestamp: new Date().toISOString()
        };
        
        // 发送数据
        res.write(`data: ${JSON.stringify(data)}\n\n`);
        
        counter++;
        if (counter >= 10) {
            // 发送自定义事件
            res.write(`event: custom-event\n`);
            res.write(`data: ${JSON.stringify({type: 'custom', content: '自定义事件'})}\n\n`);
            
            // 结束流
            res.write(`data: ${JSON.stringify({message: '流结束', type: 'end'})}\n\n`);
            clearInterval(interval);
            res.end();
        }
    }, 1000);

    // 客户端断开连接时清理
    req.on('close', () => {
        clearInterval(interval);
    });
});

// 手动 SSE 流处理
app.post('/api/manual-sse-stream', (req, res) => {
    const message = req.body.message || 'Hello';
    
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    });

    // 开始事件
    res.write(`data: ${JSON.stringify({type: 'start', content: '开始处理'})}\n\n`);

    let index = 0;
    const interval = setInterval(() => {
        if (index < message.length) {
            const data = {
                type: 'chunk',
                content: message[index],
                index: index
            };
            res.write(`data: ${JSON.stringify(data)}\n\n`);
            index++;
        } else {
            // 结束事件
            res.write(`data: ${JSON.stringify({type: 'end', content: '处理完成'})}\n\n`);
            clearInterval(interval);
            res.end();
        }
    }, 100);

    req.on('close', () => {
        clearInterval(interval);
    });
});

app.listen(3000, () => {
    console.log('SSE 服务器运行在 http://localhost:3000');
});
```

### 4. Gin (Go)

```go
package main

import (
    "encoding/json"
    "fmt"
    "net/http"
    "time"
    
    "github.com/gin-gonic/gin"
)

type Message struct {
    Type      string      `json:"type"`
    Content   string      `json:"content"`
    Timestamp string      `json:"timestamp,omitempty"`
    Index     int         `json:"index,omitempty"`
}

func main() {
    r := gin.Default()

    // 标准 SSE 端点
    r.GET("/api/sse-stream", func(c *gin.Context) {
        // 设置 SSE 头部
        c.Header("Content-Type", "text/event-stream")
        c.Header("Cache-Control", "no-cache")
        c.Header("Connection", "keep-alive")
        c.Header("Access-Control-Allow-Origin", "*")

        flusher, ok := c.Writer.(http.Flusher)
        if !ok {
            c.String(http.StatusInternalServerError, "Streaming unsupported")
            return
        }

        for i := 0; i < 10; i++ {
            msg := Message{
                Type:      "message",
                Content:   fmt.Sprintf("消息 %d", i),
                Timestamp: time.Now().Format(time.RFC3339),
            }
            
            data, _ := json.Marshal(msg)
            fmt.Fprintf(c.Writer, "data: %s\n\n", data)
            flusher.Flush()
            
            time.Sleep(1 * time.Second)
        }

        // 自定义事件
        customMsg := Message{Type: "custom", Content: "自定义事件"}
        data, _ := json.Marshal(customMsg)
        fmt.Fprintf(c.Writer, "event: custom-event\ndata: %s\n\n", data)
        
        // 结束消息
        endMsg := Message{Type: "end", Content: "流结束"}
        data, _ = json.Marshal(endMsg)
        fmt.Fprintf(c.Writer, "data: %s\n\n", data)
        flusher.Flush()
    })

    // 手动 SSE 流处理
    r.POST("/api/manual-sse-stream", func(c *gin.Context) {
        var req struct {
            Message string `json:"message"`
        }
        
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }
        
        message := req.Message
        if message == "" {
            message = "Hello"
        }

        c.Header("Content-Type", "text/event-stream")
        c.Header("Cache-Control", "no-cache")
        c.Header("Connection", "keep-alive")

        flusher, _ := c.Writer.(http.Flusher)

        // 开始事件
        startMsg := Message{Type: "start", Content: "开始处理"}
        data, _ := json.Marshal(startMsg)
        fmt.Fprintf(c.Writer, "data: %s\n\n", data)
        flusher.Flush()

        // 逐字符发送
        for i, char := range message {
            chunkMsg := Message{
                Type:    "chunk",
                Content: string(char),
                Index:   i,
            }
            data, _ := json.Marshal(chunkMsg)
            fmt.Fprintf(c.Writer, "data: %s\n\n", data)
            flusher.Flush()
            
            time.Sleep(100 * time.Millisecond)
        }

        // 结束事件
        endMsg := Message{Type: "end", Content: "处理完成"}
        data, _ = json.Marshal(endMsg)
        fmt.Fprintf(c.Writer, "data: %s\n\n", data)
        flusher.Flush()
    })

    r.Run(":8080")
}
```

## 核心概念总结

### 1. SSE 的本质
- **HTTP 长连接**：保持连接开放，持续发送数据
- **文本协议**：使用简单的 `data: content\n\n` 格式
- **单向通信**：只能服务器向客户端推送

### 2. 前端处理方式
- **EventSource API**：浏览器原生支持，自动处理重连
- **Fetch + ReadableStream**：手动处理，更灵活但需要自己处理重连

### 3. 后端实现要点
- **正确的 Content-Type**：`text/event-stream`
- **禁用缓存**：`Cache-Control: no-cache`
- **保持连接**：`Connection: keep-alive`
- **及时刷新**：确保数据立即发送到客户端

### 4. 跨框架的共同模式
1. 设置正确的响应头
2. 使用生成器/流来产生数据
3. 按 SSE 格式输出数据
4. 处理客户端断开连接

## 实际应用场景

1. **实时聊天**：AI 对话、客服系统
2. **进度推送**：文件上传、任务处理进度
3. **实时监控**：系统状态、日志流
4. **通知系统**：实时消息推送
5. **数据流**：股票价格、传感器数据

## 与其他技术的对比

| 特性 | SSE | WebSocket | 长轮询 |
|------|-----|-----------|--------|
| 连接方向 | 单向 | 双向 | 单向 |
| 协议 | HTTP | WebSocket | HTTP |
| 复杂度 | 简单 | 中等 | 简单 |
| 自动重连 | 是 | 否 | 否 |
| 浏览器支持 | 好 | 好 | 好 |
| 服务器资源 | 中等 | 低 | 高 |

## 总结

SSE 是一项简单而强大的技术，它的美在于：

1. **简单性**：基于标准 HTTP，协议简单
2. **可靠性**：浏览器自动处理重连
3. **通用性**：所有主流框架都支持
4. **实用性**：满足大多数实时推送需求

通过理解 SSE 的本质——HTTP 长连接 + 文本流协议，我们可以在任何技术栈中轻松实现实时数据推送功能。

---

*本文展示了 SSE 技术在不同框架中的实现，帮助开发者理解这项技术的本质和通用模式。*