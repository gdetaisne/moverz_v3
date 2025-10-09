/**
 * 🌐 Centralized API Client for Moverz v4
 * Handles authentication and unified fetch
 */

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

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return process.env.NEXT_PUBLIC_ADMIN_BYPASS_TOKEN || null;
}

export async function apiFetch<T = unknown>(
  path: string,
  opts?: RequestInit
): Promise<T> {
  const token = getAuthToken();
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  
  const headers: HeadersInit = {
    ...opts?.headers,
  };

  // Ajouter le token si disponible
  if (token) {
    headers['x-admin-token'] = token;
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Ajouter Content-Type par défaut si pas multipart
  // Pour FormData, laisser le navigateur définir Content-Type avec boundary
  if (opts?.body && !(opts.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const url = path.startsWith('http') ? path : `${baseUrl}${path}`;

  console.log(`🌐 API Request: ${opts?.method || 'GET'} ${url}`, { hasToken: !!token });

  try {
    const res = await fetch(url, {
      ...opts,
      headers,
    });

    console.log(`📡 API Response: ${res.status} ${url}`);

    if (!res.ok) {
      let errorMessage = `API ${path} failed (${res.status})`;
      let details: unknown = null;

      try {
        const errorData = await res.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
        details = errorData;
      } catch {
        // Ignore JSON parse errors
      }

      console.error(`❌ API Error:`, { status: res.status, message: errorMessage, details });
      throw new ApiError(res.status, errorMessage, details);
    }

    // Vérifier le Content-Type pour gérer les réponses binaires (PDF, etc.)
    const contentType = res.headers.get('Content-Type') || '';
    
    // Si c'est un PDF ou autre binaire, retourner un Blob
    if (contentType.includes('application/pdf') || 
        contentType.includes('application/octet-stream') ||
        contentType.includes('image/')) {
      return (await res.blob()) as T;
    }

    // Handle empty responses
    const text = await res.text();
    if (!text) return null as T;

    return JSON.parse(text) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error(`❌ Network Error:`, error);
    throw new ApiError(0, `Network error: ${(error as Error).message}`);
  }
}

export async function apiPost<T = unknown>(
  path: string,
  body?: unknown
): Promise<T> {
  return apiFetch<T>(path, {
    method: 'POST',
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
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

