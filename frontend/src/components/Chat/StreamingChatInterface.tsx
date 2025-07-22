/**
 * Streaming Chat Interface Component
 * Demonstrates how to use the streaming chat hook
 */

import React, { useState, useRef, useEffect } from 'react';
import type { FC } from 'react';
import { useStreamingChat } from '../../hooks/useChatStream';
import type { Message } from '../../types/chat';
import { MessageType } from '../../types/chat';


interface StreamingChatInterfaceProps {
  className?: string;
}

export const StreamingChatInterface: FC<StreamingChatInterfaceProps> = ({ 
  className = '' 
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      console.log('Message streaming started for conversation:', conversationId);
    },
    onMessageChunk: (chunk, conversationId) => {
      console.log('Received chunk:', chunk);
      // Auto-scroll to bottom when receiving chunks
      scrollToBottom();
    },
    onMessageComplete: (message) => {
      console.log('Message completed:', message);
    },
    onError: (error) => {
      console.error('Streaming error:', error);
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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isStreaming) {
      return;
    }

    const message = inputMessage.trim();
    setInputMessage('');
    
    await sendStreamingMessage(message);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  // Render message
  const renderMessage = (message: Message, isStreaming = false) => {
    const isUser = message.type === MessageType.USER;
    
    return (
      <div
        key={message.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div
          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
            isUser
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-800'
          } ${isStreaming ? 'animate-pulse' : ''}`}
        >
          <div className="text-sm">
            {message.content}
            {isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse">
                |
              </span>
            )}
          </div>
          <div className="text-xs opacity-70 mt-1">
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">
          AI Chat {currentConversationId ? `- ${currentConversationId.slice(0, 8)}...` : ''}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={createNewConversation}
            className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
            disabled={isStreaming}
          >
            New Chat
          </button>
          {isStreaming && (
            <button
              onClick={stopStreaming}
              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
            >
              Stop
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {currentConversation?.messages.map((message) => 
          renderMessage(message)
        )}
        
        {/* Show streaming message if it's for current conversation */}
        {isStreaming && streamingConversationId === currentConversationId && streamingMessage && (
          <div className="flex justify-start mb-4">
            <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gray-200 text-gray-800 animate-pulse">
              <div className="text-sm">
                {streamingMessage}
                <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse">
                  |
                </span>
              </div>
              <div className="text-xs opacity-70 mt-1">
                Streaming...
              </div>
            </div>
          </div>
        )}
        
        {/* Empty state */}
        {!currentConversation && !isStreaming && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-lg mb-2">Welcome to AI Chat!</p>
              <p className="text-sm">Send a message to start a conversation</p>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <textarea
            value={inputMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={isStreaming ? "AI is responding..." : "Type your message..."}
            disabled={isStreaming}
            className="flex-1 p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            rows={1}
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isStreaming}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isStreaming ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Sending...</span>
              </div>
            ) : (
              'Send'
            )}
          </button>
        </div>
        
        {/* Status indicator */}
        <div className="mt-2 text-xs text-gray-500">
          {isStreaming ? (
            <span className="text-blue-500">● AI is responding...</span>
          ) : (
            <span>Press Enter to send, Shift+Enter for new line</span>
          )}
        </div>
      </form>

      {/* Conversation List (Simple) */}
      {conversations.length > 0 && (
        <div className="border-t p-4">
          <h3 className="text-sm font-medium mb-2">Recent Conversations</h3>
          <div className="flex gap-2 overflow-x-auto">
            {conversations.slice(0, 5).map((conv) => (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv.id)}
                className={`px-3 py-1 text-xs rounded whitespace-nowrap ${
                  conv.id === currentConversationId
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                disabled={isStreaming}
              >
                {conv.id.slice(0, 8)}... ({conv.messages.length})
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};