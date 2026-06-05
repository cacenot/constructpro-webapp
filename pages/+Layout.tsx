import { ApiClientProvider } from '@cacenot/construct-pro-api-client'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider } from 'next-themes'
import { NuqsAdapter } from 'nuqs/adapters/react'
import { type ReactNode, useEffect } from 'react'
import { AuthGuard } from '@/components/auth-guard'
import { TenantLoader } from '@/components/tenant-loader'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/contexts/auth-context'
import { auth } from '@/lib/firebase'
import { queryClient } from '@/lib/query-client'
import { useTenantStore } from '@/stores/tenant-store'
import '@/styles/globals.css'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const tenantId = useTenantStore((s) => s.tenantId)

  useEffect(() => {
    if (!import.meta.env.DEV) return
    if (document.querySelector('script[data-impeccable-live]')) return
    const s = document.createElement('script')
    s.src = 'http://localhost:8400/live.js'
    s.setAttribute('data-impeccable-live', 'true')
    document.head.appendChild(s)
  }, [])

  return (
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <ApiClientProvider
            baseUrl={import.meta.env.VITE_API_BASE_URL || '/api'}
            getToken={async () => {
              const token = await auth.currentUser?.getIdToken()
              return token || null
            }}
            tenantId={tenantId ?? undefined}
          >
            <AuthProvider>
              <AuthGuard>
                <TenantLoader>{children}</TenantLoader>
              </AuthGuard>
              <Toaster richColors position="bottom-center" />
            </AuthProvider>
            <ReactQueryDevtools initialIsOpen={false} />
          </ApiClientProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </NuqsAdapter>
  )
}
