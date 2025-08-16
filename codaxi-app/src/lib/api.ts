import { 
  Repo, 
  Scan, 
  DocNode, 
  QAThread, 
  QAMessage, 
  ChangelogEntry, 
  ActivityEvent, 
  BillingUsage,
  Graph,
  ApiResponse,
  PaginatedResponse,
  AddRepoForm,
  AskQuestionForm,
  RepoFilters,
  DocSearchResult
} from '@/types'
import { 
  mockRepos,
  mockScans, 
  mockDocNodes, 
  mockQAThreads, 
  mockChangelogEntries, 
  mockActivityEvents, 
  mockBillingUsage,
  mockGraph,
  mockUser,
  mockOrganization
} from '@/data/mock-data'

// Simulate network delay
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms))

// Mock API client
export class MockApiClient {
  // Repos
  async getRepos(filters?: RepoFilters): Promise<ApiResponse<Repo[]>> {
    await delay(300)
    
    let repos = [...mockRepos]
    
    if (filters?.provider) {
      repos = repos.filter(repo => repo.provider === filters.provider)
    }
    
    if (filters?.language) {
      repos = repos.filter(repo => repo.languages.includes(filters.language!))
    }
    
    if (filters?.visibility) {
      repos = repos.filter(repo => repo.visibility === filters.visibility)
    }
    
    if (filters?.search) {
      const search = filters.search.toLowerCase()
      repos = repos.filter(repo => 
        repo.name.toLowerCase().includes(search) || 
        repo.owner.toLowerCase().includes(search) ||
        repo.description?.toLowerCase().includes(search)
      )
    }
    
    return {
      data: repos,
      success: true,
      timestamp: new Date().toISOString()
    }
  }

  async getRepo(id: string): Promise<ApiResponse<Repo>> {
    await delay(200)
    
    const repo = mockRepos.find(r => r.id === id)
    if (!repo) {
      throw new Error(`Repo with id ${id} not found`)
    }
    
    return {
      data: repo,
      success: true,
      timestamp: new Date().toISOString()
    }
  }

  async createRepo(data: AddRepoForm): Promise<ApiResponse<Repo>> {
    await delay(800)
    
    const newRepo: Repo = {
      id: `repo-${Date.now()}`,
      name: data.url.split('/').pop() || 'unnamed',
      owner: data.url.split('/').slice(-2, -1)[0] || 'unknown',
      provider: data.provider,
      visibility: 'private',
      defaultBranch: data.branch,
      languages: ['ts'], // Default
      updatedAt: new Date().toISOString(),
      docsFreshness: 0,
      description: 'Recently added repository'
    }
    
    mockRepos.push(newRepo)
    
    return {
      data: newRepo,
      success: true,
      timestamp: new Date().toISOString()
    }
  }

  // Scans
  async startScan(repoId: string, branch?: string): Promise<ApiResponse<Scan>> {
    await delay(400)
    
    const newScan: Scan = {
      id: `scan-${Date.now()}`,
      repoId,
      branch: branch || 'main',
      status: 'queued',
      startedAt: new Date().toISOString(),
      metrics: {
        filesParsed: 0,
        endpointsDetected: 0,
        eventsDetected: 0,
        typesDetected: 0,
        tokensUsed: 0,
        durationSec: 0
      }
    }
    
    mockScans.push(newScan)
    
    // Update repo's lastScan
    const repo = mockRepos.find(r => r.id === repoId)
    if (repo) {
      repo.lastScan = newScan
    }
    
    // Simulate scan progression
    this.simulateScanProgress(newScan.id)
    
    return {
      data: newScan,
      success: true,
      timestamp: new Date().toISOString()
    }
  }

  async getScan(scanId: string): Promise<ApiResponse<Scan>> {
    await delay(100)
    
    const scan = mockScans.find(s => s.id === scanId)
    if (!scan) {
      throw new Error(`Scan with id ${scanId} not found`)
    }
    
    return {
      data: scan,
      success: true,
      timestamp: new Date().toISOString()
    }
  }

