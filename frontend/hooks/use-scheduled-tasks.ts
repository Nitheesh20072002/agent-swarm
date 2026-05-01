'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api-client'
import { ScheduledTask } from '@/lib/types'

export function useScheduledTasks() {
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch scheduled tasks
  useEffect(() => {
    fetchScheduledTasks()
  }, [])

  const fetchScheduledTasks = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.get('/scheduled-tasks')
      setScheduledTasks(response.data || [])
      setError(null)
    } catch (err) {
      console.error('Failed to fetch scheduled tasks:', err)
      setError('Failed to fetch scheduled tasks')
    } finally {
      setIsLoading(false)
    }
  }

  const createScheduledTask = async (
    taskId: string,
    agentId: string,
    cronExpression: string,
    isOneTime: boolean = false,
    executeAt?: string
  ) => {
    try {
      const payload = {
        taskId,
        agentId,
        isOneTime,
        cronExpression: isOneTime ? null : cronExpression,
        executeAt: isOneTime ? executeAt : null,
      }
      const response = await apiClient.post('/scheduled-tasks', payload)
      setScheduledTasks((prev) => [...prev, response.data])
      return response.data
    } catch (err) {
      console.error('Failed to create scheduled task:', err)
      throw err
    }
  }

  const updateScheduledTask = async (
    id: string,
    updates: Partial<ScheduledTask>
  ) => {
    try {
      const response = await apiClient.put(`/scheduled-tasks/${id}`, updates)
      setScheduledTasks((prev) =>
        prev.map((task) => (task.id === id ? response.data : task))
      )
      return response.data
    } catch (err) {
      console.error('Failed to update scheduled task:', err)
      throw err
    }
  }

  const deleteScheduledTask = async (id: string) => {
    try {
      await apiClient.delete(`/scheduled-tasks/${id}`)
      setScheduledTasks((prev) => prev.filter((task) => task.id !== id))
    } catch (err) {
      console.error('Failed to delete scheduled task:', err)
      throw err
    }
  }

  const toggleScheduledTask = async (id: string, enabled: boolean) => {
    try {
      const response = await apiClient.put(`/scheduled-tasks/${id}`, {
        enabled,
      })
      setScheduledTasks((prev) =>
        prev.map((task) => (task.id === id ? response.data : task))
      )
      return response.data
    } catch (err) {
      console.error('Failed to toggle scheduled task:', err)
      throw err
    }
  }

  return {
    scheduledTasks,
    isLoading,
    error,
    createScheduledTask,
    updateScheduledTask,
    deleteScheduledTask,
    toggleScheduledTask,
    refetch: fetchScheduledTasks,
  }
}
