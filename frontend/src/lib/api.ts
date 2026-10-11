const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'

export interface ApiFetchOptions extends RequestInit {
  token?: string
}

export class ApiError extends Error {
  statusCode: number
  errors?: string[]

  constructor(message: string, statusCode: number, errors?: string[]) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.errors = errors
  }
}

export async function fetchApi<T = unknown>(endpoint: string, options: ApiFetchOptions = {}): Promise<T> {
  let token = options.token || null
  if (!token && typeof window !== 'undefined') {
    token = localStorage.getItem('token')
  }

  const headers = new Headers(options.headers || {})

  // Only set application/json if not uploading FormData
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData
  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (typeof window !== 'undefined') {
    const isAr = window.location.pathname.startsWith('/ar') || document.documentElement.lang === 'ar'
    if (!headers.has('Accept-Language')) {
      headers.set('Accept-Language', isAr ? 'ar' : 'en')
    }
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const config: RequestInit = {
    ...options,
    headers,
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)

  if (!response.ok) {
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        window.dispatchEvent(new Event('auth:unauthorized'))
      }
    }

    let errorMessage = `Request failed with status ${response.status}`
    let errors: string[] | undefined

    try {
      const errorJson = await response.json()
      if (errorJson && typeof errorJson === 'object') {
        if (errorJson.message) errorMessage = errorJson.message
        if (Array.isArray(errorJson.errors)) errors = errorJson.errors
      }
    } catch {
      // Body not JSON
    }

    throw new ApiError(errorMessage, response.status, errors)
  }

  const json = await response.json().catch(() => ({}))
  if (json && typeof json === 'object' && 'data' in json) {
    return json.data as T
  }
  return json as T
}

/**
 * Triggers an authenticated binary stream download (e.g. GET /api/v1/products/:id/download)
 */
export async function downloadProductFile(productId: string, fallbackFileName: string = 'product_asset.zip'): Promise<void> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  const headers: HeadersInit = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}/products/${productId}/download`, {
    headers,
  })

  if (!response.ok) {
    let errMessage = 'Download failed'
    try {
      const err = await response.json()
      if (err.message) errMessage = err.message
    } catch {
      // not json
    }
    throw new ApiError(errMessage, response.status)
  }

  // Extract filename from Content-Disposition header if available
  const disposition = response.headers.get('content-disposition')
  let filename = fallbackFileName
  if (disposition && disposition.includes('filename=')) {
    const filenameMatch = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1].replace(/['"]/g, '')
    }
  }

  const blob = await response.blob()
  const downloadUrl = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = downloadUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(downloadUrl)
}
