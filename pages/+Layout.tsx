import { ApiClientProvider } from '@cacenot/construct-pro-api-client'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import type { ReactNode } from 'react'
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

  return (
    <QueryClientProvider client={queryClient}>
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
          <Toaster richColors position="top-right" />
        </AuthProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </ApiClientProvider>
    </QueryClientProvider>
  )
}
