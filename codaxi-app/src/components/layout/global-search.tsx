'use client'

import { useState, useEffect } from 'react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useUIStore } from '@/lib/store'
import { Search, FileText, Code, Route, Zap, Hash } from 'lucide-react'
import { useSearchDocs } from '@/lib/queries'
import { useRouter } from 'next/navigation'
import { useRepos } from '@/lib/queries'
import { DocNodeKind } from '@/types'

// Add command component
const CommandComponent = Command as any

export function GlobalSearch() {
  const router = useRouter()
  const { searchOpen, setSearchOpen } = useUIStore()
  const [query, setQuery] = useState('')
  const { data: repos } = useRepos()
  const { data: searchResults } = useSearchDocs('repo-1', query) // Search in first repo for demo

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setSearchOpen(!searchOpen)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [searchOpen, setSearchOpen])

  const handleSelect = (value: string) => {
    if (value.startsWith('repo:')) {
      const repoId = value.replace('repo:', '')
      router.push(`/repos/${repoId}`)
    } else if (value.startsWith('doc:')) {
      const [, repoId, docId] = value.split(':')
      router.push(`/repos/${repoId}/docs?doc=${docId}`)
    }
    setSearchOpen(false)
    setQuery('')
  }

  const getKindIcon = (kind: DocNodeKind) => {
    switch (kind) {
      case 'route':
        return <Route className="w-4 h-4" />
      case 'event':
        return <Zap className="w-4 h-4" />
      case 'type':
        return <Hash className="w-4 h-4" />
      case 'module':
        return <FileText className="w-4 h-4" />
      default:
        return <Code className="w-4 h-4" />
    }
  }

  const getKindColor = (kind: DocNodeKind) => {
    switch (kind) {
      case 'route':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'event':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'type':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'module':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  return (
    <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
      <DialogContent className="p-0 max-w-2xl">
        <CommandComponent className="rounded-lg border-0 shadow-md">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder="Search repositories, documentation, routes..."
              value={query}
              onValueChange={setQuery}
              className="border-0 focus:ring-0"
            />
          </div>
          <CommandList className="max-h-[400px]">
            <CommandEmpty>
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <Search className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {query ? 'No results found.' : 'Type to search repositories and documentation...'}
                </p>
              </div>
            </CommandEmpty>
            
            {/* Repositories */}
            {repos?.data && repos.data.length > 0 && (
              <>
                <CommandGroup heading="Repositories">
                  {repos.data
                    .filter(repo => 
                      !query || 
                      repo.name.toLowerCase().includes(query.toLowerCase()) ||
                      repo.owner.toLowerCase().includes(query.toLowerCase())
                    )
                    .slice(0, 3)
                    .map((repo) => (
                      <CommandItem
                        key={repo.id}
                        value={`repo:${repo.id}`}
                        onSelect={handleSelect}
                        className="flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{repo.owner}/{repo.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {repo.description || 'No description'}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {repo.provider}
                          </Badge>
                          {repo.docsFreshness > 80 && (
                            <Badge variant="default" className="text-xs bg-green-500">
                              Fresh
                            </Badge>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {/* Documentation */}
            {searchResults?.data && searchResults.data.length > 0 && (
              <CommandGroup heading="Documentation">
                {searchResults.data.slice(0, 5).map((result) => (
                  <CommandItem
                    key={result.id}
                    value={`doc:repo-1:${result.id}`}
                    onSelect={handleSelect}
                    className="flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      {getKindIcon(result.kind)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{result.title}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {result.excerpt}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {result.path}
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-xs ${getKindColor(result.kind)}`}>
                      {result.kind}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
          
          <div className="border-t px-4 py-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div>Search across all repositories and documentation</div>
              <div className="flex gap-2">
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  ↵
                </kbd>
                to select
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  esc
                </kbd>
                to close
              </div>
            </div>
          </div>
        </CommandComponent>
      </DialogContent>
    </Dialog>
  )
}
