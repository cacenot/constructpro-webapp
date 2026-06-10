import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { InstallmentScheduleFormData } from '@/schemas/sale.schema'
import {
  balanceGroupAmount,
  computeAllowedDates,
  computeChainedStart,
  computeContractEndDate,
  computeDefaultStartDate,
  computeInstallmentsPerMonth,
  computeMonthlyBreakdown,
  computeMonthlySpan,
  computeScheduleEnd,
  deriveRecurrenceFields,
  deriveRecurringFromSpan,
  distributeBalanceToGroup,
  formatBRDate,
  formatDateISO,
  isoFromMonthIndex,
  monthIndexFromISO,
  planAppendedSchedule,
  recomputeGroupForPeriodicity,
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

// Data atual fixa em 2026-05-05 (terça) para tornar determinísticos os helpers que
// dependem de "hoje" (computeDefaultStartDate, computeAllowedDates).
const FIXED_DATE = new Date('2026-05-05T12:00:00')
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(FIXED_DATE)
})
afterEach(() => {
  vi.useRealTimers()
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
  it('expande recorrentes em parcelas por mês com tipo, valor e índice', () => {
    const m = computeMonthlyBreakdown(
      [
        sched({ kind: 'entry', recurrence_type: null, specific_date: '2026-01-15', amount: 5000 }),
        sched({
          start_date: '2026-02-01',
          quantity: 2,
          recurrence_type: 'monthly',
          amount: 1000,
          index_type_code: 'IGPM',
        }),
        sched({
          kind: 'balloon',
          start_date: '2026-12-15',
          quantity: 1,
          recurrence_type: 'yearly',
          amount: 8000,
        }),
      ],
      'CUB'
    )
    // entrada nunca carrega índice; grupo com índice próprio usa o seu;
    // grupo sem índice próprio herda o global ('CUB').
    expect(m.get('2026-01')).toEqual([{ kind: 'entry', amount: 5000, indexCode: null }])
    expect(m.get('2026-02')).toEqual([{ kind: 'regular', amount: 1000, indexCode: 'IGPM' }])
    expect(m.get('2026-03')).toEqual([{ kind: 'regular', amount: 1000, indexCode: 'IGPM' }])
    expect(m.get('2026-12')).toEqual([{ kind: 'balloon', amount: 8000, indexCode: 'CUB' }])
  })

  it('sem índice global nem por-grupo, indexCode é null', () => {
    const m = computeMonthlyBreakdown([
      sched({ start_date: '2026-02-01', quantity: 1, recurrence_type: 'monthly', amount: 1000 }),
    ])
    expect(m.get('2026-02')?.[0]?.indexCode).toBeNull()
  })
})

// ─── computeInstallmentsPerMonth (refatorada: deriva de computeMonthlyBreakdown) ─

describe('computeInstallmentsPerMonth', () => {
  it('conta 1 parcela por mês ao expandir um grupo mensal', () => {
    const m = computeInstallmentsPerMonth([
      sched({ start_date: '2026-01-10', quantity: 3, recurrence_type: 'monthly' }),
    ])
    expect(m.get('2026-01')).toBe(1)
    expect(m.get('2026-02')).toBe(1)
    expect(m.get('2026-03')).toBe(1)
    expect(m.get('2026-04')).toBeUndefined()
  })

  it('soma parcelas de schedules distintos que caem no mesmo mês', () => {
    const m = computeInstallmentsPerMonth([
      sched({ kind: 'entry', recurrence_type: null, specific_date: '2026-01-10' }),
      sched({ start_date: '2026-01-20', quantity: 1, recurrence_type: 'monthly' }),
    ])
    expect(m.get('2026-01')).toBe(2)
  })

  it('conta grupos anuais uma vez por ano', () => {
    const m = computeInstallmentsPerMonth([
      sched({
        kind: 'balloon',
        start_date: '2026-12-15',
        quantity: 3,
        recurrence_type: 'yearly',
      }),
    ])
    expect(m.get('2026-12')).toBe(1)
    expect(m.get('2027-12')).toBe(1)
    expect(m.get('2028-12')).toBe(1)
  })

  it('conta mesmo quando recurrence_day está nulo (deriva de start_date)', () => {
    // Guard de regressão: a versão antiga pulava schedules sem recurrence_day.
    const m = computeInstallmentsPerMonth([
      sched({
        start_date: '2026-05-01',
        quantity: 2,
        recurrence_type: 'monthly',
        recurrence_day: null,
      }),
    ])
    expect(m.get('2026-05')).toBe(1)
    expect(m.get('2026-06')).toBe(1)
  })

  it('entrada conta como 1 ocorrência (não multiplica pela quantity)', () => {
    const m = computeInstallmentsPerMonth([
      sched({ kind: 'entry', recurrence_type: null, specific_date: '2026-03-05', quantity: 2 }),
    ])
    expect(m.get('2026-03')).toBe(1)
  })
})

