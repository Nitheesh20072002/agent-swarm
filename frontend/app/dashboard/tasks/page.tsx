'use client'

import { useState } from 'react'
import { useTasks } from '@/hooks/use-tasks'
import { useAgents } from '@/hooks/use-agents'
import { KanbanBoard } from '@/components/tasks/kanban-board'
import { TaskForm } from '@/components/tasks/task-form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Task } from '@/lib/types'

export default function TasksPage() {
  const { tasks, createTask, updateTask, deleteTask } = useTasks()
  const { agents } = useAgents()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreateTask = async (data: Partial<Task>) => {
    try {
      setIsSubmitting(true)
      await createTask(data as Omit<Task, 'id' | 'createdAt' | 'updatedAt'>)
      setShowCreateDialog(false)
    } catch (err) {
      console.error('Failed to create task:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateTask = async (taskId: string, status: string) => {
    try {
      await updateTask(taskId, { status } as Partial<Task>)
    } catch (err) {
      console.error('Failed to update task:', err)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId)
      setSelectedTask(null)
    } catch (err) {
      console.error('Failed to delete task:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Task Board</h1>
          <p className="mt-2 text-muted-foreground">
            Manage and track tasks assigned to agents with a Kanban board
          </p>
        </div>
      </div>

      {/* Kanban Board */}
      <KanbanBoard
        tasks={tasks}
        onCreateTask={() => setShowCreateDialog(true)}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
        onOpenTask={setSelectedTask}
      />

      {/* Create Task Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Create and assign a new task to an agent
            </DialogDescription>
          </DialogHeader>
          <TaskForm
            agents={agents}
            onSubmit={handleCreateTask}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Task Detail Dialog */}
      <Dialog
        open={!!selectedTask}
        onOpenChange={(open) => {
          if (!open) setSelectedTask(null)
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update task details and status
            </DialogDescription>
          </DialogHeader>
          {selectedTask && (
            <TaskForm
              task={selectedTask}
              agents={agents}
              onSubmit={(data) => handleUpdateTask(selectedTask.id, data.status || selectedTask.status)}
              isLoading={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
