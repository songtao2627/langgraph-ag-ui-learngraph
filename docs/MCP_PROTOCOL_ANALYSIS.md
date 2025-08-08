# MCP 协议为什么不使用 SSE：架构设计分析

## 概述

Model Context Protocol (MCP) 是 Anthropic 开发的一个用于 AI 模型与外部工具交互的协议。有趣的是，MCP 并没有采用 Server-Sent Events (SSE) 作为通信方式，而是选择了其他方案。本文分析这一设计决策的原因。

## MCP 协议的核心特征

### 1. 协议设计目标

MCP 的设计目标与传统的 Web 实时推送有本质区别：

```
传统 Web 推送场景：
服务器 ──推送数据──> 浏览器客户端
(单向，持续推送，面向用户)

MCP 场景：
AI 模型 <──双向交互──> 外部工具/服务
(双向，按需调用，面向程序)
```

### 2. MCP 的实际通信模式

**基于 JSON-RPC 2.0**：
```json
// 请求
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_weather",
    "arguments": {
      "location": "San Francisco"
    }
  }
}

// 响应
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "The weather in San Francisco is sunny, 72°F"
      }
    ]
  }
}
```

### 3. 传输层选择

MCP 支持多种传输方式：
- **stdio** (标准输入输出)
- **HTTP** (RESTful API)
- **WebSocket** (双向实时通信)

## 为什么 MCP 不使用 SSE？

### 1. 双向通信需求

**SSE 的局限**：
```javascript
// SSE 只能单向推送
const eventSource = new EventSource('/api/events');
eventSource.onmessage = (event) => {
    // 只能接收，不能发送
    console.log('收到:', event.data);
};

// 无法通过 SSE 发送请求
// eventSource.send() // ❌ 不存在这个方法
```

**MCP 需要双向交互**：
```javascript
// MCP 需要这样的交互模式
async function mcpInteraction() {
    // 1. AI 发送工具调用请求
    const request = {
        method: "tools/call",
        params: { name: "search", query: "weather" }
    };
    
    // 2. 工具返回结果
    const response = await callTool(request);
    
    // 3. AI 可能基于结果发送后续请求
    const followUp = {
        method: "tools/call", 
        params: { name: "format", data: response }
    };
}
```

### 2. 请求-响应语义

**SSE 的推送模式**：
```
时间轴: ──────────────────────────────>
服务器: ──推送──推送──推送──推送──推送──>
客户端: ←─接收←─接收←─接收←─接收←─接收──
```

**MCP 的调用模式**：
```
时间轴: ──────────────────────────────>
AI模型: ──请求────────→等待←─────请求──>
工具:   ←─────处理──响应────→处理──响应
```

### 3. 协议复杂性

**SSE 适合的场景**：
```javascript
// 简单的数据推送
eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    updateUI(data);
};
```

**MCP 需要的复杂交互**：
```javascript
// 复杂的方法调用和错误处理
class MCPClient {
    async callTool(name, args) {
        const request = {
            jsonrpc: "2.0",
            id: this.generateId(),
            method: "tools/call",
            params: { name, arguments: args }
        };
        
        const response = await this.send(request);
        
        if (response.error) {
            throw new Error(response.error.message);
        }
        
        return response.result;
    }
    
    async listTools() {
        // 获取可用工具列表
    }
    
    async getSchema(toolName) {
        // 获取工具的参数模式
    }
}
```

### 4. 生态系统集成

**MCP 的设计考虑**：

1. **跨语言支持**：需要在 Python、JavaScript、Go 等多种语言中实现
2. **进程间通信**：经常需要与独立进程通信
3. **标准化**：基于成熟的 JSON-RPC 标准
4. **可扩展性**：支持插件和扩展机制

## MCP 的实际实现方式

### 1. Stdio 传输（最常见）

```python
# MCP 服务器 (Python)
import json
import sys

class MCPServer:
    def handle_request(self, request):
        if request["method"] == "tools/call":
            return self.call_tool(request["params"])
        elif request["method"] == "tools/list":
            return self.list_tools()
    
    def run(self):
        for line in sys.stdin:
            request = json.loads(line)
            response = self.handle_request(request)
            print(json.dumps(response))
            sys.stdout.flush()
```

