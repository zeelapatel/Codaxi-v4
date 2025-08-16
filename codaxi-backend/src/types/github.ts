export interface GitHubOAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scope: string
}

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

export interface GitHubBranch {
  name: string
  commit: {
    sha: string
    url: string
  }
  protected: boolean
}

export interface GitHubCommit {
  sha: string
  node_id: string
  commit: {
    author: {
      name: string
      email: string
      date: string
    }
    committer: {
      name: string
      email: string
      date: string
    }
    message: string
    tree: {
      sha: string
      url: string
    }
    url: string
    comment_count: number
    verification: {
      verified: boolean
      reason: string
      signature: string
      payload: string
    }
  }
  url: string
  html_url: string
  comments_url: string
  author: GitHubUser
  committer: GitHubUser
  parents: Array<{
    sha: string
    url: string
    html_url: string
  }>
}

export interface GitHubFile {
  name: string
  path: string
  sha: string
  size: number
  url: string
  html_url: string
  git_url: string
  download_url: string
  type: string
  content?: string
  encoding?: string
}

export interface GitHubWebhookPayload {
  ref: string
  before: string
  after: string
  repository: GitHubRepository
  pusher: {
    name: string
    email: string
  }
  commits: GitHubCommit[]
  head_commit: GitHubCommit
  created: boolean
  deleted: boolean
  forced: boolean
  base_ref: string
  compare: string
}

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

export interface GitHubSyncJob {
  id: string
  repositoryConnectionId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  startedAt?: Date
  completedAt?: Date
  error?: string
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

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

export interface GitHubError {
  message: string
  documentation_url?: string
  errors?: Array<{
    resource: string
    field: string
    code: string
  }>
}
