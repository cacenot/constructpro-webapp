import { describe, expect, it } from 'vitest'
import type { InstallmentScheduleFormData } from '@/schemas/sale.schema'
import {
  balanceGroupAmount,
  computeChainedStart,
  computeMonthlyBreakdown,
  computeMonthlySpan,
  computeScheduleEnd,
  deriveRecurrenceFields,
  deriveRecurringFromSpan,
  isoFromMonthIndex,
  monthIndexFromISO,
} from './installment-utils'

const sched = (o: Partial<InstallmentScheduleFormData>): InstallmentScheduleFormData => ({
  kind: 'regular',
  payment_method: 'boleto',
  quantity: 1,
  amount: 1000,
  specific_date: null,
  recurrence_type: 'monthly',
  recurrence_day: null,
  recurrence_month: null,
  start_date: null,
  asset_proposal: null,
  ...o,
})

// ─── Task 1 ───────────────────────────────────────────────────────────────────

describe('monthIndexFromISO / isoFromMonthIndex', () => {
  it('converte ISO para índice de mês absoluto', () => {
    expect(monthIndexFromISO('2026-01-15')).toBe(2026 * 12 + 0)
    expect(monthIndexFromISO('2026-12-01')).toBe(2026 * 12 + 11)
  })
  it('reconstrói ISO a partir do índice, clampando o dia', () => {
    expect(isoFromMonthIndex(2027 * 12 + 0, 15)).toBe('2027-01-15')
    expect(isoFromMonthIndex(2026 * 12 + 1, 31)).toBe('2026-02-28') // fev não tem 31
  })
})

describe('deriveRecurrenceFields', () => {
  it('mensal: deriva o dia, mês nulo', () => {
    expect(deriveRecurrenceFields('2026-03-10', 'monthly')).toEqual({
      recurrence_day: 10,
      recurrence_month: null,
    })
  })
  it('anual: deriva dia e mês', () => {
    expect(deriveRecurrenceFields('2026-12-05', 'yearly')).toEqual({
      recurrence_day: 5,
      recurrence_month: 12,
    })
  })
})

describe('computeScheduleEnd', () => {
  it('mensal 12x desde 01/01/2026 termina em 01/12/2026', () => {
    const end = computeScheduleEnd(sched({ start_date: '2026-01-01', quantity: 12 }))
    expect(end?.getFullYear()).toBe(2026)
    expect(end?.getMonth()).toBe(11)
    expect(end?.getDate()).toBe(1)
  })
  it('anual 3x desde 15/12/2026 termina em 15/12/2028', () => {
    const end = computeScheduleEnd(
      sched({ recurrence_type: 'yearly', start_date: '2026-12-15', quantity: 3 })
    )
    expect(end?.getFullYear()).toBe(2028)
    expect(end?.getMonth()).toBe(11)
  })
  it('entrada/chaves usam specific_date', () => {
    const end = computeScheduleEnd(
      sched({ kind: 'entry', recurrence_type: null, specific_date: '2026-05-20' })
    )
    expect(end?.getMonth()).toBe(4)
  })
})

// ─── Task 2 ───────────────────────────────────────────────────────────────────

describe('computeMonthlySpan', () => {
  it('cobre do menor início ao maior fim das mensais', () => {
    const span = computeMonthlySpan([
      sched({ start_date: '2026-01-01', quantity: 60, recurrence_type: 'monthly' }),
    ])
    expect(span).toEqual({
      startIdx: monthIndexFromISO('2026-01-01'),
      endIdx: monthIndexFromISO('2030-12-01'),
    })
  })
  it('retorna null sem mensais', () => {
    expect(computeMonthlySpan([sched({ kind: 'entry', recurrence_type: null })])).toBeNull()
  })
})

