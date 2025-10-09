/**
 * 🔐 API Client - Wrapper fetch avec gestion d'erreurs et token auto-injecté
 * 
 * Usage:
 *   import { apiFetch } from '@/lib/api-client'
 *   
 *   const data = await apiFetch('/api/rooms', { method: 'POST', body: { name: 'Salon' } })
 */

interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: any
  timeout?: number
}

/**
 * Fetch wrapper avec gestion d'erreurs et token admin auto-injecté
 */
export async function apiFetch<T = any>(
  url: string, 
  options: ApiFetchOptions = {}
): Promise<T> {
  const { body, timeout = 5000, headers, ...restOptions } = options

  // Construire les headers avec le token admin si disponible
  const finalHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...headers,
  }

  // Injecter le token admin en dev si disponible
  if (typeof window !== 'undefined') {
    const adminToken = process.env.NEXT_PUBLIC_ADMIN_BYPASS_TOKEN
    if (adminToken) {
      finalHeaders['x-admin-token'] = adminToken
    }
  }

  // Créer un AbortController pour le timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...restOptions,
      headers: finalHeaders,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    // Gérer les erreurs HTTP
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.message || 
        errorData.error || 
        `HTTP ${response.status}: ${response.statusText}`
      )
    }

    // Parser la réponse JSON
    const data = await response.json()
    return data as T
  } catch (error) {
    clearTimeout(timeoutId)

    // Gérer les erreurs d'abort (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Timeout après ${timeout}ms`)
    }

    // Gérer les erreurs réseau
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Erreur réseau - Vérifiez votre connexion')
    }

    // Re-throw l'erreur
    throw error
  }
}

/**
 * Helper pour GET
 */
export async function apiGet<T = any>(url: string, options?: ApiFetchOptions): Promise<T> {
  return apiFetch<T>(url, { ...options, method: 'GET' })
}

/**
 * Helper pour POST
 */
export async function apiPost<T = any>(url: string, body?: any, options?: ApiFetchOptions): Promise<T> {
  return apiFetch<T>(url, { ...options, method: 'POST', body })
}

/**
 * Helper pour PUT
 */
export async function apiPut<T = any>(url: string, body?: any, options?: ApiFetchOptions): Promise<T> {
  return apiFetch<T>(url, { ...options, method: 'PUT', body })
}

/**
 * Helper pour DELETE
 */
export async function apiDelete<T = any>(url: string, options?: ApiFetchOptions): Promise<T> {
  return apiFetch<T>(url, { ...options, method: 'DELETE' })
}


