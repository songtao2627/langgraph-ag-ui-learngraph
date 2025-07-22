/**
 * Streaming chat hook
 * Manages streaming chat conversations with real-time message updates
 */

import { useState, useCallback, useRef } from 'react';
import { chatApiService } from '../services/chat';
import {MessageType} from "../types/chat"

import type { 
  ChatRequest, 
  Message, 
  Conversation, 
  StreamChunk 
} from '../types/chat';

/**
 * Streaming chat hook options
 */
interface UseStreamingChatOptions {
  onMessageStart?: (conversationId: string) => void;
  onMessageChunk?: (chunk: string, conversationId: string) => void;
  onMessageComplete?: (message: Message) => void;
  onError?: (error: string) => void;
}

/**
 * Streaming chat hook return type
 */
interface UseStreamingChatReturn {
  // State
  conversations: Conversation[];
  currentConversationId: string | null;
  isStreaming: boolean;
  error: string | null;
  
  // Current streaming message
  streamingMessage: string;
  streamingConversationId: string | null;
  
  // Actions
  sendStreamingMessage: (content: string, conversationId?: string) => Promise<void>;
  selectConversation: (conversationId: string) => void;
  createNewConversation: () => void;
  clearError: () => void;
  stopStreaming: () => void;
}

/**
 * Generate unique message ID
 */
function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Generate unique conversation ID
 */
function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Streaming chat hook
 */
export function useStreamingChat(options: UseStreamingChatOptions = {}): UseStreamingChatReturn {
  const {
    onMessageStart,
    onMessageChunk,
    onMessageComplete,
    onError
  } = options;

  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [streamingConversationId, setStreamingConversationId] = useState<string | null>(null);

  // Refs
  const streamingMessageRef = useRef('');
  const currentAiMessageIdRef = useRef<string | null>(null);

  /**
   * Add message to conversation
   */
  const addMessageToConversation = useCallback((
    conversationId: string, 
    message: Message
  ) => {
    setConversations(prev => {
      const existingConvIndex = prev.findIndex(conv => conv.id === conversationId);
      
      if (existingConvIndex >= 0) {
        // Update existing conversation
        const updatedConversations = [...prev];
        updatedConversations[existingConvIndex] = {
          ...updatedConversations[existingConvIndex],
          messages: [...updatedConversations[existingConvIndex].messages, message],
          updated_at: new Date().toISOString()
        };
        return updatedConversations;
      } else {
        // Create new conversation
        const newConversation: Conversation = {
          id: conversationId,
          messages: [message],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        return [newConversation, ...prev];
      }
    });
  }, []);

  /**
   * Update streaming message in conversation
   */
  const updateStreamingMessage = useCallback((
    conversationId: string,
    messageId: string,
    content: string
  ) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId
          ? {
              ...conv,
              messages: conv.messages.map(msg =>
                msg.id === messageId
                  ? { ...msg, content }
                  : msg
              )
            }
          : conv
      )
    );
  }, []);

  /**
   * Send streaming message
   */
  const sendStreamingMessage = useCallback(async (
    content: string,
    conversationId?: string
  ): Promise<void> => {
    if (!content.trim()) {
      setError('Message cannot be empty');
      return;
    }

    // Clear previous errors and reset streaming state
    setError(null);
    setStreamingMessage('');
    streamingMessageRef.current = '';

    // Determine conversation ID
    const targetConversationId = conversationId || currentConversationId || generateConversationId();
    
    // Create user message
    const userMessage: Message = {
      id: generateMessageId(),
      content: content.trim(),
      type: MessageType.USER,
      timestamp: new Date().toISOString(),
      conversation_id: targetConversationId,
    };

    // Add user message to conversation
    addMessageToConversation(targetConversationId, userMessage);
    
    // Set current conversation if not set
    if (!currentConversationId) {
      setCurrentConversationId(targetConversationId);
    }

    // Prepare chat request
    const chatRequest: ChatRequest = {
      message: content.trim(),
      conversation_id: targetConversationId,
    };

    // Set streaming state
    setIsStreaming(true);
    setStreamingConversationId(targetConversationId);

    // Create AI message placeholder
    const aiMessageId = generateMessageId();
    currentAiMessageIdRef.current = aiMessageId;

    const aiMessage: Message = {
      id: aiMessageId,
      content: '',
      type: MessageType.AI,
      timestamp: new Date().toISOString(),
      conversation_id: targetConversationId,
    };

    // Add empty AI message to conversation
    addMessageToConversation(targetConversationId, aiMessage);

    try {
      // Start streaming
      await chatApiService.sendStreamingMessage(chatRequest, {
        onStart: (chunk: StreamChunk) => {
          console.log('Stream started:', chunk);
          onMessageStart?.(chunk.conversation_id);
        },
        
        onChunk: (chunk: StreamChunk) => {
          // Accumulate streaming content
          streamingMessageRef.current += chunk.content;
          setStreamingMessage(streamingMessageRef.current);
          
          // Update the AI message in conversation
          updateStreamingMessage(
            targetConversationId, 
            aiMessageId, 
            streamingMessageRef.current
          );
          
          onMessageChunk?.(chunk.content, chunk.conversation_id);
        },
        
        onEnd: (chunk: StreamChunk) => {
          console.log('Stream ended:', chunk);
          
          // Finalize the AI message
          const finalMessage: Message = {
            id: aiMessageId,
            content: streamingMessageRef.current,
            type: MessageType.AI,
            timestamp: chunk.timestamp,
            conversation_id: chunk.conversation_id,
            metadata: chunk.metadata
          };
          
          onMessageComplete?.(finalMessage);
          
          // Reset streaming state
          setIsStreaming(false);
          setStreamingMessage('');
          setStreamingConversationId(null);
          streamingMessageRef.current = '';
          currentAiMessageIdRef.current = null;
        },
        
        onError: (chunk: StreamChunk) => {
          console.error('Stream error:', chunk);
          setError(chunk.content);
          onError?.(chunk.content);
          
          // Reset streaming state
          setIsStreaming(false);
          setStreamingMessage('');
          setStreamingConversationId(null);
          streamingMessageRef.current = '';
          currentAiMessageIdRef.current = null;
        }
      });
      
    } catch (error) {
      console.error('Streaming error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown streaming error';
      setError(errorMessage);
      onError?.(errorMessage);
      
      // Reset streaming state
      setIsStreaming(false);
      setStreamingMessage('');
      setStreamingConversationId(null);
      streamingMessageRef.current = '';
      currentAiMessageIdRef.current = null;
    }
  }, [
    currentConversationId,
    addMessageToConversation,
    updateStreamingMessage,
    onMessageStart,
    onMessageChunk,
    onMessageComplete,
    onError
  ]);

  /**
   * Select conversation
   */
  const selectConversation = useCallback((conversationId: string) => {
    setCurrentConversationId(conversationId);
    setError(null);
  }, []);

  /**
   * Create new conversation
   */
  const createNewConversation = useCallback(() => {
    setCurrentConversationId(null);
    setError(null);
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Stop streaming
   */
  const stopStreaming = useCallback(() => {
    setIsStreaming(false);
    setStreamingMessage('');
    setStreamingConversationId(null);
    streamingMessageRef.current = '';
    currentAiMessageIdRef.current = null;
  }, []);

  return {
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
  };
}