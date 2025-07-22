/**
 * Chat-related TypeScript type definitions
 * These types correspond to the backend Pydantic models
 */

// Message types enum
export const enum MessageType {
  USER = 'user',
  AI = 'ai',
  SYSTEM = 'system'
}

// Individual message interface
export interface Message {
  id: string;
  content: string;
  type: MessageType;
  timestamp: string; // ISO string format
  conversation_id: string;
  metadata?: Record<string, any>;
}

// Conversation interface
export interface Conversation {
  id: string;
  messages: Message[];
  created_at: string; // ISO string format
  updated_at: string; // ISO string format
  metadata?: Record<string, any>;
}

// Chat request interface
export interface ChatRequest {
  message: string;
  conversation_id?: string;
}

// Chat response interface
export interface ChatResponse {
  response: string;
  conversation_id: string;
  timestamp: string; // ISO string format
  processing_time?: number;
}

// Chat state interface for frontend state management
export interface ChatState {
  conversations: Conversation[];
  currentConversationId: string | null;
  isLoading: boolean;
  error: string | null;
}

// UI-specific interfaces
export interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

export interface ConversationListProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
}