'use client'

import { useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'

function GoogleCallbackClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { handleGoogleCallback } = useAuth()
  const calledRef = useRef(false)

  useEffect(() => {
    if (calledRef.current) return
    const code = searchParams.get('code')
    const state = searchParams.get('state') || undefined

    if (!code) {
      toast.error('Invalid Google callback')
      router.push('/auth/signin')
      return
    }

    calledRef.current = true

    // Clear query params to avoid re-triggering if the page re-renders
    try {
      window.history.replaceState(null, '', '/auth/google/callback')
    } catch {}

    handleGoogleCallback({ code, state })
      .then((success) => {
        if (success) {
          toast.success('Signed in with Google')
          const fromSignup = typeof window !== 'undefined' ? localStorage.getItem('codaxi_from_signup') : null
          if (fromSignup) {
            try { localStorage.removeItem('codaxi_from_signup') } catch {}
            router.push('/onboarding?step=github&fromSignup=true')
            return
          }
          router.push('/dashboard')
        } else {
          toast.error('Google sign-in failed')
          router.push('/auth/signin')
        }
      })
      .catch(() => {
        toast.error('Google sign-in failed')
        router.push('/auth/signin')
      })
  }, [searchParams, handleGoogleCallback, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground">Connecting to Google...</p>
      </div>
    </div>
  )
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Connecting to Google...</p>
        </div>
      </div>
    }>
      <GoogleCallbackClient />
    </Suspense>
  )
}

export const dynamic = 'force-dynamic'


