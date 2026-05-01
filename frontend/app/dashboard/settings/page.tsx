'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/use-auth'

export default function SettingsPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              value={user?.email || ''}
              disabled
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Username</label>
            <Input
              value={user?.username || ''}
              disabled
              className="bg-muted"
            />
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Customize your experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Theme</label>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Light</Button>
              <Button variant="outline" size="sm">Dark</Button>
              <Button variant="outline" size="sm">System</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Manage notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Notification settings coming soon
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
