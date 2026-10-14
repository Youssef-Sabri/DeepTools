import type { Category } from '@/lib/types'

const API_BASE_URL = '/api/v1'

export type ApiFetchOptions = RequestInit

function csrfToken(): string | undefined {
  if (typeof document === 'undefined') return undefined
  const value = document.cookie.split('; ').find((cookie) => cookie.startsWith('dt_csrf='))?.slice('dt_csrf='.length)
  return value ? decodeURIComponent(value) : undefined
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

  if (!['GET', 'HEAD', 'OPTIONS'].includes((options.method || 'GET').toUpperCase())) {
    const csrf = csrfToken()
    if (csrf) headers.set('X-CSRF-Token', csrf)
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'same-origin',
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)

  if (!response.ok) {
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
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

// The browser handles the GET response as a download stream; JavaScript only checks access with HEAD.
async function downloadFile(url: string, fallbackFileName: string): Promise<void> {
  const response = await fetch(url, { method: 'HEAD', credentials: 'same-origin', cache: 'no-store' })

  if (!response.ok) {
    if (response.status === 401) window.dispatchEvent(new Event('auth:unauthorized'))
    throw new ApiError(`Download unavailable (${response.status})`, response.status)
  }

  const a = document.createElement('a')
  a.href = url
  const serverFileName = response.headers.get('content-disposition')?.match(/filename="([^"]+)"/)?.[1]
  a.download = serverFileName || fallbackFileName
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export function downloadProductFile(productId: string, fallbackFileName: string = 'asset', guestToken?: string): Promise<void> {
  const query = guestToken ? `?token=${encodeURIComponent(guestToken)}` : ''
  return downloadFile(`${API_BASE_URL}/products/${encodeURIComponent(productId)}/download${query}`, fallbackFileName)
}

export function downloadAdminUploadFile(productId: string, fallbackFileName: string = 'asset-review.zip'): Promise<void> {
  return downloadFile(`${API_BASE_URL}/admin/uploads/${encodeURIComponent(productId)}/download`, fallbackFileName)
}

export function adminUploadViewUrl(productId: string): string {
  return `${API_BASE_URL}/admin/uploads/${encodeURIComponent(productId)}/download?disposition=inline`
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetchApi<Category[] | { categories: Category[] }>('/categories')
  if (Array.isArray(res)) return res
  if (res && typeof res === 'object' && 'categories' in res && Array.isArray(res.categories)) {
    return res.categories
  }
  return []
}

export async function createAdminCategory(data: {
  slug: string
  name: string
  nameAr: string
  description?: string
  descriptionAr?: string
  icon?: string
  displayOrder?: number
}): Promise<Category> {
  return fetchApi<Category>('/admin/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateAdminCategory(
  id: string,
  data: Partial<{
    name: string
    nameAr: string
    description: string
    descriptionAr: string
    icon: string
    displayOrder: number
    isActive: boolean
  }>
): Promise<Category> {
  return fetchApi<Category>(`/admin/categories/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteAdminCategory(id: string): Promise<{ message: string }> {
  return fetchApi<{ message: string }>(`/admin/categories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}
