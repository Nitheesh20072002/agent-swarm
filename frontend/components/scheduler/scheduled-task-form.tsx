'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CronExpressionBuilder } from './cron-expression-builder'
import { Task, Agent, ScheduledTask } from '@/lib/types'

interface ScheduledTaskFormProps {
  tasks: Task[]
  agents: Agent[]
  scheduledTask?: ScheduledTask
  onSubmit: (data: any) => Promise<void>
  isLoading?: boolean
}

export function ScheduledTaskForm({
  tasks,
  agents,
  scheduledTask,
  onSubmit,
  isLoading = false,
}: ScheduledTaskFormProps) {
  const [scheduleType, setScheduleType] = useState<'recurring' | 'oneTime'>(
    scheduledTask?.isOneTime ? 'oneTime' : 'recurring'
  )
  const [cronExpression, setCronExpression] = useState(scheduledTask?.cronExpression || '')
  const [executeAt, setExecuteAt] = useState(
    scheduledTask?.executeAt ? new Date(scheduledTask.executeAt).toISOString().slice(0, 16) : ''
  )

  const form = useForm({
    defaultValues: {
      taskId: scheduledTask?.taskId || '',
      agentId: scheduledTask?.agentId || '',
    },
  })

  const handleSubmit = async () => {
    const formData = form.getValues()

    if (!formData.taskId || !formData.agentId) {
      return
    }

    if (scheduleType === 'recurring' && !cronExpression) {
      return
    }

    if (scheduleType === 'oneTime' && !executeAt) {
      return
    }

    await onSubmit({
      taskId: formData.taskId,
      agentId: formData.agentId,
      isOneTime: scheduleType === 'oneTime',
      cronExpression: scheduleType === 'recurring' ? cronExpression : null,
      executeAt: scheduleType === 'oneTime' ? new Date(executeAt).toISOString() : null,
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }} className="space-y-6">
        {/* Task Selection */}
        <FormField
          control={form.control}
          name="taskId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select Task</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a task" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {tasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Select the task to schedule</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Agent Selection */}
        <FormField
          control={form.control}
          name="agentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assign to Agent</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an agent" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Select the agent to execute the task</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Schedule Type Tabs */}
        <div>
          <Label className="text-base mb-3 block">Schedule Type</Label>
          <Tabs
            value={scheduleType}
            onValueChange={(value) => setScheduleType(value as 'recurring' | 'oneTime')}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="recurring">Recurring</TabsTrigger>
              <TabsTrigger value="oneTime">One Time</TabsTrigger>
            </TabsList>

            {/* Recurring Tab */}
            <TabsContent value="recurring" className="mt-4">
              <CronExpressionBuilder
                value={cronExpression}
                onChange={setCronExpression}
              />
            </TabsContent>

            {/* One Time Tab */}
            <TabsContent value="oneTime" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Schedule One-Time Execution</CardTitle>
                  <CardDescription>
                    Task will execute once at the specified date and time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label htmlFor="executeAt">Date and Time</Label>
                    <Input
                      id="executeAt"
                      type="datetime-local"
                      value={executeAt}
                      onChange={(e) => setExecuteAt(e.target.value)}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Select when to execute the task
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Submit Button */}
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading
            ? 'Scheduling...'
            : scheduledTask
            ? 'Update Schedule'
            : 'Create Schedule'}
        </Button>
      </form>
    </Form>
  )
}
