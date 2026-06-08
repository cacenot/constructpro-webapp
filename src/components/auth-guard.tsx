import { type ReactNode, useEffect } from 'react'
import { navigate } from 'vike/client/router'
import { ConsoleBoot } from '@/components/auth/console-boot'
import { useAuth } from '@/contexts/auth-context'

// Rotas que dispensam autenticação.
const PUBLIC_PATHS = ['/login', '/recuperar-senha', '/redefinir-senha']
// Telas de entrada das quais um usuário já autenticado deve ser desviado.
// /redefinir-senha fica de fora: um usuário logado pode chegar pelo link do e-mail.
const AUTH_ENTRY_PATHS = ['/login', '/recuperar-senha']

interface AuthGuardProps {
  children: ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const pathname = window.location.pathname

  const isPublicPath = PUBLIC_PATHS.some((path) => pathname === path)
  const isAuthEntry = AUTH_ENTRY_PATHS.some((path) => pathname === path)

  useEffect(() => {
    if (loading) return

    if (!user && !isPublicPath) {
      navigate('/login')
      return
    }

    if (user && (isAuthEntry || pathname === '/')) {
      navigate('/dashboard')
      return
    }

    if (!user && pathname === '/') {
      navigate('/login')
    }
  }, [user, loading, isPublicPath, isAuthEntry, pathname])

  if (loading) {
    return <ConsoleBoot label="Verificando acesso…" />
  }

  if (!user && !isPublicPath) return null
  if (user && isAuthEntry) return null

  return <>{children}</>
}
