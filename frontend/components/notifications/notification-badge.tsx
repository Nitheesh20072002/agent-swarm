'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface NotificationBadgeProps {
  count: number
  className?: string
}

export function NotificationBadge({ count, className }: NotificationBadgeProps) {
  if (count === 0) return null

  return (
    <Badge
      variant="destructive"
      className={cn('absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs', className)}
    >
      {count > 99 ? '99+' : count}
    </Badge>
  )
}
