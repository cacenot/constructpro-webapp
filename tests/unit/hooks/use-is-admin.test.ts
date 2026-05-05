import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock zustand tenant-store antes de importar o hook
vi.mock('@/stores/tenant-store', () => ({
  useTenantStore: vi.fn(),
}))

import { useTenantStore } from '@/stores/tenant-store'
import { useIsAdmin } from '@/hooks/use-is-admin'

const mockUseTenantStore = vi.mocked(useTenantStore)

function setTenantId(id: string | null) {
  mockUseTenantStore.mockImplementation((selector: (s: { tenantId: string | null }) => unknown) =>
    selector({ tenantId: id })
  )
}

describe('useIsAdmin', () => {
  beforeEach(() => {
    setTenantId('tenant-1')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('retorna false quando profile é undefined', () => {
    const { result } = renderHook(() => useIsAdmin(undefined))
    expect(result.current).toBe(false)
  })

  it('retorna true para superuser independente de tenant', () => {
    const { result } = renderHook(() =>
      useIsAdmin({ is_superuser: true, tenants: [], id: 'u1', email: 'a@b.com' })
    )
    expect(result.current).toBe(true)
  })

  it('retorna true quando usuário tem role admin no tenant ativo', () => {
    const profile = {
      is_superuser: false,
      id: 'u2',
      email: 'a@b.com',
      tenants: [
        {
          id: 'tenant-1',
          roles: [{ name: 'admin', id: 'r1' }],
        },
      ],
    }
    const { result } = renderHook(() => useIsAdmin(profile as Parameters<typeof useIsAdmin>[0]))
    expect(result.current).toBe(true)
  })

  it('retorna true quando usuário tem role superadmin no tenant ativo', () => {
    const profile = {
      is_superuser: false,
      id: 'u3',
      email: 'a@b.com',
      tenants: [
        {
          id: 'tenant-1',
          roles: [{ name: 'superadmin', id: 'r2' }],
        },
      ],
    }
    const { result } = renderHook(() => useIsAdmin(profile as Parameters<typeof useIsAdmin>[0]))
    expect(result.current).toBe(true)
  })

  it('retorna false quando usuário tem role viewer no tenant ativo', () => {
    const profile = {
      is_superuser: false,
      id: 'u4',
      email: 'a@b.com',
      tenants: [
        {
          id: 'tenant-1',
          roles: [{ name: 'viewer', id: 'r3' }],
        },
      ],
    }
    const { result } = renderHook(() => useIsAdmin(profile as Parameters<typeof useIsAdmin>[0]))
    expect(result.current).toBe(false)
  })

  it('retorna false quando o tenantId ativo não corresponde a nenhum tenant do profile', () => {
    setTenantId('tenant-outro')
    const profile = {
      is_superuser: false,
      id: 'u5',
      email: 'a@b.com',
      tenants: [
        {
          id: 'tenant-1',
          roles: [{ name: 'admin', id: 'r4' }],
        },
      ],
    }
    const { result } = renderHook(() => useIsAdmin(profile as Parameters<typeof useIsAdmin>[0]))
    expect(result.current).toBe(false)
  })

  it('retorna false quando tenants está vazio', () => {
    const profile = {
      is_superuser: false,
      id: 'u6',
      email: 'a@b.com',
      tenants: [],
    }
    const { result } = renderHook(() => useIsAdmin(profile as Parameters<typeof useIsAdmin>[0]))
    expect(result.current).toBe(false)
  })
})
