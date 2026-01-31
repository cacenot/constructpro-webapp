import { useApiClient } from '@cacenot/construct-pro-api-client'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { type ReactNode, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useTenantStore } from '@/stores/tenant-store'

export function TenantLoader({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { client } = useApiClient()
  const tenantId = useTenantStore((s) => s.tenantId)
  const setTenantId = useTenantStore((s) => s.setTenantId)

  const { data, isLoading } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: async () => {
      const { data, error } = await client.GET('/api/v1/users/me')
      if (error) throw new Error('Failed to fetch user profile')
      return data
    },
    enabled: !!user,
  })

  useEffect(() => {
    if (!tenantId && data?.tenants?.length) {
      setTenantId(data.tenants[0].id)
    }
  }, [data, tenantId, setTenantId])

  if (user && (isLoading || (!tenantId && !data))) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return <>{children}</>
}
