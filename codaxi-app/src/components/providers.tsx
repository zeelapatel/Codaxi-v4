'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from './theme-provider'
import { KeyboardShortcuts } from './keyboard-shortcuts'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => 
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000, // 1 minute
          retry: (failureCount, error) => {
            // Don't retry on 4xx errors
            if (error && typeof error === 'object' && 'status' in error) {
              const status = (error as any).status
              if (status >= 400 && status < 500) {
                return false
              }
            }
            return failureCount < 3
          },
        },
        mutations: {
          retry: false,
        },
      },
    })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <KeyboardShortcuts>
          {children}
        </KeyboardShortcuts>
        <Toaster />
        <ReactQueryDevtools initialIsOpen={false} />
      </ThemeProvider>
    </QueryClientProvider>
  )
}
