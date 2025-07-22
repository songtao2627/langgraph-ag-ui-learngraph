/**
 * Streaming Chat Test Component
 * Simple test component to verify streaming functionality
 */

import React, { useState } from 'react';
import type { FC } from 'react';
import { chatApiService } from '../../services/chat';
import type { ChatRequest, StreamChunk } from '../../types/chat';

export const StreamingChatTest: FC = () => {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (log: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${log}`]);
  };

  const handleTest = async () => {
    if (!message.trim()) return;

    setIsStreaming(true);
    setResponse('');
    setError(null);
    setLogs([]);

    const request: ChatRequest = {
      message: message.trim(),
      conversation_id: `test_${Date.now()}`
    };

    addLog('开始流式请求');

    try {
      await chatApiService.sendStreamingMessage(request, {
        onStart: (chunk: StreamChunk) => {
          addLog(`流开始: ${JSON.stringify(chunk)}`);
        },
        onChunk: (chunk: StreamChunk) => {
          addLog(`接收数据块: "${chunk.content}"`);
          setResponse(prev => prev + chunk.content);
        },
        onEnd: (chunk: StreamChunk) => {
          addLog(`流结束: ${JSON.stringify(chunk)}`);
          setIsStreaming(false);
        },
        onError: (chunk: StreamChunk) => {
          addLog(`流错误: ${chunk.content}`);
          setError(chunk.content);
          setIsStreaming(false);
        }
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '未知错误';
      addLog(`请求异常: ${errorMsg}`);
      setError(errorMsg);
      setIsStreaming(false);
    }
  };

  const handleClear = () => {
    setMessage('');
    setResponse('');
    setError(null);
    setLogs([]);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">流式聊天测试</h2>
      
      {/* Input Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">测试消息:</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="输入测试消息..."
            className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isStreaming}
          />
          <button
            onClick={handleTest}
            disabled={!message.trim() || isStreaming}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
          >
            {isStreaming ? '流式中...' : '发送'}
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            清空
          </button>
        </div>
      </div>

      {/* Status */}
      <div className="mb-4">
        <div className={`inline-block px-3 py-1 rounded text-sm ${
          isStreaming 
            ? 'bg-blue-100 text-blue-800' 
            : error 
            ? 'bg-red-100 text-red-800'
            : 'bg-green-100 text-green-800'
        }`}>
          {isStreaming ? '正在流式传输...' : error ? '错误' : '就绪'}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
          <h3 className="font-medium text-red-800 mb-2">错误信息:</h3>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Response Display */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-medium mb-2">AI 响应:</h3>
          <div className="p-4 bg-gray-50 border rounded min-h-[200px] whitespace-pre-wrap">
            {response}
            {isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-gray-600 animate-pulse">|</span>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2">调试日志:</h3>
          <div className="p-4 bg-gray-900 text-green-400 rounded min-h-[200px] text-sm font-mono overflow-y-auto max-h-[400px]">
            {logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))}
            {logs.length === 0 && (
              <div className="text-gray-500">等待日志...</div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Test Buttons */}
      <div className="mt-6">
        <h3 className="font-medium mb-2">快速测试:</h3>
        <div className="flex flex-wrap gap-2">
          {[
            '你好',
            '请介绍一下你自己',
            '写一个简单的Python函数',
            '解释什么是机器学习',
            '生成一个长文本测试流式响应的效果'
          ].map((testMsg) => (
            <button
              key={testMsg}
              onClick={() => setMessage(testMsg)}
              disabled={isStreaming}
              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              {testMsg}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};