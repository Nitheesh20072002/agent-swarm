'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import * as authService from '@/lib/auth'
import { wsClient } from '@/lib/websocket'

export function useAuth() {
  const { user, isLoading, error, setUser, setLoading, setError, logout } = useAuthStore()

  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    setLoading(true)
    try {
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
      
      if (currentUser) {
        // Connect to WebSocket
        const token = authService.getToken()
        if (token) {
          await wsClient.connect(token)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize auth')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      const user = await authService.login(email, password)
      setUser(user)
      
      // Connect to WebSocket
      const token = authService.getToken()
      if (token) {
        await wsClient.connect(token)
      }
      
      return user
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, username: string, password: string) => {
    setLoading(true)
    try {
      const user = await authService.register(email, username, password)
      setUser(user)
      
      // Connect to WebSocket
      const token = authService.getToken()
      if (token) {
        await wsClient.connect(token)
      }
      
      return user
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      await authService.logout()
      wsClient.disconnect()
      logout()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed')
    }
  }

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
  }
}
