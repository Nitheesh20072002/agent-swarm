'use client'

import { useState } from 'react'
import { TaskCard } from './task-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Task } from '@/lib/types'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface KanbanBoardProps {
  tasks: Task[]
  onCreateTask: () => void
  onUpdateTask: (taskId: string, status: string) => Promise<void>
  onDeleteTask: (taskId: string) => Promise<void>
  onOpenTask: (task: Task) => void
}

const COLUMNS = [
  { id: 'todo', title: 'To Do', color: 'bg-slate-100 dark:bg-slate-900' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-blue-100 dark:bg-blue-900' },
  { id: 'in_review', title: 'In Review', color: 'bg-purple-100 dark:bg-purple-900' },
  { id: 'done', title: 'Done', color: 'bg-green-100 dark:bg-green-900' },
]

export function KanbanBoard({
  tasks,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onOpenTask,
}: KanbanBoardProps) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)

  const getTasksByStatus = (status: string) => {
    return tasks.filter((task) => task.status === status)
  }

  const handleDragStart = (task: Task) => {
    setDraggedTask(task)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (status: string) => {
    if (!draggedTask) return
    if (draggedTask.status === status) {
      setDraggedTask(null)
      return
    }

    try {
      await onUpdateTask(draggedTask.id, status)
      setDraggedTask(null)
    } catch (err) {
      console.error('Failed to update task:', err)
      setDraggedTask(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Task Board</h2>
        <Button onClick={onCreateTask} size="sm">
          <Plus size={16} className="mr-2" />
          New Task
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 overflow-x-auto pb-4">
        {COLUMNS.map((column) => {
          const columnTasks = getTasksByStatus(column.id)

          return (
            <div
              key={column.id}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(column.id)}
              className="flex flex-col min-h-[500px] rounded-lg border-2 border-dashed border-muted-foreground/25 p-4 space-y-4"
            >
              {/* Column Header */}
              <div className={`rounded-lg p-3 ${column.color}`}>
                <h3 className="font-semibold flex items-center gap-2">
                  {column.title}
                  <span className="text-xs font-mono ml-auto bg-background rounded px-2 py-1">
                    {columnTasks.length}
                  </span>
                </h3>
              </div>

              {/* Tasks */}
              <div className="space-y-3 flex-1">
                {columnTasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No tasks</p>
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => handleDragStart(task)}
                      className="cursor-grab active:cursor-grabbing"
                    >
                      <TaskCard
                        task={task}
                        onDelete={() => onDeleteTask(task.id)}
                        onClick={() => onOpenTask(task)}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
