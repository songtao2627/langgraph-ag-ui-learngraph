/**
 * Advanced Message Bubble Component
 * Features rich animations, reactions, and interactive elements
 */

import { useState, useRef, useEffect } from 'react';
import type { FC, ReactNode } from 'react';
import type { Message } from '../../types/chat';
import { MessageType } from '../../types/chat';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
  onReaction?: (messageId: string, reaction: string) => void;
  onCopy?: (content: string) => void;
  onRegenerate?: (messageId: string) => void;
}

const reactions = ['👍', '👎', '❤️', '😂', '😮', '😢', '😡'];

export const MessageBubble: FC<MessageBubbleProps> = ({
  message,
  isStreaming = false,
  onReaction,
  onCopy,
  onRegenerate
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [copiedText, setCopiedText] = useState('');
  const bubbleRef = useRef<HTMLDivElement>(null);

  const isUser = message.type === MessageType.USER;
  const isAI = message.type === MessageType.AI;

  // Animation on mount
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Handle copy
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedText('已复制!');
      onCopy?.(message.content);
      setTimeout(() => setCopiedText(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Handle reaction
  const handleReaction = (reaction: string) => {
    onReaction?.(message.id, reaction);
    setShowReactions(false);
    
    // Add reaction animation
    const bubble = bubbleRef.current;
    if (bubble) {
      bubble.style.transform = 'scale(1.05)';
      setTimeout(() => {
        bubble.style.transform = 'scale(1)';
      }, 200);
    }
  };

  // Render message content with syntax highlighting for code
  const renderContent = () => {
    const content = message.content;
    
    // Simple code block detection
    if (content.includes('```')) {
      const parts = content.split('```');
      return parts.map((part, index) => {
        if (index % 2 === 1) {
          // Code block
          return (
            <div key={index} className="bg-gray-900 text-green-400 p-4 rounded-lg my-2 font-mono text-sm overflow-x-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-xs">CODE</span>
                <button
                  onClick={() => navigator.clipboard.writeText(part)}
                  className="text-gray-500 hover:text-green-400 text-xs"
                >
                  复制代码
                </button>
              </div>
              <pre className="whitespace-pre-wrap">{part}</pre>
            </div>
          );
        }
        return <span key={index} className="whitespace-pre-wrap">{part}</span>;
      });
    }

    return <span className="whitespace-pre-wrap">{content}</span>;
  };

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 group ${
        isAnimating ? 'animate-slide-in' : ''
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowReactions(false);
      }}
    >
      <div className={`flex items-start gap-3 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar with status */}
        <div className="relative flex-shrink-0">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-medium shadow-lg ${
            isUser 
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
              : 'bg-gradient-to-r from-green-400 to-blue-500 text-white'
          }`}>
            {isUser ? '👤' : '🤖'}
          </div>
          
          {/* Status indicator */}
          {isStreaming && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-ping" />
            </div>
          )}
        </div>
        
        {/* Message bubble */}
        <div className="relative">
          <div
            ref={bubbleRef}
            className={`relative px-6 py-4 rounded-3xl shadow-lg transition-all duration-300 ${
              isUser
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-lg'
                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-lg shadow-xl'
            } ${isStreaming ? 'animate-pulse-slow' : ''} ${
              showActions ? 'shadow-2xl scale-105' : ''
            }`}
          >
            {/* Message content */}
            <div className="text-sm leading-relaxed">
              {renderContent()}
              {isStreaming && (
                <span className="inline-block w-0.5 h-5 ml-2 bg-current animate-pulse rounded-full" />
              )}
            </div>
            
            {/* Timestamp and metadata */}
            <div className={`flex items-center justify-between mt-3 text-xs ${
              isUser ? 'text-blue-100' : 'text-gray-500'
            }`}>
              <span>
                {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              
              {message.metadata?.model && (
                <span className={`px-2 py-1 rounded-full text-xs ${
                  isUser ? 'bg-white/20' : 'bg-gray-100'
                }`}>
                  {message.metadata.model}
                </span>
              )}
            </div>

            {/* Tail */}
            <div className={`absolute top-4 w-0 h-0 ${
              isUser 
                ? 'right-0 translate-x-full border-l-8 border-l-purple-600 border-t-8 border-t-transparent border-b-8 border-b-transparent'
                : 'left-0 -translate-x-full border-r-8 border-r-white border-t-8 border-t-transparent border-b-8 border-b-transparent'
            }`} />
          </div>

          {/* Action buttons */}
          {showActions && (
            <div className={`absolute top-0 flex items-center gap-2 transition-all duration-200 ${
              isUser ? 'right-full mr-3' : 'left-full ml-3'
            }`}>
              <button
                onClick={handleCopy}
                className="w-8 h-8 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
                title="复制消息"
              >
                {copiedText ? '✓' : '📋'}
              </button>
              
              {isAI && (
                <>
                  <button
                    onClick={() => setShowReactions(!showReactions)}
                    className="w-8 h-8 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
                    title="添加反应"
                  >
                    😊
                  </button>
                  
                  <button
                    onClick={() => onRegenerate?.(message.id)}
                    className="w-8 h-8 bg-white shadow-lg rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
                    title="重新生成"
                  >
                    🔄
                  </button>
                </>
              )}
            </div>
          )}

          {/* Reactions panel */}
          {showReactions && (
            <div className={`absolute top-12 bg-white rounded-2xl shadow-2xl p-3 border border-gray-200 z-10 ${
              isUser ? 'right-0' : 'left-0'
            }`}>
              <div className="flex gap-2">
                {reactions.map(reaction => (
                  <button
                    key={reaction}
                    onClick={() => handleReaction(reaction)}
                    className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-lg transition-all duration-200 hover:scale-125"
                  >
                    {reaction}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Copy feedback */}
          {copiedText && (
            <div className={`absolute -top-8 bg-black text-white px-3 py-1 rounded-lg text-xs ${
              isUser ? 'right-0' : 'left-0'
            }`}>
              {copiedText}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};