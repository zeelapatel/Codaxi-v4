'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useDocs, useDoc, useSearchDocs } from '@/lib/queries'
import { useUIStore, useAnalyticsStore } from '@/lib/store'
import { DocNode, DocNodeKind } from '@/types'
import { 
  Search, 
  FileText, 
  Code, 
  Route, 
  Zap, 
  Hash, 
  ChevronRight, 
  ChevronDown,
  Copy,
  ExternalLink,
  Eye,
  FolderOpen,
  Folder
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface DocsTabProps {
  repoId: string
}

export function DocsTab({ repoId }: DocsTabProps) {
  const { track } = useAnalyticsStore()
  const { expandedDocNodes, toggleDocNode } = useUIStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  
  const { data: docs, isLoading: docsLoading } = useDocs(repoId, searchQuery)
  const { data: selectedDoc, isLoading: docLoading } = useDoc(
    repoId, 
    selectedDocId || '',
    { enabled: !!selectedDocId }
  )

  const getKindIcon = (kind: DocNodeKind) => {
    switch (kind) {
      case 'route':
        return <Route className="w-4 h-4 text-blue-600" />
      case 'event':
        return <Zap className="w-4 h-4 text-yellow-600" />
      case 'type':
        return <Hash className="w-4 h-4 text-green-600" />
      case 'module':
        return <FolderOpen className="w-4 h-4 text-purple-600" />
      case 'function':
        return <Code className="w-4 h-4 text-orange-600" />
      case 'class':
        return <Code className="w-4 h-4 text-red-600" />
      default:
        return <FileText className="w-4 h-4 text-gray-600" />
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
      case 'function':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'class':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const handleDocSelect = (doc: DocNode) => {
    setSelectedDocId(doc.id)
    track('docs_view_node', { docId: doc.id, kind: doc.kind })
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('Code copied to clipboard')
    track('docs_copy_code')
  }

  const handleOpenCitation = (citation: any) => {
    track('docs_open_citation', { filePath: citation.filePath })
    // In a real app, this would open the source file
  }

  const DocTree = ({ docs }: { docs: DocNode[] }) => {
    const groupedDocs = docs.reduce((acc, doc) => {
      if (!acc[doc.kind]) acc[doc.kind] = []
      acc[doc.kind].push(doc)
      return acc
    }, {} as Record<DocNodeKind, DocNode[]>)

    return (
      <div className="space-y-4">
        {Object.entries(groupedDocs).map(([kind, kindDocs]) => (
          <div key={kind}>
            <div 
              className="flex items-center gap-2 px-2 py-1 text-sm font-medium cursor-pointer hover:bg-muted rounded"
              onClick={() => toggleDocNode(kind)}
            >
              {expandedDocNodes[kind] ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <Folder className="w-4 h-4" />
              <span className="capitalize">{kind}s</span>
              <Badge variant="secondary" className="ml-auto text-xs">
                {kindDocs.length}
              </Badge>
            </div>
            
            {expandedDocNodes[kind] && (
              <div className="ml-6 space-y-1">
                {kindDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className={cn(
                      'flex items-center gap-2 px-2 py-1 text-sm cursor-pointer rounded hover:bg-muted',
                      selectedDocId === doc.id && 'bg-primary/10 text-primary'
                    )}
                    onClick={() => handleDocSelect(doc)}
                  >
                    {getKindIcon(doc.kind)}
                    <span className="flex-1 truncate">{doc.title}</span>
                    <Badge variant="outline" className={`text-xs ${getKindColor(doc.kind)}`}>
                      {doc.kind}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  const DocViewer = ({ doc }: { doc: DocNode }) => (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {getKindIcon(doc.kind)}
          <h2 className="text-2xl font-bold">{doc.title}</h2>
          <Badge className={getKindColor(doc.kind)}>
            {doc.kind}
          </Badge>
        </div>
        <p className="text-muted-foreground">{doc.summary}</p>
        <div className="text-sm text-muted-foreground">
          Path: <code className="bg-muted px-1 py-0.5 rounded text-xs">{doc.path}</code>
        </div>
      </div>

      {/* Table of Contents */}
      {doc.anchors && doc.anchors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Table of Contents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {doc.anchors.map((anchor) => (
                <a
                  key={anchor.id}
                  href={`#${anchor.id}`}
                  className="block text-sm text-muted-foreground hover:text-foreground"
                >
                  {anchor.label}
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      <Card>
        <CardContent className="p-6">
          {doc.html ? (
            <div 
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: doc.html }}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-8 h-8 mx-auto mb-2" />
              <p>No content available for this documentation node.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Citations */}
      {doc.citations && doc.citations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Source Code References</CardTitle>
            <CardDescription>
              Code locations that this documentation is based on
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {doc.citations.map((citation, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleOpenCitation(citation)}
                >
                  <div className="space-y-1">
                    <div className="text-sm font-medium">{citation.filePath}</div>
                    <div className="text-xs text-muted-foreground">
                      Lines {citation.startLine}-{citation.endLine}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {citation.sha.slice(0, 7)}
                    </Badge>
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  return (
    <div className="grid lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
      {/* Sidebar */}
      <div className="lg:col-span-1">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg">Documentation</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search docs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            {docsLoading ? (
              <div className="space-y-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <div className="ml-4 space-y-1">
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </div>
                ))}
              </div>
            ) : docs?.data ? (
              <DocTree docs={docs.data} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-8 h-8 mx-auto mb-2" />
                <p>No documentation found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="lg:col-span-3">
        <Card className="h-full">
          <CardContent className="p-6 overflow-y-auto">
            {selectedDocId && selectedDoc?.data ? (
              <DocViewer doc={selectedDoc.data} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Eye className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a documentation item</h3>
                <p className="text-muted-foreground max-w-sm">
                  Choose an item from the sidebar to view its detailed documentation and source code references.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
