import { Loader2 } from 'lucide-react'
import { type ReactNode, useEffect } from 'react'
import { navigate } from 'vike/client/router'
import { useAuth } from '@/contexts/auth-context'

const PUBLIC_PATHS = ['/login']

interface AuthGuardProps {
  children: ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const pathname = window.location.pathname

  const isPublicPath = PUBLIC_PATHS.some((path) => pathname === path)

  useEffect(() => {
    if (loading) return

    if (!user && !isPublicPath) {
      navigate('/login')
      return
    }

    if (user && (isPublicPath || pathname === '/')) {
      navigate('/dashboard')
      return
    }

    if (!user && pathname === '/') {
      navigate('/login')
    }
  }, [user, loading, isPublicPath, pathname])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user && !isPublicPath) return null
  if (user && isPublicPath) return null

  return <>{children}</>
}
