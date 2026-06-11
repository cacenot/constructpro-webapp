import { describe, expect, it } from 'vitest'
import { cashflowWindow, delinquencyRate, percentChange } from './dashboard-metrics'

describe('delinquencyRate', () => {
  it('fórmula Sienge: vencido / (vencido + a vencer) — sobre o saldo remanescente', () => {
    expect(delinquencyRate(13_491_000, 421_843_000)).toBeCloseTo(3.198, 2)
  })
  it('null sem carteira (evita divisão por zero)', () => {
    expect(delinquencyRate(0, 0)).toBeNull()
  })
  it('zero vencido → 0%', () => {
    expect(delinquencyRate(0, 100)).toBe(0)
  })
})

describe('percentChange', () => {
  it('variação relativa ao anterior', () => {
    expect(percentChange(342_580, 305_875)).toBeCloseTo(12, 0)
  })
  it('null sem base de comparação', () => {
    expect(percentChange(100, 0)).toBeNull()
  })
  it('queda vira negativo', () => {
    expect(percentChange(80, 100)).toBe(-20)
  })
})

describe('cashflowWindow', () => {
  it('3 meses atrás + atual + 2 à frente, com o ISO do mês corrente', () => {
    expect(cashflowWindow(new Date(2026, 5, 10))).toEqual({
      from: '2026-03',
      to: '2026-08',
      currentIso: '2026-06-01',
    })
  })
  it('vira o ano corretamente', () => {
    expect(cashflowWindow(new Date(2026, 0, 15))).toEqual({
      from: '2025-10',
      to: '2026-03',
      currentIso: '2026-01-01',
    })
  })
})
