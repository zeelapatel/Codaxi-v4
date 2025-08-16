import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Theme } from '@/types'

interface UIState {
  // Theme
  theme: Theme
  setTheme: (theme: Theme) => void
  
  // Sidebar
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  
  // Global search
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void
  
  // Current repo context
  currentRepoId?: string
  setCurrentRepoId: (repoId?: string) => void
  
  // Repos view preferences
  reposViewMode: 'table' | 'grid'
  setReposViewMode: (mode: 'table' | 'grid') => void
  
  // Doc tree state
  expandedDocNodes: Record<string, boolean>
  toggleDocNode: (nodeId: string) => void
  
  // Recent activity
  lastVisitedRepos: string[]
  addRecentRepo: (repoId: string) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Theme
      theme: 'system',
      setTheme: (theme) => set({ theme }),
      
      // Sidebar
      sidebarOpen: true,
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      
      // Global search
      searchOpen: false,
      setSearchOpen: (searchOpen) => set({ searchOpen }),
      
      // Current repo context
      currentRepoId: undefined,
      setCurrentRepoId: (currentRepoId) => set({ currentRepoId }),
      
      // Repos view preferences
      reposViewMode: 'table',
      setReposViewMode: (reposViewMode) => set({ reposViewMode }),
      
      // Doc tree state
      expandedDocNodes: {},
      toggleDocNode: (nodeId) => set((state) => ({
        expandedDocNodes: {
          ...state.expandedDocNodes,
          [nodeId]: !state.expandedDocNodes[nodeId]
        }
      })),
      
      // Recent activity
      lastVisitedRepos: [],
      addRecentRepo: (repoId) => set((state) => {
        const filtered = state.lastVisitedRepos.filter(id => id !== repoId)
        return {
          lastVisitedRepos: [repoId, ...filtered].slice(0, 5) // Keep last 5
        }
      }),
    }),
    {
      name: 'codaxi-ui-state',
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        reposViewMode: state.reposViewMode,
        expandedDocNodes: state.expandedDocNodes,
        lastVisitedRepos: state.lastVisitedRepos,
      }),
    }
  )
)

// Keyboard shortcuts store
interface KeyboardState {
  shortcuts: Record<string, () => void>
  registerShortcut: (key: string, handler: () => void) => void
  unregisterShortcut: (key: string) => void
}

export const useKeyboardStore = create<KeyboardState>((set, get) => ({
  shortcuts: {},
  registerShortcut: (key, handler) => set((state) => ({
    shortcuts: { ...state.shortcuts, [key]: handler }
  })),
  unregisterShortcut: (key) => set((state) => {
    const { [key]: _, ...rest } = state.shortcuts
    return { shortcuts: rest }
  }),
}))

// Toast notifications store
interface ToastState {
  toasts: Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    description?: string
    duration?: number
  }>
  addToast: (toast: Omit<ToastState['toasts'][0], 'id'>) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substr(2, 9)
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }]
    }))
    
    // Auto remove after duration
    const duration = toast.duration ?? 5000
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter(t => t.id !== id)
        }))
      }, duration)
    }
  },
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter(t => t.id !== id)
  })),
}))

// Analytics store (mock events)
interface AnalyticsState {
  events: Array<{
    name: string
    properties?: Record<string, any>
    timestamp: string
  }>
  track: (name: string, properties?: Record<string, any>) => void
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  events: [],
  track: (name, properties) => {
    const event = {
      name,
      properties,
      timestamp: new Date().toISOString()
    }
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics:', event)
    }
    
    set((state) => ({
      events: [...state.events.slice(-100), event] // Keep last 100 events
    }))
  },
}))