describe('deriveRecurringFromSpan', () => {
  it('anual sobre 60 meses (01/2026→12/2030) = 4x, início no aniversário', () => {
    const span = {
      startIdx: monthIndexFromISO('2026-01-01'),
      endIdx: monthIndexFromISO('2030-12-01'),
    }
    const r = deriveRecurringFromSpan(span, 12, 1)
    expect(r.quantity).toBe(4)
    expect(r.startISO).toBe('2027-01-01')
  })
  it('semestral sobre o mesmo span = 9x', () => {
    const span = {
      startIdx: monthIndexFromISO('2026-01-01'),
      endIdx: monthIndexFromISO('2030-12-01'),
    }
    expect(deriveRecurringFromSpan(span, 6, 15).quantity).toBe(9)
  })
  it('span menor que o período → 1x', () => {
    const span = {
      startIdx: monthIndexFromISO('2026-01-01'),
      endIdx: monthIndexFromISO('2026-06-01'),
    }
    expect(deriveRecurringFromSpan(span, 12, 1).quantity).toBe(1)
  })
})

// ─── Task 3 ───────────────────────────────────────────────────────────────────

describe('balanceGroupAmount', () => {
  it('eleva o valor por parcela para absorver o saldo', () => {
    // valores em centavos: base R$2.000 (200000c), saldo R$3.000 (300000c) em 3 parcelas
    // → +100000c por parcela → 300000c (R$3.000)
    expect(balanceGroupAmount(200_000, 3, 300_000)).toBe(300_000)
  })
  it('distribui em partes inteiras de centavo (resíduo < quantidade)', () => {
    // saldo 6.000.001c em 4 parcelas → Math.round(1500000.25)=1500000c, base 0 → 1.500.000c
    expect(balanceGroupAmount(0, 4, 6_000_001)).toBe(1_500_000)
  })
  it('nunca fica negativo', () => {
    expect(balanceGroupAmount(1_000, 2, -5_000)).toBe(0)
  })
  it('quantidade zero é no-op', () => {
    expect(balanceGroupAmount(500, 0, 1_000)).toBe(500)
  })
})

// ─── Task 4 ───────────────────────────────────────────────────────────────────

describe('computeChainedStart', () => {
  it('começa no mês seguinte ao fim do grupo mensal anterior', () => {
    const prev = sched({ start_date: '2026-01-01', quantity: 12, recurrence_type: 'monthly' })
    // fim = 01/12/2026 → próximo início = 01/01/2027
    expect(computeChainedStart(prev, 1)).toBe('2027-01-01')
  })
  it('respeita o dia informado e clampa', () => {
    const prev = sched({ start_date: '2026-01-31', quantity: 1, recurrence_type: 'monthly' })
    // fim = 31/01/2026 → próximo = fev/2026, dia 31 → 28
    expect(computeChainedStart(prev, 31)).toBe('2026-02-28')
  })
  it('null se o anterior não tem fim calculável', () => {
    expect(computeChainedStart(sched({ start_date: null }), 1)).toBeNull()
  })
})

// ─── Task 5 ───────────────────────────────────────────────────────────────────

describe('computeMonthlyBreakdown', () => {
  it('expande recorrentes em parcelas por mês com tipo e valor', () => {
    const m = computeMonthlyBreakdown([
      sched({ kind: 'entry', recurrence_type: null, specific_date: '2026-01-15', amount: 5000 }),
      sched({ start_date: '2026-02-01', quantity: 2, recurrence_type: 'monthly', amount: 1000 }),
      sched({
        kind: 'balloon',
        start_date: '2026-12-15',
        quantity: 1,
        recurrence_type: 'yearly',
        amount: 8000,
      }),
    ])
    expect(m.get('2026-01')).toEqual([{ kind: 'entry', amount: 5000 }])
    expect(m.get('2026-02')).toEqual([{ kind: 'regular', amount: 1000 }])
    expect(m.get('2026-03')).toEqual([{ kind: 'regular', amount: 1000 }])
    expect(m.get('2026-12')).toEqual([{ kind: 'balloon', amount: 8000 }])
  })
})
