
import React, { useState } from 'react';
import { ChatInterface } from './components/Chat';
import { StreamingChatInterface } from './components/Chat/StreamingChatInterface';
import { StreamingChatTest } from './components/Chat/StreamingChatTest';

function App() {
  const [chatMode, setChatMode] = useState<'normal' | 'streaming' | 'test'>('streaming');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            AI Chat Interface
          </h1>
          <p className="text-gray-600 mb-4">
            AI-UI 最小化学习项目
          </p>
          
          {/* Chat Mode Toggle */}
          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={() => setChatMode('normal')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                chatMode === 'normal'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              普通聊天
            </button>
            <button
              onClick={() => setChatMode('streaming')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                chatMode === 'streaming'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              流式聊天 (推荐)
            </button>
            <button
              onClick={() => setChatMode('test')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                chatMode === 'test'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              流式测试
            </button>
          </div>
        </header>
        
        <main className="max-w-4xl mx-auto">
          {chatMode === 'test' ? (
            <StreamingChatTest />
          ) : (
            <div className="bg-white rounded-lg shadow-lg h-[600px]">
              {chatMode === 'normal' ? (
                <ChatInterface />
              ) : (
                <StreamingChatInterface />
              )}
            </div>
          )}
          
          {/* Feature Description */}
          {chatMode !== 'test' && (
            <div className="mt-8 grid md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-3 text-gray-900">普通聊天模式</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• 发送消息后等待完整响应</li>
                  <li>• 适合短对话和快速问答</li>
                  <li>• 响应时间可能较长</li>
                  <li>• 传统的请求-响应模式</li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-3 text-gray-900">流式聊天模式</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• 实时显示AI响应内容</li>
                  <li>• 更好的用户体验</li>
                  <li>• 适合长文本生成</li>
                  <li>• 可以随时停止生成</li>
                </ul>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
