import { describe, expect, it } from 'vitest'
import type { SaleFormData } from '@/schemas/sale.schema'
import { computeProposalVitals, isProposalBalanced } from './proposal-vitals'

const entry = (
  amount: number,
  date = '2026-01-10'
): SaleFormData['installment_schedules'][number] => ({
  kind: 'entry',
  payment_method: 'pix',
  quantity: 1,
  amount,
  specific_date: date,
  recurrence_type: null,
  recurrence_day: null,
  recurrence_month: null,
  start_date: null,
  asset_proposal: null,
})

describe('isProposalBalanced', () => {
  it('count 3 tolera residual de até 2 centavos', () => {
    expect(isProposalBalanced({ saldo: 2, count: 3 })).toBe(true)
    expect(isProposalBalanced({ saldo: -2, count: 3 })).toBe(true)
    expect(isProposalBalanced({ saldo: 3, count: 3 })).toBe(false)
  })
  it('count 0 exige saldo exatamente 0', () => {
    expect(isProposalBalanced({ saldo: 0, count: 0 })).toBe(true)
    expect(isProposalBalanced({ saldo: 1, count: 0 })).toBe(false)
  })
  it('saldo 0 é sempre balanceado independente do count', () => {
    expect(isProposalBalanced({ saldo: 0, count: 10 })).toBe(true)
  })
  it('saldo grande é sempre desbalanceado', () => {
    expect(isProposalBalanced({ saldo: 100_00, count: 12 })).toBe(false)
  })
})

describe('computeProposalVitals — saldo e ágio', () => {
  it('saldo = valorProposta − total; ágio = valorProposta − tabela', () => {
    const v = computeProposalVitals(
      [entry(50_000_00)],
      480_000_00,
      undefined,
      undefined,
      500_000_00
    )
    expect(v.total).toBe(50_000_00)
    expect(v.saldo).toBe(450_000_00) // 500k − 50k
    expect(v.agio).toBe(20_000_00) // 500k − 480k
  })
  it('valorProposta default = preço de tabela quando omitido', () => {
    const v = computeProposalVitals([entry(100_00)], 480_000_00)
    expect(v.valorPropostaCents).toBe(480_000_00)
    expect(v.saldo).toBe(480_000_00 - 100_00)
  })
})
