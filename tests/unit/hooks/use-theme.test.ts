import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next-themes', () => ({
  useTheme: vi.fn(),
}))

vi.mock('@/stores/app-store', () => ({
  useAppStore: vi.fn(),
}))

import { useTheme as useNextTheme } from 'next-themes'
import { useAppStore } from '@/stores/app-store'
import { useTheme } from '@/hooks/use-theme'

const mockUseNextTheme = vi.mocked(useNextTheme)
const mockUseAppStore = vi.mocked(useAppStore)

function setupMocks({
  resolvedTheme = 'light',
  zustandTheme = 'light',
}: {
  resolvedTheme?: string
  zustandTheme?: string
} = {}) {
  const setNextTheme = vi.fn()
  const setZustandTheme = vi.fn()

  mockUseNextTheme.mockReturnValue({
    resolvedTheme,
    setTheme: setNextTheme,
    theme: zustandTheme,
    themes: [],
    systemTheme: 'light',
    forcedTheme: undefined,
  })

  mockUseAppStore.mockImplementation(
    (selector) =>
      selector({ theme: zustandTheme as 'light' | 'dark' | 'system', setTheme: setZustandTheme, sidebarOpen: true, setSidebarOpen: vi.fn(), toggleSidebar: vi.fn() })
  )

  return { setNextTheme, setZustandTheme }
}

describe('useTheme', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna o resolvedTheme do next-themes como theme atual', () => {
    setupMocks({ resolvedTheme: 'dark' })
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('dark')
  })

  it('retorna light como tema padrão', () => {
    setupMocks({ resolvedTheme: 'light' })
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('light')
  })

  it('setTheme atualiza ambos os stores', () => {
    const { setNextTheme, setZustandTheme } = setupMocks()
    const { result } = renderHook(() => useTheme())

    result.current.setTheme('dark')

    expect(setZustandTheme).toHaveBeenCalledWith('dark')
    expect(setNextTheme).toHaveBeenCalledWith('dark')
  })

  it('setTheme aceita "system"', () => {
    const { setNextTheme, setZustandTheme } = setupMocks()
    const { result } = renderHook(() => useTheme())

    result.current.setTheme('system')

    expect(setZustandTheme).toHaveBeenCalledWith('system')
    expect(setNextTheme).toHaveBeenCalledWith('system')
  })

  it('expõe função setTheme', () => {
    setupMocks()
    const { result } = renderHook(() => useTheme())
    expect(typeof result.current.setTheme).toBe('function')
  })
})
