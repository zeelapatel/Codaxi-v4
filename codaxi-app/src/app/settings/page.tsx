'use client'

import { useState } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useOrganization } from '@/lib/queries'
import { useAnalyticsStore } from '@/lib/store'
import { 
  Settings, 
  Users, 
  Shield, 
  Bell, 
  Palette, 
  Download, 
  Trash2,
  ExternalLink,
  Save
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { useEffect } from 'react'

export default function SettingsPage() {
  const { track } = useAnalyticsStore()
  const { theme, setTheme } = useTheme()
  const { data: organization } = useOrganization()
  const [settings, setSettings] = useState({
    organizationName: '',
    slug: '',
    dataRetentionDays: 90,
    docsAsCodeEnabled: true,
    slackIntegrationEnabled: false,
    emailNotifications: true,
    scanNotifications: true,
    weeklyReports: false
  })

  useEffect(() => {
    track('view_settings')
    if (organization?.data) {
      setSettings({
        organizationName: organization.data.name,
        slug: organization.data.slug,
        dataRetentionDays: organization.data.settings.dataRetentionDays,
        docsAsCodeEnabled: organization.data.settings.docsAsCodeEnabled,
        slackIntegrationEnabled: organization.data.settings.slackIntegrationEnabled,
        emailNotifications: true,
        scanNotifications: true,
        weeklyReports: false
      })
    }
  }, [track, organization])

  const handleSave = () => {
    track('settings_save', settings)
    toast.success('Settings saved successfully')
  }

  return (
    <AppShell>
      <div className="p-6 max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your organization preferences and integrations
          </p>
        </div>

        {/* Organization Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Organization
            </CardTitle>
            <CardDescription>
              Basic information about your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  value={settings.organizationName}
                  onChange={(e) => setSettings(prev => ({ ...prev, organizationName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-slug">URL Slug</Label>
                <Input
                  id="org-slug"
                  value={settings.slug}
                  onChange={(e) => setSettings(prev => ({ ...prev, slug: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div className="space-y-1">
                <Label>Plan Type</Label>
                <div className="text-sm text-muted-foreground">
                  Current plan: <Badge>{organization?.data.planType || 'team'}</Badge>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                Manage Billing
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize the look and feel of the application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Theme</Label>
                <div className="text-sm text-muted-foreground">
                  Choose your preferred color scheme
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('light')}
                >
                  Light
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('dark')}
                >
                  Dark
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('system')}
                >
                  System
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data & Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Data & Privacy
            </CardTitle>
            <CardDescription>
              Control how your data is stored and processed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Data Retention</Label>
                <div className="text-sm text-muted-foreground">
                  How long to keep scan results and documentation
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={settings.dataRetentionDays}
                  onChange={(e) => setSettings(prev => ({ ...prev, dataRetentionDays: parseInt(e.target.value) }))}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Docs-as-Code Integration</Label>
                <div className="text-sm text-muted-foreground">
                  Automatically sync documentation with your repositories
                </div>
              </div>
              <Switch
                checked={settings.docsAsCodeEnabled}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, docsAsCodeEnabled: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure when and how you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Email Notifications</Label>
                <div className="text-sm text-muted-foreground">
                  Receive important updates via email
                </div>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emailNotifications: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Scan Completion</Label>
                <div className="text-sm text-muted-foreground">
                  Get notified when repository scans complete
                </div>
              </div>
              <Switch
                checked={settings.scanNotifications}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, scanNotifications: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Weekly Reports</Label>
                <div className="text-sm text-muted-foreground">
                  Receive weekly summaries of activity
                </div>
              </div>
              <Switch
                checked={settings.weeklyReports}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, weeklyReports: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Integrations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="w-5 h-5" />
              Integrations
            </CardTitle>
            <CardDescription>
              Connect with external services and tools
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Slack Integration</Label>
                <div className="text-sm text-muted-foreground">
                  Send notifications to Slack channels
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={settings.slackIntegrationEnabled}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, slackIntegrationEnabled: checked }))}
                />
                {settings.slackIntegrationEnabled && (
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Available Integrations</Label>
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  { name: 'GitHub Actions', description: 'Trigger scans on commits', available: true },
                  { name: 'GitLab CI/CD', description: 'Integrate with pipelines', available: true },
                  { name: 'Jira', description: 'Link docs to tickets', available: false },
                  { name: 'Confluence', description: 'Sync documentation', available: false }
                ].map((integration) => (
                  <div key={integration.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{integration.name}</div>
                      <div className="text-xs text-muted-foreground">{integration.description}</div>
                    </div>
                    <Button 
                      variant={integration.available ? "outline" : "ghost"} 
                      size="sm"
                      disabled={!integration.available}
                    >
                      {integration.available ? 'Connect' : 'Coming Soon'}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Data Export
            </CardTitle>
            <CardDescription>
              Export your data for backup or migration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export All Data
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Documentation
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              Exports include all repositories, scans, documentation, and Q&A history.
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions that permanently affect your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50 dark:border-red-900 dark:bg-red-950/20">
              <div>
                <div className="font-medium text-red-700 dark:text-red-400">Delete Organization</div>
                <div className="text-sm text-red-600 dark:text-red-500">
                  Permanently delete this organization and all associated data
                </div>
              </div>
              <Button variant="destructive" size="sm">
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} size="lg">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </AppShell>
  )
}
