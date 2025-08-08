'use client'

import { useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { isUrlAllowed, getBlockedNavigationMessage } from '@/lib/navigation-control'
import { getCurrentUser } from '@/lib/supabase'

interface UseNavigationGuardOptions {
  enableExternalLinkBlocking?: boolean
  enableRouteGuarding?: boolean
  showBlockedMessage?: boolean
}

export function useNavigationGuard(options: UseNavigationGuardOptions = {}) {
  const {
    enableExternalLinkBlocking = true,
    enableRouteGuarding = true,
    showBlockedMessage = true,
  } = options

  const router = useRouter()
  const pathname = usePathname()

  // Handle click events on links
  const handleLinkClick = useCallback(async (event: MouseEvent) => {
    if (!enableExternalLinkBlocking) return

    const target = event.target as HTMLElement
    const link = target.closest('a')
    
    if (!link || !link.href) return

    try {
      const user = await getCurrentUser()
      const { allowed, redirectTo, rule } = isUrlAllowed(link.href, !!user)

      if (!allowed) {
        event.preventDefault()
        event.stopPropagation()

        if (showBlockedMessage) {
          const message = getBlockedNavigationMessage(rule)
          alert(message)
        }

        if (redirectTo) {
          setTimeout(() => {
            router.push(redirectTo)
          }, 0)
        }

        return false
      }
    } catch (error) {
      console.error('Navigation guard error:', error)
    }
  }, [enableExternalLinkBlocking, showBlockedMessage, router])

  // Handle programmatic navigation
  const guardedPush = useCallback(async (url: string) => {
    try {
      const user = await getCurrentUser()
      const { allowed, redirectTo, rule } = isUrlAllowed(url, !!user)

      if (!allowed) {
        if (showBlockedMessage) {
          const message = getBlockedNavigationMessage(rule)
          alert(message)
        }

        if (redirectTo) {
          setTimeout(() => {
            router.push(redirectTo)
          }, 0)
        }
        return false
      }

      setTimeout(() => {
        router.push(url)
      }, 0)
      return true
    } catch (error) {
      console.error('Guarded navigation error:', error)
      return false
    }
  }, [router, showBlockedMessage])

  // Handle window navigation events (e.g., browser back/forward)
  const handlePopState = useCallback(async () => {
    if (!enableRouteGuarding) return

    try {
      const user = await getCurrentUser()
      const currentUrl = window.location.href
      const { allowed, redirectTo, rule } = isUrlAllowed(currentUrl, !!user)

      if (!allowed) {
        if (showBlockedMessage) {
          const message = getBlockedNavigationMessage(rule)
          alert(message)
        }

        // Use setTimeout to avoid React state updates during event handling
        setTimeout(() => {
          if (redirectTo) {
            router.replace(redirectTo)
          } else {
            router.replace('/')
          }
        }, 0)
      }
    } catch (error) {
      console.error('PopState navigation guard error:', error)
    }
  }, [enableRouteGuarding, showBlockedMessage, router])

  // Block external navigation attempts
  const handleBeforeUnload = useCallback((event: BeforeUnloadEvent) => {
    if (!enableExternalLinkBlocking) return

    // This only works for some navigation types due to browser security
    const message = '本当にこのページを離れますか？早起きチャレンジを続けることをお勧めします。'
    event.returnValue = message
    return message
  }, [enableExternalLinkBlocking])

  useEffect(() => {
    if (enableExternalLinkBlocking) {
      // Add click event listener for links
      document.addEventListener('click', handleLinkClick, true)
      
      // Add beforeunload listener (limited functionality)
      window.addEventListener('beforeunload', handleBeforeUnload)
    }

    if (enableRouteGuarding) {
      // Add popstate listener for browser navigation
      window.addEventListener('popstate', handlePopState)
    }

    return () => {
      document.removeEventListener('click', handleLinkClick, true)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [handleLinkClick, handleBeforeUnload, handlePopState, enableExternalLinkBlocking, enableRouteGuarding])

  // Validate current route on mount and path changes
  useEffect(() => {
    if (!enableRouteGuarding) return

    const validateCurrentRoute = async () => {
      try {
        const user = await getCurrentUser()
        const currentUrl = window.location.href
        const { allowed, redirectTo, rule } = isUrlAllowed(currentUrl, !!user)

        if (!allowed) {
          if (showBlockedMessage) {
            const message = getBlockedNavigationMessage(rule)
            alert(message)
          }

          // Use setTimeout to avoid React state updates during render
          setTimeout(() => {
            if (redirectTo) {
              router.replace(redirectTo)
            } else {
              router.replace('/')
            }
          }, 0)
        }
      } catch (error) {
        console.error('Route validation error:', error)
      }
    }

    // Also use setTimeout to defer initial validation
    setTimeout(() => {
      validateCurrentRoute()
    }, 0)
  }, [pathname, enableRouteGuarding, showBlockedMessage, router])

  return {
    guardedPush,
    isUrlAllowed: async (url: string) => {
      try {
        const user = await getCurrentUser()
        return isUrlAllowed(url, !!user)
      } catch (error) {
        console.error('URL validation error:', error)
        return { allowed: false }
      }
    },
  }
}