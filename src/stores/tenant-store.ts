import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface TenantState {
  tenantId: string | null
  setTenantId: (id: string) => void
}

export const useTenantStore = create<TenantState>()(
  devtools(
    persist(
      (set) => ({
        tenantId: null,
        setTenantId: (id) => set({ tenantId: id }),
      }),
      {
        name: 'tenant-storage',
      }
    )
  )
)