// ─── distributeBalanceToGroup (extraída de handleDistribute) ────────────────────

describe('distributeBalanceToGroup', () => {
  it('reparte o saldo igualmente entre as parcelas do grupo', () => {
    const out = distributeBalanceToGroup(
      [sched({ kind: 'balloon', quantity: 3, amount: 0, recurrence_type: 'yearly' })],
      'balloon',
      300_000
    )
    // 1 schedule, índice 0, novo valor por parcela = 0 + round(300000/3) = 100000
    expect(out).toEqual([{ index: 0, amount: 100_000 }])
  })

  it('soma a quantidade entre vários schedules do mesmo tipo', () => {
    const out = distributeBalanceToGroup(
      [
        sched({ kind: 'balloon', quantity: 2, amount: 0, recurrence_type: 'yearly' }),
        sched({ kind: 'balloon', quantity: 1, amount: 0, recurrence_type: 'yearly' }),
      ],
      'balloon',
      300_000
    )
    // qty total = 3 → cada parcela recebe +round(300000/3)=100000
    expect(out).toEqual([
      { index: 0, amount: 100_000 },
      { index: 1, amount: 100_000 },
    ])
  })

  it('soma sobre o valor base já existente da parcela', () => {
    const out = distributeBalanceToGroup(
      [sched({ kind: 'balloon', quantity: 2, amount: 50_000, recurrence_type: 'yearly' })],
      'balloon',
      100_000
    )
    // 50000 + round(100000/2) = 100000
    expect(out).toEqual([{ index: 0, amount: 100_000 }])
  })

  it('grupo sem parcelas (qty 0) retorna vazio', () => {
    const out = distributeBalanceToGroup(
      [sched({ kind: 'regular', quantity: 1, recurrence_type: 'monthly' })],
      'balloon',
      100_000
    )
    expect(out).toEqual([])
  })
})

// ─── planAppendedSchedule (extraída de addRecurring) ────────────────────────────

describe('planAppendedSchedule', () => {
  it('mensal encadeia logo após o último grupo mensal', () => {
    const existing = [sched({ start_date: '2026-01-01', quantity: 12, recurrence_type: 'monthly' })]
    const next = planAppendedSchedule('regular', 'monthly', existing, 0)
    expect(next.kind).toBe('regular')
    expect(next.recurrence_type).toBe('monthly')
    expect(next.quantity).toBe(1)
    expect(next.amount).toBe(0)
    // fim do grupo anterior = 01/12/2026; encadeia no dia default 10 → 2027-01-10
    expect(next.start_date).toBe('2027-01-10')
    expect(next.recurrence_day).toBe(10)
  })

  it('balão deriva quantidade do span das mensais e distribui o saldo', () => {
    const existing = [sched({ start_date: '2026-01-01', quantity: 60, recurrence_type: 'monthly' })]
    // span = jan/2026 → dez/2030 (59 meses) → anual = floor(59/12) = 4x
    const next = planAppendedSchedule('balloon', 'yearly', existing, 400_000)
    expect(next.kind).toBe('balloon')
    expect(next.recurrence_type).toBe('yearly')
    expect(next.quantity).toBe(4)
    expect(next.start_date).toBe('2027-01-15') // aniversário, dia default anual 15
    expect(next.recurrence_day).toBe(15)
    expect(next.recurrence_month).toBe(1)
    // saldo 400000 em 4 parcelas → 100000 cada
    expect(next.amount).toBe(100_000)
  })

  it('balão sem mensais cai em 1 parcela com o saldo inteiro', () => {
    const next = planAppendedSchedule('balloon', 'yearly', [], 250_000)
    expect(next.quantity).toBe(1)
    expect(next.amount).toBe(250_000)
    expect(typeof next.start_date).toBe('string')
  })

  it('mensal sem grupo anterior tem quantidade 1 e valor zero', () => {
    const next = planAppendedSchedule('regular', 'monthly', [], 999_999)
    expect(next.quantity).toBe(1)
    expect(next.amount).toBe(0) // mensal nunca herda saldo na adição
    expect(next.recurrence_day).toBe(10)
  })

  it('mensal sem grupo anterior, mas com entrada, inicia no mês seguinte à entrada', () => {
    const existing = [sched({ kind: 'entry', recurrence_type: null, specific_date: '2026-03-15' })]
    const next = planAppendedSchedule('regular', 'monthly', existing, 0)
    // entrada em mar/2026 → 1ª mensal em abr/2026, no dia default 10
    expect(next.start_date).toBe('2026-04-10')
    expect(next.recurrence_day).toBe(10)
  })

  it('com múltiplas entradas, a 1ª mensal segue a entrada de maior data', () => {
    const existing = [
      sched({ kind: 'entry', recurrence_type: null, specific_date: '2026-03-15' }),
      sched({ kind: 'entry', recurrence_type: null, specific_date: '2026-05-20' }),
    ]
    const next = planAppendedSchedule('regular', 'monthly', existing, 0)
    expect(next.start_date).toBe('2026-06-10')
  })

  it('entrada no fim do mês: clampa o dia ao mês seguinte', () => {
    const existing = [sched({ kind: 'entry', recurrence_type: null, specific_date: '2026-01-31' })]
    const next = planAppendedSchedule('regular', 'monthly', existing, 0)
    // jan → fev no dia 10 (clamp do addMonthsClamped não afeta dia 10)
    expect(next.start_date).toBe('2026-02-10')
  })
})

