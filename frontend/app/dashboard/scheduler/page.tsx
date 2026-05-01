'use client'

import { useState } from 'react'
import { useScheduledTasks } from '@/hooks/use-scheduled-tasks'
import { useTasks } from '@/hooks/use-tasks'
import { useAgents } from '@/hooks/use-agents'
import { SchedulerView } from '@/components/scheduler/scheduler-view'
import { ScheduledTaskForm } from '@/components/scheduler/scheduled-task-form'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { ScheduledTask } from '@/lib/types'

export default function SchedulerPage() {
  const { scheduledTasks, createScheduledTask, updateScheduledTask, deleteScheduledTask, toggleScheduledTask } = useScheduledTasks()
  const { tasks } = useTasks()
  const { agents } = useAgents()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingTask, setEditingTask] = useState<ScheduledTask | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreateSchedule = async (data: any) => {
    try {
      setIsSubmitting(true)
      await createScheduledTask(
        data.taskId,
        data.agentId,
        data.cronExpression || '',
        data.isOneTime,
        data.executeAt
      )
      setShowCreateDialog(false)
    } catch (err) {
      console.error('Failed to create scheduled task:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSchedule = async (data: any) => {
    if (!editingTask) return
    try {
      setIsSubmitting(true)
      await updateScheduledTask(editingTask.id, {
        ...data,
        isOneTime: data.isOneTime,
      })
      setEditingTask(null)
    } catch (err) {
      console.error('Failed to update scheduled task:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteSchedule = async (id: string) => {
    try {
      await deleteScheduledTask(id)
    } catch (err) {
      console.error('Failed to delete scheduled task:', err)
    }
  }

  const handleToggleSchedule = async (id: string, enabled: boolean) => {
    try {
      await toggleScheduledTask(id, enabled)
    } catch (err) {
      console.error('Failed to toggle scheduled task:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scheduler</h1>
          <p className="mt-2 text-muted-foreground">
            Schedule one-time and recurring tasks for your agents
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus size={16} className="mr-2" />
          Schedule Task
        </Button>
      </div>

      {/* Scheduler View */}
      <SchedulerView
        scheduledTasks={scheduledTasks}
        tasks={tasks}
        agents={agents}
        onEdit={setEditingTask}
        onDelete={handleDeleteSchedule}
        onToggle={handleToggleSchedule}
        isLoading={isSubmitting}
      />

      {/* Create Schedule Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule New Task</DialogTitle>
            <DialogDescription>
              Schedule a one-time or recurring task for an agent
            </DialogDescription>
          </DialogHeader>
          <ScheduledTaskForm
            tasks={tasks}
            agents={agents}
            onSubmit={handleCreateSchedule}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Schedule Dialog */}
      <Dialog
        open={!!editingTask}
        onOpenChange={(open) => {
          if (!open) setEditingTask(null)
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Schedule</DialogTitle>
            <DialogDescription>
              Update the task schedule
            </DialogDescription>
          </DialogHeader>
          {editingTask && (
            <ScheduledTaskForm
              tasks={tasks}
              agents={agents}
              scheduledTask={editingTask}
              onSubmit={handleEditSchedule}
              isLoading={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
