'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
  requireRole?: 'ADMIN' | 'MEMBER' | 'VIEWER'
}

export function ProtectedRoute({ 
  children, 
  redirectTo = '/auth/signin', 
  requireRole 
}: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push(redirectTo)
        return
      }

      if (requireRole && user?.role !== requireRole) {
        router.push('/403') // Forbidden page
        return
      }
    }
  }, [isAuthenticated, isLoading, user, router, redirectTo, requireRole])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render children if not authenticated or doesn't have required role
  if (!isAuthenticated || (requireRole && user?.role !== requireRole)) {
    return null
  }

  return <>{children}</>
}

// Helper component for admin-only routes
export function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requireRole="ADMIN">
      {children}
    </ProtectedRoute>
  )
}

// Helper component for redirecting authenticated users (e.g., login page)
export function GuestRoute({ children, redirectTo = '/dashboard' }: { 
  children: React.ReactNode
  redirectTo?: string 
}) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, isLoading, router, redirectTo])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return null
  }

  return <>{children}</>
}
