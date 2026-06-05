import { describe, expect, it } from 'vitest'
import { cn, formatArea, formatCurrency, formatId } from '@/lib/utils'

describe('cn()', () => {
  it('retorna classe simples', () => {
    expect(cn('foo')).toBe('foo')
  })

  it('concatena múltiplas classes', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('remove duplicatas do tailwind (tailwind-merge)', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2')
  })

  it('ignora valores falsy', () => {
    expect(cn('foo', false, undefined, null, 'bar')).toBe('foo bar')
  })

  it('suporta objetos condicionais', () => {
    expect(cn({ foo: true, bar: false })).toBe('foo')
  })
})

describe('formatCurrency()', () => {
  it('formata zero', () => {
    expect(formatCurrency(0)).toMatch(/R\$\s*0,00/)
  })

  it('formata valor positivo em pt-BR', () => {
    expect(formatCurrency(1500)).toMatch(/R\$\s*1\.500,00/)
  })

  it('formata centavos corretamente', () => {
    expect(formatCurrency(9.9)).toMatch(/R\$\s*9,90/)
  })

  it('formata valor negativo', () => {
    expect(formatCurrency(-250)).toMatch(/-/)
  })
})

describe('formatArea()', () => {
  it('retorna "—" para null', () => {
    expect(formatArea(null)).toBe('—')
  })

  it('retorna "—" para 0', () => {
    expect(formatArea(0)).toBe('—')
  })

  it('retorna "—" para string não numérica (NaN guard)', () => {
    expect(formatArea('abc')).toBe('—')
  })

  it('formata número sem casas decimais falsas e com espaço inquebrável', () => {
    // 72.5 → "72,5 m²" (sem zero desnecessário; espaço  )
    expect(formatArea(72.5)).toBe('72,5 m²')
  })

  it('formata inteiro sem decimais', () => {
    expect(formatArea('120')).toBe('120 m²')
  })

  it('formata string decimal preservando casas significativas', () => {
    expect(formatArea('48.75')).toBe('48,75 m²')
  })
})

describe('formatId()', () => {
  it('formata id com padding de 5 dígitos', () => {
    expect(formatId(1)).toBe('#00001')
  })

  it('não adiciona padding para id >= 100000', () => {
    expect(formatId(100000)).toBe('#100000')
  })

  it('formata id intermediário', () => {
    expect(formatId(342)).toBe('#00342')
  })
})
