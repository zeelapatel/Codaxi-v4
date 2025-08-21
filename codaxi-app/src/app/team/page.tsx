'use client'

import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Users, 
  UserPlus, 
  Shield, 
  Settings, 
  GitBranch, 
  FileText,
  Sparkles,
  Crown,
  UserCheck,
  Clock
} from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/protected-route'

function TeamContent() {
  return (
    <AppShell>
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
            <p className="text-muted-foreground">
              Manage your team members, roles, and permissions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Coming Soon
            </Badge>
            <Button disabled>
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Member
            </Button>
          </div>
        </div>

        {/* Coming Soon Message */}
        <Card className="border-2 border-dashed border-muted-foreground/25">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Team Management Coming Soon</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                We're building comprehensive team management features to help you collaborate effectively, 
                manage permissions, and track team contributions across your repositories.
              </p>
              <div className="flex flex-wrap justify-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <UserPlus className="w-4 h-4" />
                  Member Invitations
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  Role Management
                </span>
                <span className="flex items-center gap-1">
                  <GitBranch className="w-4 h-4" />
                  Repository Access
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Stats */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="opacity-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Total Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">--</div>
              <p className="text-xs text-muted-foreground mt-1">Active team members</p>
            </CardContent>
          </Card>

          <Card className="opacity-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Crown className="w-5 h-5" />
                Admins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">--</div>
              <p className="text-xs text-muted-foreground mt-1">Administrators</p>
            </CardContent>
          </Card>

          <Card className="opacity-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                Contributors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">--</div>
              <p className="text-xs text-muted-foreground mt-1">Active contributors</p>
            </CardContent>
          </Card>

          <Card className="opacity-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Pending Invites
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">--</div>
              <p className="text-xs text-muted-foreground mt-1">Invitations sent</p>
            </CardContent>
          </Card>
        </div>

        {/* Team Members Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Members
            </CardTitle>
            <CardDescription>
              Manage your team members and their roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Current User */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src="/placeholder-avatar.jpg" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">Current User</div>
                    <div className="text-sm text-muted-foreground">user@example.com</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Owner</Badge>
                  <Button variant="ghost" size="sm" disabled>
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Placeholder Members */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg opacity-50">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>--</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">Team Member {i}</div>
                      <div className="text-sm text-muted-foreground">member{i}@example.com</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Member</Badge>
                    <Button variant="ghost" size="sm" disabled>
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Roles and Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Roles & Permissions
            </CardTitle>
            <CardDescription>
              Define access levels and permissions for your team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 border rounded-lg opacity-50">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold">Owner</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Full access to all features and settings
                </p>
                <div className="text-xs text-muted-foreground">
                  • Manage team members<br/>
                  • Configure settings<br/>
                  • Access all repositories<br/>
                  • Billing management
                </div>
              </div>

              <div className="p-4 border rounded-lg opacity-50">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold">Admin</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Manage repositories and team members
                </p>
                <div className="text-xs text-muted-foreground">
                  • Invite team members<br/>
                  • Manage repositories<br/>
                  • View analytics<br/>
                  • Configure integrations
                </div>
              </div>

              <div className="p-4 border rounded-lg opacity-50">
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold">Member</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Contribute to repositories and view docs
                </p>
                <div className="text-xs text-muted-foreground">
                  • View repositories<br/>
                  • Contribute to docs<br/>
                  • Ask questions<br/>
                  • View analytics
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

export default function TeamPage() {
  return (
    <ProtectedRoute>
      <TeamContent />
    </ProtectedRoute>
  )
}
