
import { useState } from 'react';
import { ChatInterface } from './components/Chat';
import { StreamingChatInterface } from './components/Chat/StreamingChatInterface';
import { StreamingChatTest } from './components/Chat/StreamingChatTest';
import { AdvancedStreamingChat } from './components/Chat/AdvancedStreamingChat';
import { ParticleLearningLab } from './components/UI/ParticleLearningLab';

function App() {
  const [chatMode, setChatMode] = useState<'normal' | 'streaming' | 'advanced' | 'test' | 'particle'>('advanced');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          {/* Logo and Title */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-3xl">🚀</span>
            </div>
            <div className="text-left">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Chat Interface
              </h1>
              <p className="text-gray-600 text-lg">
                AI-UI 最小化学习项目
              </p>
            </div>
          </div>
          
          {/* Modern Chat Mode Toggle */}
          <div className="inline-flex bg-white rounded-2xl p-2 shadow-lg border border-gray-200 flex-wrap justify-center">
            <button
              onClick={() => setChatMode('normal')}
              className={`px-3 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                chatMode === 'normal'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">💬</span>
              <span className="hidden sm:inline">普通聊天</span>
            </button>
            <button
              onClick={() => setChatMode('streaming')}
              className={`px-3 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                chatMode === 'streaming'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">⚡</span>
              <span className="hidden sm:inline">流式聊天</span>
            </button>
            <button
              onClick={() => setChatMode('advanced')}
              className={`px-3 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 relative ${
                chatMode === 'advanced'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">🚀</span>
              <span className="hidden sm:inline">高级模式</span>
              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                HOT
              </span>
            </button>
            <button
              onClick={() => setChatMode('test')}
              className={`px-3 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                chatMode === 'test'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">🔬</span>
              <span className="hidden sm:inline">流式测试</span>
            </button>
            <button
              onClick={() => setChatMode('particle')}
              className={`px-3 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 relative ${
                chatMode === 'particle'
                  ? 'bg-gradient-to-r from-green-500 to-teal-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">🌟</span>
              <span className="hidden sm:inline">粒子学习</span>
              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold animate-bounce">
                LEARN
              </span>
            </button>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto">
          {chatMode === 'test' ? (
            <StreamingChatTest />
          ) : chatMode === 'particle' ? (
            <ParticleLearningLab />
          ) : chatMode === 'advanced' ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 h-[800px] overflow-hidden">
              <AdvancedStreamingChat />
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 h-[700px] overflow-hidden">
              {chatMode === 'normal' ? (
                <ChatInterface />
              ) : (
                <StreamingChatInterface />
              )}
            </div>
          )}
          
          {/* Enhanced Feature Description */}
          {chatMode !== 'test' && chatMode !== 'advanced' && (
            <div className="mt-12 grid md:grid-cols-2 gap-8">
              <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-white/20">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl">💬</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">普通聊天模式</h3>
                </div>
                <div className="space-y-4">
                  {[
                    { icon: '⏳', text: '发送消息后等待完整响应' },
                    { icon: '🎯', text: '适合短对话和快速问答' },
                    { icon: '⚡', text: '响应时间可能较长' },
                    { icon: '🔄', text: '传统的请求-响应模式' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-gray-700">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-white/20 relative">
                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-green-400 to-emerald-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                  推荐使用
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">流式聊天模式</h3>
                </div>
                <div className="space-y-4">
                  {[
                    { icon: '🔄', text: '实时显示AI响应内容' },
                    { icon: '✨', text: '更好的用户体验' },
                    { icon: '📝', text: '适合长文本生成' },
                    { icon: '⏹️', text: '可以随时停止生成' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-gray-700">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Advanced Mode Features */}
          {chatMode === 'advanced' && (
            <div className="mt-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-3xl p-8 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" />
              <div className="relative z-10">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-4">🚀 高级模式特性</h2>
                  <p className="text-lg opacity-90">体验最先进的AI聊天界面，包含所有高级功能</p>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    {
                      icon: '🎤',
                      title: '语音输入',
                      desc: '支持语音转文字，实时音频可视化',
                      features: ['实时语音识别', '音频波形显示', '多语言支持']
                    },
                    {
                      icon: '💫',
                      title: '粒子背景',
                      desc: '动态粒子系统，营造科技感氛围',
                      features: ['动态粒子连线', '响应式动画', '性能优化']
                    },
                    {
                      icon: '🧠',
                      title: '智能交互',
                      desc: '消息反应、复制、重新生成等功能',
                      features: ['消息反应系统', '一键复制', '智能重新生成']
                    },
                    {
                      icon: '📚',
                      title: '对话管理',
                      desc: '高级侧边栏，支持搜索和分类',
                      features: ['智能搜索', '自动分类', '批量操作']
                    },
                    {
                      icon: '⚡',
                      title: '智能输入',
                      desc: '自动补全、快速提示、语音输入',
                      features: ['智能建议', '快速模板', '多模态输入']
                    },
                    {
                      icon: '🎨',
                      title: '视觉效果',
                      desc: '现代化UI设计，流畅动画效果',
                      features: ['毛玻璃效果', '渐变动画', '响应式设计']
                    }
                  ].map((feature, index) => (
                    <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                      <div className="text-4xl mb-4">{feature.icon}</div>
                      <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                      <p className="text-white/80 mb-4">{feature.desc}</p>
                      <ul className="space-y-1">
                        {feature.features.map((item, i) => (
                          <li key={i} className="text-sm text-white/70 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-white/50 rounded-full" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
