/**
 * Chat API service
 * Provides type-safe functions for chat-related API calls
 */

import { apiClient } from './api';
import { ApiResponse } from '../types/api';
import { ChatRequest, ChatResponse, Message, Conversation } from '../types/chat';

/**
 * Interface for conversation history response
 */
interface ConversationHistoryResponse {
  conversation_id: string;
  messages: Array<{
    id: string;
    content: string;
    type: string;
    timestamp: string;
    conversation_id: string;
    metadata?: Record<string, any>;
  }>;
  message_count: number;
  limit: number;
  timestamp: string;
}

/**
 * Interface for conversations list response
 */
interface ConversationsListResponse {
  conversations: Array<{
    conversation_id: string;
    message_count: number;
    created_at: string;
    updated_at: string;
    last_message_preview: string;
  }>;
  total_count: number;
  timestamp: string;
}

/**
 * Interface for conversation deletion response
 */
interface ConversationDeleteResponse {
  status: string;
  message: string;
  conversation_id: string;
  timestamp: string;
}

/**
 * Interface for health check response
 */
interface HealthCheckResponse {
  status: string;
  service: string;
  timestamp: string;
  version?: string;
  ai_model?: any;
  active_conversations?: number;
}

/**
 * Chat API service class
 */
class ChatApiService {
  /**
   * Send a chat message and get AI response
   */
  async sendMessage(request: ChatRequest): Promise<ApiResponse<ChatResponse>> {
    try {
      const response = await apiClient.post<ChatResponse>('/api/chat/', request);
      
      // Transform response if needed
      if (response.data) {
        // Ensure timestamp is properly formatted
        if (response.data.timestamp && typeof response.data.timestamp === 'string') {
          response.data.timestamp = response.data.timestamp;
        }
      }
      
      return response;
    } catch (error) {
      console.error('Error sending chat message:', error);
      throw error;
    }
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(
    conversationId: string, 
    limit: number = 10
  ): Promise<ApiResponse<Message[]>> {
    try {
      const response = await apiClient.get<ConversationHistoryResponse>(
        `/api/chat/history/${conversationId}?limit=${limit}`
      );
      
      if (response.data) {
        // Transform backend message format to frontend Message format
        const messages: Message[] = response.data.messages.map(msg => ({
          id: msg.id,
          content: msg.content,
          type: msg.type as any, // Will be validated by TypeScript
          timestamp: msg.timestamp,
          conversation_id: msg.conversation_id,
          metadata: msg.metadata
        }));
        
        return {
          ...response,
          data: messages
        };
      }
      
      return response as ApiResponse<Message[]>;
    } catch (error) {
      console.error('Error getting conversation history:', error);
      throw error;
    }
  }

  /**
   * Get list of all conversations
   */
  async getConversations(): Promise<ApiResponse<Conversation[]>> {
    try {
      const response = await apiClient.get<ConversationsListResponse>('/api/chat/conversations');
      
      if (response.data) {
        // Transform backend format to frontend Conversation format
        const conversations: Conversation[] = response.data.conversations.map(conv => ({
          id: conv.conversation_id,
          messages: [], // Messages will be loaded separately when needed
          created_at: conv.created_at,
          updated_at: conv.updated_at,
          metadata: {
            message_count: conv.message_count,
            last_message_preview: conv.last_message_preview
          }
        }));
        
        return {
          ...response,
          data: conversations
        };
      }
      
      return response as ApiResponse<Conversation[]>;
    } catch (error) {
      console.error('Error getting conversations:', error);
      throw error;
    }
  }

  /**
   * Clear/delete a conversation
   */
  async clearConversation(conversationId: string): Promise<ApiResponse<ConversationDeleteResponse>> {
    try {
      const response = await apiClient.delete<ConversationDeleteResponse>(
        `/api/chat/history/${conversationId}`
      );
      
      return response;
    } catch (error) {
      console.error('Error clearing conversation:', error);
      throw error;
    }
  }

  /**
   * Check chat service health
   */
  async checkChatHealth(): Promise<ApiResponse<HealthCheckResponse>> {
    try {
      const response = await apiClient.get<HealthCheckResponse>('/api/chat/health');
      return response;
    } catch (error) {
      console.error('Error checking chat health:', error);
      throw error;
    }
  }

  /**
   * Check general service health
   */
  async checkHealth(): Promise<ApiResponse<HealthCheckResponse>> {
    try {
      const response = await apiClient.get<HealthCheckResponse>('/api/health');
      return response;
    } catch (error) {
      console.error('Error checking service health:', error);
      throw error;
    }
  }

  /**
   * Get service status
   */
  async getServiceStatus(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get('/api/status');
      return response;
    } catch (error) {
      console.error('Error getting service status:', error);
      throw error;
    }
  }
}

// Create and export default chat API service instance
export const chatApiService = new ChatApiService();

// Export the class for custom instances
export { ChatApiService };

// Export types for external use
export type {
  ConversationHistoryResponse,
  ConversationsListResponse,
  ConversationDeleteResponse,
  HealthCheckResponse
};