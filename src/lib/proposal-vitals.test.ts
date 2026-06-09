import { describe, expect, it } from 'vitest'
import type { SaleFormData } from '@/schemas/sale.schema'
import { computeProposalVitals } from './proposal-vitals'

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
