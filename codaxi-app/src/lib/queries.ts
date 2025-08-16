import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './api'
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
  return useQuery({
    queryKey: [...queryKeys.repos, filters],
    queryFn: () => apiClient.getRepos(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useRepo = (id: string) => {
  return useQuery({
    queryKey: queryKeys.repo(id),
    queryFn: () => apiClient.getRepo(id),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export const useCreateRepo = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: AddRepoForm) => apiClient.createRepo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.repos })
    },
  })
}

// Scan Queries
export const useScan = (scanId: string) => {
  return useQuery({
    queryKey: queryKeys.scan(scanId),
    queryFn: () => apiClient.getScan(scanId),
    enabled: !!scanId,
    refetchInterval: (data) => {
      // Only refetch if scan is in progress
      const status = data?.data?.status
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
      apiClient.startScan(repoId, branch),
    onSuccess: (data) => {
      const { repoId } = data.data
      queryClient.invalidateQueries({ queryKey: queryKeys.repo(repoId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.repos })
    },
  })
}

// Docs Queries
export const useDocs = (repoId: string, query?: string) => {
  return useQuery({
    queryKey: queryKeys.docs(repoId, query),
    queryFn: () => apiClient.getDocs(repoId, query),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const useDoc = (repoId: string, docId: string) => {
  return useQuery({
    queryKey: queryKeys.doc(repoId, docId),
    queryFn: () => apiClient.getDoc(repoId, docId),
    staleTime: 15 * 60 * 1000, // 15 minutes
  })
}

export const useSearchDocs = (repoId: string, query: string) => {
  return useQuery({
    queryKey: ['search-docs', repoId, query],
    queryFn: () => apiClient.searchDocs(repoId, query),
    enabled: query.length > 2, // Only search if query is longer than 2 chars
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Q&A Queries
export const useQAThreads = (repoId: string) => {
  return useQuery({
    queryKey: queryKeys.qaThreads(repoId),
    queryFn: () => apiClient.getQAThreads(repoId),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export const useQAThread = (threadId: string) => {
  return useQuery({
    queryKey: queryKeys.qaThread(threadId),
    queryFn: () => apiClient.getQAThread(threadId),
    staleTime: 30 * 1000, // 30 seconds (more frequent for active conversations)
  })
}

export const useAskQuestion = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ repoId, data }: { repoId: string; data: AskQuestionForm }) => 
      apiClient.askQuestion(repoId, data),
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
    queryFn: () => apiClient.getChangelog(repoId, fromSha, toSha),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Graph Queries
export const useGraph = (repoId: string) => {
  return useQuery({
    queryKey: queryKeys.graph(repoId),
    queryFn: () => apiClient.getGraph(repoId),
    staleTime: 15 * 60 * 1000, // 15 minutes
  })
}

// Activity Queries
export const useActivity = () => {
  return useQuery({
    queryKey: queryKeys.activity,
    queryFn: () => apiClient.getActivity(),
    staleTime: 30 * 1000, // 30 seconds for recent activity
  })
}

// Billing Queries
export const useBillingUsage = () => {
  return useQuery({
    queryKey: queryKeys.billing,
    queryFn: () => apiClient.getBillingUsage(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// User & Organization Queries
export const useCurrentUser = () => {
  return useQuery({
    queryKey: queryKeys.user,
    queryFn: () => apiClient.getCurrentUser(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const useOrganization = () => {
  return useQuery({
    queryKey: queryKeys.organization,
    queryFn: () => apiClient.getOrganization(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// GitHub Queries
export const useGitHubRepositories = () => {
  return useQuery({
    queryKey: queryKeys.githubRepos,
    queryFn: () => apiClient.getGitHubRepositories(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useConnectedRepositories = () => {
  return useQuery({
    queryKey: queryKeys.connectedRepos,
    queryFn: () => apiClient.getConnectedRepositories(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export const useConnectRepository = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ owner, repo }: { owner: string; repo: string }) => 
      apiClient.connectGitHubRepository(owner, repo),
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
      apiClient.disconnectGitHubRepository(connectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.connectedRepos })
      queryClient.invalidateQueries({ queryKey: queryKeys.repos })
    },
  })
}
