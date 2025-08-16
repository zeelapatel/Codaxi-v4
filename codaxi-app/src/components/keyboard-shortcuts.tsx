'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUIStore, useKeyboardStore } from '@/lib/store'

export function KeyboardShortcuts({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { setSearchOpen } = useUIStore()
  const { shortcuts, registerShortcut, unregisterShortcut } = useKeyboardStore()

  useEffect(() => {
    // Register global shortcuts
    registerShortcut('/', () => setSearchOpen(true))
    registerShortcut('g d', () => router.push('/dashboard'))
    registerShortcut('g r', () => router.push('/repos'))
    registerShortcut('g s', () => router.push('/settings'))
    
    // Cleanup on unmount
    return () => {
      unregisterShortcut('/')
      unregisterShortcut('g d')
      unregisterShortcut('g r')
      unregisterShortcut('g s')
    }
  }, [router, setSearchOpen, registerShortcut, unregisterShortcut])

  useEffect(() => {
    let sequenceBuffer = ''
    let sequenceTimeout: NodeJS.Timeout

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if typing in an input
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return
      }

      // Handle Escape key
      if (event.key === 'Escape') {
        setSearchOpen(false)
        return
      }

      // Handle Meta/Ctrl + K for search
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        setSearchOpen(true)
        return
      }

      // Handle single key shortcuts
      if (shortcuts[event.key]) {
        event.preventDefault()
        shortcuts[event.key]()
        return
      }

      // Handle key sequences (like "g d")
      clearTimeout(sequenceTimeout)
      sequenceBuffer += event.key
      
      // Check if current buffer matches any shortcut
      const matchingShortcut = Object.keys(shortcuts).find(key => key.startsWith(sequenceBuffer))
      
      if (matchingShortcut) {
        if (matchingShortcut === sequenceBuffer) {
          // Exact match - execute shortcut
          event.preventDefault()
          shortcuts[matchingShortcut]()
          sequenceBuffer = ''
        } else {
          // Partial match - wait for more keys
          sequenceTimeout = setTimeout(() => {
            sequenceBuffer = ''
          }, 1000)
        }
      } else {
        // No match - reset buffer
        sequenceBuffer = ''
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      clearTimeout(sequenceTimeout)
    }
  }, [shortcuts, setSearchOpen])

  return <>{children}</>
}
