/**
 * Streaming Chat Test Component
 * Beautiful developer-focused streaming test interface
 */

import { useState, useRef, useEffect } from 'react';
import type { FC } from 'react';
import { chatApiService } from '../../services/chat';
import type { ChatRequest, StreamChunk } from '../../types/chat';

export const StreamingChatTest: FC = () => {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [stats, setStats] = useState({
    startTime: 0,
    endTime: 0,
    chunkCount: 0,
    totalChars: 0
  });
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = (log: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString('zh-CN', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3
    });
    setLogs(prev => [...prev, `[${timestamp}] [${type.toUpperCase()}] ${log}`]);
  };

  // Auto scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleTest = async () => {
    if (!message.trim()) return;

    // Reset state
    setIsStreaming(true);
    setResponse('');
    setError(null);
    setLogs([]);
    setStats({
      startTime: Date.now(),
      endTime: 0,
      chunkCount: 0,
      totalChars: 0
    });

    const request: ChatRequest = {
      message: message.trim(),
      conversation_id: `test_${Date.now()}`
    };

    addLog(`🚀 开始流式请求: ${message.trim()}`, 'info');
    addLog(`📋 请求参数: ${JSON.stringify(request, null, 2)}`, 'info');

    try {
      await chatApiService.sendStreamingMessage(request, {
        onStart: (chunk: StreamChunk) => {
          addLog(`✅ 流连接建立成功`, 'success');
          addLog(`📊 初始数据: ${JSON.stringify(chunk, null, 2)}`, 'info');
          setStats(prev => ({ ...prev, startTime: Date.now() }));
        },
        onChunk: (chunk: StreamChunk) => {
          setStats(prev => ({
            ...prev,
            chunkCount: prev.chunkCount + 1,
            totalChars: prev.totalChars + chunk.content.length
          }));
          addLog(`📦 数据块 #${stats.chunkCount + 1}: "${chunk.content}" (${chunk.content.length} 字符)`, 'info');
          setResponse(prev => prev + chunk.content);
        },
        onEnd: (chunk: StreamChunk) => {
          const endTime = Date.now();
          const duration = endTime - stats.startTime;
          setStats(prev => ({ ...prev, endTime }));
          addLog(`🏁 流传输完成`, 'success');
          addLog(`📈 统计信息: 耗时 ${duration}ms, 共 ${stats.chunkCount} 个数据块, ${stats.totalChars} 个字符`, 'success');
          addLog(`📋 最终数据: ${JSON.stringify(chunk, null, 2)}`, 'info');
          setIsStreaming(false);
        },
        onError: (chunk: StreamChunk) => {
          addLog(`❌ 流传输错误: ${chunk.content}`, 'error');
          addLog(`🔍 错误详情: ${JSON.stringify(chunk, null, 2)}`, 'error');
          setError(chunk.content);
          setIsStreaming(false);
        }
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '未知错误';
      addLog(`💥 请求异常: ${errorMsg}`, 'error');
      if (err instanceof Error && err.stack) {
        addLog(`📚 错误堆栈: ${err.stack}`, 'error');
      }
      setError(errorMsg);
      setIsStreaming(false);
    }
  };

  const handleClear = () => {
    setMessage('');
    setResponse('');
    setError(null);
    setLogs([]);
    setStats({
      startTime: 0,
      endTime: 0,
      chunkCount: 0,
      totalChars: 0
    });
  };

  const getLogColor = (log: string) => {
    if (log.includes('[SUCCESS]')) return 'text-green-400';
    if (log.includes('[ERROR]')) return 'text-red-400';
    if (log.includes('[WARNING]')) return 'text-yellow-400';
    return 'text-blue-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-2xl">🔬</span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              流式聊天测试台
            </h1>
          </div>
          <p className="text-gray-300 text-lg">开发者专用 - 流式传输调试与性能监控</p>
        </div>
        
        {/* Control Panel */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">⚡</span>
            <h2 className="text-xl font-bold text-white">控制面板</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">测试消息:</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="输入测试消息..."
                  className="flex-1 p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
                  disabled={isStreaming}
                  onKeyDown={(e) => e.key === 'Enter' && !isStreaming && message.trim() && handleTest()}
                />
                <button
                  onClick={handleTest}
                  disabled={!message.trim() || isStreaming}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 font-medium"
                >
                  {isStreaming ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>测试中...</span>
                    </>
                  ) : (
                    <>
                      <span>🚀</span>
                      <span>开始测试</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleClear}
                  className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 font-medium"
                >
                  <span>🗑️</span>
                  <span>清空</span>
                </button>
              </div>
            </div>
            
            {/* Stats Display */}
            {(stats.chunkCount > 0 || isStreaming) && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-500/20 rounded-xl p-3 border border-blue-500/30">
                  <div className="text-blue-400 text-sm font-medium">数据块数量</div>
                  <div className="text-white text-xl font-bold">{stats.chunkCount}</div>
                </div>
                <div className="bg-green-500/20 rounded-xl p-3 border border-green-500/30">
                  <div className="text-green-400 text-sm font-medium">字符总数</div>
                  <div className="text-white text-xl font-bold">{stats.totalChars}</div>
                </div>
                <div className="bg-purple-500/20 rounded-xl p-3 border border-purple-500/30">
                  <div className="text-purple-400 text-sm font-medium">传输时间</div>
                  <div className="text-white text-xl font-bold">
                    {stats.endTime ? `${stats.endTime - stats.startTime}ms` : isStreaming ? `${Date.now() - stats.startTime}ms` : '0ms'}
                  </div>
                </div>
                <div className="bg-yellow-500/20 rounded-xl p-3 border border-yellow-500/30">
                  <div className="text-yellow-400 text-sm font-medium">平均速度</div>
                  <div className="text-white text-xl font-bold">
                    {stats.endTime && stats.totalChars ? 
                      `${Math.round(stats.totalChars / ((stats.endTime - stats.startTime) / 1000))} 字符/秒` : 
                      '计算中...'
                    }
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status Indicator */}
        <div className="mb-6">
          <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-xl font-medium ${
            isStreaming 
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
              : error 
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'bg-green-500/20 text-green-400 border border-green-500/30'
          }`}>
            <div className={`w-3 h-3 rounded-full ${
              isStreaming ? 'bg-blue-500 animate-pulse' : error ? 'bg-red-500' : 'bg-green-500'
            }`}></div>
            <span>
              {isStreaming ? '🔄 正在流式传输...' : error ? '❌ 传输错误' : '✅ 系统就绪'}
            </span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">⚠️</span>
              <h3 className="font-bold text-red-400">错误信息</h3>
            </div>
            <p className="text-red-300 font-mono text-sm bg-red-500/10 p-3 rounded-lg">{error}</p>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* AI Response Panel */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🤖</span>
              <h3 className="text-xl font-bold text-white">AI 响应内容</h3>
              <div className="ml-auto text-sm text-gray-400">
                {response.length} 字符
              </div>
            </div>
            <div className="bg-black/30 rounded-xl p-4 min-h-[300px] max-h-[500px] overflow-y-auto border border-white/10">
              <div className="text-gray-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                {response || (
                  <div className="text-gray-500 italic text-center py-8">
                    等待 AI 响应...
                  </div>
                )}
                {isStreaming && (
                  <span className="inline-block w-2 h-5 ml-1 bg-blue-500 animate-pulse rounded-sm"></span>
                )}
              </div>
            </div>
          </div>

          {/* Debug Logs Panel */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">📊</span>
              <h3 className="text-xl font-bold text-white">调试日志</h3>
              <div className="ml-auto text-sm text-gray-400">
                {logs.length} 条记录
              </div>
            </div>
            <div className="bg-black/50 rounded-xl p-4 min-h-[300px] max-h-[500px] overflow-y-auto border border-white/10">
              <div className="text-sm font-mono space-y-1">
                {logs.map((log, index) => (
                  <div key={index} className={`${getLogColor(log)} leading-relaxed`}>
                    {log}
                  </div>
                ))}
                {logs.length === 0 && (
                  <div className="text-gray-500 italic text-center py-8">
                    等待调试日志...
                  </div>
                )}
                <div ref={logsEndRef} />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Test Buttons */}
        <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">⚡</span>
            <h3 className="text-xl font-bold text-white">快速测试</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { text: '你好', icon: '👋', desc: '简单问候' },
              { text: '请介绍一下你自己', icon: '🤖', desc: '自我介绍' },
              { text: '写一个简单的Python函数', icon: '🐍', desc: '代码生成' },
              { text: '解释什么是机器学习', icon: '🧠', desc: '概念解释' },
              { text: '生成一个长文本测试流式响应的效果', icon: '📝', desc: '长文本测试' },
              { text: '请用中文回答：什么是人工智能？', icon: '🤔', desc: '中文问答' }
            ].map((test) => (
              <button
                key={test.text}
                onClick={() => setMessage(test.text)}
                disabled={isStreaming}
                className="p-4 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-xl transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl group-hover:scale-110 transition-transform duration-200">
                    {test.icon}
                  </span>
                  <div className="text-sm text-gray-400">{test.desc}</div>
                </div>
                <div className="text-white text-sm font-medium line-clamp-2">
                  {test.text}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};