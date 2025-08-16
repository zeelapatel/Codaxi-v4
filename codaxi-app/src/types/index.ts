export type Provider = 'github' | 'gitlab' | 'bitbucket'
export type Language = 'ts' | 'js' | 'java' | 'py' | 'go' | 'rust' | 'cpp'
export type ScanStatus = 'queued' | 'parsing' | 'embedding' | 'generating' | 'completed' | 'error'
export type DocNodeKind = 'route' | 'event' | 'type' | 'module' | 'function' | 'class'
export type MessageRole = 'user' | 'assistant' | 'system'
export type Visibility = 'public' | 'private'

export interface Repo {
  id: string
  name: string
  owner: string
  provider: Provider
  visibility: Visibility
  defaultBranch: string
  languages: Language[]
  updatedAt: string
  docsFreshness: number // 0..100
  lastScan?: Scan
  description?: string
  starCount?: number
  isFavorite?: boolean
}

export interface Scan {
  id: string
  repoId: string
  branch: string
  status: ScanStatus
  startedAt: string
  completedAt?: string
  metrics: {
    filesParsed: number
    endpointsDetected: number
    eventsDetected: number
    typesDetected: number
    tokensUsed: number
    durationSec: number
  }
  errors?: Array<{ stage: string; message: string }>
}

export interface Citation {
  filePath: string
  startLine: number
  endLine: number
  sha: string
}

export interface DocNode {
  id: string
  kind: DocNodeKind
  path: string // e.g., /api/orders or pkg.module.Function
  title: string
  summary: string
  anchors: Array<{ id: string; label: string }>
  citations: Citation[]
  html?: string // pre-rendered doc mock
  parentId?: string
  children?: DocNode[]
}

export interface QAMessage {
  id: string
  role: MessageRole
  content: string
  citations?: Citation[]
  retrievalTrace?: Array<{ step: string; details: string }>
  timestamp: string
  feedback?: 'positive' | 'negative'
}

export interface QAThread {
  id: string
  repoId: string
  question: string
  createdAt: string
  messages: QAMessage[]
}

export interface ChangelogEntry {
  id: string
  type: 'breaking' | 'feature' | 'bugfix' | 'docs' | 'performance'
  severity: 'high' | 'medium' | 'low'
  title: string
  description: string
  filePath: string
  fromSha: string
  toSha: string
  diff?: string
}

export interface GraphNode {
  id: string
  type: 'service' | 'route' | 'type' | 'event'
  label: string
  x: number
  y: number
  metadata: Record<string, any>
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  type: 'calls' | 'depends' | 'triggers' | 'implements'
  weight: number
}

export interface Graph {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface ActivityEvent {
  id: string
  type: 'scan_completed' | 'repo_added' | 'qa_asked' | 'docs_updated'
  title: string
  description: string
  timestamp: string
  repoId?: string
  userId?: string
  metadata?: Record<string, any>
}

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'admin' | 'member' | 'viewer'
}

export interface Organization {
  id: string
  name: string
  slug: string
  planType: 'free' | 'team' | 'enterprise'
  memberCount: number
  settings: {
    dataRetentionDays: number
    docsAsCodeEnabled: boolean
    slackIntegrationEnabled: boolean
  }
}

export interface BillingUsage {
  reposScanned: number
  maxRepos: number
  tokensUsed: number
  maxTokens: number
  daysRemaining: number
}

// API Response Types
export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
  timestamp: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

// Form Types
export interface AddRepoForm {
  url: string
  provider: Provider
  branch: string
  accessToken?: string
}

export interface AskQuestionForm {
  question: string
  includeContext: boolean
}

// Search and Filter Types
export interface RepoFilters {
  provider?: Provider
  language?: Language
  status?: ScanStatus
  visibility?: Visibility
  search?: string
}

export interface DocSearchResult {
  id: string
  title: string
  kind: DocNodeKind
  path: string
  excerpt: string
  relevanceScore: number
}

// Theme and UI Types
export type Theme = 'light' | 'dark' | 'system'

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  description?: string
  duration?: number
}
