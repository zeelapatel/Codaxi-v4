'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useGraph } from '@/lib/queries'
import { GraphNode, GraphEdge } from '@/types'
import { 
  Network, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize2,
  Filter,
  Info,
  Server,
  Route,
  Hash,
  Zap
} from 'lucide-react'

interface GraphTabProps {
  repoId: string
}

export function GraphTab({ repoId }: GraphTabProps) {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const { data: graph, isLoading } = useGraph(repoId)

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'service':
        return <Server className="w-4 h-4" />
      case 'route':
        return <Route className="w-4 h-4" />
      case 'type':
        return <Hash className="w-4 h-4" />
      case 'event':
        return <Zap className="w-4 h-4" />
      default:
        return <Network className="w-4 h-4" />
    }
  }

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'service':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'route':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'type':
        return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'event':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getEdgeColor = (type: string) => {
    switch (type) {
      case 'calls':
        return 'stroke-blue-500'
      case 'depends':
        return 'stroke-green-500'
      case 'triggers':
        return 'stroke-yellow-500'
      case 'implements':
        return 'stroke-purple-500'
      default:
        return 'stroke-gray-400'
    }
  }

  // Mock graph visualization - in a real app, you'd use D3.js or similar
  const MockGraphVisualization = () => (
    <div className="relative w-full h-96 bg-muted/20 rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
      <div className="text-center space-y-4">
        <Network className="w-16 h-16 text-muted-foreground mx-auto" />
        <div>
          <h3 className="text-lg font-medium mb-2">Interactive Graph Visualization</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            This would display an interactive force-directed graph showing relationships between services, routes, types, and events.
          </p>
        </div>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" size="sm">
            <ZoomIn className="w-4 h-4 mr-2" />
            Zoom In
          </Button>
          <Button variant="outline" size="sm">
            <ZoomOut className="w-4 h-4 mr-2" />
            Zoom Out
          </Button>
          <Button variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset View
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Knowledge Graph</h2>
          <p className="text-muted-foreground">
            Visualize relationships between services, routes, types, and events
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Maximize2 className="w-4 h-4 mr-2" />
            Fullscreen
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Graph Visualization */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Dependency Graph</CardTitle>
                <div className="flex gap-2">
                  {['all', 'service', 'route', 'type', 'event'].map((type) => (
                    <Button
                      key={type}
                      variant={filter === type ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter(type)}
                      className="capitalize"
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-96 w-full" />
                </div>
              ) : (
                <MockGraphVisualization />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="text-sm font-medium">Node Types</div>
                {['service', 'route', 'type', 'event'].map((type) => (
                  <div key={type} className="flex items-center gap-2 text-sm">
                    <div className={`w-3 h-3 rounded border ${getNodeColor(type)}`} />
                    <span className="capitalize">{type}</span>
                  </div>
                ))}
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium">Relationships</div>
                {[
                  { type: 'calls', label: 'Calls' },
                  { type: 'depends', label: 'Depends on' },
                  { type: 'triggers', label: 'Triggers' },
                  { type: 'implements', label: 'Implements' }
                ].map((edge) => (
                  <div key={edge.type} className="flex items-center gap-2 text-sm">
                    <div className={`w-4 h-0.5 ${getEdgeColor(edge.type).replace('stroke-', 'bg-')}`} />
                    <span>{edge.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Node Details */}
          {selectedNode ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {getNodeIcon(selectedNode.type)}
                  Node Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium">{selectedNode.label}</div>
                  <Badge className={getNodeColor(selectedNode.type)}>
                    {selectedNode.type}
                  </Badge>
                </div>
                
                {selectedNode.metadata && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Properties</div>
                    {Object.entries(selectedNode.metadata).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </span>
                        <span>{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Info className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground text-center">
                  Click on a node to view its details
                </p>
              </CardContent>
            </Card>
          )}

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Graph Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                  ))}
                </div>
              ) : graph?.data ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Nodes:</span>
                    <span className="font-medium">{graph.data.nodes.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Edges:</span>
                    <span className="font-medium">{graph.data.edges.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Services:</span>
                    <span className="font-medium">
                      {graph.data.nodes.filter(n => n.type === 'service').length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Routes:</span>
                    <span className="font-medium">
                      {graph.data.nodes.filter(n => n.type === 'route').length}
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">No data available</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
