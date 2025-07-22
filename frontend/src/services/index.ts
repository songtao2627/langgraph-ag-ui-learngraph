/**
 * Services index file
 * Provides clean imports for all API services
 */

// Export API client
export { apiClient, ApiClient, DEFAULT_CONFIG } from './api';

// Export chat service
export { chatApiService, ChatApiService } from './chat';

// Export types
export type {
  ConversationHistoryResponse,
  ConversationsListResponse,
  ConversationDeleteResponse,
  HealthCheckResponse
} from './chat';