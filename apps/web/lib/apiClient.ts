/**
 * 🌐 Centralized API client
 */

import { getAuthToken } from './helpers';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  opts?: RequestInit
): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(opts?.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = path.startsWith('/api') ? path : `/api${path}`;

  try {
    const res = await fetch(url, {
      ...opts,
      headers,
    });

    if (!res.ok) {
      let errorMessage = `API ${path} failed (${res.status})`;
      let details: unknown = null;

      try {
        const errorData = await res.json();
        errorMessage = errorData.message || errorMessage;
        details = errorData;
      } catch {
        // Ignore JSON parse errors
      }

      throw new ApiError(res.status, errorMessage, details);
    }

    // Handle empty responses
    const text = await res.text();
    if (!text) return null as T;

    return JSON.parse(text) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, `Network error: ${(error as Error).message}`);
  }
}

export async function apiPost<T = unknown>(
  path: string,
  body?: unknown
): Promise<T> {
  return apiFetch<T>(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function apiGet<T = unknown>(path: string): Promise<T> {
  return apiFetch<T>(path, { method: 'GET' });
}

export async function apiPut<T = unknown>(
  path: string,
  body?: unknown
): Promise<T> {
  return apiFetch<T>(path, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function apiDelete<T = unknown>(path: string): Promise<T> {
  return apiFetch<T>(path, { method: 'DELETE' });
}



