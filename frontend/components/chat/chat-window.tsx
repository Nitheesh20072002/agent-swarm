'use client'

import { Conversation } from '@/lib/types'
import { MessageList } from './message-list'
import { ChatInput } from './chat-input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface ChatWindowProps {
  conversation: Conversation
  messages: any[]
  currentUserId: string
  onSendMessage: (content: string) => Promise<void>
  isLoading?: boolean
  isAgentTyping?: boolean
  onRetry?: (messageId: string) => void
  onClose?: () => void
}

export function ChatWindow({
  conversation,
  messages,
  currentUserId,
  onSendMessage,
  isLoading,
  isAgentTyping,
  onRetry,
  onClose,
}: ChatWindowProps) {
  return (
    <Card className="flex h-full flex-col">
      {/* Header */}
      <CardHeader className="border-b border-border flex-row items-center justify-between py-3">
        <div className="flex items-center gap-2">
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="md:hidden"
            >
              <ArrowLeft size={18} />
            </Button>
          )}
          <div>
            <CardTitle className="text-lg">
              {conversation.name || `Chat with agent${conversation.type === 'group' ? 's' : ''}`}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {conversation.participants.length} participant{conversation.participants.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 flex flex-col gap-4 p-0 overflow-hidden">
        <MessageList
          messages={messages}
          currentUserId={currentUserId}
          isLoading={isLoading}
          isAgentTyping={isAgentTyping}
          onRetry={onRetry}
        />

        {/* Input */}
        <div className="border-t border-border p-4">
          <ChatInput
            onSend={onSendMessage}
            isLoading={isLoading}
          />
        </div>
      </CardContent>
    </Card>
  )
}
