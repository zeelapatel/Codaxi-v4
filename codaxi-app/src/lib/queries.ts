import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient as realApiClient } from './api-client'
import { apiClient as mockApiClient } from './api'
import { RepoFilters, AddRepoForm, AskQuestionForm } from '@/types'

// Query Keys
export const queryKeys = {
  repos: ['repos'] as const,
  repo: (id: string) => ['repos', id] as const,
  scan: (id: string) => ['scans', id] as const,
  docs: (repoId: string, query?: string) => ['docs', repoId, query] as const,
  doc: (repoId: string, docId: string) => ['docs', repoId, docId] as const,
  qaThreads: (repoId: string) => ['qa-threads', repoId] as const,
  qaThread: (threadId: string) => ['qa-threads', threadId] as const,
  changelog: (repoId: string, fromSha?: string, toSha?: string) => 
    ['changelog', repoId, fromSha, toSha] as const,
  graph: (repoId: string) => ['graph', repoId] as const,
  activity: ['activity'] as const,
  billing: ['billing'] as const,
  user: ['user'] as const,
  organization: ['organization'] as const,
  githubRepos: ['github-repos'] as const,
  connectedRepos: ['connected-repos'] as const,
}

// Repo Queries
export const useRepos = (filters?: RepoFilters) => {
  const { data: connectedRepos } = useConnectedRepositories()
  
  return useQuery({
    queryKey: [...queryKeys.repos, filters],
    queryFn: async () => {
      if (!connectedRepos?.data?.connections) {
        return { success: true, data: [] }
      }

      const repoDetails = await Promise.all(
        connectedRepos.data.connections.map(async (conn) => {
          try {
            const details = await realApiClient.getRepositoryDetails(conn.repositoryId)
            return details.data
          } catch (error) {
            console.error(`Error fetching details for ${conn.githubRepoFullName}:`, error)
            return null
          }
        })
      )

      return {
        success: true,
        data: repoDetails.filter(Boolean)
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!connectedRepos?.data?.connections,
    // Disable additional polling to reduce backend load and prevent 429s on GitHub routes
    refetchInterval: false,
    refetchOnWindowFocus: false
  })
}

export const useRepo = (id: string) => {
  return useQuery({
    queryKey: queryKeys.repo(id),
    queryFn: () => realApiClient.getRepo(id),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: false,
    refetchOnWindowFocus: false
  })
}

export const useCreateRepo = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: AddRepoForm) => mockApiClient.createRepo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.repos })
    },
  })
}

// Scan Queries
export const useScan = (scanId: string) => {
  return useQuery({
    queryKey: queryKeys.scan(scanId),
    queryFn: () => realApiClient.getScan(scanId),
    enabled: !!scanId,
    refetchInterval: (query) => {
      // Only refetch if scan is in progress
      const status = (query.state.data as any)?.data?.status
      return status && ['queued', 'parsing', 'embedding', 'generating'].includes(status) 
        ? 2000 // 2 seconds
        : false
    },
  })
}

export const useStartScan = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ repoId, branch }: { repoId: string; branch?: string }) => 
      realApiClient.startScan(repoId, branch),
    onSuccess: (data) => {
      const repoId = data.data?.repoId
      if (repoId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.repo(repoId) })
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.repos })
    },
  })
}

export const useCancelScan = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (scanId: string) => realApiClient.cancelScan(scanId),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scan(id) })
    }
  })
}

// Docs Queries (real backend)
export const useDocs = (repoId: string, query?: string, opts?: { kinds?: string[]; page?: number; pageSize?: number }) => {
  return useQuery({
    queryKey: queryKeys.docs(repoId, `${query || ''}-${(opts?.kinds || []).join(',')}-${opts?.page || 1}-${opts?.pageSize || 50}`),
    queryFn: () => realApiClient.getDocs(repoId, query, opts),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  })
}

export const useDoc = (repoId: string, docId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.doc(repoId, docId),
    queryFn: () => realApiClient.getDoc(repoId, docId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled ?? true,
  })
}

// Doc schema (request/response/errors)
export const useDocSchema = (repoId: string, docId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['doc-schema', repoId, docId],
    queryFn: () => realApiClient.getDocSchema(repoId, docId),
    staleTime: 60 * 1000,
    enabled: options?.enabled ?? true,
  })
}