  private simulateScanProgress(scanId: string) {
    const updateScan = (status: Scan['status'], metrics?: Partial<Scan['metrics']>) => {
      const scan = mockScans.find(s => s.id === scanId)
      if (scan) {
        scan.status = status
        if (metrics) {
          scan.metrics = { ...scan.metrics, ...metrics }
        }
        if (status === 'completed') {
          scan.completedAt = new Date().toISOString()
          scan.metrics.durationSec = Math.floor((Date.now() - new Date(scan.startedAt).getTime()) / 1000)
        }
        
        // Update repo's lastScan
        const repo = mockRepos.find(r => r.id === scan.repoId)
        if (repo) {
          repo.lastScan = scan
          if (status === 'completed') {
            repo.docsFreshness = Math.floor(Math.random() * 20) + 80 // 80-100
          }
        }
        
        // Emit event (in real app, this would be WebSocket)
        window.dispatchEvent(new CustomEvent('scan-progress', { 
          detail: { scanId, scan } 
        }))
      }
    }

    setTimeout(() => updateScan('parsing', { filesParsed: 45 }), 2000)
    setTimeout(() => updateScan('parsing', { filesParsed: 120 }), 4000)
    setTimeout(() => updateScan('embedding', { filesParsed: 200, endpointsDetected: 15 }), 6000)
    setTimeout(() => updateScan('generating', { filesParsed: 234, endpointsDetected: 45, eventsDetected: 12 }), 8000)
    setTimeout(() => updateScan('completed', { 
      filesParsed: 234, 
      endpointsDetected: 45, 
      eventsDetected: 23, 
      typesDetected: 156,
      tokensUsed: Math.floor(Math.random() * 10000) + 5000
    }), 10000)
  }

  // Docs
  async getDocs(repoId: string, query?: string): Promise<ApiResponse<DocNode[]>> {
    await delay(300)
    
    let docs = mockDocNodes.filter(() => true) // All docs for now
    
    if (query) {
      const searchTerm = query.toLowerCase()
      docs = docs.filter(doc => 
        doc.title.toLowerCase().includes(searchTerm) ||
        doc.summary.toLowerCase().includes(searchTerm) ||
        doc.path.toLowerCase().includes(searchTerm)
      )
    }
    
    return {
      data: docs,
      success: true,
      timestamp: new Date().toISOString()
    }
  }

  async getDoc(repoId: string, docId: string): Promise<ApiResponse<DocNode>> {
    await delay(200)
    
    const doc = mockDocNodes.find(d => d.id === docId)
    if (!doc) {
      throw new Error(`Doc with id ${docId} not found`)
    }
    
    return {
      data: doc,
      success: true,
      timestamp: new Date().toISOString()
    }
  }

