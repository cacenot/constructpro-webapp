import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { agingBucketHref, agingDueRange, monthDueHref, OPEN_STATUSES } from './installment-aging'

describe('agingDueRange', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 10)) // 10 jun 2026 (mês é 0-based)
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('not_due: de hoje em diante, sem teto', () => {
    expect(agingDueRange('not_due')).toEqual({ min: '2026-06-10', max: '' })
  })

  it('d1_30: vencidas entre ontem e 30 dias atrás', () => {
    expect(agingDueRange('d1_30')).toEqual({ min: '2026-05-11', max: '2026-06-09' })
  })

  it('d31_60', () => {
    expect(agingDueRange('d31_60')).toEqual({ min: '2026-04-11', max: '2026-05-10' })
  })

  it('d61_90', () => {
    expect(agingDueRange('d61_90')).toEqual({ min: '2026-03-12', max: '2026-04-10' })
  })

  it('d90_plus: sem piso, teto em 91 dias atrás', () => {
    expect(agingDueRange('d90_plus')).toEqual({ min: '', max: '2026-03-11' })
  })
})

describe('agingBucketHref', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 10))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('monta o deep-link do /financeiro com status abertos e intervalo custom', () => {
    const href = agingBucketHref('d1_30')
    const url = new URL(href, 'http://x')
    expect(url.pathname).toBe('/financeiro')
    expect(url.searchParams.get('status')).toBe(OPEN_STATUSES)
    expect(url.searchParams.get('duePreset')).toBe('custom')
    expect(url.searchParams.get('dueMin')).toBe('2026-05-11')
    expect(url.searchParams.get('dueMax')).toBe('2026-06-09')
  })

  it('omite o limite vazio (d90_plus não tem dueMin)', () => {
    const url = new URL(agingBucketHref('d90_plus'), 'http://x')
    expect(url.searchParams.has('dueMin')).toBe(false)
    expect(url.searchParams.get('dueMax')).toBe('2026-03-11')
  })
})

describe('monthDueHref', () => {
  it('recorta o mês inteiro por vencimento, sem filtro de status', () => {
    const url = new URL(monthDueHref('2026-07-01'), 'http://x')
    expect(url.pathname).toBe('/financeiro')
    expect(url.searchParams.get('duePreset')).toBe('custom')
    expect(url.searchParams.get('dueMin')).toBe('2026-07-01')
    expect(url.searchParams.get('dueMax')).toBe('2026-07-31')
    expect(url.searchParams.has('status')).toBe(false)
  })
})