```javascript
// MCP 客户端 (JavaScript)
const { spawn } = require('child_process');

class MCPClient {
    constructor(command, args) {
        this.process = spawn(command, args);
        this.setupCommunication();
    }
    
    async callTool(name, args) {
        const request = {
            jsonrpc: "2.0",
            id: Date.now(),
            method: "tools/call",
            params: { name, arguments: args }
        };
        
        return new Promise((resolve, reject) => {
            this.process.stdin.write(JSON.stringify(request) + '\n');
            
            this.process.stdout.once('data', (data) => {
                const response = JSON.parse(data.toString());
                if (response.error) {
                    reject(new Error(response.error.message));
                } else {
                    resolve(response.result);
                }
            });
        });
    }
}
```

### 2. HTTP 传输

```python
# MCP HTTP 服务器
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class MCPRequest(BaseModel):
    jsonrpc: str = "2.0"
    id: int
    method: str
    params: dict

@app.post("/mcp")
async def mcp_endpoint(request: MCPRequest):
    if request.method == "tools/call":
        result = await call_tool(request.params)
        return {
            "jsonrpc": "2.0",
            "id": request.id,
            "result": result
        }
```

### 3. WebSocket 传输（用于实时场景）

```javascript
// 当需要实时交互时，MCP 使用 WebSocket
class MCPWebSocketClient {
    constructor(url) {
        this.ws = new WebSocket(url);
        this.pendingRequests = new Map();
        
        this.ws.onmessage = (event) => {
            const response = JSON.parse(event.data);
            const resolver = this.pendingRequests.get(response.id);
            if (resolver) {
                resolver(response);
                this.pendingRequests.delete(response.id);
            }
        };
    }
    
    async callTool(name, args) {
        const id = Date.now();
        const request = {
            jsonrpc: "2.0",
            id,
            method: "tools/call",
            params: { name, arguments: args }
        };
        
        return new Promise((resolve) => {
            this.pendingRequests.set(id, resolve);
            this.ws.send(JSON.stringify(request));
        });
    }
}
```

## 对比分析：SSE vs MCP 方案

| 特性 | SSE | MCP (JSON-RPC) |
|------|-----|----------------|
| **通信方向** | 单向 | 双向 |
| **协议基础** | HTTP 流 | JSON-RPC 2.0 |
| **请求-响应** | 不支持 | 原生支持 |
| **错误处理** | 基础 | 标准化错误码 |
| **方法调用** | 不支持 | 原生支持 |
| **跨语言** | 有限 | 优秀 |
| **进程通信** | 不适合 | 优秀 |
| **实时性** | 优秀 | 良好 |
| **复杂度** | 低 | 中等 |

## 实际应用场景对比

### SSE 适合的场景：
```javascript
// 实时推送：聊天、通知、监控
const eventSource = new EventSource('/api/chat/stream');
eventSource.onmessage = (event) => {
    const message = JSON.parse(event.data);
    displayMessage(message.content);
};
```

### MCP 适合的场景：
```javascript
// 工具调用：搜索、计算、数据处理
const mcpClient = new MCPClient();

// 调用搜索工具
const searchResults = await mcpClient.callTool('web_search', {
    query: 'latest AI news'
});

// 基于搜索结果调用总结工具
const summary = await mcpClient.callTool('summarize', {
    content: searchResults.content
});
```

## 结论

MCP 不使用 SSE 的核心原因：

### 1. **架构需求不匹配**
- MCP 需要双向、按需的方法调用
- SSE 提供的是单向、持续的数据推送

### 2. **协议语义不同**
- MCP 基于请求-响应模式
- SSE 基于事件推送模式

### 3. **技术要求不同**
- MCP 需要跨进程、跨语言通信
- SSE 主要面向浏览器环境

### 4. **标准化考虑**
- MCP 基于成熟的 JSON-RPC 2.0 标准
- 有完整的错误处理和扩展机制

**总结**：MCP 和 SSE 解决的是完全不同的问题。SSE 专注于实时数据推送，而 MCP 专注于结构化的工具调用和集成。选择合适的协议取决于具体的应用场景和需求。

对于 AI 聊天应用的流式响应，SSE 仍然是最佳选择；而对于 AI 模型与外部工具的集成，MCP 的 JSON-RPC 方案更加合适。