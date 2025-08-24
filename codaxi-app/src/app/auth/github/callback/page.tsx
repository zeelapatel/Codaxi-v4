'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'

function GitHubCallbackClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { handleGitHubCallback } = useAuth()

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code || !state) {
      toast.error('Invalid GitHub callback')
      router.push('/onboarding')
      return
    }

    handleGitHubCallback({ code, state })
      .then((success) => {
        if (success) {
          toast.success('GitHub account connected successfully!')
          router.push('/onboarding')
        } else {
          toast.error('Failed to connect GitHub account')
          router.push('/onboarding')
        }
      })
      .catch((error) => {
        console.error('GitHub callback error:', error)
        toast.error('Failed to connect GitHub account')
        router.push('/onboarding')
      })
  }, [searchParams, handleGitHubCallback, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground">Connecting to GitHub...</p>
      </div>
    </div>
  )
}

export default function GitHubCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground">Connecting to GitHub...</p>
          </div>
        </div>
      }
    >
      <GitHubCallbackClient />
    </Suspense>
  )
}
