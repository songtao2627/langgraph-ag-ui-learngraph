/**
 * Chat state management hook
 * Manages chat conversations, messages, and API interactions
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { chatApiService } from '../services/chat';
import { useApi } from './useAPI';
import type { 
  ChatState, 
  Message, 
  Conversation, 
  ChatRequest
} from '../types/chat';
import { MessageType } from '../types/chat';

/**
 * Chat hook options
 */
export interface UseChatOptions {
  autoLoadConversations?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  onMessageSent?: (message: Message) => void;
  onMessageReceived?: (message: Message) => void;
  onError?: (error: string) => void;
}

/**
 * Chat hook return type
 */
export interface UseChatReturn {
  // State
  state: ChatState;
  currentConversation: Conversation | null;
  
  // Actions
  sendMessage: (content: string, conversationId?: string) => Promise<boolean>;
  loadConversations: () => Promise<void>;
  loadConversationHistory: (conversationId: string) => Promise<void>;
  selectConversation: (conversationId: string) => void;
  createNewConversation: () => void;
  clearConversation: (conversationId: string) => Promise<boolean>;
  
  // Utilities
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  retry: () => Promise<void>;
}

/**
 * Generate unique message ID
 */
function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate unique conversation ID
 */
function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Main chat hook
 */
export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const {
    autoLoadConversations = true,
    maxRetries = 3,
    retryDelay = 1000,
    onMessageSent,
    onMessageReceived,
    onError
  } = options;

  // Chat state
  const [state, setState] = useState<ChatState>({
    conversations: [],
    currentConversationId: null,
    isLoading: false,
    error: null,
  });

  // API hooks
  const sendMessageApi = useApi(chatApiService.sendMessage, {
    retryCount: maxRetries,
    retryDelay,
    onError: (error) => {
      setState(prev => ({ ...prev, error: error.message }));
      onError?.(error.message);
    }
  });

  const loadConversationsApi = useApi(chatApiService.getConversations, {
    retryCount: maxRetries,
    retryDelay,
    onError: (error) => {
      setState(prev => ({ ...prev, error: error.message }));
      onError?.(error.message);
    }
  });

  const loadHistoryApi = useApi(chatApiService.getConversationHistory, {
    retryCount: maxRetries,
    retryDelay,
    onError: (error) => {
      setState(prev => ({ ...prev, error: error.message }));
      onError?.(error.message);
    }
  });

  const clearConversationApi = useApi(chatApiService.clearConversation, {
    retryCount: maxRetries,
    retryDelay,
    onError: (error) => {
      setState(prev => ({ ...prev, error: error.message }));
      onError?.(error.message);
    }
  });

  // Refs for tracking pending operations
  const pendingMessageRef = useRef<Message | null>(null);
  const lastActionRef = useRef<(() => Promise<void>) | null>(null);

  /**
   * Get current conversation
   */
  const currentConversation = state.conversations.find(
    conv => conv.id === state.currentConversationId
  ) || null;

  /**
   * Add message to conversation
   */
  const addMessageToConversation = useCallback((
    conversationId: string, 
    message: Message
  ) => {
    setState(prev => ({
      ...prev,
      conversations: prev.conversations.map(conv => 
        conv.id === conversationId
          ? {
              ...conv,
              messages: [...conv.messages, message],
              updated_at: new Date().toISOString()
            }
          : conv
      )
    }));
  }, []);

  /**
   * Create or update conversation
   */
  const upsertConversation = useCallback((conversation: Conversation) => {
    setState(prev => {
      const existingIndex = prev.conversations.findIndex(
        conv => conv.id === conversation.id
      );

      if (existingIndex >= 0) {
        // Update existing conversation
        const updatedConversations = [...prev.conversations];
        updatedConversations[existingIndex] = conversation;
        return {
          ...prev,
          conversations: updatedConversations
        };
      } else {
        // Add new conversation
        return {
          ...prev,
          conversations: [conversation, ...prev.conversations]
        };
      }
    });
  }, []);

  /**
   * Send message
   */
  const sendMessage = useCallback(async (
    content: string, 
    conversationId?: string
  ): Promise<boolean> => {
    if (!content.trim()) {
      setState(prev => ({ ...prev, error: 'Message cannot be empty' }));
      return false;
    }

    // Clear previous errors
    setState(prev => ({ ...prev, error: null }));

    // Use provided conversation ID or current one
    const targetConversationId = conversationId || state.currentConversationId;

    // Create user message
    const userMessage: Message = {
      id: generateMessageId(),
      content: content.trim(),
      type: MessageType.USER,
      timestamp: new Date().toISOString(),
      conversation_id: targetConversationId || generateConversationId(),
    };

    // Store pending message
    pendingMessageRef.current = userMessage;

    // If no conversation exists, create one
    if (!targetConversationId) {
      const newConversation: Conversation = {
        id: userMessage.conversation_id,
        messages: [userMessage],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      upsertConversation(newConversation);
      setState(prev => ({ 
        ...prev, 
        currentConversationId: newConversation.id 
      }));
    } else {
      // Add to existing conversation
      addMessageToConversation(targetConversationId, userMessage);
    }

    // Trigger callback
    onMessageSent?.(userMessage);

    // Prepare chat request
    const chatRequest: ChatRequest = {
      message: content.trim(),
      conversation_id: userMessage.conversation_id,
    };

    // Send to API
    const response = await sendMessageApi.execute(chatRequest);

    if (response) {
      // Create AI message
      const aiMessage: Message = {
        id: generateMessageId(),
        content: response.response,
        type: MessageType.AI,
        timestamp: response.timestamp,
        conversation_id: response.conversation_id,
        metadata: {
          processing_time: response.processing_time
        }
      };

      // Add AI response to conversation
      addMessageToConversation(response.conversation_id, aiMessage);

      // Trigger callback
      onMessageReceived?.(aiMessage);

      // Clear pending message
      pendingMessageRef.current = null;

      return true;
    }

    return false;
  }, [
    state.currentConversationId, 
    sendMessageApi, 
    addMessageToConversation, 
    upsertConversation,
    onMessageSent,
    onMessageReceived
  ]);

  /**
   * Load conversations list
   */
  const loadConversations = useCallback(async () => {
    lastActionRef.current = loadConversations;
    
    const conversations = await loadConversationsApi.execute();
    
    if (conversations) {
      setState(prev => ({
        ...prev,
        conversations: conversations,
        error: null
      }));
    }
  }, [loadConversationsApi]);

  /**
   * Load conversation history
   */
  const loadConversationHistory = useCallback(async (conversationId: string) => {
    lastActionRef.current = () => loadConversationHistory(conversationId);
    
    const messages = await loadHistoryApi.execute(conversationId);
    
    if (messages) {
      setState(prev => ({
        ...prev,
        conversations: prev.conversations.map(conv =>
          conv.id === conversationId
            ? { ...conv, messages }
            : conv
        ),
        error: null
      }));
    }
  }, [loadHistoryApi]);

  /**
   * Select conversation
   */
  const selectConversation = useCallback((conversationId: string) => {
    setState(prev => ({
      ...prev,
      currentConversationId: conversationId,
      error: null
    }));

    // Load history if not already loaded
    const conversation = state.conversations.find(conv => conv.id === conversationId);
    if (conversation && conversation.messages.length === 0) {
      loadConversationHistory(conversationId);
    }
  }, [state.conversations, loadConversationHistory]);

  /**
   * Create new conversation
   */
  const createNewConversation = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentConversationId: null,
      error: null
    }));
  }, []);

  /**
   * Clear conversation
   */
  const clearConversation = useCallback(async (conversationId: string): Promise<boolean> => {
    const result = await clearConversationApi.execute(conversationId);
    
    if (result) {
      setState(prev => ({
        ...prev,
        conversations: prev.conversations.filter(conv => conv.id !== conversationId),
        currentConversationId: prev.currentConversationId === conversationId 
          ? null 
          : prev.currentConversationId,
        error: null
      }));
      
      return true;
    }
    
    return false;
  }, [clearConversationApi]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Retry last action
   */
  const retry = useCallback(async () => {
    if (lastActionRef.current) {
      await lastActionRef.current();
    }
  }, []);

  /**
   * Combined loading state
   */
  const isLoading = sendMessageApi.loading || 
                   loadConversationsApi.loading || 
                   loadHistoryApi.loading || 
                   clearConversationApi.loading ||
                   state.isLoading;

  /**
   * Combined error state
   */
  const error = state.error || 
               sendMessageApi.error || 
               loadConversationsApi.error || 
               loadHistoryApi.error || 
               clearConversationApi.error;

  // Auto-load conversations on mount
  useEffect(() => {
    if (autoLoadConversations) {
      loadConversations();
    }
  }, [autoLoadConversations, loadConversations]);

  return {
    state,
    currentConversation,
    sendMessage,
    loadConversations,
    loadConversationHistory,
    selectConversation,
    createNewConversation,
    clearConversation,
    isLoading,
    error,
    clearError,
    retry,
  };
}