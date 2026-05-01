'use client'

import { useState, useEffect, useCallback } from 'react'
import APIClient from '@/lib/api-client'
import { Task } from '@/lib/types'

interface TasksStore {
  tasks: Task[]
  filteredTasks: Task[]
  statusFilter: string | null
  priorityFilter: string | null
  searchQuery: string
}

export function useTasks() {
  const [store, setStore] = useState<TasksStore>({
    tasks: [],
    filteredTasks: [],
    statusFilter: null,
    priorityFilter: null,
    searchQuery: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filter tasks based on current filters
  const applyFilters = useCallback((tasks: Task[], store: TasksStore) => {
    return tasks.filter((task) => {
      const matchesStatus = !store.statusFilter || task.status === store.statusFilter
      const matchesPriority = !store.priorityFilter || task.priority === store.priorityFilter
      const matchesSearch =
        !store.searchQuery ||
        task.title.toLowerCase().includes(store.searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(store.searchQuery.toLowerCase())
      return matchesStatus && matchesPriority && matchesSearch
    })
  }, [])

  // Fetch all tasks
  const fetchTasks = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await APIClient.get<Task[]>('/api/tasks')
      setStore((prev) => ({
        ...prev,
        tasks: data,
        filteredTasks: applyFilters(data, prev),
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks')
    } finally {
      setIsLoading(false)
    }
  }, [applyFilters])

  // Create new task
  const createTask = useCallback(
    async (taskData: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
      try {
        const newTask = await APIClient.post<Task>('/api/tasks', taskData)
        setStore((prev) => {
          const tasks = [...prev.tasks, newTask]
          return {
            ...prev,
            tasks,
            filteredTasks: applyFilters(tasks, prev),
          }
        })
        return newTask
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create task'
        setError(errorMessage)
        throw err
      }
    },
    [applyFilters]
  )

  // Update task
  const updateTask = useCallback(
    async (id: string, taskData: Partial<Task>) => {
      try {
        const updated = await APIClient.put<Task>(`/api/tasks/${id}`, taskData)
        setStore((prev) => {
          const tasks = prev.tasks.map((t) => (t.id === id ? updated : t))
          return {
            ...prev,
            tasks,
            filteredTasks: applyFilters(tasks, prev),
          }
        })
        return updated
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update task'
        setError(errorMessage)
        throw err
      }
    },
    [applyFilters]
  )

  // Delete task
  const deleteTask = useCallback(
    async (id: string) => {
      try {
        await APIClient.delete(`/api/tasks/${id}`)
        setStore((prev) => {
          const tasks = prev.tasks.filter((t) => t.id !== id)
          return {
            ...prev,
            tasks,
            filteredTasks: applyFilters(tasks, prev),
          }
        })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete task'
        setError(errorMessage)
        throw err
      }
    },
    [applyFilters]
  )

  // Set status filter
  const setStatusFilter = useCallback((status: string | null) => {
    setStore((prev) => {
      const newStore = { ...prev, statusFilter: status }
      return {
        ...newStore,
        filteredTasks: applyFilters(prev.tasks, newStore),
      }
    })
  }, [applyFilters])

  // Set priority filter
  const setPriorityFilter = useCallback((priority: string | null) => {
    setStore((prev) => {
      const newStore = { ...prev, priorityFilter: priority }
      return {
        ...newStore,
        filteredTasks: applyFilters(prev.tasks, newStore),
      }
    })
  }, [applyFilters])

  // Set search query
  const setSearchQuery = useCallback(
    (query: string) => {
      setStore((prev) => {
        const newStore = { ...prev, searchQuery: query }
        return {
          ...newStore,
          filteredTasks: applyFilters(prev.tasks, newStore),
        }
      })
    },
    [applyFilters]
  )

  // Group tasks by status for kanban view
  const getTasksByStatus = useCallback(() => {
    const statuses = ['todo', 'in_progress', 'in_review', 'done']
    const grouped: Record<string, Task[]> = {}
    statuses.forEach((status) => {
      grouped[status] = store.filteredTasks.filter((t) => t.status === status)
    })
    return grouped
  }, [store.filteredTasks])

  // Load tasks on mount
  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  return {
    tasks: store.filteredTasks,
    allTasks: store.tasks,
    tasksByStatus: getTasksByStatus(),
    isLoading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    setStatusFilter,
    setPriorityFilter,
    setSearchQuery,
  }
}
