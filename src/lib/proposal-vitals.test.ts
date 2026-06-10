import { describe, expect, it } from 'vitest'
import type { SaleFormData } from '@/schemas/sale.schema'
import { computeProposalVitals, isProposalBalanced } from './proposal-vitals'

type Schedule = SaleFormData['installment_schedules'][number]

const entry = (amount: number, date = '2026-01-10'): Schedule => ({
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

const monthly = (start: string, quantity: number, amount = 1000): Schedule => ({
  kind: 'regular',
  payment_method: 'boleto',
  quantity,
  amount,
  specific_date: null,
  recurrence_type: 'monthly',
  recurrence_day: null,
  recurrence_month: null,
  start_date: start,
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

describe('computeProposalVitals — perMonthViolations', () => {
  it('reporta meses que excedem o teto de parcelas do tenant', () => {
    // jan/2026 recebe 2 parcelas (entrada + 1ª mensal); teto = 1 → viola.
    const v = computeProposalVitals([entry(100_00, '2026-01-10'), monthly('2026-01-20', 1)], 0, 1)
    expect(v.perMonthViolations).toEqual([{ month: '2026-01', count: 2 }])
  })

  it('sem teto configurado, nunca reporta violações', () => {
    const v = computeProposalVitals(
      [entry(100_00, '2026-01-10'), monthly('2026-01-20', 1)],
      0,
      undefined
    )
    expect(v.perMonthViolations).toEqual([])
  })

  it('teto 0 é tratado como sem teto', () => {
    const v = computeProposalVitals([entry(100_00), monthly('2026-01-20', 1)], 0, 0)
    expect(v.perMonthViolations).toEqual([])
  })

  it('ordena as violações por mês ascendente', () => {
    // 2 parcelas em mar e 2 em jan; teto 1 → ambas violam, ordenadas jan→mar.
    const v = computeProposalVitals(
      [
        entry(100_00, '2026-03-10'),
        monthly('2026-03-20', 1),
        entry(100_00, '2026-01-10'),
        monthly('2026-01-20', 1),
      ],
      0,
      1
    )
    expect(v.perMonthViolations.map((x) => x.month)).toEqual(['2026-01', '2026-03'])
  })
})

describe('computeProposalVitals — comissão', () => {
  const commission = (over: {
    brokerId?: number | null
    brokerRate?: number | null
    agencyRate?: number | null
    capPercent?: number
  }) => computeProposalVitals([entry(100_000_00)], 0, undefined, over).commission

  it('soma corretor + imobiliária e calcula o valor sobre o total', () => {
    const c = commission({ brokerId: 1, brokerRate: 5, agencyRate: 2, capPercent: 6 })
    expect(c).not.toBeNull()
    expect(c?.totalPercent).toBe(7)
    // 100.000,00 × 7% = 7.000,00
    expect(c?.amountCents).toBe(7_000_00)
    expect(c?.exceedsCap).toBe(true) // 7% > teto 6%
  })

  it('não excede o teto quando a soma fica dentro do limite', () => {
    const c = commission({ brokerId: 1, brokerRate: 6, agencyRate: 0, capPercent: 6 })
    expect(c?.totalPercent).toBe(6)
    expect(c?.exceedsCap).toBe(false)
  })

  it('teto 0 significa sem teto: nunca excede', () => {
    const c = commission({ brokerId: 1, brokerRate: 10, agencyRate: 0, capPercent: 0 })
    expect(c?.exceedsCap).toBe(false)
  })

  it('sem corretor, comissão é nula', () => {
    expect(commission({ brokerId: null, brokerRate: 5 })).toBeNull()
    expect(commission({})).toBeNull()
  })

  it('rates nulos contam como zero', () => {
    const c = commission({ brokerId: 1, brokerRate: null, agencyRate: null, capPercent: 6 })
    expect(c?.totalPercent).toBe(0)
    expect(c?.amountCents).toBe(0)
  })
})
