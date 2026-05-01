import { Task } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2, Edit } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TaskCardProps {
  task: Task
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
  draggable?: boolean
  onDragStart?: (e: React.DragEvent, taskId: string) => void
}

const priorityColors = {
  low: 'bg-blue-50 text-blue-700 border-blue-200',
  medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  urgent: 'bg-red-50 text-red-700 border-red-200',
}

export function TaskCard({
  task,
  onEdit,
  onDelete,
  draggable = true,
  onDragStart,
}: TaskCardProps) {
  return (
    <Card
      className={cn(
        'p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow',
        draggable ? 'cursor-grab' : 'cursor-default'
      )}
      draggable={draggable}
      onDragStart={(e) => {
        if (onDragStart) onDragStart(e, task.id)
      }}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm line-clamp-2 flex-1">
            {task.title}
          </h3>
          <Badge
            className={cn(
              'flex-shrink-0',
              priorityColors[task.priority as keyof typeof priorityColors]
            )}
            variant="outline"
            size="sm"
          >
            {task.priority}
          </Badge>
        </div>

        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        {task.assignedAgent && (
          <div className="text-xs text-muted-foreground">
            Assigned to: <span className="font-medium">{task.assignedAgent}</span>
          </div>
        )}

        {task.dueDate && (
          <div className="text-xs text-muted-foreground">
            Due: {new Date(task.dueDate).toLocaleDateString()}
          </div>
        )}

        <div className="flex gap-1 pt-2">
          {onEdit && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(task)}
              className="h-6 px-2 text-xs"
            >
              <Edit size={14} />
            </Button>
          )}
          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(task.id)}
              className="h-6 px-2 text-xs text-destructive hover:bg-destructive/10"
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