// ─── recomputeGroupForPeriodicity (extraída de handlePeriodicityChange) ─────────

describe('recomputeGroupForPeriodicity', () => {
  const monthlySpan = [
    sched({ start_date: '2026-01-01', quantity: 60, recurrence_type: 'monthly' }),
  ]

  it('troca a sazonalidade recalculando quantidade pelo span e repartindo o total', () => {
    const row = sched({
      kind: 'balloon',
      recurrence_type: 'yearly',
      quantity: 4,
      amount: 100_000, // total antigo = 400000
      recurrence_day: 15,
      start_date: '2027-01-15',
    })
    const out = recomputeGroupForPeriodicity(row, 'semestral', [...monthlySpan, row])
    expect(out.recurrence_type).toBe('semestral')
    // span 59 meses / 6 = 9x; total 400000 / 9 = 44444
    expect(out.quantity).toBe(9)
    expect(out.amount).toBe(Math.round(400_000 / 9))
    expect(out.recurrence_month).toBeNull() // não-anual zera o mês
  })

  it('sem mensais, preserva a quantidade e só troca a periodicidade', () => {
    const row = sched({
      kind: 'balloon',
      recurrence_type: 'yearly',
      quantity: 2,
      amount: 50_000,
      recurrence_day: 15,
      start_date: '2027-06-15',
    })
    const out = recomputeGroupForPeriodicity(row, 'quarterly', [row])
    expect(out.recurrence_type).toBe('quarterly')
    expect(out.quantity).toBe(2)
    expect(out.amount).toBe(50_000) // total 100000 / 2 mantido
  })
})

// ─── Helpers de data e contrato (migrados de tests/unit/lib/installment-utils) ──

describe('formatDateISO()', () => {
  it('formata com padding correto', () => {
    expect(formatDateISO(2026, 1, 5)).toBe('2026-01-05')
  })

  it('formata mês e dia com dois dígitos', () => {
    expect(formatDateISO(2026, 12, 31)).toBe('2026-12-31')
  })
})

describe('formatBRDate()', () => {
  it('formata em DD/MM/YYYY pt-BR', () => {
    const date = new Date('2026-05-05T12:00:00')
    expect(formatBRDate(date)).toBe('05/05/2026')
  })
})

describe('computeDefaultStartDate()', () => {
  it('retorna string vazia se recurrenceDay for nulo', () => {
    expect(computeDefaultStartDate('monthly', null, null)).toBe('')
  })

  it('monthly: retorna o dia atual se ainda não passou neste mês', () => {
    // Dia 10 ainda não passou (hoje é dia 5)
    expect(computeDefaultStartDate('monthly', 10, null)).toBe('2026-05-10')
  })

  it('monthly: avança para o próximo mês se o dia já passou', () => {
    // Dia 3 já passou (hoje é dia 5)
    expect(computeDefaultStartDate('monthly', 3, null)).toBe('2026-06-03')
  })

  it('yearly: retorna data deste ano se o mês/dia ainda não passou', () => {
    // Dezembro ainda não passou
    expect(computeDefaultStartDate('yearly', 15, 12)).toBe('2026-12-15')
  })

  it('yearly: avança para o próximo ano se mês/dia já passou', () => {
    // Janeiro já passou (estamos em maio)
    expect(computeDefaultStartDate('yearly', 15, 1)).toBe('2027-01-15')
  })

  it('yearly: retorna string vazia sem recurrenceMonth', () => {
    expect(computeDefaultStartDate('yearly', 15, null)).toBe('')
  })
})

