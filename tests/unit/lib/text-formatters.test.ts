import { describe, expect, it } from 'vitest'
import {
  capitalizeNameBR,
  formatDocument,
  formatISOToBirthDate,
  formatPhone,
  maskBirthDate,
  parseBirthDateToISO,
  whatsappLink,
} from '@/lib/text-formatters'

describe('capitalizeNameBR()', () => {
  it('retorna string vazia para entrada vazia', () => {
    expect(capitalizeNameBR('')).toBe('')
  })

  it('capitaliza primeira letra de cada palavra', () => {
    expect(capitalizeNameBR('joao silva')).toBe('Joao Silva')
  })

  it('mantém preposições em minúsculo', () => {
    expect(capitalizeNameBR('maria das dores de oliveira')).toBe('Maria das Dores de Oliveira')
  })

  it('sempre capitaliza a primeira palavra mesmo sendo preposição', () => {
    expect(capitalizeNameBR('da silva')).toBe('Da Silva')
  })

  it('normaliza texto todo maiúsculo', () => {
    expect(capitalizeNameBR('PEDRO DO CARMO')).toBe('Pedro do Carmo')
  })

  it('trata nomes com artigo "e"', () => {
    expect(capitalizeNameBR('luz e sombra')).toBe('Luz e Sombra')
  })
})

describe('maskBirthDate()', () => {
  it('retorna apenas dígitos para 1 ou 2 caracteres', () => {
    expect(maskBirthDate('1')).toBe('1')
    expect(maskBirthDate('12')).toBe('12')
  })

  it('insere barra após 2 dígitos', () => {
    expect(maskBirthDate('123')).toBe('12/3')
  })

  it('insere segunda barra após 4 dígitos', () => {
    expect(maskBirthDate('12051990')).toBe('12/05/1990')
  })

  it('ignora caracteres não numéricos', () => {
    expect(maskBirthDate('12/05/1990')).toBe('12/05/1990')
  })

  it('limita a 8 dígitos', () => {
    expect(maskBirthDate('120519901234')).toBe('12/05/1990')
  })
})

describe('parseBirthDateToISO()', () => {
  it('converte DD/MM/YYYY para YYYY-MM-DD', () => {
    expect(parseBirthDateToISO('12/05/1990')).toBe('1990-05-12')
  })

  it('retorna null para string incompleta', () => {
    expect(parseBirthDateToISO('12/05')).toBeNull()
  })

  it('retorna null para string vazia', () => {
    expect(parseBirthDateToISO('')).toBeNull()
  })
})

describe('formatISOToBirthDate()', () => {
  it('converte YYYY-MM-DD para DD/MM/YYYY', () => {
    expect(formatISOToBirthDate('1990-05-12')).toBe('12/05/1990')
  })

  it('retorna string vazia para null', () => {
    expect(formatISOToBirthDate(null)).toBe('')
  })

  it('retorna string vazia para undefined', () => {
    expect(formatISOToBirthDate(undefined)).toBe('')
  })

  it('retorna string vazia para formato inválido', () => {
    expect(formatISOToBirthDate('not-a-date')).toBe('')
  })
})

describe('formatPhone()', () => {
  it('formata celular com 11 dígitos', () => {
    expect(formatPhone('11987654321')).toBe('(11) 98765-4321')
  })

  it('formata fixo com 10 dígitos', () => {
    expect(formatPhone('1134567890')).toBe('(11) 3456-7890')
  })

  it('remove código do país 55', () => {
    expect(formatPhone('5511987654321')).toBe('(11) 98765-4321')
  })

  it('retorna original para formato desconhecido', () => {
    expect(formatPhone('123')).toBe('123')
  })
})

describe('whatsappLink()', () => {
  it('gera link wa.me apenas com dígitos', () => {
    expect(whatsappLink('+55 (11) 98765-4321')).toBe('https://wa.me/5511987654321')
  })

  it('mantém número já limpo', () => {
    expect(whatsappLink('5511987654321')).toBe('https://wa.me/5511987654321')
  })
})

describe('formatDocument()', () => {
  it('retorna string vazia para null', () => {
    expect(formatDocument(null)).toBe('')
  })

  it('retorna string vazia para undefined', () => {
    expect(formatDocument(undefined)).toBe('')
  })

  it('formata CPF com 11 dígitos', () => {
    expect(formatDocument('12345678901')).toBe('123.456.789-01')
  })

  it('formata CNPJ com 14 dígitos', () => {
    expect(formatDocument('12345678000195')).toBe('12.345.678/0001-95')
  })

  it('formata CPF já com pontuação (remove e reformata)', () => {
    expect(formatDocument('123.456.789-01')).toBe('123.456.789-01')
  })

  it('retorna original para tamanho inválido', () => {
    expect(formatDocument('123456')).toBe('123456')
  })
})
