import { User } from './types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export async function login(email: string, password: string): Promise<User> {
  const response = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Login failed' }))
    throw new Error(error.message || 'Login failed')
  }

  const data = await response.json()
  
  // Store token if provided (check both data.token and data.data.token)
  const token = data.token || data.data?.token
  if (token) {
    setToken(token)
  }
  
  return data.data?.user || data.user || data.data || data
}

export async function register(email: string, username: string, password: string): Promise<User> {
  const response = await fetch(`${API_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, username, password }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Registration failed' }))
    throw new Error(error.message || 'Registration failed')
  }

  const data = await response.json()
  
  // Store token if provided (check both data.token and data.data.token)
  const token = data.token || data.data?.token
  if (token) {
    setToken(token)
  }
  
  return data.data?.user || data.user || data.data || data
}

export async function logout(): Promise<void> {
  await fetch(`${API_URL}/api/v1/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  })
  removeToken()
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const token = getToken()
    const headers: HeadersInit = { 'Content-Type': 'application/json' }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    const response = await fetch(`${API_URL}/api/v1/auth/me`, {
      credentials: 'include',
      headers,
    })

    if (!response.ok) return null
    
    const data = await response.json()
    return data.data?.user || data.user || data.data || data
  } catch {
    return null
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

export function setToken(token: string): void {
  localStorage.setItem('token', token)
}

export function removeToken(): void {
  localStorage.removeItem('token')
}
