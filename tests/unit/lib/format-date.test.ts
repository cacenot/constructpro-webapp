import { describe, expect, it } from 'vitest'
import { formatDate, formatMonthYear } from '@/lib/format-date'

// Datas com horário local explícito (T12:00:00, sem "Z") evitam que o fuso
// horário do runner empurre o dia/mês para a véspera.

describe('formatDate', () => {
  it.each([null, undefined, ''])('retorna "—" para valor vazio (%s)', (value) => {
    expect(formatDate(value)).toBe('—')
  })

  it('formata uma data ISO para dd/MM/yyyy', () => {
    expect(formatDate('2026-06-07T12:00:00')).toBe('07/06/2026')
  })

  it('devolve a string original quando a data é inválida', () => {
    expect(formatDate('data-invalida')).toBe('data-invalida')
  })
})

describe('formatMonthYear', () => {
  it.each([null, undefined, ''])('retorna "—" para valor vazio (%s)', (value) => {
    expect(formatMonthYear(value)).toBe('—')
  })

  it('formata uma data ISO para mês abreviado/ano em pt-BR', () => {
    const result = formatMonthYear('2026-06-15T12:00:00')
    expect(result.toLowerCase()).toContain('jun')
    expect(result).toContain('26')
  })

  it('devolve a string original quando a data é inválida', () => {
    expect(formatMonthYear('xxx')).toBe('xxx')
  })
})
