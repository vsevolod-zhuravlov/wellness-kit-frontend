// Use an explicit prefix to prevent backend proxy rules from colliding with frontend React Router SPA routes.
export const API_BASE_URL = '/api-proxy'

/**
 * Enhanced fetch wrapper that automatically attaches the JWT token
 * from localStorage if it exists.
 */
export async function fetchApi(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('auth_token')
  const headers = new Headers(options.headers || {})

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  // Set default content type to JSON if a body is present and no Content-Type is provided
  if (options.body && (!options.headers || !('Content-Type' in (options.headers as Record<string, unknown>)))) {
    headers.set('Content-Type', 'application/json')
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers,
  })

  return response
}
