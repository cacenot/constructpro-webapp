import { describe, expect, it } from 'vitest'
import { formatCompactCurrency } from './utils'

describe('formatCompactCurrency', () => {
  it('mantém valores abaixo de mil sem sufixo', () => {
    expect(formatCompactCurrency(0)).toBe('R$0')
    expect(formatCompactCurrency(340)).toBe('R$340')
    expect(formatCompactCurrency(999)).toBe('R$999')
  })

  it('compacta milhares com k (sem casas por padrão)', () => {
    expect(formatCompactCurrency(1_000)).toBe('R$1k')
    expect(formatCompactCurrency(12_000)).toBe('R$12k')
    expect(formatCompactCurrency(12_500)).toBe('R$13k') // arredonda
  })

  it('respeita kDecimals na faixa dos milhares', () => {
    expect(formatCompactCurrency(1_500, 1)).toBe('R$1.5k')
    expect(formatCompactCurrency(12_340, 1)).toBe('R$12.3k')
  })

  it('compacta milhões com M e 1 casa decimal', () => {
    expect(formatCompactCurrency(1_000_000)).toBe('R$1.0M')
    expect(formatCompactCurrency(1_200_000)).toBe('R$1.2M')
    expect(formatCompactCurrency(15_000_000)).toBe('R$15.0M')
  })

  it('preserva o sinal de valores negativos', () => {
    expect(formatCompactCurrency(-500)).toBe('R$-500')
    expect(formatCompactCurrency(-2_000_000)).toBe('R$-2.0M')
  })
})
