import { 
  Repo, 
  Scan, 
  DocNode, 
  QAThread, 
  QAMessage, 
  ChangelogEntry, 
  ActivityEvent, 
  User, 
  Organization, 
  BillingUsage,
  GraphNode,
  GraphEdge,
  Graph
} from '@/types'

// Current user
export const mockUser: User = {
  id: 'user-1',
  name: 'Alex Chen',
  email: 'alex@codaxi.dev',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  role: 'admin'
}

// Organization
export const mockOrganization: Organization = {
  id: 'org-1',
  name: 'Codaxi Team',
  slug: 'codaxi',
  planType: 'team',
  memberCount: 12,
  settings: {
    dataRetentionDays: 90,
    docsAsCodeEnabled: true,
    slackIntegrationEnabled: false
  }
}

// Repos
export const mockRepos: Repo[] = [
  {
    id: 'repo-1',
    name: 'core',
    owner: 'codaxi',
    provider: 'github',
    visibility: 'private',
    defaultBranch: 'main',
    languages: ['ts', 'js'],
    updatedAt: '2024-01-15T10:30:00Z',
    docsFreshness: 95,
    description: 'Core API service with authentication and business logic',
    starCount: 234,
    isFavorite: true
  },
  {
    id: 'repo-2',
    name: 'web',
    owner: 'codaxi',
    provider: 'github',
    visibility: 'private',
    defaultBranch: 'main',
    languages: ['ts', 'js'],
    updatedAt: '2024-01-14T16:45:00Z',
    docsFreshness: 87,
    description: 'React frontend application',
    starCount: 89,
    isFavorite: true
  },
  {
    id: 'repo-3',
    name: 'payment-svc',
    owner: 'acme',
    provider: 'github',
    visibility: 'private',
    defaultBranch: 'main',
    languages: ['java'],
    updatedAt: '2024-01-13T09:15:00Z',
    docsFreshness: 78,
    description: 'Payment processing microservice',
    starCount: 45
  },
  {
    id: 'repo-4',
    name: 'order-svc',
    owner: 'acme',
    provider: 'github',
    visibility: 'private',
    defaultBranch: 'main',
    languages: ['java'],
    updatedAt: '2024-01-12T14:20:00Z',
    docsFreshness: 92,
    description: 'Order management service',
    starCount: 67
  },
  {
    id: 'repo-5',
    name: 'json-stream',
    owner: 'oss',
    provider: 'github',
    visibility: 'public',
    defaultBranch: 'main',
    languages: ['go'],
    updatedAt: '2024-01-11T11:30:00Z',
    docsFreshness: 62,
    description: 'Streaming JSON parser library',
    starCount: 1250
  },
  {
    id: 'repo-6',
    name: 'mono',
    owner: 'sandbox',
    provider: 'gitlab',
    visibility: 'private',
    defaultBranch: 'develop',
    languages: ['py', 'ts'],
    updatedAt: '2024-01-10T08:45:00Z',
    docsFreshness: 71,
    description: 'Monorepo for experimental projects',
    starCount: 23
  }
]

// Scans
export const mockScans: Scan[] = [
  {
    id: 'scan-1',
    repoId: 'repo-1',
    branch: 'main',
    status: 'completed',
    startedAt: '2024-01-15T10:30:00Z',
    completedAt: '2024-01-15T10:45:00Z',
    metrics: {
      filesParsed: 234,
      endpointsDetected: 45,
      eventsDetected: 23,
      typesDetected: 156,
      tokensUsed: 12450,
      durationSec: 890
    }
  },
  {
    id: 'scan-2',
    repoId: 'repo-2',
    branch: 'main',
    status: 'completed',
    startedAt: '2024-01-14T16:45:00Z',
    completedAt: '2024-01-14T17:02:00Z',
    metrics: {
      filesParsed: 189,
      endpointsDetected: 12,
      eventsDetected: 8,
      typesDetected: 94,
      tokensUsed: 8930,
      durationSec: 1020
    }
  },
  {
    id: 'scan-3',
    repoId: 'repo-3',
    branch: 'main',
    status: 'error',
    startedAt: '2024-01-13T09:15:00Z',
    metrics: {
      filesParsed: 67,
      endpointsDetected: 0,
      eventsDetected: 0,
      typesDetected: 0,
      tokensUsed: 2340,
      durationSec: 120
    },
    errors: [
      {
        stage: 'embedding',
        message: 'Failed to connect to embedding service: timeout after 30s'
      }
    ]
  },
  {
    id: 'scan-4',
    repoId: 'repo-4',
    branch: 'main',
    status: 'parsing',
    startedAt: '2024-01-16T08:00:00Z',
    metrics: {
      filesParsed: 123,
      endpointsDetected: 0,
      eventsDetected: 0,
      typesDetected: 0,
      tokensUsed: 0,
      durationSec: 0
    }
  }
]

// Add scan references to repos
mockRepos.forEach(repo => {
  const scan = mockScans.find(s => s.repoId === repo.id)
  if (scan) {
    repo.lastScan = scan
  }
})