describe('computeAllowedDates()', () => {
  it('retorna array vazio se recurrenceDay for nulo', () => {
    expect(computeAllowedDates('monthly', null, null)).toHaveLength(0)
  })

  it('monthly: inclui o dia correto do mês corrente e futuros', () => {
    const dates = computeAllowedDates('monthly', 10, null)
    expect(dates).toContain('2026-05-10')
    expect(dates).toContain('2026-06-10')
    expect(dates).toContain('2027-01-10')
  })

  it('monthly: não inclui datas anteriores ao mês corrente', () => {
    const dates = computeAllowedDates('monthly', 1, null)
    // Maio de 2026 deve estar incluído (mesmo já tendo passado o dia 1, a lógica inclui o mês corrente)
    expect(dates.every((d) => d >= '2026-05-01')).toBe(true)
  })

  it('monthly: gera datas por ~30 anos', () => {
    const dates = computeAllowedDates('monthly', 15, null)
    expect(dates.length).toBeGreaterThan(300)
  })

  it('yearly: inclui o dia/mês correto a cada ano', () => {
    const dates = computeAllowedDates('yearly', 10, 8)
    expect(dates).toContain('2026-08-10')
    expect(dates).toContain('2027-08-10')
  })

  it('yearly: gera ~30 datas', () => {
    const dates = computeAllowedDates('yearly', 10, 8)
    expect(dates.length).toBeGreaterThanOrEqual(30)
  })
})

describe('computeDefaultStartDate() — novas periodicidades', () => {
  it('bimonthly: dia não passou → retorna este mês', () => {
    expect(computeDefaultStartDate('bimonthly', 10, null)).toBe('2026-05-10')
  })

  it('bimonthly: dia já passou → retorna próximo mês', () => {
    expect(computeDefaultStartDate('bimonthly', 3, null)).toBe('2026-06-03')
  })

  it('quarterly: dia não passou → retorna este mês', () => {
    expect(computeDefaultStartDate('quarterly', 10, null)).toBe('2026-05-10')
  })

  it('quarterly: dia já passou → retorna próximo mês', () => {
    expect(computeDefaultStartDate('quarterly', 3, null)).toBe('2026-06-03')
  })

  it('semestral: dia não passou → retorna este mês', () => {
    expect(computeDefaultStartDate('semestral', 10, null)).toBe('2026-05-10')
  })

  it('semestral: dia já passou → retorna próximo mês', () => {
    expect(computeDefaultStartDate('semestral', 3, null)).toBe('2026-06-03')
  })
})

describe('computeAllowedDates() — novas periodicidades', () => {
  it('bimonthly: contém datas futuras do dia correto em vários meses', () => {
    const dates = computeAllowedDates('bimonthly', 10, null)
    expect(dates).toContain('2026-05-10')
    expect(dates).toContain('2026-06-10')
    expect(dates).toContain('2027-01-10')
    expect(dates.length).toBeGreaterThan(300)
  })

  it('quarterly: contém datas futuras do dia correto em vários meses', () => {
    const dates = computeAllowedDates('quarterly', 15, null)
    expect(dates).toContain('2026-05-15')
    expect(dates).toContain('2026-06-15')
    expect(dates).toContain('2027-03-15')
    expect(dates.length).toBeGreaterThan(300)
  })

  it('semestral: contém datas futuras do dia correto em vários meses', () => {
    const dates = computeAllowedDates('semestral', 20, null)
    expect(dates).toContain('2026-05-20')
    expect(dates).toContain('2027-01-20')
    expect(dates.length).toBeGreaterThan(300)
  })
})

