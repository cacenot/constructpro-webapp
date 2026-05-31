import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  computeAllowedDates,
  computeContractEndDate,
  computeDefaultStartDate,
  formatBRDate,
  formatDateISO,
} from '@/lib/installment-utils'

// Fixa a data atual em 2026-05-05 (terça-feira) para resultados determinísticos
const FIXED_DATE = new Date('2026-05-05T12:00:00')

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(FIXED_DATE)
})

afterEach(() => {
  vi.useRealTimers()
})

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
