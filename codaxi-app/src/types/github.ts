// GitHub OAuth Types
export interface GitHubOAuthRequest {
  code: string
  state?: string
}

export interface GitHubOAuthResponse {
  access_token: string
  token_type: string
  scope: string
  refresh_token?: string
  expires_in?: number
}

// GitHub User Types
export interface GitHubUser {
  id: number
  login: string
  name: string
  email: string
  avatar_url: string
  html_url: string
  type: string
  company?: string
  location?: string
  bio?: string
}

// GitHub Repository Types
export interface GitHubRepository {
  id: number
  name: string
  full_name: string
  description: string
  private: boolean
  fork: boolean
  language: string
  default_branch: string
  html_url: string
  clone_url: string
  ssh_url: string
  size: number
  stargazers_count: number
  watchers_count: number
  forks_count: number
  open_issues_count: number
  created_at: string
  updated_at: string
  pushed_at: string
  topics: string[]
  visibility: string
  archived: boolean
  disabled: boolean
}

// GitHub Connection Types
export interface GitHubConnection {
  id: string
  userId: string
  githubUserId: number
  githubUsername: string
  accessToken: string
  refreshToken?: string
  tokenExpiresAt?: Date
  scope: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface GitHubRepositoryConnection {
  id: string
  githubConnectionId: string
  repositoryId: string
  githubRepoId: number
  githubRepoName: string
  githubRepoFullName: string
  isActive: boolean
  lastSyncAt?: Date
  createdAt: Date
  updatedAt: Date
}

// GitHub Webhook Types
export interface GitHubWebhook {
  id: string
  repositoryConnectionId: string
  webhookId: number
  webhookUrl: string
  webhookSecret: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// API Response Types
export interface GitHubAuthUrlResponse {
  authUrl: string
  state: string
}

export interface GitHubConnectionResponse {
  connection: GitHubConnection
  githubUser: GitHubUser
}

export interface GitHubRepositoriesResponse {
  repositories: GitHubRepository[]
}

export interface GitHubConnectedRepositoriesResponse {
  connections: GitHubRepositoryConnection[]
}
