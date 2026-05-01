import { Conversation } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageSquare, Users } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface ConversationListProps {
  conversations: Conversation[]
  selectedId?: string
  onSelect: (conversationId: string) => void
  isLoading?: boolean
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  isLoading,
}: ConversationListProps) {
  console.log('🔥🔥🔥 [ConversationList] Component rendered with', conversations.length, 'conversations')
  
  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading conversations...</p>
        </CardContent>
      </Card>
    )
  }

  if (!conversations || conversations.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">Conversations</CardTitle>
          <CardDescription>No conversations yet</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 gap-2">
          <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Start by creating a conversation</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full overflow-hidden flex flex-col">
      <CardHeader className="border-b border-border py-3">
        <CardTitle className="text-lg">Conversations</CardTitle>
        <CardDescription>{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-0">
        <div className="space-y-1 p-2">
          {conversations.filter(conversation => conversation && conversation.id).map((conversation) => (
            <Button
              key={conversation.id}
              variant="ghost"
              className={cn(
                'w-full justify-start h-auto flex-col items-start gap-1 p-3 rounded-lg',
                selectedId === conversation.id && 'bg-accent'
              )}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('[ConversationList] Button clicked for conversation:', conversation.id)
                onSelect(conversation.id)
              }}
            >
              <div className="flex items-center gap-2 w-full">
                {conversation.type === 'group' ? (
                  <Users size={16} />
                ) : (
                  <MessageSquare size={16} />
                )}
                <span className="font-medium text-sm truncate flex-1">
                  {conversation.name || `Chat with agent${conversation.type === 'group' ? 's' : ''}`}
                </span>
              </div>
              {conversation.lastMessageAt && (
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true })}
                </span>
              )}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