// Doc Nodes
export const mockDocNodes: DocNode[] = [
  {
    id: 'doc-1',
    kind: 'route',
    path: '/api/auth/login',
    title: 'POST /api/auth/login',
    summary: 'Authenticate user with email and password',
    anchors: [
      { id: 'request', label: 'Request Body' },
      { id: 'response', label: 'Response' },
      { id: 'errors', label: 'Error Codes' }
    ],
    citations: [
      { filePath: 'src/controllers/auth.ts', startLine: 23, endLine: 45, sha: 'abc123' },
      { filePath: 'src/types/auth.ts', startLine: 12, endLine: 18, sha: 'abc123' }
    ],
    html: `<h2 id="request">Request Body</h2>
<pre><code class="language-json">{
  "email": "user@example.com",
  "password": "secretpassword"
}</code></pre>
<h2 id="response">Response</h2>
<pre><code class="language-json">{
  "token": "jwt_token_here",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}</code></pre>`
  },
  {
    id: 'doc-2',
    kind: 'route',
    path: '/api/orders',
    title: 'GET /api/orders',
    summary: 'Retrieve paginated list of orders',
    anchors: [
      { id: 'parameters', label: 'Query Parameters' },
      { id: 'response', label: 'Response' }
    ],
    citations: [
      { filePath: 'src/controllers/orders.ts', startLine: 78, endLine: 95, sha: 'def456' }
    ],
    html: `<h2 id="parameters">Query Parameters</h2>
<ul>
<li><code>page</code> - Page number (default: 1)</li>
<li><code>limit</code> - Items per page (default: 20)</li>
<li><code>status</code> - Filter by order status</li>
</ul>`
  },
  {
    id: 'doc-3',
    kind: 'type',
    path: 'Order',
    title: 'Order Type',
    summary: 'Core order data structure',
    anchors: [
      { id: 'properties', label: 'Properties' },
      { id: 'example', label: 'Example' }
    ],
    citations: [
      { filePath: 'src/types/order.ts', startLine: 5, endLine: 25, sha: 'ghi789' }
    ],
    html: `<h2 id="properties">Properties</h2>
<pre><code class="language-typescript">interface Order {
  id: string
  customerId: string
  items: LineItem[]
  status: OrderStatus
  total: number
  createdAt: string
  updatedAt: string
}</code></pre>`
  },
  {
    id: 'doc-4',
    kind: 'event',
    path: 'order.created',
    title: 'Order Created Event',
    summary: 'Emitted when a new order is successfully created',
    anchors: [
      { id: 'payload', label: 'Event Payload' },
      { id: 'handlers', label: 'Event Handlers' }
    ],
    citations: [
      { filePath: 'src/events/order.ts', startLine: 12, endLine: 28, sha: 'jkl012' }
    ],
    html: `<h2 id="payload">Event Payload</h2>
<pre><code class="language-json">{
  "orderId": "order-123",
  "customerId": "customer-456",
  "total": 99.99,
  "timestamp": "2024-01-15T10:30:00Z"
}</code></pre>`
  }
]

// QA Threads and Messages
export const mockQAMessages: QAMessage[] = [
  {
    id: 'msg-1',
    role: 'user',
    content: 'How does the authentication system work?',
    timestamp: '2024-01-15T14:20:00Z'
  },
  {
    id: 'msg-2',
    role: 'assistant',
    content: `The authentication system uses JWT tokens for stateless authentication. Here's how it works:

1. **Login Process**: Users submit credentials to \`POST /api/auth/login\`
2. **Token Generation**: Server validates credentials and generates a JWT token
3. **Token Usage**: Clients include the token in the Authorization header for subsequent requests
4. **Token Validation**: Middleware validates tokens on protected routes

The system supports both email/password and OAuth providers like Google and GitHub.`,
    timestamp: '2024-01-15T14:20:30Z',
    citations: [
      { filePath: 'src/controllers/auth.ts', startLine: 23, endLine: 45, sha: 'abc123' },
      { filePath: 'src/middleware/auth.ts', startLine: 8, endLine: 22, sha: 'abc123' }
    ],
    retrievalTrace: [
      { step: 'Query Analysis', details: 'Identified authentication-related keywords' },
      { step: 'Document Retrieval', details: 'Found 5 relevant code sections' },
      { step: 'Context Ranking', details: 'Ranked by relevance score (0.92)' },
      { step: 'Response Generation', details: 'Generated response using top 3 chunks' }
    ]
  }
]

