'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { apiClient, User, Organization, LoginRequest, RegisterRequest } from '@/lib/api-client'
import { GitHubConnection, GitHubUser, GitHubOAuthRequest } from '@/types/github'
import { toast } from 'sonner'

interface AuthContextType {
  user: User | null
  organization: Organization | null
  isAuthenticated: boolean
  isLoading: boolean
  githubConnection: GitHubConnection | null
  githubUser: GitHubUser | null
  isGitHubConnected: boolean
  login: (data: LoginRequest) => Promise<boolean>
  register: (data: RegisterRequest) => Promise<boolean>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
  connectGitHub: () => Promise<string>
  handleGitHubCallback: (data: GitHubOAuthRequest) => Promise<boolean>
  disconnectGitHub: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [githubConnection, setGithubConnection] = useState<GitHubConnection | null>(null)
  const [githubUser, setGithubUser] = useState<GitHubUser | null>(null)

  const isAuthenticated = !!user

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = apiClient.getToken()
      
      if (token) {
        try {
          // Verify token and get user profile
          const response = await apiClient.getProfile()
          if (response.success && response.data) {
            setUser(response.data)
            // You could also fetch organization data here if needed
          } else {
            // Invalid token, clear it
            apiClient.setToken(null)
          }
        } catch (error) {
          console.error('Failed to verify token:', error)
          apiClient.setToken(null)
        }
      }
      
      setIsLoading(false)
    }

    initializeAuth()
  }, [])

  const login = async (data: LoginRequest): Promise<boolean> => {
    try {
      setIsLoading(true)
      const response = await apiClient.login(data)

      if (response.success && response.data) {
        setUser(response.data.user)
        setOrganization(response.data.organization || null)
        toast.success(response.message || 'Login successful!')
        return true
      } else {
        // Handle validation errors
        if (response.errors && response.errors.length > 0) {
          response.errors.forEach(error => {
            toast.error(`${error.field}: ${error.message}`)
          })
        } else {
          toast.error(response.message || 'Login failed')
        }
        return false
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Login failed. Please try again.')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: RegisterRequest): Promise<boolean> => {
    try {
      setIsLoading(true)
      const response = await apiClient.register(data)

      if (response.success && response.data) {
        setUser(response.data.user)
        setOrganization(response.data.organization || null)
        toast.success(response.message || 'Account created successfully!')
        return true
      } else {
        // Handle validation errors
        if (response.errors && response.errors.length > 0) {
          response.errors.forEach(error => {
            toast.error(`${error.field}: ${error.message}`)
          })
        } else {
          toast.error(response.message || 'Registration failed')
        }
        return false
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast.error('Registration failed. Please try again.')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async (): Promise<void> => {
    try {
      await apiClient.logout()
      setUser(null)
      setOrganization(null)
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Logout error:', error)
      // Still clear local state even if API call fails
      setUser(null)
      setOrganization(null)
      apiClient.setToken(null)
    }
  }

  const refreshProfile = async (): Promise<void> => {
    try {
      const response = await apiClient.getProfile()
      if (response.success && response.data) {
        setUser(response.data)
      }
    } catch (error) {
      console.error('Failed to refresh profile:', error)
    }
  }

  // GitHub methods
  const connectGitHub = async (): Promise<string> => {
    try {
      const response = await apiClient.generateGitHubAuthUrl()
      if (response.success && response.data) {
        return response.data.authUrl
      }
      throw new Error(response.message || 'Failed to generate GitHub auth URL')
    } catch (error) {
      console.error('GitHub connection error:', error)
      throw error
    }
  }

  const handleGitHubCallback = async (data: GitHubOAuthRequest): Promise<boolean> => {
    try {
      setIsLoading(true)
      const response = await apiClient.handleGitHubCallback(data)

      if (response.success && response.data) {
        setGithubConnection(response.data.connection)
        setGithubUser(response.data.githubUser)
        toast.success('GitHub account connected successfully!')
        return true
      } else {
        toast.error(response.message || 'Failed to connect GitHub account')
        return false
      }
    } catch (error) {
      console.error('GitHub callback error:', error)
      toast.error('Failed to connect GitHub account')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const disconnectGitHub = async (): Promise<void> => {
    try {
      setIsLoading(true)
      const response = await apiClient.disconnectGitHubAccount()

      if (response.success) {
        setGithubConnection(null)
        setGithubUser(null)
        toast.success('GitHub account disconnected successfully')
      } else {
        toast.error(response.message || 'Failed to disconnect GitHub account')
      }
    } catch (error) {
      console.error('GitHub disconnect error:', error)
      toast.error('Failed to disconnect GitHub account')
    } finally {
      setIsLoading(false)
    }
  }

  const isGitHubConnected = !!githubConnection?.isActive

  const value: AuthContextType = {
    user,
    organization,
    isAuthenticated,
    isLoading,
    githubConnection,
    githubUser,
    isGitHubConnected,
    login,
    register,
    logout,
    refreshProfile,
    connectGitHub,
    handleGitHubCallback,
    disconnectGitHub
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook for checking if user has specific role
export function useRequireRole(role: User['role']) {
  const { user, isAuthenticated } = useAuth()
  
  return isAuthenticated && user?.role === role
}

// Hook for checking if user is admin
export function useIsAdmin() {
  return useRequireRole('ADMIN')
}
