'use client'

import { useState } from 'react'
import { Notification } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trash2, Check, CheckCheck, Inbox } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

interface NotificationCenterProps {
  notifications: Notification[]
  unreadCount: number
  onMarkAsRead: (id: string) => Promise<void>
  onMarkAllAsRead: () => Promise<void>
  onDelete: (id: string) => Promise<void>
  onDeleteAll: () => Promise<void>
  isLoading?: boolean
}

const NOTIFICATION_TYPES = {
  agent_message: { label: 'Agent Message', color: 'bg-blue-100 dark:bg-blue-900' },
  task_assigned: { label: 'Task Assigned', color: 'bg-green-100 dark:bg-green-900' },
  task_completed: { label: 'Task Completed', color: 'bg-purple-100 dark:bg-purple-900' },
  group_mention: { label: 'Group Mention', color: 'bg-orange-100 dark:bg-orange-900' },
  error: { label: 'Error', color: 'bg-red-100 dark:bg-red-900' },
  info: { label: 'Info', color: 'bg-slate-100 dark:bg-slate-900' },
}

export function NotificationCenter({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onDeleteAll,
  isLoading = false,
}: NotificationCenterProps) {
  const [showDeleteAll, setShowDeleteAll] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const unreadNotifications = notifications.filter((n) => !n.read)
  const readNotifications = notifications.filter((n) => n.read)

  const handleMarkAsRead = async (id: string) => {
    try {
      setIsProcessing(true)
      await onMarkAsRead(id)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      setIsProcessing(true)
      await onMarkAllAsRead()
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeleteAll = async () => {
    try {
      setIsProcessing(true)
      await onDeleteAll()
      setShowDeleteAll(false)
    } finally {
      setIsProcessing(false)
    }
  }

  const renderNotificationItem = (notification: Notification) => (
    <div
      key={notification.id}
      className={cn(
        'p-4 rounded-lg border transition-colors',
        notification.read ? 'bg-muted/30' : 'bg-background border-blue-200'
      )}
    >
      <div className="flex gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <h3 className="font-semibold text-sm flex-1">
              {notification.title}
            </h3>
            <Badge
              variant="outline"
              className={NOTIFICATION_TYPES[notification.type as keyof typeof NOTIFICATION_TYPES]?.color}
            >
              {NOTIFICATION_TYPES[notification.type as keyof typeof NOTIFICATION_TYPES]?.label || notification.type}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground mt-1">
            {notification.message}
          </p>

          <p className="text-xs text-muted-foreground mt-2">
            {new Date(notification.createdAt).toLocaleString()}
          </p>

          {notification.actionUrl && (
            <Button
              variant="link"
              size="sm"
              className="mt-2 h-auto p-0 text-xs"
              onClick={() => {
                window.location.href = notification.actionUrl!
              }}
            >
              View Details →
            </Button>
          )}
        </div>

        <div className="flex gap-1 flex-shrink-0">
          {!notification.read && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => handleMarkAsRead(notification.id)}
              disabled={isProcessing}
              title="Mark as read"
            >
              <Check size={16} />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => onDelete(notification.id)}
            disabled={isProcessing}
            title="Delete"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>
    </div>
  )

  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Inbox className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">All caught up!</p>
          <p className="text-sm text-muted-foreground mt-1">
            You don&apos;t have any notifications
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      {unreadCount > 0 && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge>{unreadCount} unread</Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={isProcessing}
          >
            <CheckCheck size={16} className="mr-2" />
            Mark all as read
          </Button>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="unread" className="w-full">
        <TabsList>
          <TabsTrigger value="unread" className="relative">
            Unread
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="read">Read</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        {/* Unread Tab */}
        <TabsContent value="unread" className="space-y-3 mt-4">
          {unreadNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <p className="text-muted-foreground">No unread notifications</p>
              </CardContent>
            </Card>
          ) : (
            unreadNotifications.map(renderNotificationItem)
          )}
        </TabsContent>

        {/* Read Tab */}
        <TabsContent value="read" className="space-y-3 mt-4">
          {readNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <p className="text-muted-foreground">No read notifications</p>
              </CardContent>
            </Card>
          ) : (
            readNotifications.map(renderNotificationItem)
          )}
        </TabsContent>

        {/* All Tab */}
        <TabsContent value="all" className="space-y-3 mt-4">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <p className="text-muted-foreground">No notifications</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {notifications.map(renderNotificationItem)}
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setShowDeleteAll(true)}
                disabled={isProcessing}
              >
                <Trash2 size={16} className="mr-2" />
                Delete all notifications
              </Button>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete All Confirmation */}
      <AlertDialog open={showDeleteAll} onOpenChange={setShowDeleteAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Notifications</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All notifications will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteAll}
            disabled={isProcessing}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isProcessing ? 'Deleting...' : 'Delete All'}
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
