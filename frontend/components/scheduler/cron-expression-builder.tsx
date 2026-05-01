'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Info } from 'lucide-react'

interface CronExpressionBuilderProps {
  value?: string
  onChange: (expression: string) => void
}

const COMMON_EXPRESSIONS = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every 5 minutes', value: '*/5 * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Daily at midnight', value: '0 0 * * *' },
  { label: 'Daily at 9 AM', value: '0 9 * * *' },
  { label: 'Every Monday at 9 AM', value: '0 9 * * 1' },
  { label: 'Every weekday at 9 AM', value: '0 9 * * 1-5' },
  { label: 'First day of month', value: '0 0 1 * *' },
  { label: 'Every 12 hours', value: '0 */12 * * *' },
]

export function CronExpressionBuilder({ value = '', onChange }: CronExpressionBuilderProps) {
  const [minute, setMinute] = useState('0')
  const [hour, setHour] = useState('0')
  const [dayOfMonth, setDayOfMonth] = useState('*')
  const [month, setMonth] = useState('*')
  const [dayOfWeek, setDayOfWeek] = useState('*')

  const generateExpression = () => {
    const expression = `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`
    onChange(expression)
  }

  const handleQuickSelect = (expression: string) => {
    onChange(expression)
    // Parse and update fields
    const parts = expression.split(' ')
    if (parts.length === 5) {
      setMinute(parts[0])
      setHour(parts[1])
      setDayOfMonth(parts[2])
      setMonth(parts[3])
      setDayOfWeek(parts[4])
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cron Expression Builder</CardTitle>
        <CardDescription>
          Configure when to run the task automatically
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="builder" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="builder">Builder</TabsTrigger>
            <TabsTrigger value="manual">Manual</TabsTrigger>
          </TabsList>

          {/* Builder Tab */}
          <TabsContent value="builder" className="space-y-4 mt-4">
            {/* Current Expression Display */}
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground mb-1">Current Expression:</p>
              <p className="font-mono text-lg font-semibold break-all">
                {value || 'Not set'}
              </p>
            </div>

            {/* Field Selectors */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <div>
                <Label htmlFor="minute" className="text-xs">
                  Minute
                </Label>
                <Input
                  id="minute"
                  value={minute}
                  onChange={(e) => setMinute(e.target.value)}
                  placeholder="0"
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">0-59</p>
              </div>

              <div>
                <Label htmlFor="hour" className="text-xs">
                  Hour
                </Label>
                <Input
                  id="hour"
                  value={hour}
                  onChange={(e) => setHour(e.target.value)}
                  placeholder="0"
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">0-23</p>
              </div>

              <div>
                <Label htmlFor="day" className="text-xs">
                  Day
                </Label>
                <Input
                  id="day"
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(e.target.value)}
                  placeholder="*"
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">1-31</p>
              </div>

              <div>
                <Label htmlFor="month" className="text-xs">
                  Month
                </Label>
                <Input
                  id="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  placeholder="*"
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">1-12</p>
              </div>

              <div>
                <Label htmlFor="weekday" className="text-xs">
                  Weekday
                </Label>
                <Input
                  id="weekday"
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(e.target.value)}
                  placeholder="*"
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">0-6 (Sun-Sat)</p>
              </div>
            </div>

            <Button onClick={generateExpression} className="w-full">
              Generate Expression
            </Button>

            {/* Quick Presets */}
            <div>
              <Label className="text-sm mb-2 block">Quick Presets</Label>
              <div className="space-y-2">
                {COMMON_EXPRESSIONS.map((preset) => (
                  <Button
                    key={preset.value}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleQuickSelect(preset.value)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Manual Tab */}
          <TabsContent value="manual" className="space-y-4 mt-4">
            <div>
              <Label htmlFor="expression">Cron Expression</Label>
              <Textarea
                id="expression"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="* * * * *"
                rows={3}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Format: minute hour day month weekday
              </p>
            </div>

            {/* Help Section */}
            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 text-blue-600 dark:text-blue-400" />
                  <CardTitle className="text-sm">Cron Format Help</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-xs space-y-1">
                <p>
                  <span className="font-mono font-semibold">*</span> = any value
                </p>
                <p>
                  <span className="font-mono font-semibold">1-5</span> = range
                </p>
                <p>
                  <span className="font-mono font-semibold">*/5</span> = every 5
                </p>
                <p className="mt-2">
                  <strong>Example:</strong> <span className="font-mono">0 9 * * 1-5</span> =
                  every weekday at 9 AM
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
