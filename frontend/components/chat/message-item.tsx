import { Message } from '@/lib/types'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface MessageItemProps {
  message: Message
  isOwn: boolean
  onRetry?: (messageId: string) => void
}

export function MessageItem({ message, isOwn, onRetry }: MessageItemProps) {
  // Handle system messages differently
  if (message.senderType === 'system') {
    return (
      <div className="flex justify-center my-4">
        <div className="text-xs text-muted-foreground bg-muted/50 px-4 py-2 rounded-full max-w-md text-center">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex gap-3', isOwn ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar placeholder */}
      <div
        className={cn(
          'h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold',
          isOwn ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
        )}
      >
        {message.senderType === 'user' ? 'U' : 'A'}
      </div>

      {/* Message content */}
      <div className={cn('flex flex-col gap-1', isOwn ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'max-w-xs break-words rounded-lg px-4 py-2 text-sm',
            message.error
              ? 'bg-destructive/10 border border-destructive/50 text-destructive'
              : isOwn
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {message.content}
          
          {/* Error message */}
          {message.error && (
            <div className="mt-2 pt-2 border-t border-destructive/30 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-medium">Failed to send</p>
                <p className="text-xs opacity-80">{message.error}</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
          </span>
          
          {/* Retry button for failed messages */}
          {message.error && onRetry && !message.isRetrying && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => onRetry(message.id)}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
          
          {/* Retrying indicator */}
          {message.isRetrying && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Retrying...
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
