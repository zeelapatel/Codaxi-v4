'use client'

import { useParams, useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { useAnalyticsStore } from '@/lib/store'
import { 
  GitBranch, 
  Star, 
  StarOff, 
  ExternalLink,
  Settings,
  BarChart3,
  FileText,
  MessageSquare,
  GitCommit,
  Network,
  Calendar,
  Users,
  Eye,
  Lock
} from 'lucide-react'
import { useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ScanTab } from '@/components/repo/scan-tab'
import { DocsTab } from '@/components/repo/docs-tab'
import { QATab } from '@/components/repo/qa-tab'
import { ChangelogTab } from '@/components/repo/changelog-tab'
import { GraphTab } from '@/components/repo/graph-tab'
import { useRepo as useRepoQuery } from '@/lib/queries'

export default function RepoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const repoId = params.id as string
  const { track } = useAnalyticsStore()
  const { data: repo, isLoading } = useRepoQuery(repoId)

  useEffect(() => {
    track('view_repo_detail', { repoId })
  }, [track, repoId])

  if (isLoading) {
    return (
      <AppShell>
        <div className="p-6 space-y-6">
          {/* Header skeleton */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-28" />
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
          
          {/* Tabs skeleton */}
          <div className="space-y-4">
            <div className="flex gap-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-20" />
              ))}
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </AppShell>
    )
  }

  if (!repo?.data) {
    return (
      <AppShell>
        <div className="p-6">
          <Card className="p-12 text-center">
            <GitBranch className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Repository not found</h3>
            <p className="text-muted-foreground mb-4">
              The repository you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
            </p>
            <Button onClick={() => router.back()}>
              Go Back
            </Button>
          </Card>
        </div>
      </AppShell>
    )
  }

  const repoData = repo.data

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                {repoData.owner}/{repoData.name}
                {repoData.isFavorite ? (
                  <Star className="w-6 h-6 text-yellow-500 fill-current" />
                ) : (
                  <StarOff className="w-6 h-6 text-muted-foreground" />
                )}
              </h1>
              <p className="text-muted-foreground mt-1">
                {repoData.description || 'No description provided'}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                View on {repoData.provider}
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
          
          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              {repoData.visibility === 'private' ? (
                <Lock className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              <span className="capitalize">{repoData.visibility}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <GitBranch className="w-4 h-4" />
              <span>{repoData.defaultBranch}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>
                Updated {formatDistanceToNow(new Date(repoData.updatedAt), { addSuffix: true })}
              </span>
            </div>
            
            {repoData.starCount && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4" />
                <span>{repoData.starCount.toLocaleString()} stars</span>
              </div>
            )}
            
            <div className="flex gap-1">
              {repoData.languages.map((lang) => (
                <Badge key={lang} variant="secondary" className="text-xs">
                  {lang.toUpperCase()}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="scan" className="space-y-6">
          <TabsList>
            <TabsTrigger value="scan" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Scan
            </TabsTrigger>
            <TabsTrigger value="docs" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Documentation
            </TabsTrigger>
            <TabsTrigger value="qa" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Q&A
            </TabsTrigger>
            <TabsTrigger value="changelog" className="flex items-center gap-2">
              <GitCommit className="w-4 h-4" />
              Changelog
            </TabsTrigger>
            <TabsTrigger value="graph" className="flex items-center gap-2">
              <Network className="w-4 h-4" />
              Graph
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scan">
            <ScanTab repoId={repoId} repo={repoData} />
          </TabsContent>

          <TabsContent value="docs">
            <DocsTab repoId={repoId} />
          </TabsContent>

          <TabsContent value="qa">
            <QATab repoId={repoId} />
          </TabsContent>

          <TabsContent value="changelog">
            <ChangelogTab repoId={repoId} />
          </TabsContent>

          <TabsContent value="graph">
            <GraphTab repoId={repoId} />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
