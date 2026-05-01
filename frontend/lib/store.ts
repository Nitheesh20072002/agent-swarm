import { create } from 'zustand'
import { User, Agent, Notification } from './types'

interface AuthStore {
  user: User | null
  isLoading: boolean
  error: string | null
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  logout: () => void
}

interface AgentStore {
  agents: Agent[]
  selectedAgent: Agent | null
  isLoading: boolean
  error: string | null
  setAgents: (agents: Agent[]) => void
  setSelectedAgent: (agent: Agent | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  addAgent: (agent: Agent) => void
  updateAgent: (id: string, agent: Partial<Agent>) => void
  removeAgent: (id: string) => void
}

interface NotificationStore {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  setNotifications: (notifications: Notification[]) => void
  addNotification: (notification: Notification) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: false,
  error: null,
  setUser: (user) => set({ user, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  logout: () => set({ user: null, error: null }),
}))

export const useAgentStore = create<AgentStore>((set) => ({
  agents: [],
  selectedAgent: null,
  isLoading: false,
  error: null,
  setAgents: (agents) => set({ agents: (agents || []).filter(a => a && a.id), error: null }),
  setSelectedAgent: (selectedAgent) => set({ selectedAgent }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  addAgent: (agent) =>
    set((state) => ({ agents: [...state.agents, agent] })),
  updateAgent: (id, updates) =>
    set((state) => ({
      agents: state.agents.map((a) =>
        a && a.id === id ? { ...a, ...updates } : a
      ).filter(a => a && a.id),
    })),
  removeAgent: (id) =>
    set((state) => ({
      agents: state.agents.filter((a) => a && a.id !== id),
    })),
}))

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.isRead).length,
    }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  setLoading: (isLoading) => set({ isLoading }),
}))
