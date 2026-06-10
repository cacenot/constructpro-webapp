import { describe, expect, it } from 'vitest'
import {
  INSTALLMENT_KIND_LABELS,
  INSTALLMENT_PERIODICITY_LABELS,
  installmentKindValues,
  saleFormSchema,
} from '@/schemas/sale.schema'

const validEntrySchedule = {
  kind: 'entry' as const,
  payment_method: 'pix' as const,
  quantity: 1,
  amount: 1000000,
  specific_date: '2026-06-01',
}

const validRegularSchedule = {
  kind: 'regular' as const,
  payment_method: 'boleto' as const,
  quantity: 12,
  amount: 500000,
  recurrence_day: 10,
  start_date: '2026-06-10',
}

const validBalloonSchedule = {
  kind: 'balloon' as const,
  payment_method: 'transfer' as const,
  quantity: 3,
  amount: 2000000,
  recurrence_type: 'yearly' as const,
  recurrence_day: 15,
  recurrence_month: 12,
  start_date: '2026-12-15',
}

const validSale = {
  unit_id: 1,
  customer_id: 1,
  same_index_for_all: true,
  index_type_code: 'IGPM',
  installment_schedules: [validEntrySchedule],
}

// ─── AC1: INSTALLMENT_KIND_LABELS ─────────────────────────────────────────────

describe('INSTALLMENT_KIND_LABELS', () => {
  const expectedKinds = ['entry', 'regular', 'balloon', 'key_delivery', 'extra']

  it('possui exatamente os 5 kinds esperados', () => {
    const keys = Object.keys(INSTALLMENT_KIND_LABELS)
    expect(keys.sort()).toEqual(expectedKinds.sort())
  })

  it('monthly NÃO existe em INSTALLMENT_KIND_LABELS', () => {
    expect('monthly' in INSTALLMENT_KIND_LABELS).toBe(false)
  })

  it('yearly NÃO existe em INSTALLMENT_KIND_LABELS', () => {
    expect('yearly' in INSTALLMENT_KIND_LABELS).toBe(false)
  })

  it('todos os valores são strings não-vazias em português', () => {
    for (const value of Object.values(INSTALLMENT_KIND_LABELS)) {
      expect(typeof value).toBe('string')
      expect(value.length).toBeGreaterThan(0)
    }
  })

  it('installmentKindValues bate com as chaves de INSTALLMENT_KIND_LABELS', () => {
    expect([...installmentKindValues].sort()).toEqual(
      Object.keys(INSTALLMENT_KIND_LABELS).sort(),
    )
  })
})

// ─── AC1: INSTALLMENT_PERIODICITY_LABELS ─────────────────────────────────────

describe('INSTALLMENT_PERIODICITY_LABELS', () => {
  const expectedPeriodicities = [
    'one_shot',
    'monthly',
    'bimonthly',
    'quarterly',
    'semestral',
    'yearly',
  ]

  it('possui exatamente os 6 periodicities esperados', () => {
    const keys = Object.keys(INSTALLMENT_PERIODICITY_LABELS)
    expect(keys.sort()).toEqual(expectedPeriodicities.sort())
  })

  it('todos os valores são strings não-vazias em português', () => {
    for (const value of Object.values(INSTALLMENT_PERIODICITY_LABELS)) {
      expect(typeof value).toBe('string')
      expect(value.length).toBeGreaterThan(0)
    }
  })
})

// ─── saleFormSchema ───────────────────────────────────────────────────────────

describe('saleFormSchema', () => {
  it('aceita venda válida com entrada', () => {
    expect(saleFormSchema.safeParse(validSale).success).toBe(true)
  })

  it('aceita venda com múltiplos schedules', () => {
    const result = saleFormSchema.safeParse({
      ...validSale,
      installment_schedules: [validEntrySchedule, validRegularSchedule],
    })
    expect(result.success).toBe(true)
  })

  it('aceita schedule balão com recorrência anual', () => {
    const result = saleFormSchema.safeParse({
      ...validSale,
      installment_schedules: [validBalloonSchedule],
    })
    expect(result.success).toBe(true)
  })

  it('rejeita unit_id zero', () => {
    const result = saleFormSchema.safeParse({ ...validSale, unit_id: 0 })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('unit_id')
  })

  it('rejeita customer_id zero', () => {
    const result = saleFormSchema.safeParse({ ...validSale, customer_id: 0 })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('customer_id')
  })

  it('rejeita index_type_code vazio', () => {
    const result = saleFormSchema.safeParse({ ...validSale, index_type_code: '' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('index_type_code')
  })

  it('rejeita schedules vazio', () => {
    const result = saleFormSchema.safeParse({ ...validSale, installment_schedules: [] })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('installment_schedules')
  })
})

// ─── installmentScheduleSchema ────────────────────────────────────────────────

describe('installmentScheduleSchema (via saleFormSchema)', () => {
  const wrap = (schedule: object) =>
    saleFormSchema.safeParse({ ...validSale, installment_schedules: [schedule] })

  it('rejeita entrada sem specific_date', () => {
    const result = wrap({ ...validEntrySchedule, specific_date: null })
    expect(result.success).toBe(false)
    const issue = result.error?.issues.find((i) => i.path.includes('specific_date'))
    expect(issue).toBeDefined()
  })

  it('rejeita regular sem recurrence_day', () => {
    const result = wrap({ ...validRegularSchedule, recurrence_day: null })
    expect(result.success).toBe(false)
    const issue = result.error?.issues.find((i) => i.path.includes('recurrence_day'))
    expect(issue).toBeDefined()
  })

  it('rejeita regular sem start_date', () => {
    const result = wrap({ ...validRegularSchedule, start_date: null })
    expect(result.success).toBe(false)
    const issue = result.error?.issues.find((i) => i.path.includes('start_date'))
    expect(issue).toBeDefined()
  })

  it('rejeita balloon com recurrence_type yearly sem recurrence_month', () => {
    const result = wrap({ ...validBalloonSchedule, recurrence_month: null })
    expect(result.success).toBe(false)
    const issue = result.error?.issues.find((i) => i.path.includes('recurrence_month'))
    expect(issue).toBeDefined()
  })

  it('rejeita amount zero', () => {
    const result = wrap({ ...validEntrySchedule, amount: 0 })
    expect(result.success).toBe(false)
  })

  it('rejeita kind inválido', () => {
    const result = wrap({ ...validEntrySchedule, kind: 'invalido' })
    expect(result.success).toBe(false)
  })

  it('rejeita payment_method inválido', () => {
    const result = wrap({ ...validEntrySchedule, payment_method: 'bitcoin' })
    expect(result.success).toBe(false)
  })
})
