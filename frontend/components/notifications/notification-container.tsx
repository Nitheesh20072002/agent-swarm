'use client'

import { useState, useEffect } from 'react'
import { useNotifications } from '@/hooks/use-notifications'
import { NotificationPopup } from './notification-popup'
import { Notification } from '@/lib/types'

// Max 3 notifications visible at once
const MAX_VISIBLE_NOTIFICATIONS = 3

export function NotificationContainer() {
  const { notifications, markAsRead } = useNotifications()
  const [visibleNotifications, setVisibleNotifications] = useState<Notification[]>([])

  // Show most recent unread notifications, up to MAX_VISIBLE_NOTIFICATIONS
  useEffect(() => {
    const unread = notifications
      .filter((n) => !n.read)
      .slice(0, MAX_VISIBLE_NOTIFICATIONS)

    setVisibleNotifications(unread)
  }, [notifications])

  const handleRemoveNotification = (id: string) => {
    setVisibleNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const handleMarkAsRead = (id: string) => {
    markAsRead(id)
  }

  return (
    <div className="fixed inset-0 pointer-events-none">
      <div className="fixed bottom-4 right-4 space-y-3 flex flex-col pointer-events-auto">
        {visibleNotifications.map((notification) => (
          <NotificationPopup
            key={notification.id}
            notification={notification}
            onClose={() => handleRemoveNotification(notification.id)}
            onMarkAsRead={() => handleMarkAsRead(notification.id)}
          />
        ))}
      </div>
    </div>
  )
}
