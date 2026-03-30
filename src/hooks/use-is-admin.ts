import type { components } from '@cacenot/construct-pro-api-client'
import { useTenantStore } from '@/stores/tenant-store'

type UserProfileResponse = components['schemas']['UserProfileResponse']

export function useIsAdmin(profile: UserProfileResponse | undefined): boolean {
  const tenantId = useTenantStore((s) => s.tenantId)

  if (!profile) return false
  if (profile.is_superuser) return true

  return (
    profile.tenants
      ?.find((t) => t.id === tenantId)
      ?.roles?.some((r) => r.name === 'admin' || r.name === 'superadmin') ?? false
  )
}
