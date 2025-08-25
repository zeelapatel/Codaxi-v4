'use client'

import { useEffect } from 'react'
import { apiClient } from '@/lib/api-client'

export function HealthCheck() {
  useEffect(() => {
    const ping = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/health`)
        if (!response.ok) {
          throw new Error(`Health check failed: ${response.status}`)
        }
      } catch (error) {
        // Silently fail in production, log in development
        if (process.env.NODE_ENV === 'development') {
          console.warn('Health check ping failed:', error)
        }
      }
    }

    // Run initial ping after 15 seconds
    const initialPing = setTimeout(ping, 15000)

    // Set up 10-minute interval
    const interval = setInterval(ping, 10 * 60 * 1000)

    // Cleanup
    return () => {
      clearTimeout(initialPing)
      clearInterval(interval)
    }
  }, [])

  // This component doesn't render anything
  return null
}
