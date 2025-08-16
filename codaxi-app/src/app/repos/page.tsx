'use client'

import { useState } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { useRepos, useGitHubRepositories, useConnectedRepositories, useConnectRepository, useDisconnectRepository } from '@/lib/queries'
import { useAuth } from '@/contexts/auth-context'
import { useUIStore, useAnalyticsStore } from '@/lib/store'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Star,
  StarOff,
  GitBranch,
  Clock,
  CheckCircle,
  XCircle,
  Grid3X3,
  List,
  Eye,
  Settings,
  BarChart3,
  Github
} from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'
import { RepoFilters } from '@/types'
import { formatDistanceToNow } from 'date-fns'

export default function ReposPage() {
  const { track } = useAnalyticsStore()
  const { reposViewMode, setReposViewMode } = useUIStore()
  const { isGitHubConnected } = useAuth()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<RepoFilters>({})
  
  const queryFilters = {
    ...filters,
    search: search || undefined
  }
  
  const { data: repos, isLoading } = useRepos(queryFilters)
  const { data: githubRepos } = useGitHubRepositories()
  const { data: connectedRepos } = useConnectedRepositories()
  const { mutate: connectRepo, isPending: isConnecting } = useConnectRepository()
  const { mutate: disconnectRepo, isPending: isDisconnecting } = useDisconnectRepository()

  useEffect(() => {
    track('view_repo_list')
  }, [track])

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'queued':
      case 'parsing':
      case 'embedding':
      case 'generating':
        return <Clock className="w-4 h-4 text-yellow-500" />
      default:
        return <GitBranch className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'queued':
      case 'parsing':
      case 'embedding':
      case 'generating':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getFreshnessColor = (freshness: number) => {
    if (freshness >= 80) return 'text-green-600'
    if (freshness >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const TableView = () => (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Repository</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Languages</TableHead>
            <TableHead>Freshness</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </TableCell>
                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="w-8 h-8" /></TableCell>
              </TableRow>
            ))
          ) : repos?.data.map((repo) => (
            <TableRow key={repo.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                    <GitBranch className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Link 
                        href={`/repos/${repo.id}`}
                        className="font-medium hover:underline"
                      >
                        {repo.owner}/{repo.name}
                      </Link>
                      {repo.isFavorite && (
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {repo.description || 'No description'}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getStatusIcon(repo.lastScan?.status)}
                  <Badge 
                    variant="outline" 
                    className={`${getStatusColor(repo.lastScan?.status)} border-0`}
                  >
                    {repo.lastScan?.status || 'No scans'}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {repo.languages.slice(0, 3).map((lang) => (
                    <Badge key={lang} variant="secondary" className="text-xs">
                      {lang.toUpperCase()}
                    </Badge>
                  ))}
                  {repo.languages.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{repo.languages.length - 3}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className={`font-medium ${getFreshnessColor(repo.docsFreshness)}`}>
                  {repo.docsFreshness}%
                </span>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(repo.updatedAt), { addSuffix: true })}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/repos/${repo.id}`}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/repos/${repo.id}/scan`}>
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Start Scan
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      {repo.isFavorite ? (
                        <>
                          <StarOff className="w-4 h-4 mr-2" />
                          Remove from Favorites
                        </>
                      ) : (
                        <>
                          <Star className="w-4 h-4 mr-2" />
                          Add to Favorites
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
             {repos?.data.length === 0 && !isLoading && (
                             <div className="text-center py-12">
                      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <GitBranch className="w-10 h-10 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">
                        {isGitHubConnected ? 'Add Your First Repository' : 'Connect Your First Repository'}
                      </h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        {search || Object.keys(filters).length > 0 
                          ? 'Try adjusting your search or filters'
                          : isGitHubConnected
                            ? 'Choose repositories from your GitHub account to start generating documentation.'
                            : 'Connect your GitHub repositories to start generating AI-powered documentation and get intelligent insights about your codebase.'
                        }
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        {isGitHubConnected ? (
                          <Button asChild>
                            <Link href="/repos/select">
                              <Plus className="w-4 h-4 mr-2" />
                              Select Repositories
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
    </Card>
  )

  const GridView = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {isLoading ? (
        [...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="w-8 h-8" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-16 w-full mb-4" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            </CardContent>
          </Card>
        ))
      ) : repos?.data.map((repo) => (
        <Card key={repo.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">
                  <Link 
                    href={`/repos/${repo.id}`}
                    className="hover:underline flex items-center gap-2"
                  >
                    {repo.owner}/{repo.name}
                    {repo.isFavorite && (
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    )}
                  </Link>
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {repo.description || 'No description'}
                </CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/repos/${repo.id}`}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/repos/${repo.id}/scan`}>
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Start Scan
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getStatusIcon(repo.lastScan?.status)}
                <Badge 
                  variant="outline" 
                  className={`${getStatusColor(repo.lastScan?.status)} border-0`}
                >
                  {repo.lastScan?.status || 'No scans'}
                </Badge>
              </div>
              
              <div className="flex flex-wrap gap-1">
                {repo.languages.map((lang) => (
                  <Badge key={lang} variant="secondary" className="text-xs">
                    {lang.toUpperCase()}
                  </Badge>
                ))}
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Docs Freshness</span>
                <span className={`font-medium ${getFreshnessColor(repo.docsFreshness)}`}>
                  {repo.docsFreshness}%
                </span>
              </div>

              <div className="text-xs text-muted-foreground">
                Updated {formatDistanceToNow(new Date(repo.updatedAt), { addSuffix: true })}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
             {repos?.data.length === 0 && !isLoading && (
                             <div className="col-span-full">
                      <Card className="p-12 text-center">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                          <GitBranch className="w-10 h-10 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">
                          {isGitHubConnected ? 'Add Your First Repository' : 'Connect Your First Repository'}
                        </h3>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                          {search || Object.keys(filters).length > 0 
                            ? 'Try adjusting your search or filters'
                            : isGitHubConnected
                              ? 'Choose repositories from your GitHub account to start generating documentation.'
                              : 'Connect your GitHub repositories to start generating AI-powered documentation and get intelligent insights about your codebase.'
                          }
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          {isGitHubConnected ? (
                            <Button asChild>
                              <Link href="/repos/select">
                                <Plus className="w-4 h-4 mr-2" />
                                Select Repositories
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
                      </Card>
                    </div>
       )}
    </div>
  )

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Repositories</h1>
            <p className="text-muted-foreground">
              Manage your connected repositories and their documentation
            </p>
          </div>
          <Button asChild>
            <Link href="/repos/new">
              <Plus className="w-4 h-4 mr-2" />
              Add Repository
            </Link>
          </Button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search repositories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Provider</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setFilters({ ...filters, provider: 'github' })}>
                GitHub
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters({ ...filters, provider: 'gitlab' })}>
                GitLab
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters({ ...filters, provider: undefined })}>
                All Providers
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center border rounded-lg">
            <Button
              variant={reposViewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setReposViewMode('table')}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={reposViewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setReposViewMode('grid')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {reposViewMode === 'table' ? <TableView /> : <GridView />}
      </div>
    </AppShell>
  )
}
