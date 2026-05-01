'use client'

import { useState, useEffect, useCallback } from 'react'
import APIClient from '@/lib/api-client'
import { Agent } from '@/lib/types'
import { useAgentStore } from '@/lib/store'

export function useAgents() {
  const {
    agents,
    isLoading,
    error,
    setAgents,
    setLoading,
    setError,
    addAgent,
    updateAgent,
    removeAgent,
  } = useAgentStore()

  // Fetch all agents
  const fetchAgents = useCallback(async () => {
    setLoading(true)
    try {
      const response = await APIClient.get<{ status: string; data: { agents: Agent[]; count: number } }>('/api/v1/agents')
      setAgents(response.data.agents)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch agents')
    } finally {
      setLoading(false)
    }
  }, [setAgents, setLoading, setError])

  // Create new agent
  const createAgent = useCallback(
    async (agentData: Omit<Agent, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isOnline' | 'status'>) => {
      try {
        const response = await APIClient.post<{ status: string; data: { agent: Agent } }>('/api/v1/agents', agentData)
        addAgent(response.data.agent)
        return response.data.agent
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create agent'
        setError(errorMessage)
        throw err
      }
    },
    [addAgent, setError]
  )

  // Update agent
  const updateAgentData = useCallback(
    async (id: string, agentData: Partial<Agent>) => {
      try {
        const response = await APIClient.patch<{ status: string; data: { agent: Agent } }>(`/api/v1/agents/${id}`, agentData)
        updateAgent(id, response.data.agent)
        return response.data.agent
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update agent'
        setError(errorMessage)
        throw err
      }
    },
    [updateAgent, setError]
  )

  // Delete agent
  const deleteAgent = useCallback(
    async (id: string) => {
      try {
        await APIClient.delete(`/api/v1/agents/${id}`)
        removeAgent(id)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete agent'
        setError(errorMessage)
        throw err
      }
    },
    [removeAgent, setError]
  )

  // Load agents on mount
  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  return {
    agents,
    isLoading,
    error,
    fetchAgents,
    createAgent,
    updateAgent: updateAgentData,
    deleteAgent,
  }
}
