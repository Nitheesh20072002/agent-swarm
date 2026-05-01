'use client'

import { useNotifications } from '@/hooks/use-notifications'
import { NotificationCenter } from '@/components/notifications/notification-center'
import { Spinner } from '@/components/ui/spinner'
import { Card, CardContent } from '@/components/ui/card'

export default function NotificationsPage() {
  const {
    notifications,
    isLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  } = useNotifications()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="mt-2 text-muted-foreground">
          Manage notifications from agents, tasks, and system events
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card className="flex items-center justify-center py-12">
          <Spinner className="h-8 w-8" />
        </Card>
      )}

      {/* Notification Center */}
      {!isLoading && (
        <NotificationCenter
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onDelete={deleteNotification}
          onDeleteAll={deleteAllNotifications}
        />
      )}
    </div>
  )
}
