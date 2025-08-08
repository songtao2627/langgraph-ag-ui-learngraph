import React, { useState, useCallback } from 'react';
import { type Message, MessageType, type ChatState } from '../../types/chat';
import { MessageList, MessageInput } from './index';

interface ChatInterfaceProps {
  className?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ className = '' }) => {
  // Chat state management
  const [chatState, setChatState] = useState<ChatState>({
    conversations: [],
    currentConversationId: null,
    isLoading: false,
    error: null
  });

  // Current conversation messages
  const currentMessages = chatState.conversations
    .find(conv => conv.id === chatState.currentConversationId)?.messages || [];

  // Generate unique ID for messages
  const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Generate conversation ID
  const generateConversationId = () => `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Handle sending a new message
  const handleSendMessage = useCallback(async (messageContent: string) => {
    try {
      // Clear any previous errors
      setChatState(prev => ({ ...prev, error: null, isLoading: true }));

      // Create user message
      const userMessage: Message = {
        id: generateId(),
        content: messageContent,
        type: MessageType.USER,
        timestamp: new Date().toISOString(),
        conversation_id: chatState.currentConversationId || generateConversationId(),
        metadata: {}
      };

      // If no current conversation, create one
      let conversationId = chatState.currentConversationId;
      if (!conversationId) {
        conversationId = userMessage.conversation_id;
        setChatState(prev => ({
          ...prev,
          currentConversationId: conversationId!,
          conversations: [{
            id: conversationId!,
            messages: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            metadata: {}
          }]
        }));
      }

      // Add user message to conversation
      setChatState(prev => ({
        ...prev,
        conversations: prev.conversations.map(conv =>
          conv.id === conversationId
            ? {
                ...conv,
                messages: [...conv.messages, userMessage],
                updated_at: new Date().toISOString()
              }
            : conv
        )
      }));

      // Call the backend API
      const apiResponse = await fetch('http://localhost:8000/api/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageContent,
          conversation_id: conversationId,
        }),
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({ detail: '无法解析错误响应' }));
        throw new Error(errorData.detail || `AI服务返回错误: ${apiResponse.statusText}`);
      }

      const responseData = await apiResponse.json();

      const aiMessage: Message = {
        id: generateId(),
        content: responseData.response,
        type: MessageType.AI,
        timestamp: responseData.timestamp,
        conversation_id: responseData.conversation_id,
        metadata: responseData.metadata || {},
      };

      setChatState(prev => ({
        ...prev,
        isLoading: false,
        conversations: prev.conversations.map(conv =>
          conv.id === responseData.conversation_id
            ? {
                ...conv,
                messages: [...conv.messages, aiMessage],
                updated_at: new Date().toISOString(),
              }
            : conv
        ),
      }));

    } catch (error) {
      console.error('Error sending message:', error);
      setChatState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : '发送消息时出现错误'
      }));
    }
  }, [chatState.currentConversationId]);

  // Handle starting a new conversation
  const handleNewConversation = useCallback(() => {
    setChatState(prev => ({
      ...prev,
      currentConversationId: null,
      error: null
    }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setChatState(prev => ({ ...prev, error: null }));
  }, []);

  return (
    <div className={`flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gray-50 border-b px-4 py-3 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">AI 对话</h2>
          <p className="text-sm text-gray-600">
            {currentMessages.length > 0 
              ? `${currentMessages.length} 条消息` 
              : '开始新对话'
            }
          </p>
        </div>
        
        {/* New conversation button */}
        {currentMessages.length > 0 && (
          <button
            onClick={handleNewConversation}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            新对话
          </button>
        )}
      </div>

      {/* Error display */}
      {chatState.error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 mt-4 rounded">
          <div className="flex justify-between items-start">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{chatState.error}</p>
              </div>
            </div>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-600"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Message list */}
      <div className="flex-1 min-h-0">
        <MessageList 
          messages={currentMessages} 
          isLoading={chatState.isLoading}
        />
      </div>

      {/* Message input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={chatState.isLoading}
        placeholder="输入消息与AI对话..."
      />
    </div>
  );
};

export default ChatInterface;