  async searchDocs(repoId: string, query: string): Promise<ApiResponse<DocSearchResult[]>> {
    await delay(400)
    
    const searchTerm = query.toLowerCase()
    const results = mockDocNodes
      .filter(doc => 
        doc.title.toLowerCase().includes(searchTerm) ||
        doc.summary.toLowerCase().includes(searchTerm) ||
        doc.path.toLowerCase().includes(searchTerm)
      )
      .map(doc => ({
        id: doc.id,
        title: doc.title,
        kind: doc.kind,
        path: doc.path,
        excerpt: doc.summary.slice(0, 150) + '...',
        relevanceScore: Math.random() * 0.4 + 0.6 // 0.6-1.0
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
    
    return {
      data: results,
      success: true,
      timestamp: new Date().toISOString()
    }
  }

  // Q&A
  async askQuestion(repoId: string, data: AskQuestionForm): Promise<ApiResponse<QAThread>> {
    await delay(600)
    
    const newThread: QAThread = {
      id: `thread-${Date.now()}`,
      repoId,
      question: data.question,
      createdAt: new Date().toISOString(),
      messages: [
        {
          id: `msg-${Date.now()}`,
          role: 'user',
          content: data.question,
          timestamp: new Date().toISOString()
        }
      ]
    }
    
    mockQAThreads.push(newThread)
    
    // Simulate AI response
    this.simulateAIResponse(newThread.id)
    
    return {
      data: newThread,
      success: true,
      timestamp: new Date().toISOString()
    }
  }

  async getQAThreads(repoId: string): Promise<ApiResponse<QAThread[]>> {
    await delay(200)
    
    const threads = mockQAThreads.filter(t => t.repoId === repoId)
    
    return {
      data: threads,
      success: true,
      timestamp: new Date().toISOString()
    }
  }

  async getQAThread(threadId: string): Promise<ApiResponse<QAThread>> {
    await delay(150)
    
    const thread = mockQAThreads.find(t => t.id === threadId)
    if (!thread) {
      throw new Error(`Thread with id ${threadId} not found`)
    }
    
    return {
      data: thread,
      success: true,
      timestamp: new Date().toISOString()
    }
  }

  private simulateAIResponse(threadId: string) {
    setTimeout(() => {
      const thread = mockQAThreads.find(t => t.id === threadId)
      if (!thread) return
      
      const responses = [
        {
          content: `Based on the codebase analysis, here's what I found about your question:

The system implements a robust authentication mechanism using JWT tokens. The main components include:

1. **Login Controller**: Handles user authentication requests
2. **Token Generation**: Creates secure JWT tokens with user claims
3. **Middleware**: Validates tokens on protected routes

The authentication flow is stateless and supports both traditional email/password login and OAuth integration.`,
          citations: [
            { filePath: 'src/controllers/auth.ts', startLine: 23, endLine: 45, sha: 'abc123' },
            { filePath: 'src/middleware/auth.ts', startLine: 8, endLine: 22, sha: 'abc123' }
          ]
        },
        {
          content: `The order management system follows a state machine pattern with the following statuses:

- **PENDING**: Initial state when order is created
- **CONFIRMED**: Payment processed successfully
- **PROCESSING**: Order being fulfilled
- **SHIPPED**: Order dispatched to customer
- **DELIVERED**: Order successfully delivered
- **CANCELLED**: Order cancelled (refundable)
- **REFUNDED**: Refund processed

State transitions are enforced by business rules in the OrderService class.`,
          citations: [
            { filePath: 'src/types/order.ts', startLine: 28, endLine: 36, sha: 'def456' },
            { filePath: 'src/services/order.ts', startLine: 89, endLine: 120, sha: 'def456' }
          ]
        }
      ]
      
      const response = responses[Math.floor(Math.random() * responses.length)]
      
      const aiMessage: QAMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toISOString(),
        citations: response.citations,
        retrievalTrace: [
          { step: 'Query Analysis', details: 'Parsed question and identified key concepts' },
          { step: 'Document Retrieval', details: 'Retrieved 8 relevant code sections' },
          { step: 'Context Ranking', details: 'Ranked by semantic similarity (score: 0.89)' },
          { step: 'Response Generation', details: 'Generated response using top 3 chunks' }
        ]
      }
      
      thread.messages.push(aiMessage)
      
      // Emit event for real-time updates
      window.dispatchEvent(new CustomEvent('qa-response', { 
        detail: { threadId, message: aiMessage } 
      }))
    }, 2000)
  }

  // Changelog
  async getChangelog(repoId: string, fromSha?: string, toSha?: string): Promise<ApiResponse<ChangelogEntry[]>> {
    await delay(400)
    
    // Return all changelog entries for demo
    return {
      data: mockChangelogEntries,
      success: true,
      timestamp: new Date().toISOString()
    }
  }

  // Graph
  async getGraph(repoId: string): Promise<ApiResponse<Graph>> {
    await delay(600)
    
    return {
      data: mockGraph,
      success: true,
      timestamp: new Date().toISOString()
    }
  }

  // Activity
  async getActivity(): Promise<ApiResponse<ActivityEvent[]>> {
    await delay(250)
    
    return {
      data: mockActivityEvents,
      success: true,
      timestamp: new Date().toISOString()
    }
  }

  // Billing
  async getBillingUsage(): Promise<ApiResponse<BillingUsage>> {
    await delay(300)
    
    return {
      data: mockBillingUsage,
      success: true,
      timestamp: new Date().toISOString()
    }
  }

  // User & Organization
  async getCurrentUser() {
    await delay(100)
    return {
      data: mockUser,
      success: true,
      timestamp: new Date().toISOString()
    }
  }

  async getOrganization() {
    await delay(150)
    return {
      data: mockOrganization,
      success: true,
      timestamp: new Date().toISOString()
    }
  }
}

// Singleton instance
export const apiClient = new MockApiClient()
