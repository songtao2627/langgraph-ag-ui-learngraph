/**
 * Base API client service
 * Provides HTTP client with interceptors, error handling, and type safety
 */

import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import type { ApiResponse, ApiError, ApiConfig } from '../types/api';

// Extended config interface with metadata
interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  metadata?: {
    startTime: number;
  };
}

// Default API configuration
const DEFAULT_CONFIG: ApiConfig = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 30000, // 30 seconds
  endpoints: {
    chat: '/api/chat',
    conversations: '/api/chat/conversations',
    health: '/api/health'
  }
};

/**
 * API Client class with comprehensive error handling and interceptors
 */
class ApiClient {
  private client: AxiosInstance;
  private config: ApiConfig;

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.client = this.createAxiosInstance();
    this.setupInterceptors();
  }

  /**
   * Create axios instance with base configuration
   */
  private createAxiosInstance(): AxiosInstance {
    return axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add timestamp to requests for debugging
        (config as ExtendedAxiosRequestConfig).metadata = { startTime: Date.now() };
        
        // Log request in development
        if (import.meta.env.DEV) {
          console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
            data: config.data,
            params: config.params,
          });
        }
        
        return config;
      },
      (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(this.handleError(error));
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Calculate request duration
        const extendedConfig = response.config as ExtendedAxiosRequestConfig;
        const duration = Date.now() - (extendedConfig.metadata?.startTime || 0);
        
        // Log response in development
        if (import.meta.env.DEV) {
          console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
            status: response.status,
            duration: `${duration}ms`,
            data: response.data,
          });
        }
        
        return response;
      },
      (error: AxiosError) => {
        // Calculate request duration for failed requests
        const extendedConfig = error.config as ExtendedAxiosRequestConfig;
        const duration = Date.now() - (extendedConfig?.metadata?.startTime || 0);
        
        // Log error in development
        if (import.meta.env.DEV) {
          console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
            status: error.response?.status,
            duration: `${duration}ms`,
            error: error.response?.data || error.message,
          });
        }
        
        return Promise.reject(this.handleError(error));
      }
    );
  }

  /**
   * Handle and normalize API errors
   */
  private handleError(error: any): ApiError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      // Network or timeout errors
      if (!axiosError.response) {
        return {
          message: axiosError.code === 'ECONNABORTED' 
            ? 'Request timeout - please try again' 
            : 'Network error - please check your connection',
          status: 0,
          details: {
            code: axiosError.code,
            originalMessage: axiosError.message,
          }
        };
      }
      
      // HTTP errors with response
      const response = axiosError.response;
      const errorData = response.data as any;
      
      return {
        message: errorData?.detail || errorData?.message || `HTTP ${response.status} Error`,
        status: response.status,
        details: {
          url: axiosError.config?.url,
          method: axiosError.config?.method,
          data: errorData,
        }
      };
    }
    
    // Non-axios errors
    return {
      message: error.message || 'Unknown error occurred',
      status: 500,
      details: { originalError: error }
    };
  }

  /**
   * Generic request method with type safety
   */
  private async request<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.request<T>(config);
      
      return {
        data: response.data,
        status: response.status,
        message: 'Success'
      };
    } catch (error) {
      const apiError = error as ApiError;
      
      return {
        error: apiError.message,
        status: apiError.status,
        data: undefined
      };
    }
  }

  /**
   * GET request
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'GET',
      url,
      ...config,
    });
  }

  /**
   * POST request
   */
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'POST',
      url,
      data,
      ...config,
    });
  }

  /**
   * PUT request
   */
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'PUT',
      url,
      data,
      ...config,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'DELETE',
      url,
      ...config,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'PATCH',
      url,
      data,
      ...config,
    });
  }

  /**
   * Get current configuration
   */
  getConfig(): ApiConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ApiConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update axios instance baseURL if changed
    if (newConfig.baseURL) {
      this.client.defaults.baseURL = newConfig.baseURL;
    }
    
    // Update timeout if changed
    if (newConfig.timeout) {
      this.client.defaults.timeout = newConfig.timeout;
    }
  }

  /**
   * Add custom header
   */
  setHeader(key: string, value: string): void {
    this.client.defaults.headers.common[key] = value;
  }

  /**
   * Remove custom header
   */
  removeHeader(key: string): void {
    delete this.client.defaults.headers.common[key];
  }

  /**
   * Get axios instance for advanced usage
   */
  getAxiosInstance(): AxiosInstance {
    return this.client;
  }
}

// Create and export default API client instance
export const apiClient = new ApiClient();

// Export the class for custom instances
export { ApiClient };

// Export configuration for external use
export { DEFAULT_CONFIG };