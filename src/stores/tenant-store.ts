import type { components } from '@cacenot/construct-pro-api-client'
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

type TenantWithRoles = NonNullable<components['schemas']['UserProfileResponse']['tenants']>[number]

interface TenantState {
  tenantId: string | null
  tenants: TenantWithRoles[]
  setTenantId: (id: string) => void
  setTenants: (tenants: TenantWithRoles[]) => void
}

export const useTenantStore = create<TenantState>()(
  devtools(
    persist(
      (set) => ({
        tenantId: null,
        tenants: [],
        setTenantId: (id) => set({ tenantId: id }),
        setTenants: (tenants) => set({ tenants }),
      }),
      {
        name: 'tenant-storage',
      }
    )
  )
)
