'use client'

import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useRepos, useActivity, useBillingUsage, useConnectedRepositories } from '@/lib/queries'
import { useAuth } from '@/contexts/auth-context'
import { useAnalyticsStore } from '@/lib/store'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { 
  GitBranch, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  FileText,
  Zap,
  Hash,
  BarChart3,
  Plus,
  ArrowRight,
  Github
} from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'
import { format, formatDistanceToNow } from 'date-fns'

function DashboardContent() {
  const { track } = useAnalyticsStore()
  const { isGitHubConnected } = useAuth()
  const { data: repos, isLoading: reposLoading } = useRepos()
  const { data: activity, isLoading: activityLoading } = useActivity()
  const { data: billing } = useBillingUsage()
  const { data: connectedRepos } = useConnectedRepositories()

  useEffect(() => {
    track('view_dashboard')
  }, [track])

  // Calculate metrics
  const totalRepos = repos?.data.length || 0
  const reposWithFreshDocs = repos?.data.filter(r => r.docsFreshness > 80).length || 0
  const activeScans = repos?.data.filter(r => 
    r.lastScan && ['queued', 'parsing', 'embedding', 'generating'].includes(r.lastScan.status)
  ).length || 0
  const avgDocsFreshness = repos?.data.length 
    ? Math.round(repos.data.reduce((acc, r) => acc + r.docsFreshness, 0) / repos.data.length)
    : 0

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'scan_completed':
        return <BarChart3 className="w-4 h-4" />
      case 'repo_added':
        return <GitBranch className="w-4 h-4" />
      case 'qa_asked':
        return <FileText className="w-4 h-4" />
      case 'docs_updated':
        return <FileText className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'scan_completed':
        return 'text-green-600'
      case 'repo_added':
        return 'text-blue-600'
      case 'qa_asked':
        return 'text-purple-600'
      case 'docs_updated':
        return 'text-orange-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <AppShell>
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor your repositories and documentation health
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild>
              <Link href="/repos">
                <Plus className="w-4 h-4 mr-2" />
                Add Repository
              </Link>
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Repositories</CardTitle>
              <GitBranch className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRepos}</div>
              <p className="text-xs text-muted-foreground">
                {reposWithFreshDocs} with fresh docs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Scans</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeScans}</div>
              <p className="text-xs text-muted-foreground">
                Currently processing
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Docs Freshness</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgDocsFreshness}%</div>
              <p className="text-xs text-muted-foreground">
                Average across all repos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usage This Month</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {billing?.data.tokensUsed.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-muted-foreground">
                of {billing?.data.maxTokens.toLocaleString() || '0'} tokens
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest events across your repositories
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activityLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activity?.data ? (
                <div className="space-y-4">
                  {activity.data.slice(0, 5).map((event) => (
                    <div key={event.id} className="flex items-start gap-3">
                      <div className={`p-2 rounded-full bg-muted ${getActivityColor(event.type)}`}>
                        {getActivityIcon(event.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{event.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {event.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {activity.data.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      <Clock className="w-8 h-8 mx-auto mb-2" />
                      <p>No recent activity</p>
                    </div>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Repository Status */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Repository Status</CardTitle>
                <CardDescription>
                  Documentation health across repositories
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/repos">
                  View all
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {reposLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-8 h-8 rounded" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))}
                </div>
              ) : repos?.data ? (
                <div className="space-y-4">
                  {repos.data.slice(0, 5).map((repo) => (
                    <div key={repo.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                          <GitBranch className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {repo.owner}/{repo.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {repo.lastScan?.status ? (
                              <Badge 
                                variant={repo.lastScan.status === 'completed' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {repo.lastScan.status}
                              </Badge>
                            ) : (
                              'No scans'
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {repo.docsFreshness}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          freshness
                        </div>
                      </div>
                    </div>
                  ))}
                  {repos.data.length === 0 && (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <GitBranch className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">
                        {isGitHubConnected ? 'Add Your First Repository' : 'Connect Your First Repository'}
                      </h3>
                      <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                        {isGitHubConnected 
                          ? 'Your GitHub account is connected! Choose repositories to start generating AI-powered documentation.'
                          : 'Connect your GitHub repositories to start generating AI-powered documentation and get intelligent insights about your codebase.'}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        {isGitHubConnected ? (
                          <Button asChild>
                            <Link href="/repos">
                              <Plus className="w-4 h-4 mr-2" />
                              Add Repository
                            </Link>
                          </Button>
                        ) : (
                          <Button asChild>
                            <Link href="/onboarding">
                              <Github className="w-4 h-4 mr-2" />
                              Connect GitHub
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks to keep your documentation up to date
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-2" asChild>
                <Link href="/repos">
                  <Plus className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">Add Repository</div>
                    <div className="text-xs text-muted-foreground">
                      Connect a new codebase
                    </div>
                  </div>
                </Link>
              </Button>

              <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-2" asChild>
                <Link href="/repos?scan=all">
                  <BarChart3 className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">Rescan All</div>
                    <div className="text-xs text-muted-foreground">
                      Update all documentation
                    </div>
                  </div>
                </Link>
              </Button>

              <Button variant="outline" className="h-auto p-4 flex flex-col items-start gap-2" asChild>
                <Link href="/settings">
                  <AlertTriangle className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">Review Settings</div>
                    <div className="text-xs text-muted-foreground">
                      Configure integrations
                    </div>
                  </div>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}
