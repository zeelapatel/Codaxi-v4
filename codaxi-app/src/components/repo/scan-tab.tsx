'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useStartScan, useScan } from '@/lib/queries'
import { useAnalyticsStore } from '@/lib/store'
import { Repo, Scan } from '@/types'
import { 
  Play, 
  Square, 
  RefreshCw, 
  Clock, 
  FileText, 
  Code, 
  Zap, 
  Hash,
  AlertCircle,
  CheckCircle,
  BarChart3
} from 'lucide-react'
import { toast } from 'sonner'

interface ScanTabProps {
  repoId: string
  repo: Repo
}

export function ScanTab({ repoId, repo }: ScanTabProps) {
  const { track } = useAnalyticsStore()
  const startScanMutation = useStartScan()
  const [currentScanId, setCurrentScanId] = useState<string | null>(
    repo.lastScan?.id || null
  )
  const storageKey = `codaxi:lastScanId:${repoId}`
  
  const { data: currentScan, isLoading: scanLoading } = useScan(
    currentScanId || ''
  )

  // Listen for scan progress events
  useEffect(() => {
    // Resume from localStorage if repo details didn't include lastScan
    if (!currentScanId && typeof window !== 'undefined') {
      const savedId = localStorage.getItem(storageKey)
      if (savedId) {
        setCurrentScanId(savedId)
      }
    }

    const handleScanProgress = (event: CustomEvent) => {
      if (event.detail.scanId === currentScanId) {
        // The query will automatically refetch due to refetchInterval
      }
    }

    window.addEventListener('scan-progress', handleScanProgress as EventListener)
    return () => {
      window.removeEventListener('scan-progress', handleScanProgress as EventListener)
    }
  }, [currentScanId])

  const handleStartScan = async () => {
    try {
      track('start_scan', { repoId })
      const result = await startScanMutation.mutateAsync({ repoId })
      setCurrentScanId(result.data.id)
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(storageKey, result.data.id)
        }
      } catch {}
      toast.success('Scan started successfully')
    } catch (error) {
      toast.error('Failed to start scan')
    }
  }

  const scanData = currentScan?.data || repo.lastScan
  const isScanning = scanData && ['queued', 'parsing', 'embedding', 'generating'].includes(scanData.status)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    }
  }

  const getProgressValue = (status: string) => {
    switch (status) {
      case 'queued':
        return 10
      case 'parsing':
        return 30
      case 'embedding':
        return 60
      case 'generating':
        return 85
      case 'completed':
        return 100
      case 'error':
        return 0
      default:
        return 0
    }
  }

  const getStageIcon = (stage: string, current: boolean) => {
    const className = current ? 'w-5 h-5 text-primary' : 'w-5 h-5 text-muted-foreground'
    
    switch (stage) {
      case 'parsing':
        return <FileText className={className} />
      case 'embedding':
        return <Code className={className} />
      case 'generating':
        return <BarChart3 className={className} />
      default:
        return <Clock className={className} />
    }
  }

  // Keep last scan id in storage so completed scans are shown after navigation

  return (
    <div className="space-y-6">
      {/* Scan Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Repository Scan</CardTitle>
              <CardDescription>
                Analyze your codebase to generate documentation, detect APIs, and map dependencies
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleStartScan}
                disabled={isScanning || startScanMutation.isPending}
                className="flex items-center gap-2"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Start Scan
                  </>
                )}
              </Button>
              
              {isScanning && (
                <Button variant="outline" size="sm">
                  <Square className="w-4 h-4" />
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        {scanData && (
          <CardContent className="space-y-4">
            {/* Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                <Badge className={getStatusColor(scanData.status)}>
                  {scanData.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                  {scanData.status === 'error' && <AlertCircle className="w-3 h-3 mr-1" />}
                  {isScanning && <RefreshCw className="w-3 h-3 mr-1 animate-spin" />}
                  {scanData.status.charAt(0).toUpperCase() + scanData.status.slice(1)}
                </Badge>
              </div>
              
              <div className="text-sm text-muted-foreground">
                Started {new Date(scanData.startedAt).toLocaleString()}
              </div>
            </div>

            {/* Progress */}
            {isScanning && (
              <div className="space-y-2">
                <Progress value={getProgressValue(scanData.status)} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>{getProgressValue(scanData.status)}%</span>
                </div>
              </div>
            )}

            {/* Stage Timeline */}
            <div className="grid grid-cols-4 gap-4">
              {['queued', 'parsing', 'embedding', 'generating'].map((stage, index) => {
                const isComplete = ['completed', 'error'].includes(scanData.status) || 
                  (['parsing', 'embedding', 'generating'].indexOf(scanData.status) > index)
                const isCurrent = scanData.status === stage
                
                return (
                  <div key={stage} className="flex flex-col items-center text-center space-y-2">
                    <div className={`p-3 rounded-full border-2 ${
                      isComplete ? 'border-primary bg-primary/10' :
                      isCurrent ? 'border-primary bg-primary/5' :
                      'border-muted-foreground/20'
                    }`}>
                      {getStageIcon(stage, isCurrent || isComplete)}
                    </div>
                    <div className="text-sm font-medium capitalize">{stage}</div>
                    {isCurrent && (
                      <div className="text-xs text-muted-foreground">In progress...</div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Errors */}
            {scanData.errors && scanData.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    {scanData.errors.map((error, index) => (
                      <div key={index}>
                        <strong>{error.stage}:</strong> {error.message}
                      </div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        )}
      </Card>

      {/* Scan Metrics */}
      {scanData && scanData.status === 'completed' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Files Parsed</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scanData.metrics?.filesParsed || 0}</div>
              <p className="text-xs text-muted-foreground">
                Source files analyzed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Endpoints</CardTitle>
              <Code className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scanData.metrics?.endpointsDetected || 0}</div>
              <p className="text-xs text-muted-foreground">
                Routes discovered
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Events</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scanData.metrics?.eventsDetected || 0}</div>
              <p className="text-xs text-muted-foreground">
                Event handlers found
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Types</CardTitle>
              <Hash className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scanData.metrics?.typesDetected || 0}</div>
              <p className="text-xs text-muted-foreground">
                Type definitions
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* No Scan State */}
      {!scanData && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No scans yet</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-sm">
              Start your first scan to analyze this repository and generate comprehensive documentation.
            </p>
            <Button onClick={handleStartScan} disabled={startScanMutation.isPending}>
              <Play className="w-4 h-4 mr-2" />
              Start Your First Scan
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