export const mockQAThreads: QAThread[] = [
  {
    id: 'thread-1',
    repoId: 'repo-1',
    question: 'How does the authentication system work?',
    createdAt: '2024-01-15T14:20:00Z',
    messages: mockQAMessages
  },
  {
    id: 'thread-2',
    repoId: 'repo-1',
    question: 'What are the different order statuses?',
    createdAt: '2024-01-14T11:15:00Z',
    messages: [
      {
        id: 'msg-3',
        role: 'user',
        content: 'What are the different order statuses?',
        timestamp: '2024-01-14T11:15:00Z'
      },
      {
        id: 'msg-4',
        role: 'assistant',
        content: `The order management system supports the following statuses:

- **PENDING**: Order created but payment not processed
- **CONFIRMED**: Payment successful, order confirmed
- **PROCESSING**: Order is being prepared/fulfilled
- **SHIPPED**: Order has been shipped to customer
- **DELIVERED**: Order successfully delivered
- **CANCELLED**: Order cancelled by customer or system
- **REFUNDED**: Order refunded after cancellation

Status transitions are enforced by the state machine in the OrderService.`,
        timestamp: '2024-01-14T11:15:45Z',
        citations: [
          { filePath: 'src/types/order.ts', startLine: 28, endLine: 36, sha: 'def456' },
          { filePath: 'src/services/order.ts', startLine: 89, endLine: 120, sha: 'def456' }
        ]
      }
    ]
  }
]

// Changelog Entries
export const mockChangelogEntries: ChangelogEntry[] = [
  {
    id: 'change-1',
    type: 'breaking',
    severity: 'high',
    title: 'Order API: customerId field renamed to userId',
    description: 'The customerId field in the Order type has been renamed to userId for consistency across the API.',
    filePath: 'src/types/order.ts',
    fromSha: 'abc123',
    toSha: 'def456',
    diff: `- customerId: string
+ userId: string`
  },
  {
    id: 'change-2',
    type: 'feature',
    severity: 'medium',
    title: 'Added order search endpoint',
    description: 'New GET /api/orders/search endpoint for advanced order filtering.',
    filePath: 'src/controllers/orders.ts',
    fromSha: 'def456',
    toSha: 'ghi789'
  },
  {
    id: 'change-3',
    type: 'docs',
    severity: 'low',
    title: 'Updated authentication documentation',
    description: 'Added examples for OAuth integration and improved error code documentation.',
    filePath: 'docs/authentication.md',
    fromSha: 'ghi789',
    toSha: 'jkl012'
  }
]

// Activity Events
export const mockActivityEvents: ActivityEvent[] = [
  {
    id: 'activity-1',
    type: 'scan_completed',
    title: 'Scan completed for codaxi/core',
    description: 'Found 45 endpoints, 23 events, and 156 types',
    timestamp: '2024-01-15T10:45:00Z',
    repoId: 'repo-1',
    userId: 'user-1'
  },
  {
    id: 'activity-2',
    type: 'repo_added',
    title: 'New repository added',
    description: 'acme/payment-svc was added to the organization',
    timestamp: '2024-01-14T09:30:00Z',
    repoId: 'repo-3',
    userId: 'user-1'
  },
  {
    id: 'activity-3',
    type: 'qa_asked',
    title: 'Question asked about authentication',
    description: 'How does the authentication system work?',
    timestamp: '2024-01-15T14:20:00Z',
    repoId: 'repo-1',
    userId: 'user-1'
  },
  {
    id: 'activity-4',
    type: 'docs_updated',
    title: 'Documentation updated',
    description: 'Order API documentation was regenerated',
    timestamp: '2024-01-13T16:15:00Z',
    repoId: 'repo-1',
    userId: 'user-1'
  }
]

// Billing Usage
export const mockBillingUsage: BillingUsage = {
  reposScanned: 6,
  maxRepos: 10,
  tokensUsed: 45670,
  maxTokens: 100000,
  daysRemaining: 23
}

// Graph Data
export const mockGraphNodes: GraphNode[] = [
  {
    id: 'node-1',
    type: 'service',
    label: 'Auth Service',
    x: 100,
    y: 100,
    metadata: { endpoints: 5, status: 'active' }
  },
  {
    id: 'node-2',
    type: 'service',
    label: 'Order Service',
    x: 300,
    y: 150,
    metadata: { endpoints: 12, status: 'active' }
  },
  {
    id: 'node-3',
    type: 'route',
    label: 'POST /api/auth/login',
    x: 50,
    y: 200,
    metadata: { method: 'POST', protected: false }
  },
  {
    id: 'node-4',
    type: 'route',
    label: 'GET /api/orders',
    x: 250,
    y: 250,
    metadata: { method: 'GET', protected: true }
  },
  {
    id: 'node-5',
    type: 'type',
    label: 'Order',
    x: 400,
    y: 100,
    metadata: { fields: 8, exported: true }
  },
  {
    id: 'node-6',
    type: 'event',
    label: 'order.created',
    x: 350,
    y: 300,
    metadata: { handlers: 3, async: true }
  }
]

export const mockGraphEdges: GraphEdge[] = [
  {
    id: 'edge-1',
    source: 'node-1',
    target: 'node-3',
    type: 'calls',
    weight: 1
  },
  {
    id: 'edge-2',
    source: 'node-2',
    target: 'node-4',
    type: 'calls',
    weight: 1
  },
  {
    id: 'edge-3',
    source: 'node-4',
    target: 'node-5',
    type: 'depends',
    weight: 0.8
  },
  {
    id: 'edge-4',
    source: 'node-2',
    target: 'node-6',
    type: 'triggers',
    weight: 0.6
  }
]

export const mockGraph: Graph = {
  nodes: mockGraphNodes,
  edges: mockGraphEdges
}
