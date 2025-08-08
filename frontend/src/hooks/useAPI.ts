/**
 * API interaction hooks
 * Provides reusable hooks for API calls with loading states and error handling
 */

import { useState, useCallback } from 'react';
import type { ApiResponse, ApiError } from '../types/api';

/**
 * Generic API hook state interface
 */
interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * API hook options
 */
interface UseApiOptions {
  retryCount?: number;
  retryDelay?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: ApiError) => void;
}

/**
 * Generic hook for API calls with loading states and error handling
 */
export function useApi<T>(
  apiCall: (...args: any[]) => Promise<ApiResponse<T>>,
  options: UseApiOptions = {}
) {
  const { retryCount = 3, retryDelay = 1000, onSuccess, onError } = options;
  
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  /**
   * Execute API call with retry logic
   */
  const execute = useCallback(async (...args: any[]) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    let lastError: string | null = null;
    
    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        const response = await apiCall(...args);
        
        if (response.error) {
          lastError = response.error;
          
          // Don't retry on client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            break;
          }
          
          // Retry on server errors (5xx) or network errors
          if (attempt < retryCount) {
            await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
            continue;
          }
        } else {
          // Success
          setState({
            data: response.data || null,
            loading: false,
            error: null,
          });
          
          if (onSuccess && response.data) {
            onSuccess(response.data);
          }
          
          return response.data;
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        
        // Retry on network errors
        if (attempt < retryCount) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
          continue;
        }
      }
    }

    // All attempts failed
    setState({
      data: null,
      loading: false,
      error: lastError || 'Request failed after multiple attempts',
    });

    if (onError) {
      onError({
        message: lastError || 'Request failed',
        status: 0,
      });
    }

    return null;
  }, [apiCall, retryCount, retryDelay, onSuccess, onError]);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  /**
   * Set error manually
   */
  const setError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      loading: false,
      error,
    }));
  }, []);

  /**
   * Set data manually
   */
  const setData = useCallback((data: T | null) => {
    setState(prev => ({
      ...prev,
      data,
      error: null,
    }));
  }, []);

  return {
    ...state,
    execute,
    reset,
    setError,
    setData,
  };
}

/**
 * Hook for handling multiple concurrent API calls
 */
export function useMultipleApi<T extends Record<string, any>>(
  apiCalls: { [K in keyof T]: (...args: any[]) => Promise<ApiResponse<T[K]>> }
) {
  const [states, setStates] = useState<{ [K in keyof T]: ApiState<T[K]> }>(
    Object.keys(apiCalls).reduce((acc, key) => {
      acc[key as keyof T] = {
        data: null,
        loading: false,
        error: null,
      };
      return acc;
    }, {} as { [K in keyof T]: ApiState<T[K]> })
  );

  /**
   * Execute specific API call
   */
  const execute = useCallback(async <K extends keyof T>(
    key: K,
    ...args: any[]
  ): Promise<T[K] | null> => {
    setStates(prev => ({
      ...prev,
      [key]: { ...prev[key], loading: true, error: null },
    }));

    try {
      const response = await apiCalls[key](...args);
      
      if (response.error) {
        setStates(prev => ({
          ...prev,
          [key]: {
            data: null,
            loading: false,
            error: response.error!,
          },
        }));
        return null;
      }

      setStates(prev => ({
        ...prev,
        [key]: {
          data: response.data || null,
          loading: false,
          error: null,
        },
      }));

      return response.data || null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setStates(prev => ({
        ...prev,
        [key]: {
          data: null,
          loading: false,
          error: errorMessage,
        },
      }));

      return null;
    }
  }, [apiCalls]);

  /**
   * Execute all API calls concurrently
   */
  const executeAll = useCallback(async (
    args: { [K in keyof T]?: any[] } = {}
  ): Promise<{ [K in keyof T]: T[K] | null }> => {
    // Set all to loading
    setStates(prev => 
      Object.keys(prev).reduce((acc, key) => {
        acc[key as keyof T] = { ...prev[key as keyof T], loading: true, error: null };
        return acc;
      }, {} as { [K in keyof T]: ApiState<T[K]> })
    );

    const promises = Object.keys(apiCalls).map(async (key) => {
      const k = key as keyof T;
      const callArgs = args[k] || [];
      
      try {
        const response = await apiCalls[k](...callArgs);
        return { key: k, response };
      } catch (error) {
        return { 
          key: k, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    });

    const results = await Promise.allSettled(promises);
    const newStates = { ...states };
    const returnData = {} as { [K in keyof T]: T[K] | null };

    results.forEach((result, index) => {
      const key = Object.keys(apiCalls)[index] as keyof T;
      
      if (result.status === 'fulfilled') {
        const { response, error } = result.value;
        
        if (error) {
          newStates[key] = {
            data: null,
            loading: false,
            error,
          };
          returnData[key] = null;
        } else if (response?.error) {
          newStates[key] = {
            data: null,
            loading: false,
            error: response.error,
          };
          returnData[key] = null;
        } else {
          newStates[key] = {
            data: response?.data || null,
            loading: false,
            error: null,
          };
          returnData[key] = response?.data || null;
        }
      } else {
        newStates[key] = {
          data: null,
          loading: false,
          error: result.reason?.message || 'Request failed',
        };
        returnData[key] = null;
      }
    });

    setStates(newStates);
    return returnData;
  }, [apiCalls, states]);

  /**
   * Reset specific state
   */
  const reset = useCallback(<K extends keyof T>(key: K) => {
    setStates(prev => ({
      ...prev,
      [key]: {
        data: null,
        loading: false,
        error: null,
      },
    }));
  }, []);

  /**
   * Reset all states
   */
  const resetAll = useCallback(() => {
    setStates(
      Object.keys(apiCalls).reduce((acc, key) => {
        acc[key as keyof T] = {
          data: null,
          loading: false,
          error: null,
        };
        return acc;
      }, {} as { [K in keyof T]: ApiState<T[K]> })
    );
  }, [apiCalls]);

  return {
    states,
    execute,
    executeAll,
    reset,
    resetAll,
  };
}