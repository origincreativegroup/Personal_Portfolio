export interface ApiError extends Error {
  status: number;
  data?: unknown;
}

const defaultBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api';

export const apiBaseUrl = defaultBaseUrl.endsWith('/')
  ? defaultBaseUrl.slice(0, -1)
  : defaultBaseUrl;

const buildHeaders = (headers: HeadersInit = {}, token?: string): HeadersInit => {
  const finalHeaders = new Headers(headers);
  if (!finalHeaders.has('Content-Type')) {
    finalHeaders.set('Content-Type', 'application/json');
  }
  if (token) {
    finalHeaders.set('Authorization', `Bearer ${token}`);
  }
  return finalHeaders;
};

export async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: buildHeaders(init.headers, token),
    credentials: 'include',
  });

  if (!response.ok) {
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      data = undefined;
    }
    const error = new Error('API request failed') as ApiError;
    error.status = response.status;
    error.data = data;
    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('Content-Type');
  if (contentType && contentType.includes('application/json')) {
    return response.json() as Promise<T>;
  }

  return undefined as T;
}

export type ProjectPayload = {
  name: string;
  description?: string;
  category?: string;
  template?: string;
  color?: string;
  visibility?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  summary?: string;
};
