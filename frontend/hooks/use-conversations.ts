'use client'

import { useState, useEffect, useCallback } from 'react'
import APIClient from '@/lib/api-client'
import { Conversation, Message } from '@/lib/types'
import { wsClient } from '@/lib/websocket'

interface ConversationStore {
  conversations: Conversation[]
  selectedConversationId: string | null
  messages: Map<string, Message[]>
}

export function useConversations() {
  const [store, setStore] = useState<ConversationStore>({
    conversations: [],
    selectedConversationId: null,
    messages: new Map(),
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAgentTyping, setIsAgentTyping] = useState(false)

  // Fetch all conversations
  const fetchConversations = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await APIClient.get<{ status: string; data: { conversations: Conversation[] } }>('/api/v1/conversations')
      // Filter out any undefined or invalid conversations
      const validConversations = (response.data.conversations || []).filter(c => c && c.id)
      setStore((prev) => ({ ...prev, conversations: validConversations }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch conversations')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      const response = await APIClient.get<{ status: string; data: { messages: Message[] } }>(`/api/v1/conversations/${conversationId}/messages`)
      setStore((prev) => ({
        ...prev,
        messages: new Map(prev.messages).set(conversationId, response.data.messages),
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages')
    }
  }, [])

  // Create new conversation
  const createConversation = useCallback(
    async (type: 'direct' | 'group', participants: string[], name?: string) => {
      try {
        // For direct conversations, send agentId instead of participants array
        const payload = type === 'direct'
          ? { agentId: participants[0], title: name }
          : { type, participants, name }
        
        const response = await APIClient.post<{ status: string; data: { conversation: Conversation } }>('/api/v1/conversations', payload)
        const conversation = response.data.conversation
        
        setStore((prev) => ({
          ...prev,
          conversations: [...(prev.conversations || []), conversation],
        }))
        
        // Refresh conversation list to ensure sync with server
        await fetchConversations()
        
        return conversation
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create conversation'
        setError(errorMessage)
        throw err
      }
    },
    [fetchConversations]
  )

  // Send message
  const sendMessage = useCallback(
    async (conversationId: string, content: string, mentionedAgents?: string[]) => {
      // Create optimistic message
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        conversationId,
        senderId: '', // Will be set by server
        senderType: 'user',
        content,
        mentionedAgents,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Add optimistic message immediately
      setStore((prev) => {
        const messages = new Map(prev.messages)
        const conversationMessages = messages.get(conversationId) || []
        messages.set(conversationId, [...conversationMessages, optimisticMessage])
        return { ...prev, messages }
      })

      try {
        // Show agent typing indicator
        setIsAgentTyping(true)

        const response = await APIClient.post<{ status: string; data: { message: Message } }>(
          `/api/v1/conversations/${conversationId}/messages`,
          {
            content,
            mentionedAgents,
          }
        )
        const message = response.data.message

        // Replace optimistic message with real one
        setStore((prev) => {
          const messages = new Map(prev.messages)
          const conversationMessages = messages.get(conversationId) || []
          const updatedMessages = conversationMessages
            .filter(msg => msg && msg.id)
            .map((msg) => msg.id === optimisticMessage.id ? message : msg)
          messages.set(conversationId, updatedMessages)
          return { ...prev, messages }
        })

        // Emit via WebSocket
        wsClient.sendMessage(conversationId, content, mentionedAgents)

        // Refresh conversation list to update lastMessageAt timestamp
        await fetchConversations()

        return message
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to send message'
        
        // Update optimistic message with error
        setStore((prev) => {
          const messages = new Map(prev.messages)
          const conversationMessages = messages.get(conversationId) || []
          const updatedMessages = conversationMessages.map((msg) =>
            msg.id === optimisticMessage.id
              ? { ...msg, error: errorMessage }
              : msg
          )
          messages.set(conversationId, updatedMessages)
          return { ...prev, messages }
        })

        setError(errorMessage)
        throw err
      } finally {
        // Don't hide typing indicator here - it will be hidden when agent message arrives via WebSocket
      }
    },
    [fetchConversations]
  )

  // Retry failed message
  const retryMessage = useCallback(
    async (messageId: string) => {
      const conversationId = store.selectedConversationId
      if (!conversationId) return

      const conversationMessages = store.messages.get(conversationId) || []
      const message = conversationMessages.find((m) => m.id === messageId)
      if (!message || !message.error) return

      // Mark message as retrying
      setStore((prev) => {
        const messages = new Map(prev.messages)
        const conversationMessages = messages.get(conversationId) || []
        const updatedMessages = conversationMessages.map((msg) =>
          msg.id === messageId
            ? { ...msg, isRetrying: true, error: undefined }
            : msg
        )
        messages.set(conversationId, updatedMessages)
        return { ...prev, messages }
      })

      try {
        setIsAgentTyping(true)

        const response = await APIClient.post<{ status: string; data: { message: Message } }>(
          `/api/v1/conversations/${conversationId}/messages`,
          {
            content: message.content,
            mentionedAgents: message.mentionedAgents,
          }
        )
        const newMessage = response.data.message

        // Replace failed message with successful one
        setStore((prev) => {
          const messages = new Map(prev.messages)
          const conversationMessages = messages.get(conversationId) || []
          const updatedMessages = conversationMessages.map((msg) =>
            msg.id === messageId ? newMessage : msg
          )
          messages.set(conversationId, updatedMessages)
          return { ...prev, messages }
        })

        // Emit via WebSocket
        wsClient.sendMessage(conversationId, message.content, message.mentionedAgents)

        // Refresh conversation list
        await fetchConversations()

        setError(null)
        return newMessage
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to retry message'

        // Restore error state
        setStore((prev) => {
          const messages = new Map(prev.messages)
          const conversationMessages = messages.get(conversationId) || []
          const updatedMessages = conversationMessages.map((msg) =>
            msg.id === messageId
              ? { ...msg, error: errorMessage, isRetrying: false }
              : msg
          )
          messages.set(conversationId, updatedMessages)
          return { ...prev, messages }
        })

        setError(errorMessage)
        throw err
      } finally {
        // Don't hide typing indicator here - it will be hidden when agent message arrives via WebSocket
      }
    },
    [store.selectedConversationId, store.messages, fetchConversations]
  )

  // Select conversation
  const selectConversation = useCallback((conversationId: string | null) => {
    console.log('======================================')
    console.log('[useConversations] >>> START selectConversation', conversationId)
    console.log('[useConversations] Current selectedId:', store.selectedConversationId)
    console.log('======================================')
    
    // Leave previous conversation room
    if (store.selectedConversationId) {
      console.log('[useConversations] Leaving previous conversation', store.selectedConversationId)
      wsClient.send('leave:conversation', { conversationId: store.selectedConversationId })
    }
    
    setStore((prev) => ({ ...prev, selectedConversationId: conversationId }))
    
    // Join new conversation room for real-time updates
    if (conversationId) {
      console.log('[useConversations] Joining conversation room', conversationId)
      wsClient.send('join:conversation', { conversationId })
      
      // Fetch messages if not already loaded
      if (!store.messages.has(conversationId)) {
        console.log('[useConversations] Fetching messages for conversation', conversationId)
        fetchMessages(conversationId)
      }
    }
    
    console.log('[useConversations] >>> END selectConversation')
  }, [store.selectedConversationId, store.messages, fetchMessages])

  // Set up WebSocket listeners
  useEffect(() => {
    const handleMessage = (data: any) => {
      console.log('[useConversations] Received message via WebSocket', data)
      const { conversationId, message } = data
      
      // Validate message before adding
      if (!message || !message.id) {
        console.warn('[useConversations] Received invalid message, skipping:', message)
        return
      }
      
      // Hide typing indicator when agent message arrives
      if (message.senderType === 'agent' || message.senderType === 'system') {
        console.log('[useConversations] Hiding typing indicator')
        setIsAgentTyping(false)
      }
      
      setStore((prev) => {
        const messages = new Map(prev.messages)
        const conversationMessages = (messages.get(conversationId) || []).filter(msg => msg && msg.id)
        
        // Check if message already exists to prevent duplicates
        if (conversationMessages.some(msg => msg.id === message.id)) {
          console.log('[useConversations] Message already exists, skipping duplicate')
          return prev
        }
        
        console.log('[useConversations] Adding message to conversation', conversationId, 'Current count:', conversationMessages.length)
        messages.set(conversationId, [...conversationMessages, message])
        return { ...prev, messages }
      })
    }
    
    // Listen for typing indicators
    const handleTypingStart = (data: any) => {
      if (data.conversationId === store.selectedConversationId) {
        setIsAgentTyping(true)
      }
    }
    
    const handleTypingStop = (data: any) => {
      if (data.conversationId === store.selectedConversationId) {
        setIsAgentTyping(false)
      }
    }

    wsClient.on('message', handleMessage)
    wsClient.on('typing:start', handleTypingStart)
    wsClient.on('typing:stop', handleTypingStop)

    return () => {
      wsClient.off('message', handleMessage)
      wsClient.off('typing:start', handleTypingStart)
      wsClient.off('typing:stop', handleTypingStop)
    }
  }, [store.selectedConversationId])

  // Load conversations on mount
  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  return {
    conversations: store.conversations,
    selectedConversationId: store.selectedConversationId,
    messages: store.messages.get(store.selectedConversationId || '') || [],
    isLoading,
    isAgentTyping,
    error,
    fetchConversations,
    fetchMessages,
    createConversation,
    sendMessage,
    retryMessage,
    selectConversation,
  }
}
