const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  // Get token from localStorage if available
  let token = null
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('token')
  }

  const headers = new Headers(options.headers || {})
  headers.set('Content-Type', 'application/json')
  
  if (typeof window !== 'undefined') {
    const isAr = window.location.pathname.startsWith('/ar') || document.documentElement.lang === 'ar'
    if (!headers.has('Accept-Language')) {
      headers.set('Accept-Language', isAr ? 'ar' : 'en')
    }
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const config = {
    ...options,
    headers,
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `API error: ${response.status}`)
  }

  return response.json()
}
