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
        kind: 'monthly',
        start_date: '2026-06-01',
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
        kind: 'monthly',
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
