
'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, ArrowLeft, Bot } from 'lucide-react'
import APIClient from '@/lib/api-client'
import { useAgents } from '@/hooks/use-agents'
import { useAuth } from '@/hooks/use-auth'
import { wsClient } from '@/lib/websocket'
import { Message, Conversation } from '@/lib/types'

export default function ConversationPage() {
  const params = useParams()
  const router = useRouter()
  const conversationId = params.id as string
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isAgentTyping, setIsAgentTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { agents } = useAgents()
  const { user } = useAuth()

  // Get agent info
  const agent = agents?.find(a => a.id === conversation?.participants?.[0])

  // Fetch conversation and messages
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch messages
        const messagesRes = await APIClient.get<{
          status: string
          data: { messages: Message[] }
        }>(`/api/v1/conversations/${conversationId}/messages`)
        // Reverse messages since they come in DESC order (newest first) but we want to display oldest first
        const messages = messagesRes.data?.messages || []
        setMessages(messages.reverse())
        
        // Fetch conversation details
        const conversations = await APIClient.get<{
          status: string
          data: { conversations: Conversation[] }
        }>('/api/v1/conversations')
        const conv = conversations.data.conversations.find(c => c.id === conversationId)
        setConversation(conv || null)
      } catch (error) {
        console.error('Failed to fetch conversation:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (conversationId) {
      fetchData()
    }
  }, [conversationId])

  // Setup WebSocket for real-time messages
  useEffect(() => {
    if (!conversationId) return
    
    console.log('[ConversationPage] Setting up WebSocket for conversation:', conversationId)
    
    // Listen for new messages
    const handleMessage = (data: any) => {
      console.log('[ConversationPage] Received message via WebSocket:', data)
      if (data.conversationId === conversationId && data.message && data.message.id) {
        setMessages(prev => {
          // Filter out any undefined messages and check for duplicates
          const validMessages = prev.filter(msg => msg && msg.id)
          if (validMessages.some(msg => msg.id === data.message.id)) {
            console.log('[ConversationPage] Message already exists, skipping')
            return validMessages
          }
          console.log('[ConversationPage] Adding new message to state')
          return [...validMessages, data.message]
        })
        
        // Hide typing indicator when agent message arrives
        if (data.message.senderType === 'agent' || data.message.senderType === 'system') {
          setIsAgentTyping(false)
        }
      }
    }
    
    // Listen for typing indicators
    const handleTypingStart = (data: any) => {
      console.log('[ConversationPage] Agent started typing')
      if (data.conversationId === conversationId) {
        setIsAgentTyping(true)
      }
    }
    
    const handleTypingStop = (data: any) => {
      console.log('[ConversationPage] Agent stopped typing')
      if (data.conversationId === conversationId) {
        setIsAgentTyping(false)
      }
    }
    
    // Register listeners first
    wsClient.on('message', handleMessage)
    wsClient.on('typing:start', handleTypingStart)
    wsClient.on('typing:stop', handleTypingStop)
    
    // Wait for WebSocket to connect before joining
    const joinConversation = () => {
      if (wsClient.isConnected()) {
        console.log('[ConversationPage] WebSocket connected, joining conversation')
        wsClient.send('join:conversation', { conversationId })
        console.log('[ConversationPage] Sent join:conversation event')
        return true
      }
      return false
    }
    
    // Try to join immediately if already connected
    if (!joinConversation()) {
      console.log('[ConversationPage] WebSocket not connected yet, waiting...')
      // If not connected, retry every 500ms for up to 5 seconds
      const maxRetries = 10
      let retries = 0
      const intervalId = setInterval(() => {
        retries++
        if (joinConversation()) {
          clearInterval(intervalId)
        } else if (retries >= maxRetries) {
          console.error('[ConversationPage] Failed to connect to WebSocket after', maxRetries, 'retries')
          clearInterval(intervalId)
        }
      }, 500)
      
      // Return cleanup that includes both interval and listeners
      return () => {
        clearInterval(intervalId)
        console.log('[ConversationPage] Cleaning up - leaving conversation:', conversationId)
        wsClient.off('message', handleMessage)
        wsClient.off('typing:start', handleTypingStart)
        wsClient.off('typing:stop', handleTypingStop)
        if (wsClient.isConnected()) {
          wsClient.send('leave:conversation', { conversationId })
        }
      }
    }
    
    // Cleanup when component unmounts
    return () => {
      console.log('[ConversationPage] Cleaning up - leaving conversation:', conversationId)
      wsClient.off('message', handleMessage)
      wsClient.off('typing:start', handleTypingStart)
      wsClient.off('typing:stop', handleTypingStop)
      if (wsClient.isConnected()) {
        wsClient.send('leave:conversation', { conversationId })
      }
    }
  }, [conversationId])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!message.trim() || isSending) return
    
    try {
      setIsSending(true)
      const content = message.trim()
      setMessage('')
      
      // Optimistic update - add user message immediately
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        conversationId,
        senderId: user?.id || '',
        senderType: 'user',
        content,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      setMessages(prev => [...prev.filter(msg => msg && msg.id), optimisticMessage])
      
      // Show typing indicator
      setIsAgentTyping(true)
      
      // Send message
      const response = await APIClient.post<{
        status: string
        data: { message: Message }
      }>(`/api/v1/conversations/${conversationId}/messages`, { content })
      
      // Replace optimistic message with real one
      setMessages(prev =>
        prev.filter(msg => msg && msg.id).map(msg =>
          msg.id === optimisticMessage.id ? response.data.message : msg
        )
      )
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessage(message) // Restore message on error
      setIsAgentTyping(false)
    } finally {
      setIsSending(false)
    }
  }

  const formatTime = (date: Date | string) => {
    const d = new Date(date)
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="text-muted-foreground">Loading conversation...</div>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="text-muted-foreground">Conversation not found</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Chat Header */}
      <Card className="rounded-b-none border-b-0">
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/dashboard')}
                className="lg:hidden"
              >
                <ArrowLeft size={18} />
              </Button>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-primary">
                {agent?.name?.charAt(0) || '?'}
              </div>
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  {agent?.name || conversation.name || 'Chat'}
                  <Bot size={16} className="text-primary" />
                </h2>
                <p className="text-xs text-muted-foreground">
                  {agent?.status || 'Active'}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Messages Area */}
      <Card className="flex-1 rounded-none border-x-0 overflow-hidden">
        <CardContent className="h-full p-0">
          <div className="h-full overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.filter(msg => msg && msg.id).map((msg) => {
                const isMe = msg.senderType === 'user'
                const isSystem = msg.senderType === 'system'
                
                if (isSystem) {
                  return (
                    <div key={msg.id} className="flex justify-center">
                      <div className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                        {msg.content}
                      </div>
                    </div>
                  )
                }
                
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-3 max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      {!isMe && (
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {agent?.name?.charAt(0) || 'A'}
                        </div>
                      )}
                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        {!isMe && (
                          <span className="text-xs font-semibold text-muted-foreground mb-1 px-4">
                            {agent?.name || 'Agent'}
                          </span>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-2.5 ${
                            isMe
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        <span className="text-xs text-muted-foreground mt-1 px-4">
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            {isAgentTyping && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[70%]">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {agent?.name?.charAt(0) || 'A'}
                  </div>
                  <div className="bg-muted rounded-2xl px-4 py-2.5">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
      </Card>

      {/* Message Input */}
      <Card className="rounded-t-none border-t-0">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Input
              placeholder={`Message ${agent?.name || 'agent'}...`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              disabled={isSending}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim() || isSending}
            >
              <Send size={18} />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