export const useUpdateDocSchema = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ repoId, docId, data }: { repoId: string; docId: string; data: { params?: any; requestSchema?: any; requestExample?: any; responses?: any; errors?: any } }) =>
      realApiClient.updateDocSchema(repoId, docId, data),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['doc-schema', vars.repoId, vars.docId] })
      queryClient.invalidateQueries({ queryKey: queryKeys.doc(vars.repoId, vars.docId) })
    }
  })
}

export const useGenerateDocSchema = () => {
  return useMutation({
    mutationFn: ({ repoId, docId }: { repoId: string; docId: string }) => realApiClient.generateDocSchema(repoId, docId)
  })
}

export const useSearchDocs = (repoId: string, query: string) => {
  return useQuery({
    queryKey: ['search-docs', repoId, query],
    queryFn: () => realApiClient.getDocs(repoId, query).then(r => ({ ...r, data: r.data })),
    enabled: query.length > 1,
    staleTime: 60 * 1000,
  })
}

// Q&A Queries
export const useQAThreads = (repoId: string) => {
  return useQuery({
    queryKey: queryKeys.qaThreads(repoId),
    queryFn: () => mockApiClient.getQAThreads(repoId),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export const useQAThread = (threadId: string) => {
  return useQuery({
    queryKey: queryKeys.qaThread(threadId),
    queryFn: () => mockApiClient.getQAThread(threadId),
    staleTime: 30 * 1000, // 30 seconds (more frequent for active conversations)
  })
}

export const useAskQuestion = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ repoId, data }: { repoId: string; data: AskQuestionForm }) => 
      mockApiClient.askQuestion(repoId, data),
    onSuccess: (data) => {
      const { repoId } = data.data
      queryClient.invalidateQueries({ queryKey: queryKeys.qaThreads(repoId) })
    },
  })
}

// Changelog Queries
export const useChangelog = (repoId: string, fromSha?: string, toSha?: string) => {
  return useQuery({
    queryKey: queryKeys.changelog(repoId, fromSha, toSha),
    queryFn: () => mockApiClient.getChangelog(repoId, fromSha, toSha),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Graph Queries
export const useGraph = (repoId: string) => {
  return useQuery({
    queryKey: queryKeys.graph(repoId),
    queryFn: () => mockApiClient.getGraph(repoId),
    staleTime: 15 * 60 * 1000, // 15 minutes
  })
}

// Activity Queries
export const useActivity = () => {
  const { data: connectedRepos } = useConnectedRepositories()
  
  return useQuery({
    queryKey: queryKeys.activity,
    queryFn: async () => {
      if (!connectedRepos?.data?.connections) {
        return { success: true, data: [] }
      }

      // For now, we'll create activity items from repository data
      const activities = connectedRepos.data.connections.map((conn) => ({
        id: conn.repositoryId,
        type: 'repo_added',
        title: `Connected ${conn.githubRepoFullName}`,
        description: `Repository ${conn.githubRepoFullName} was connected to Codaxi`,
        timestamp: conn.createdAt
      }))

      return {
        success: true,
        data: activities.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
      }
    },
    staleTime: 30 * 1000, // 30 seconds for recent activity
    enabled: !!connectedRepos?.data?.connections
  })
}

// Billing Queries
export const useBillingUsage = () => {
  return useQuery({
    queryKey: queryKeys.billing,
    queryFn: () => mockApiClient.getBillingUsage(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// User & Organization Queries
export const useCurrentUser = () => {
  return useQuery({
    queryKey: queryKeys.user,
    queryFn: () => mockApiClient.getCurrentUser(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const useOrganization = () => {
  return useQuery({
    queryKey: queryKeys.organization,
    queryFn: () => mockApiClient.getOrganization(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// GitHub Queries
export const useGitHubRepositories = () => {
  return useQuery({
    queryKey: queryKeys.githubRepos,
    queryFn: () => realApiClient.getGitHubRepositories(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useConnectedRepositories = () => {
  return useQuery({
    queryKey: queryKeys.connectedRepos,
    queryFn: () => realApiClient.getConnectedRepositories(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export const useConnectRepository = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ owner, repo }: { owner: string; repo: string }) => 
      realApiClient.connectGitHubRepository(owner, repo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.connectedRepos })
      queryClient.invalidateQueries({ queryKey: queryKeys.repos })
    },
  })
}

export const useDisconnectRepository = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (connectionId: string) => 
      realApiClient.disconnectGitHubRepository(connectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.connectedRepos })
      queryClient.invalidateQueries({ queryKey: queryKeys.repos })
    },
  })
}
