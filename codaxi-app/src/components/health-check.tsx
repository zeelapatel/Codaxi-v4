'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api-client'

interface HealthCheckConfig {
  initialDelay: number // Initial delay before first ping in ms
  pollingInterval: number // Interval between pings in ms
  retryDelay: number // Delay before retrying after failure in ms
  maxRetries: number // Maximum number of retries before giving up
}

const DEFAULT_CONFIG: HealthCheckConfig = {
  initialDelay: 15000, // 15 seconds
  pollingInterval: 10 * 60 * 1000, // 10 minutes
  retryDelay: 5000, // 5 seconds
  maxRetries: 3
}

export function HealthCheck({ config = DEFAULT_CONFIG }: { config?: Partial<HealthCheckConfig> }) {
  const [retryCount, setRetryCount] = useState(0)
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }

  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    let intervalId: NodeJS.Timeout

    const ping = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/health`)
        if (!response.ok) {
          throw new Error(`Health check failed: ${response.status}`)
        }
        // Reset retry count on successful ping
        setRetryCount(0)
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Health check ping failed:', error)
        }

        // Implement retry logic
        if (retryCount < mergedConfig.maxRetries) {
          setRetryCount(prev => prev + 1)
          timeoutId = setTimeout(ping, mergedConfig.retryDelay)
          return
        }
      }
    }

    // Initial ping after delay
    timeoutId = setTimeout(ping, mergedConfig.initialDelay)

    // Set up polling interval
    intervalId = setInterval(ping, mergedConfig.pollingInterval)

    // Cleanup
    return () => {
      clearTimeout(timeoutId)
      clearInterval(intervalId)
    }
  }, [mergedConfig, retryCount])

  // This component doesn't render anything
  return null
}
