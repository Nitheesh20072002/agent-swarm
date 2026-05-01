'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import { getSocket } from '@/lib/websocket'
import { Notification } from '@/lib/types'

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  // Fetch initial notifications
  useEffect(() => {
    fetchNotifications()
  }, [])

  // Listen for real-time notifications via WebSocket
  useEffect(() => {
    const socket = getSocket()

    const handleNotification = (data: Notification) => {
      setNotifications((prev) => [data, ...prev])
      setUnreadCount((prev) => prev + 1)
    }

    socket.on('notification', handleNotification)

    return () => {
      socket.off('notification', handleNotification)
    }
  }, [])

  const fetchNotifications = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.get('/notifications')
      const data = response.data || []
      setNotifications(data)
      setUnreadCount(data.filter((n: Notification) => !n.read).length)
      setError(null)
    } catch (err: any) {
      // Gracefully handle 404 - notifications endpoint not implemented yet
      if (err?.message?.includes('Not Found')) {
        setNotifications([])
        setUnreadCount(0)
        setError(null)
      } else {
        console.error('Failed to fetch notifications:', err)
        setError('Failed to fetch notifications')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = useCallback(async (id: string) => {
    try {
      await apiClient.put(`/notifications/${id}/read`)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      await apiClient.post('/notifications/mark-all-read')
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err)
    }
  }, [])

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await apiClient.delete(`/notifications/${id}`)
      setNotifications((prev) => {
        const notification = prev.find((n) => n.id === id)
        if (notification && !notification.read) {
          setUnreadCount((prev) => Math.max(0, prev - 1))
        }
        return prev.filter((n) => n.id !== id)
      })
    } catch (err) {
      console.error('Failed to delete notification:', err)
    }
  }, [])

  const deleteAllNotifications = useCallback(async () => {
    try {
      await apiClient.delete('/notifications')
      setNotifications([])
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to delete all notifications:', err)
    }
  }, [])

  return {
    notifications,
    isLoading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    refetch: fetchNotifications,
  }
}
