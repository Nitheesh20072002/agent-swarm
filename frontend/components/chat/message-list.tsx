import { useRef, useEffect } from 'react'
import { Message } from '@/lib/types'
import { MessageItem } from './message-item'
import { TypingIndicator } from './typing-indicator'
import { Card, CardContent } from '@/components/ui/card'

interface MessageListProps {
  messages: Message[]
  currentUserId: string
  isLoading?: boolean
  isAgentTyping?: boolean
  onRetry?: (messageId: string) => void
}

export function MessageList({ messages, currentUserId, isLoading, isAgentTyping, onRetry }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (isLoading) {
    return (
      <Card className="flex-1">
        <CardContent className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading messages...</p>
        </CardContent>
      </Card>
    )
  }

  if (messages.length === 0) {
    return (
      <Card className="flex-1">
        <CardContent className="flex flex-col items-center justify-center h-96 gap-2">
          <p className="text-muted-foreground">No messages yet</p>
          <p className="text-xs text-muted-foreground">
            Start the conversation by sending a message
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-background rounded-lg border border-border">
      {messages.filter(msg => msg && msg.id).map((message, index) => (
        <MessageItem
          key={message.id}
          message={message}
          isOwn={message.senderId === currentUserId}
          onRetry={onRetry}
        />
      ))}
      
      {/* Show typing indicator when agent is typing */}
      {isAgentTyping && <TypingIndicator />}
      
      <div ref={endRef} />
    </div>
  )
}
