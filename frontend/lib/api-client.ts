const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>
}

export class APIClient {
  static async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { params, ...fetchOptions } = options

    let url = `${API_URL}${endpoint}`

    // Add query parameters
    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        searchParams.append(key, String(value))
      })
      url += `?${searchParams.toString()}`
    }

    // Set default headers
    const headers = new Headers(fetchOptions.headers || {})
    if (!headers.has('Content-Type') && fetchOptions.body) {
      headers.set('Content-Type', 'application/json')
    }
    
    // Add authorization token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`)
      }
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: 'include',
    })

    if (!response.ok) {
      if (response.status === 401) {
        // Handle unauthorized
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      }
      throw new Error(`API error: ${response.statusText}`)
    }

    return response.json()
  }

  static get<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  static post<T>(endpoint: string, body?: any, options?: RequestOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  static put<T>(endpoint: string, body?: any, options?: RequestOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  static patch<T>(endpoint: string, body?: any, options?: RequestOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  static delete<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }
}

// Export singleton instance for convenience
export const apiClient = APIClient

export default APIClient
