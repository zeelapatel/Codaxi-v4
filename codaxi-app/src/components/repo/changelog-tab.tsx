'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useChangelog } from '@/lib/queries'
import { ChangelogEntry } from '@/types'
import { 
  GitCommit, 
  AlertTriangle, 
  Plus, 
  Bug, 
  FileText, 
  Zap,
  Filter,
  Calendar
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ChangelogTabProps {
  repoId: string
}

export function ChangelogTab({ repoId }: ChangelogTabProps) {
  const [filter, setFilter] = useState<string>('all')
  const { data: changelog, isLoading } = useChangelog(repoId)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'breaking':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'feature':
        return <Plus className="w-4 h-4 text-green-500" />
      case 'bugfix':
        return <Bug className="w-4 h-4 text-blue-500" />
      case 'docs':
        return <FileText className="w-4 h-4 text-gray-500" />
      case 'performance':
        return <Zap className="w-4 h-4 text-yellow-500" />
      default:
        return <GitCommit className="w-4 h-4 text-gray-500" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'breaking':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'feature':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'bugfix':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'docs':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      case 'performance':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950'
      case 'medium':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950'
      case 'low':
        return 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950'
      default:
        return 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950'
    }
  }

  const filteredChanges = changelog?.data.filter(change => 
    filter === 'all' || change.type === filter
  ) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Changelog</h2>
          <p className="text-muted-foreground">
            Track breaking changes and updates across versions
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Compare Versions
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'breaking', 'feature', 'bugfix', 'docs', 'performance'].map((type) => (
          <Button
            key={type}
            variant={filter === type ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(type)}
            className="capitalize"
          >
            {type === 'all' ? 'All Changes' : `${type}s`}
          </Button>
        ))}
      </div>

      {/* Changelog Entries */}
      <div className="space-y-4">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredChanges.length > 0 ? (
          filteredChanges.map((change) => (
            <Card key={change.id} className={getSeverityColor(change.severity)}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(change.type)}
                      <h3 className="font-medium">{change.title}</h3>
                      <Badge className={getTypeColor(change.type)}>
                        {change.type}
                      </Badge>
                      {change.severity === 'high' && (
                        <Badge variant="destructive">
                          Breaking Change
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground">
                    {change.description}
                  </p>

                  {/* File and Diff */}
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">
                      <code className="bg-muted px-1 py-0.5 rounded">
                        {change.filePath}
                      </code>
                    </div>
                    
                    {change.diff && (
                      <Card className="bg-muted/30">
                        <CardContent className="p-4">
                          <pre className="text-xs overflow-x-auto">
                            <code>{change.diff}</code>
                          </pre>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      {change.fromSha.slice(0, 7)} → {change.toSha.slice(0, 7)}
                    </span>
                    <Badge variant="outline" className={`${
                      change.severity === 'high' ? 'border-red-300 text-red-700' :
                      change.severity === 'medium' ? 'border-yellow-300 text-yellow-700' :
                      'border-gray-300 text-gray-700'
                    }`}>
                      {change.severity} impact
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <GitCommit className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No changes found</h3>
              <p className="text-muted-foreground text-center max-w-sm">
                {filter === 'all' 
                  ? 'No changelog entries available for this repository.'
                  : `No ${filter} changes found. Try selecting a different filter.`
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
