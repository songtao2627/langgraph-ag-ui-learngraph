/**
 * Advanced Streaming Chat Interface
 * The ultimate chat experience with all premium features
 */

import { useState, useRef, useEffect } from 'react';
import type { FC } from 'react';
import { useStreamingChat } from '../../hooks/useChatStream';
import type { Message } from '../../types/chat';
import { MessageType } from '../../types/chat';

// Import our advanced components
import { ParticleBackground } from '../UI/ParticleBackground';
import { TypingIndicator } from '../UI/TypingIndicator';
import { MessageBubble } from '../UI/MessageBubble';
import { SmartInput } from '../UI/SmartInput';
import { ConversationSidebar } from '../UI/ConversationSidebar';

interface AdvancedStreamingChatProps {
  className?: string;
}

export const AdvancedStreamingChat: FC<AdvancedStreamingChatProps> = ({
  className = ''
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('light');
  const [reactions, setReactions] = useState<{ [messageId: string]: string[] }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const {
    conversations,
    currentConversationId,
    isStreaming,
    error,
    streamingMessage,
    streamingConversationId,
    sendStreamingMessage,
    selectConversation,
    createNewConversation,
    clearError,
    stopStreaming,
  } = useStreamingChat({
    onMessageStart: (conversationId) => {
      console.log('🚀 Message streaming started:', conversationId);
      scrollToBottom();
    },
    onMessageChunk: (chunk) => {
      scrollToBottom();
    },
    onMessageComplete: (message) => {
      console.log('✅ Message completed:', message);
    },
    onError: (error) => {
      console.error('❌ Streaming error:', error);
    }
  });

  // Get current conversation
  const currentConversation = conversations.find(
    conv => conv.id === currentConversationId
  );

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages, streamingMessage]);

  // Handle form submission
  const handleSubmit = async () => {
    if (!inputMessage.trim() || isStreaming) {
      return;
    }

    const message = inputMessage.trim();
    setInputMessage('');

    await sendStreamingMessage(message);
  };

  // Handle message reactions
  const handleReaction = (messageId: string, reaction: string) => {
    setReactions(prev => ({
      ...prev,
      [messageId]: [...(prev[messageId] || []), reaction]
    }));
  };

  // Handle message copy
  const handleCopy = (content: string) => {
    // Show toast notification
    console.log('📋 Copied to clipboard:', content);
  };

  // Handle message regeneration
  const handleRegenerate = async (messageId: string) => {
    if (!currentConversation) return;
    
    // Find the user message before this AI message
    const messageIndex = currentConversation.messages.findIndex(msg => msg.id === messageId);
    if (messageIndex > 0) {
      const userMessage = currentConversation.messages[messageIndex - 1];
      if (userMessage.type === MessageType.USER) {
        await sendStreamingMessage(userMessage.content);
      }
    }
  };

  // Suggested prompts for empty state
  const suggestedPrompts = [
    '帮我写一个Python函数',
    '解释一下机器学习的基本概念',
    '翻译这段文字',
    '总结一下今天的新闻',
    '写一首关于春天的诗',
    '帮我分析这个问题'
  ];

  return (
    <div className={`flex h-full bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden ${className}`}>
      {/* Particle Background */}
      <ParticleBackground className="opacity-30" />
      
      {/* Sidebar */}
      {showSidebar && (
        <ConversationSidebar
          conversations={conversations}
          currentConversationId={currentConversationId}
          onSelectConversation={selectConversation}
          onNewConversation={createNewConversation}
          onDeleteConversation={(id) => {
            // TODO: Implement delete functionality
            console.log('Delete conversation:', id);
          }}
          onRenameConversation={(id, title) => {
            // TODO: Implement rename functionality
            console.log('Rename conversation:', id, title);
          }}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-white/80 backdrop-blur-sm border-b border-gray-200/50 relative z-10">
          <div className="flex items-center gap-4">
            {!showSidebar && (
              <button
                onClick={() => setShowSidebar(true)}
                className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 flex items-center justify-center"
              >
                <span className="text-lg">📋</span>
              </button>
            )}
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white text-2xl">🤖</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  AI 智能助手
                </h1>
                <p className="text-sm text-gray-500">
                  {currentConversationId ? `对话 ${currentConversationId.slice(0, 8)}...` : '准备开始新对话'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Status indicator with advanced styling */}
            <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl font-medium transition-all duration-300 ${
              isStreaming 
                ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-700 border border-blue-300/50 shadow-lg' 
                : error
                ? 'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-700 border border-red-300/50'
                : 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-700 border border-green-300/50'
            }`}>
              <div className={`w-3 h-3 rounded-full ${
                isStreaming ? 'bg-blue-500 animate-pulse' : error ? 'bg-red-500' : 'bg-green-500'
              }`} />
              <span className="text-sm">
                {isStreaming ? '🧠 AI 正在思考...' : error ? '⚠️ 连接异常' : '✨ 就绪'}
              </span>
            </div>
            
            {/* Control buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="w-10 h-10 bg-white/80 hover:bg-white border border-gray-200 rounded-xl transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md"
                title={showSidebar ? '隐藏侧边栏' : '显示侧边栏'}
              >
                <span className="text-lg">{showSidebar ? '◀' : '▶'}</span>
              </button>
              
              <button
                onClick={createNewConversation}
                disabled={isStreaming}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <span className="text-lg">✨</span>
                <span className="font-medium">新对话</span>
              </button>
              
              {isStreaming && (
                <button
                  onClick={stopStreaming}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl hover:from-red-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <span className="text-lg">⏹️</span>
                  <span className="font-medium">停止</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl shadow-sm relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-lg">⚠️</span>
                </div>
                <div>
                  <p className="font-bold text-red-800">连接出现问题</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
              <button
                onClick={clearError}
                className="w-8 h-8 bg-red-100 hover:bg-red-200 rounded-full flex items-center justify-center text-red-600 hover:text-red-700 transition-colors duration-200"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin relative"
        >
          {currentConversation?.messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onReaction={handleReaction}
              onCopy={handleCopy}
              onRegenerate={handleRegenerate}
            />
          ))}

          {/* Streaming message */}
          {isStreaming && streamingConversationId === currentConversationId && streamingMessage && (
            <MessageBubble
              message={{
                id: 'streaming',
                content: streamingMessage,
                type: MessageType.AI,
                timestamp: new Date().toISOString(),
                conversation_id: streamingConversationId
              }}
              isStreaming={true}
            />
          )}

          {/* Typing indicator */}
          {isStreaming && streamingConversationId === currentConversationId && !streamingMessage && (
            <div className="flex justify-start mb-6">
              <TypingIndicator isVisible={true} variant="brain" />
            </div>
          )}

          {/* Beautiful empty state */}
          {!currentConversation && !isStreaming && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-2xl">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
                  <span className="text-4xl">🚀</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">开始精彩对话</h2>
                <p className="text-gray-600 mb-8 text-lg">与AI智能助手开始一段有趣的对话，探索无限可能！</p>
                
                {/* Suggested prompts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {suggestedPrompts.slice(0, 4).map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => setInputMessage(prompt)}
                      className="p-4 bg-white/80 hover:bg-white border border-gray-200 hover:border-gray-300 rounded-2xl transition-all duration-200 text-left shadow-sm hover:shadow-lg group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                          <span className="text-white text-lg">💡</span>
                        </div>
                        <span className="text-gray-700 font-medium">{prompt}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Features showcase */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl">
                    <span className="text-2xl">⚡</span>
                    <div>
                      <div className="font-medium text-blue-800">实时流式回复</div>
                      <div className="text-blue-600">即时看到AI思考过程</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-2xl">
                    <span className="text-2xl">🎤</span>
                    <div>
                      <div className="font-medium text-purple-800">语音输入</div>
                      <div className="text-purple-600">支持语音转文字</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl">
                    <span className="text-2xl">💾</span>
                    <div>
                      <div className="font-medium text-green-800">智能记忆</div>
                      <div className="text-green-600">自动保存对话历史</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Smart Input Area */}
        <div className="p-6 bg-white/80 backdrop-blur-sm border-t border-gray-200/50 relative z-10">
          <SmartInput
            value={inputMessage}
            onChange={setInputMessage}
            onSubmit={handleSubmit}
            disabled={isStreaming}
            suggestions={suggestedPrompts}
            placeholder={isStreaming ? 'AI 正在思考中...' : '输入你的消息，开始对话...'}
          />
        </div>
      </div>
    </div>
  );
};