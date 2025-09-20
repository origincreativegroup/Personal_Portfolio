import { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../contexts/AppContext';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface ApiOptions {
  immediate?: boolean;
  dependencies?: React.DependencyList;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestConfig {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  signal?: AbortSignal;
}

// Generic API hook
export function useApi<T = any>(
  url: string | null,
  options: ApiOptions = {}
): ApiState<T> & {
  refetch: () => Promise<T | null>;
  mutate: (data: T) => void;
} {
  const { immediate = true, dependencies = [] } = options;
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const { addNotification } = useApp();
  const abortControllerRef = useRef<AbortController>();

  const fetchData = useCallback(async (): Promise<T | null> => {
    if (!url) return null;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(url, {
        signal: abortControllerRef.current.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled, don't update state
        return null;
      }

      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      addNotification('error', `Failed to fetch data: ${errorMessage}`);
      return null;
    }
  }, [url, addNotification]);

  const mutate = useCallback((data: T) => {
    setState(prev => ({ ...prev, data }));
  }, []);

  // Effect to fetch data on mount and dependency changes
  useEffect(() => {
    if (immediate && url) {
      fetchData();
    }

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [immediate, url, ...dependencies]);

  return {
    ...state,
    refetch: fetchData,
    mutate,
  };
}

// Hook for making API requests with different HTTP methods
export function useApiRequest() {
  const [loading, setLoading] = useState(false);
  const { addNotification } = useApp();
  const abortControllerRef = useRef<AbortController>();

  const request = useCallback(async <T = any>(
    url: string,
    config: RequestConfig = {}
  ): Promise<T | null> => {
    const { method = 'GET', headers = {}, body } = config;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setLoading(true);

    try {
      const requestInit: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        signal: abortControllerRef.current.signal,
      };

      if (body && method !== 'GET') {
        requestInit.body = typeof body === 'string' ? body : JSON.stringify(body);
      }

      const response = await fetch(url, requestInit);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setLoading(false);
      return data;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return null;
      }

      const errorMessage = error instanceof Error ? error.message : 'Request failed';
      setLoading(false);
      addNotification('error', errorMessage);
      throw error;
    }
  }, [addNotification]);

  const get = useCallback(<T = any>(url: string, headers?: Record<string, string>) =>
    request<T>(url, { method: 'GET', headers }), [request]);

  const post = useCallback(<T = any>(url: string, body?: any, headers?: Record<string, string>) =>
    request<T>(url, { method: 'POST', body, headers }), [request]);

  const put = useCallback(<T = any>(url: string, body?: any, headers?: Record<string, string>) =>
    request<T>(url, { method: 'PUT', body, headers }), [request]);

  const patch = useCallback(<T = any>(url: string, body?: any, headers?: Record<string, string>) =>
    request<T>(url, { method: 'PATCH', body, headers }), [request]);

  const del = useCallback(<T = any>(url: string, headers?: Record<string, string>) =>
    request<T>(url, { method: 'DELETE', headers }), [request]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    loading,
    request,
    get,
    post,
    put,
    patch,
    delete: del,
  };
}

// Hook for uploading files
export function useFileUpload() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { addNotification } = useApp();

  const upload = useCallback(async (
    url: string,
    file: File,
    fieldName: string = 'file',
    additionalFields?: Record<string, string>
  ) => {
    setLoading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append(fieldName, file);

      if (additionalFields) {
        Object.entries(additionalFields).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header, let browser set it with boundary
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();
      setLoading(false);
      setProgress(100);
      addNotification('success', 'File uploaded successfully');
      return result;
    } catch (error) {
      setLoading(false);
      setProgress(0);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      addNotification('error', errorMessage);
      throw error;
    }
  }, [addNotification]);

  return {
    upload,
    loading,
    progress,
  };
}

// Hook for optimistic updates
export function useOptimisticUpdate<T>(
  initialData: T,
  updateFn: (data: T) => Promise<T>
) {
  const [data, setData] = useState<T>(initialData);
  const [isUpdating, setIsUpdating] = useState(false);
  const { addNotification } = useApp();

  const update = useCallback(async (optimisticData: T) => {
    const previousData = data;

    // Apply optimistic update immediately
    setData(optimisticData);
    setIsUpdating(true);

    try {
      // Perform actual update
      const updatedData = await updateFn(optimisticData);
      setData(updatedData);
      setIsUpdating(false);
      return updatedData;
    } catch (error) {
      // Revert to previous data on error
      setData(previousData);
      setIsUpdating(false);
      const errorMessage = error instanceof Error ? error.message : 'Update failed';
      addNotification('error', errorMessage);
      throw error;
    }
  }, [data, updateFn, addNotification]);

  return {
    data,
    update,
    isUpdating,
    setData,
  };
}