describe('computeContractEndDate()', () => {
  it('retorna endDate null para array vazio', () => {
    const { endDate, totalMonths } = computeContractEndDate([])
    expect(endDate).toBeNull()
    expect(totalMonths).toBe(0)
  })

  it('calcula endDate de schedule de entrada (entry)', () => {
    const { endDate } = computeContractEndDate([
      { kind: 'entry', specific_date: '2026-06-01', quantity: 1 } as never,
    ])
    expect(endDate).toEqual(new Date('2026-06-01'))
  })

  it('calcula endDate de schedule mensal com quantidade', () => {
    const { endDate, totalMonths } = computeContractEndDate([
      {
        kind: 'regular',
        recurrence_type: 'monthly',
        start_date: '2026-06-01T12:00:00',
        recurrence_day: 1,
        quantity: 12,
      } as never,
    ])
    // 12 parcelas mensais a partir de junho/2026 → termina em maio/2027
    expect(endDate?.getFullYear()).toBe(2027)
    expect(endDate?.getMonth()).toBe(4) // maio (0-indexed)
    expect(totalMonths).toBe(12)
  })

  it('retorna o maior endDate entre múltiplos schedules', () => {
    const { endDate } = computeContractEndDate([
      { kind: 'entry', specific_date: '2026-06-01T12:00:00', quantity: 1 } as never,
      {
        kind: 'regular',
        recurrence_type: 'monthly',
        start_date: '2026-07-01T12:00:00',
        recurrence_day: 1,
        quantity: 24,
      } as never,
    ])
    // 24 mensais a partir de jul/2026 → termina em jun/2028
    expect(endDate?.getFullYear()).toBe(2028)
    expect(endDate?.getMonth()).toBe(5) // junho (0-indexed)
  })
})

describe('computeContractEndDate() — novas periodicidades', () => {
  it('bimonthly qty=3 start=2026-01-31 → fim em 2026-05-31 (maio tem 31 dias)', () => {
    const { endDate } = computeContractEndDate([
      {
        kind: 'regular',
        recurrence_type: 'bimonthly',
        start_date: '2026-01-31T12:00:00',
        recurrence_day: 31,
        quantity: 3,
      } as never,
    ])
    expect(endDate?.getFullYear()).toBe(2026)
    expect(endDate?.getMonth()).toBe(4) // maio (0-indexed)
    expect(endDate?.getDate()).toBe(31)
  })

  it('quarterly qty=2 start=2026-01-31 → fim em 2026-04-30 (abril tem 30 dias — clamp!)', () => {
    const { endDate } = computeContractEndDate([
      {
        kind: 'regular',
        recurrence_type: 'quarterly',
        start_date: '2026-01-31T12:00:00',
        recurrence_day: 31,
        quantity: 2,
      } as never,
    ])
    expect(endDate?.getFullYear()).toBe(2026)
    expect(endDate?.getMonth()).toBe(3) // abril (0-indexed)
    expect(endDate?.getDate()).toBe(30)
  })

  it('semestral qty=2 start=2026-08-31 → fim em 2027-02-28 (fev tem 28 dias — clamp!)', () => {
    const { endDate } = computeContractEndDate([
      {
        kind: 'regular',
        recurrence_type: 'semestral',
        start_date: '2026-08-31T12:00:00',
        recurrence_day: 31,
        quantity: 2,
      } as never,
    ])
    expect(endDate?.getFullYear()).toBe(2027)
    expect(endDate?.getMonth()).toBe(1) // fevereiro (0-indexed)
    expect(endDate?.getDate()).toBe(28)
  })

  it('bimonthly qty=6 start=2026-06-10 → fim em 2027-04-10 (5 intervalos × 2 meses)', () => {
    const { endDate } = computeContractEndDate([
      {
        kind: 'regular',
        recurrence_type: 'bimonthly',
        start_date: '2026-06-10T12:00:00',
        recurrence_day: 10,
        quantity: 6,
      } as never,
    ])
    expect(endDate?.getFullYear()).toBe(2027)
    expect(endDate?.getMonth()).toBe(3) // abril (0-indexed)
    expect(endDate?.getDate()).toBe(10)
  })

  it('quarterly qty=4 start=2026-03-31 → fim em 2026-12-31 (3 intervalos × 3 meses)', () => {
    const { endDate } = computeContractEndDate([
      {
        kind: 'regular',
        recurrence_type: 'quarterly',
        start_date: '2026-03-31T12:00:00',
        recurrence_day: 31,
        quantity: 4,
      } as never,
    ])
    expect(endDate?.getFullYear()).toBe(2026)
    expect(endDate?.getMonth()).toBe(11) // dezembro (0-indexed)
    expect(endDate?.getDate()).toBe(31)
  })

  it('semestral qty=3 start=2026-01-31 → fim em 2027-01-31 (2 intervalos × 6 meses)', () => {
    const { endDate } = computeContractEndDate([
      {
        kind: 'regular',
        recurrence_type: 'semestral',
        start_date: '2026-01-31T12:00:00',
        recurrence_day: 31,
        quantity: 3,
      } as never,
    ])
    expect(endDate?.getFullYear()).toBe(2027)
    expect(endDate?.getMonth()).toBe(0) // janeiro (0-indexed)
    expect(endDate?.getDate()).toBe(31)
  })
})
