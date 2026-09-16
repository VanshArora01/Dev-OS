import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your preferences</p>
      </div>

      <div className="space-y-8">
        <div className="space-y-4">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Profile
          </div>
          <div className="space-y-4 rounded-lg border border-border/40 bg-card/30 p-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm">Name</Label>
              <Input id="name" defaultValue="Developer" disabled className="bg-background/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">Email</Label>
              <Input id="email" type="email" defaultValue="developer@example.com" disabled className="bg-background/50" />
            </div>
            <p className="text-xs text-muted-foreground">
              Profile information is managed through your authentication provider.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Appearance
          </div>
          <div className="space-y-4 rounded-lg border border-border/40 bg-card/30 p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">Dark Mode</Label>
                <div className="text-xs text-muted-foreground">Toggle dark mode theme</div>
              </div>
              <Switch />
            </div>
            <Separator className="bg-border/40" />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">Compact Mode</Label>
                <div className="text-xs text-muted-foreground">Use a more compact layout</div>
              </div>
              <Switch />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Notifications
          </div>
          <div className="space-y-4 rounded-lg border border-border/40 bg-card/30 p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">Email Notifications</Label>
                <div className="text-xs text-muted-foreground">
                  Receive updates about your projects
                </div>
              </div>
              <Switch />
            </div>
            <Separator className="bg-border/40" />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">Project Reminders</Label>
                <div className="text-xs text-muted-foreground">
                  Get reminders for inactive projects
                </div>
              </div>
              <Switch />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Account
          </div>
          <div className="space-y-4 rounded-lg border border-border/40 bg-card/30 p-6">
            <Button variant="outline" size="sm">Change Password</Button>
            <Separator className="bg-border/40" />
            <div className="space-y-2">
              <Button variant="destructive" size="sm">Delete Account</Button>
              <p className="text-xs text-muted-foreground">
                Permanently delete your DevOS account and all associated data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
