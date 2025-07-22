/**
 * API-related TypeScript type definitions
 * These types define the structure for API requests and responses
 */

// Base API response structure
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

// API error structure
export interface ApiError {
  message: string;
  status: number;
  details?: Record<string, any>;
}

// HTTP methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// API request configuration
export interface ApiRequestConfig {
  method: HttpMethod;
  url: string;
  data?: any;
  headers?: Record<string, string>;
  timeout?: number;
}

// API client interface
export interface ApiClient {
  get<T>(url: string, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>>;
  post<T>(url: string, data?: any, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>>;
  put<T>(url: string, data?: any, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>>;
  delete<T>(url: string, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>>;
}

// API endpoints configuration
export interface ApiEndpoints {
  chat: string;
  conversations: string;
  health: string;
}

// API configuration
export interface ApiConfig {
  baseURL: string;
  timeout: number;
  endpoints: ApiEndpoints;
}