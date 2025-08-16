'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { apiClient, User, Organization, LoginRequest, RegisterRequest } from '@/lib/api-client'
import { toast } from 'sonner'

interface AuthContextType {
  user: User | null
  organization: Organization | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (data: LoginRequest) => Promise<boolean>
  register: (data: RegisterRequest) => Promise<boolean>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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

  const value: AuthContextType = {
    user,
    organization,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshProfile
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
