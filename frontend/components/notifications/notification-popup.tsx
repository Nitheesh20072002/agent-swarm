'use client'

import { useEffect, useState } from 'react'
import { Notification } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { X, Bell, AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NotificationPopupProps {
  notification: Notification
  onClose: () => void
  onMarkAsRead?: () => void
}

export function NotificationPopup({
  notification,
  onClose,
  onMarkAsRead,
}: NotificationPopupProps) {
  const [isVisible, setIsVisible] = useState(true)

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      onClose()
    }, 8000)

    return () => clearTimeout(timer)
  }, [onClose])

  if (!isVisible) return null

  const getIcon = () => {
    switch (notification.type) {
      case 'task_assigned':
      case 'task_completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'agent_message':
      case 'group_mention':
        return <Bell className="h-5 w-5 text-blue-600" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return <Info className="h-5 w-5 text-slate-600" />
    }
  }

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'task_assigned':
      case 'task_completed':
        return 'bg-green-50 border-green-200'
      case 'agent_message':
      case 'group_mention':
        return 'bg-blue-50 border-blue-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-slate-50 border-slate-200'
    }
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 max-w-sm rounded-lg border shadow-lg p-4 animate-slide-up',
        getBackgroundColor()
      )}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0">{getIcon()}</div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground">
            {notification.title}
          </p>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {notification.message}
          </p>

          {/* Action Button */}
          {notification.actionUrl && (
            <Button
              variant="link"
              size="sm"
              className="mt-2 h-auto p-0 text-xs"
              onClick={() => {
                window.location.href = notification.actionUrl!
                onClose()
              }}
            >
              View
            </Button>
          )}
        </div>

        <div className="flex gap-1 flex-shrink-0">
          {onMarkAsRead && !notification.read && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => {
                onMarkAsRead()
              }}
              title="Mark as read"
            >
              ✓
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={() => {
              setIsVisible(false)
              onClose()
            }}
          >
            <X size={16} />
          </Button>
        </div>
      </div>
    </div>
  )
}
