'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { ScheduledTask, Task, Agent } from '@/lib/types'
import { Trash2, Edit2, Clock } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface SchedulerViewProps {
  scheduledTasks: ScheduledTask[]
  tasks: Task[]
  agents: Agent[]
  onEdit: (task: ScheduledTask) => void
  onDelete: (id: string) => Promise<void>
  onToggle: (id: string, enabled: boolean) => Promise<void>
  isLoading?: boolean
}

export function SchedulerView({
  scheduledTasks,
  tasks,
  agents,
  onEdit,
  onDelete,
  onToggle,
  isLoading = false,
}: SchedulerViewProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const getTaskTitle = (taskId: string) => {
    return tasks.find((t) => t.id === taskId)?.title || 'Unknown Task'
  }

  const getAgentName = (agentId: string) => {
    return agents.find((a) => a.id === agentId)?.name || 'Unknown Agent'
  }

  const formatCron = (cron: string | null) => {
    if (!cron) return '-'
    return cron
  }

  const formatDateTime = (dateTime: string | null) => {
    if (!dateTime) return '-'
    const date = new Date(dateTime)
    return date.toLocaleString()
  }

  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    try {
      setIsDeleting(true)
      await onDelete(deleteId)
      setDeleteId(null)
    } finally {
      setIsDeleting(false)
    }
  }

  if (scheduledTasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Scheduled Tasks</CardTitle>
          <CardDescription>
            Create a scheduled task to automate agent work
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Clock className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No scheduled tasks yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Tasks</CardTitle>
          <CardDescription>
            {scheduledTasks.length} task{scheduledTasks.length !== 1 ? 's' : ''} scheduled
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mobile View */}
          <div className="md:hidden space-y-3">
            {scheduledTasks.map((scheduled) => (
              <Card key={scheduled.id} className="p-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">
                        {getTaskTitle(scheduled.taskId)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {getAgentName(scheduled.agentId)}
                      </p>
                    </div>
                    <Badge variant={scheduled.enabled ? 'default' : 'secondary'}>
                      {scheduled.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-xs">
                    {scheduled.isOneTime ? (
                      <p>
                        <span className="text-muted-foreground">Execute at:</span>{' '}
                        {formatDateTime(scheduled.executeAt)}
                      </p>
                    ) : (
                      <p>
                        <span className="text-muted-foreground">Cron:</span>{' '}
                        {formatCron(scheduled.cronExpression)}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Switch
                      checked={scheduled.enabled}
                      onCheckedChange={(checked) =>
                        onToggle(scheduled.id, checked)
                      }
                      disabled={isLoading}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(scheduled)}
                    >
                      <Edit2 size={16} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeleteId(scheduled.id)}
                      disabled={isDeleting}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduledTasks.map((scheduled) => (
                  <TableRow key={scheduled.id}>
                    <TableCell className="font-medium">
                      {getTaskTitle(scheduled.taskId)}
                    </TableCell>
                    <TableCell>
                      {getAgentName(scheduled.agentId)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {scheduled.isOneTime ? 'One-Time' : 'Recurring'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {scheduled.isOneTime
                        ? formatDateTime(scheduled.executeAt)
                        : formatCron(scheduled.cronExpression)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={scheduled.enabled}
                          onCheckedChange={(checked) =>
                            onToggle(scheduled.id, checked)
                          }
                          disabled={isLoading}
                        />
                        <span className="text-xs">
                          {scheduled.enabled
                            ? 'Enabled'
                            : 'Disabled'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEdit(scheduled)}
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setDeleteId(scheduled.id)
                          }
                          disabled={isDeleting}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Scheduled Task</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The scheduled task will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
