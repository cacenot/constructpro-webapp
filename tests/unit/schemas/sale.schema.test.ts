import { describe, expect, it } from 'vitest'
import { saleFormSchema } from '@/schemas/sale.schema'

const validEntrySchedule = {
  kind: 'entry' as const,
  payment_method: 'pix' as const,
  quantity: 1,
  amount_cents: 1000000,
  specific_date: '2026-06-01',
}

const validMonthlySchedule = {
  kind: 'monthly' as const,
  payment_method: 'boleto' as const,
  quantity: 12,
  amount_cents: 500000,
  recurrence_day: 10,
  start_date: '2026-06-10',
}

const validYearlySchedule = {
  kind: 'yearly' as const,
  payment_method: 'transfer' as const,
  quantity: 3,
  amount_cents: 2000000,
  recurrence_day: 15,
  recurrence_month: 12,
  start_date: '2026-12-15',
}

const validSale = {
  unit_id: 1,
  customer_id: 1,
  index_type_code: 'IGPM',
  installment_schedules: [validEntrySchedule],
}

describe('saleFormSchema', () => {
  it('aceita venda válida com entrada', () => {
    expect(saleFormSchema.safeParse(validSale).success).toBe(true)
  })

  it('aceita venda com múltiplos schedules', () => {
    const result = saleFormSchema.safeParse({
      ...validSale,
      installment_schedules: [validEntrySchedule, validMonthlySchedule],
    })
    expect(result.success).toBe(true)
  })

  it('aceita schedule anual válido', () => {
    const result = saleFormSchema.safeParse({
      ...validSale,
      installment_schedules: [validYearlySchedule],
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

describe('installmentScheduleSchema (via saleFormSchema)', () => {
  const wrap = (schedule: object) =>
    saleFormSchema.safeParse({ ...validSale, installment_schedules: [schedule] })

  it('rejeita entrada sem specific_date', () => {
    const result = wrap({ ...validEntrySchedule, specific_date: null })
    expect(result.success).toBe(false)
    const issue = result.error?.issues.find((i) => i.path.includes('specific_date'))
    expect(issue).toBeDefined()
  })

  it('rejeita mensal sem recurrence_day', () => {
    const result = wrap({ ...validMonthlySchedule, recurrence_day: null })
    expect(result.success).toBe(false)
    const issue = result.error?.issues.find((i) => i.path.includes('recurrence_day'))
    expect(issue).toBeDefined()
  })

  it('rejeita mensal sem start_date', () => {
    const result = wrap({ ...validMonthlySchedule, start_date: null })
    expect(result.success).toBe(false)
    const issue = result.error?.issues.find((i) => i.path.includes('start_date'))
    expect(issue).toBeDefined()
  })

  it('rejeita anual sem recurrence_month', () => {
    const result = wrap({ ...validYearlySchedule, recurrence_month: null })
    expect(result.success).toBe(false)
    const issue = result.error?.issues.find((i) => i.path.includes('recurrence_month'))
    expect(issue).toBeDefined()
  })

  it('rejeita amount_cents zero', () => {
    const result = wrap({ ...validEntrySchedule, amount_cents: 0 })
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
