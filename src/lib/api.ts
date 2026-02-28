// Use relative path to leverage Vite's proxy in development and Vercel's rewrites in production, avoiding CORS issues.
export const API_BASE_URL = ''

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
