// Real API client for backend integration
const API_BASE_URL = (typeof process !== 'undefined' && (process as any).env?.NEXT_PUBLIC_API_BASE_URL) || 'http://localhost:5000/api'

// Import GitHub types
import {
  GitHubAuthUrlResponse,
  GitHubConnectionResponse,
  GitHubRepositoriesResponse,
  GitHubConnectedRepositoriesResponse,
  GitHubOAuthRequest
} from '@/types/github'
import { DocNode } from '@/types'

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  errors?: Array<{ field: string; message: string }>
  timestamp: string
}

export interface User {
  id: string
  email: string
  name: string
  company?: string
  role: 'ADMIN' | 'EDITOR' | 'MEMBER' | 'VIEWER'
  avatar?: string
  emailVerified: boolean
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  planType: 'FREE' | 'TEAM' | 'ENTERPRISE'
}

export interface LoginResponse {
  user: User
  token: string
  organization?: Organization
}

export interface RegisterRequest {
  email: string
  name: string
  password: string
  company?: string
}

export interface LoginRequest {
  email: string
  password: string
}

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
    // Load token from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('codaxi_token')
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {})
    }

    // Add authorization header if token exists
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      })

      const data: ApiResponse<T> = await response.json()

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`)
      }

      return data
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  setToken(token: string | null) {
    this.token = token
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('codaxi_token', token)
      } else {
        localStorage.removeItem('codaxi_token')
      }
    }
  }

  getToken(): string | null {
    return this.token
  }

  // Auth endpoints
  async register(data: RegisterRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await this.request<LoginResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    })

    // Store token after successful registration
    if (response.success && response.data?.token) {
      this.setToken(response.data.token)
    }

    return response
  }

  async login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    })

    // Store token after successful login
    if (response.success && response.data?.token) {
      this.setToken(response.data.token)
    }

    return response
  }

  async logout(): Promise<ApiResponse> {
    const response = await this.request('/auth/logout', {
      method: 'POST'
    })

    // Clear token after logout
    this.setToken(null)

    return response
  }

  async getProfile(): Promise<ApiResponse<User>> {
    return this.request<User>('/auth/profile')
  }

  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    const response = await this.request<{ token: string }>('/auth/refresh', {
      method: 'POST'
    })

    // Update token after refresh
    if (response.success && response.data?.token) {
      this.setToken(response.data.token)
    }

    return response
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    return this.request('/health')
  }

  // GitHub OAuth methods
  async generateGitHubAuthUrl(): Promise<ApiResponse<GitHubAuthUrlResponse>> {
    return this.request<GitHubAuthUrlResponse>('/github/auth/url', {
      method: 'POST'
    })
  }

  async handleGitHubCallback(data: GitHubOAuthRequest): Promise<ApiResponse<GitHubConnectionResponse>> {
    return this.request<GitHubConnectionResponse>('/github/auth/callback', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // GitHub repository methods
  async getGitHubRepositories(): Promise<ApiResponse<GitHubRepositoriesResponse>> {
    return this.request<GitHubRepositoriesResponse>('/github/repositories')
  }

  async connectGitHubRepository(owner: string, repo: string): Promise<ApiResponse<GitHubConnectionResponse>> {
    return this.request<GitHubConnectionResponse>('/github/repositories/connect', {
      method: 'POST',
      body: JSON.stringify({ owner, repo })
    })
  }

  async disconnectGitHubRepository(connectionId: string): Promise<ApiResponse> {
    return this.request(`/github/repositories/${connectionId}`, {
      method: 'DELETE'
    })
  }

  async getConnectedRepositories(): Promise<ApiResponse<GitHubConnectedRepositoriesResponse>> {
    return this.request<GitHubConnectedRepositoriesResponse>('/github/repositories/connected')
  }

  // Scans
  async startScan(
    repoId: string,
    branch?: string
  ): Promise<ApiResponse<{
    id: string
    repoId: string
    branch: string
    status: 'queued' | 'parsing' | 'embedding' | 'generating' | 'completed' | 'error'
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
  }>> {
    return this.request('/scans', {
      method: 'POST',
      body: JSON.stringify({ repoId, branch })
    })
  }

  async getScan(
    scanId: string
  ): Promise<ApiResponse<{
    id: string
    repoId: string
    branch: string
    status: 'queued' | 'parsing' | 'embedding' | 'generating' | 'completed' | 'error'
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
  }>> {
    return this.request(`/scans/${scanId}`)
  }

  async cancelScan(scanId: string): Promise<ApiResponse<{ id: string }>> {
    return this.request(`/scans/${scanId}/cancel`, { method: 'POST' })
  }

  // Docs
  async getDocs(repoId: string, query?: string, opts?: { kinds?: string[]; page?: number; pageSize?: number }): Promise<ApiResponse<{ items: DocNode[]; total: number; page: number; pageSize: number }>> {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (opts?.kinds?.length) params.set('kinds', opts.kinds.join(','))
    if (opts?.page) params.set('page', String(opts.page))
    if (opts?.pageSize) params.set('pageSize', String(opts.pageSize))
    const qs = params.toString() ? `?${params.toString()}` : ''
    return this.request(`/repos/${repoId}/docs${qs}`)
  }

  async getDoc(repoId: string, docId: string): Promise<ApiResponse<DocNode>> {
    return this.request<DocNode>(`/repos/${repoId}/docs/${docId}`)
  }

  async getDocSchema(repoId: string, docId: string): Promise<ApiResponse<{ id: string; metadata?: any; params?: any; requestSchema?: any; requestExample?: any; responses?: any; errors?: any }>> {
    return this.request(`/repos/${repoId}/docs/${docId}/schema`)
  }

  async updateDocSchema(repoId: string, docId: string, data: { params?: any; requestSchema?: any; requestExample?: any; responses?: any; errors?: any }): Promise<ApiResponse<{ id: string }>> {
    return this.request(`/repos/${repoId}/docs/${docId}/schema`, { method: 'PUT', body: JSON.stringify(data) })
  }

  async generateDocSchema(repoId: string, docId: string): Promise<ApiResponse<any>> {
    return this.request(`/repos/${repoId}/docs/${docId}/schema:generate`, { method: 'POST' })
  }

  // Repository details with scan status
  async getRepositoryDetails(repoId: string): Promise<ApiResponse<{
    id: string
    owner: string
    name: string
    description: string
    languages: string[]
    docsFreshness: number
    lastScan: {
      id?: string
      status: 'queued' | 'parsing' | 'embedding' | 'generating' | 'completed' | 'error'
      timestamp: string
    } | null
    isFavorite: boolean
    updatedAt: string
  }>> {
    return this.request(`/github/repositories/${repoId}/details`)
  }

  // Get repository by ID
  async getRepo(repoId: string): Promise<ApiResponse<{
    id: string
    owner: string
    name: string
    description: string
    languages: string[]
    docsFreshness: number
    lastScan: {
      status: 'queued' | 'parsing' | 'embedding' | 'generating' | 'completed' | 'error'
      timestamp: string
    } | null
    isFavorite: boolean
    visibility: 'public' | 'private'
    defaultBranch: string
    updatedAt: string
  }>> {
    return this.request(`/github/repositories/${repoId}/details`)
  }

  // GitHub account management
  async disconnectGitHubAccount(): Promise<ApiResponse> {
    return this.request('/github/account', {
      method: 'DELETE'
    })
  }
}

// Create and export singleton instance
export const apiClient = new ApiClient(API_BASE_URL)

// Export the ApiClient class for type checking
export type { ApiClient }

// Helper function to check if user is authenticated
export function isAuthenticated(): boolean {
  return !!apiClient.getToken()
}

// Helper function to get auth headers
export function getAuthHeaders(): Record<string, string> {
  const token = apiClient.getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}
