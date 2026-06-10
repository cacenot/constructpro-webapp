import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AnimatedNumber } from '@/components/ui/animated-number'

/** Mock de matchMedia para prefers-reduced-motion. */
const stubReducedMotion = (matches: boolean) => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('AnimatedNumber', () => {
  it('renderiza o valor inicial sem animar (from === to no mount)', () => {
    render(<AnimatedNumber value={500} />)
    expect(screen.getByText('500')).toBeDefined()
  })

  it('aplica o formatador ao valor exibido', () => {
    render(<AnimatedNumber value={1234} format={(n) => `R$ ${n}`} />)
    expect(screen.getByText('R$ 1234')).toBeDefined()
  })

  it('formatador default arredonda o valor', () => {
    render(<AnimatedNumber value={3.7} />)
    expect(screen.getByText('4')).toBeDefined()
  })

  it('com prefers-reduced-motion, salta direto ao novo valor', () => {
    stubReducedMotion(true)
    const { rerender } = render(<AnimatedNumber value={100} />)
    expect(screen.getByText('100')).toBeDefined()
    rerender(<AnimatedNumber value={900} />)
    // Reduced motion: sem animação por frames — o alvo aparece imediatamente.
    expect(screen.getByText('900')).toBeDefined()
    expect(screen.queryByText('100')).toBeNull()
  })

  it('re-render com o mesmo valor mantém o texto exibido', () => {
    const { rerender } = render(<AnimatedNumber value={42} format={(n) => `#${n}`} />)
    rerender(<AnimatedNumber value={42} format={(n) => `#${n}`} />)
    expect(screen.getByText('#42')).toBeDefined()
  })
})
