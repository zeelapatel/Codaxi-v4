'use client'

import { useState } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useGitHubRepositories, useConnectRepository } from '@/lib/queries'
import { useRouter } from 'next/navigation'
import { useAnalyticsStore } from '@/lib/store'
import { 
  Search, 
  GitBranch,
  Star,
  ArrowLeft,
  Plus,
  Check
} from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'
import { toast } from 'sonner'
import type { GitHubRepository } from '@/types/github'

export default function SelectRepoPage() {
  const router = useRouter()
  const { track } = useAnalyticsStore()
  const [search, setSearch] = useState('')
  const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set())
  
  const { data: githubRepos, isLoading, error } = useGitHubRepositories()
  const { mutate: connectRepo, isPending: isConnecting } = useConnectRepository()

  useEffect(() => {
    track('view_repo_select')
    console.log('[SelectRepoPage] Component mounted')
  }, [track])

  // Log GitHub repos data changes
  useEffect(() => {
    console.log('[SelectRepoPage] GitHub repos data:', {
      isLoading,
      error,
      reposCount: githubRepos?.data?.repositories?.length || 0,
      repositories: githubRepos?.data?.repositories || []
    })
  }, [githubRepos, isLoading, error])

  useEffect(() => {
    if (error) {
      console.error('[SelectRepoPage] Error fetching GitHub repositories:', error)
      toast.error('Failed to fetch GitHub repositories. Please try again.')
    }
  }, [error])

  // Filter repositories based on search
  const filteredRepos = githubRepos?.data?.repositories?.filter((repo: { full_name: string; description?: string }) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      repo.full_name.toLowerCase().includes(searchLower) ||
      repo.description?.toLowerCase().includes(searchLower)
    )
  }) || []

  const handleToggleRepo = (fullName: string) => {
    const newSelected = new Set(selectedRepos)
    if (newSelected.has(fullName)) {
      newSelected.delete(fullName)
    } else {
      newSelected.add(fullName)
    }
    setSelectedRepos(newSelected)
  }

  const handleConnectRepositories = async () => {
    if (selectedRepos.size === 0) {
      toast.error('Please select at least one repository')
      return
    }

    const promises = Array.from(selectedRepos).map(fullName => {
      const [owner, repo] = fullName.split('/')
      return connectRepo({ owner, repo })
    })

    try {
      await Promise.all(promises)
      toast.success(`Successfully connected ${selectedRepos.size} repositories`)
      router.push('/repos')
    } catch (error) {
      console.error('Error connecting repositories:', error)
      toast.error('Failed to connect some repositories')
    }
  }

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild className="mb-2">
                <Link href="/repos">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Link>
              </Button>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Select Repositories</h1>
            <p className="text-muted-foreground">
              Choose repositories to connect with Codaxi
            </p>
          </div>
          <Button 
            onClick={handleConnectRepositories}
            disabled={selectedRepos.size === 0 || isConnecting}
          >
            {isConnecting ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Connecting...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Connect Selected ({selectedRepos.size})
              </>
            )}
          </Button>
        </div>

        {/* Search */}
        <div className="max-w-md">
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

        {/* Repository List */}
        <div className="grid gap-4">
          {isLoading ? (
            [...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-9 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredRepos.map((repo: GitHubRepository) => (
            <Card 
              key={repo.full_name}
              className={`transition-colors ${
                selectedRepos.has(repo.full_name) ? 'border-primary' : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{repo.full_name}</h3>
                      {repo.private && (
                        <Badge variant="secondary" className="text-xs">Private</Badge>
                      )}
                      {repo.stargazers_count > 0 && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Star className="w-3 h-3 mr-1" />
                          {repo.stargazers_count}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {repo.description || 'No description'}
                    </p>
                  </div>
                  <Button
                    variant={selectedRepos.has(repo.full_name) ? "default" : "outline"}
                    onClick={() => handleToggleRepo(repo.full_name)}
                  >
                    {selectedRepos.has(repo.full_name) ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Selected
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Select
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredRepos.length === 0 && !isLoading && (
            <Card className="py-16">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <GitBranch className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  No repositories found
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {search 
                    ? 'Try adjusting your search terms'
                    : 'No GitHub repositories available. Make sure you have access to some repositories.'}
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  )
}
