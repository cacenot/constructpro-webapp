import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useIsMobile } from '@/hooks/use-mobile'

function mockMatchMedia(matches: boolean) {
  const listeners: Array<() => void> = []
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn(() => ({
      matches,
      addEventListener: (_event: string, cb: () => void) => listeners.push(cb),
      removeEventListener: (_event: string, cb: () => void) => {
        const idx = listeners.indexOf(cb)
        if (idx >= 0) listeners.splice(idx, 1)
      },
    })),
  })
  return listeners
}

describe('useIsMobile', () => {
  const originalInnerWidth = window.innerWidth

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: originalInnerWidth })
  })

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('retorna false em viewport desktop (>= 768px)', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 })
    mockMatchMedia(false)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('retorna true em viewport mobile (< 768px)', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 375 })
    mockMatchMedia(true)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('atualiza quando a janela muda para mobile', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 })
    const listeners = mockMatchMedia(false)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)

    act(() => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 375 })
      listeners.forEach((cb) => cb())
    })

    expect(result.current).toBe(true)
  })

  it('retorna false exatamente no breakpoint 768px', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 768 })
    mockMatchMedia(false)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })
})
