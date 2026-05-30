import { describe, expect, it } from 'vitest'
import { agencyCreateSchema } from './agency.schema'

const VALID_CNPJ = '11.222.333/0001-81'

const validAgency = {
  cnpj: VALID_CNPJ,
  legal_name: 'Imobiliária Exemplo Ltda',
  creci_j: 'CRECI-J SP 12345',
}

describe('agencyCreateSchema — cnpj', () => {
  it('aceita CNPJ válido com máscara', () => {
    expect(agencyCreateSchema.safeParse(validAgency).success).toBe(true)
  })

  it('rejeita CNPJ inválido', () => {
    const result = agencyCreateSchema.safeParse({ ...validAgency, cnpj: '11.111.111/1111-11' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('CNPJ inválido')
  })

  it('rejeita CNPJ vazio', () => {
    const result = agencyCreateSchema.safeParse({ ...validAgency, cnpj: '' })
    expect(result.success).toBe(false)
  })
})

describe('agencyCreateSchema — legal_name', () => {
  it('rejeita razão social com 2 caracteres', () => {
    const result = agencyCreateSchema.safeParse({ ...validAgency, legal_name: 'AB' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('legal_name')
  })

  it('aceita razão social com 3 caracteres', () => {
    const result = agencyCreateSchema.safeParse({ ...validAgency, legal_name: 'ABC' })
    expect(result.success).toBe(true)
  })

  it('aceita razão social com 160 caracteres', () => {
    const result = agencyCreateSchema.safeParse({ ...validAgency, legal_name: 'A'.repeat(160) })
    expect(result.success).toBe(true)
  })

  it('rejeita razão social com 161 caracteres', () => {
    const result = agencyCreateSchema.safeParse({ ...validAgency, legal_name: 'A'.repeat(161) })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('legal_name')
  })
})

describe('agencyCreateSchema — trade_name (opcional)', () => {
  it('aceita trade_name ausente', () => {
    const result = agencyCreateSchema.safeParse(validAgency)
    expect(result.success).toBe(true)
  })

  it('aceita trade_name com 120 caracteres', () => {
    const result = agencyCreateSchema.safeParse({ ...validAgency, trade_name: 'A'.repeat(120) })
    expect(result.success).toBe(true)
  })

  it('rejeita trade_name com 121 caracteres', () => {
    const result = agencyCreateSchema.safeParse({ ...validAgency, trade_name: 'A'.repeat(121) })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('trade_name')
  })

  it('aceita trade_name string vazia', () => {
    const result = agencyCreateSchema.safeParse({ ...validAgency, trade_name: '' })
    expect(result.success).toBe(true)
  })
})

describe('agencyCreateSchema — creci_j', () => {
  it('rejeita CRECI-J com 4 caracteres', () => {
    const result = agencyCreateSchema.safeParse({ ...validAgency, creci_j: 'ABCD' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('creci_j')
  })

  it('aceita CRECI-J com 5 caracteres', () => {
    const result = agencyCreateSchema.safeParse({ ...validAgency, creci_j: 'ABCDE' })
    expect(result.success).toBe(true)
  })

  it('aceita CRECI-J com 20 caracteres', () => {
    const result = agencyCreateSchema.safeParse({ ...validAgency, creci_j: 'A'.repeat(20) })
    expect(result.success).toBe(true)
  })

  it('rejeita CRECI-J com 21 caracteres', () => {
    const result = agencyCreateSchema.safeParse({ ...validAgency, creci_j: 'A'.repeat(21) })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('creci_j')
  })
})

describe('agencyCreateSchema — email (opcional)', () => {
  it('aceita email ausente', () => {
    const result = agencyCreateSchema.safeParse(validAgency)
    expect(result.success).toBe(true)
  })

  it('aceita email válido', () => {
    const result = agencyCreateSchema.safeParse({ ...validAgency, email: 'contato@imob.com' })
    expect(result.success).toBe(true)
  })

  it('rejeita email inválido', () => {
    const result = agencyCreateSchema.safeParse({ ...validAgency, email: 'nao-e-email' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('email')
  })

  it('aceita email string vazia', () => {
    const result = agencyCreateSchema.safeParse({ ...validAgency, email: '' })
    expect(result.success).toBe(true)
  })
})

describe('agencyCreateSchema — phone (opcional)', () => {
  it('aceita phone ausente', () => {
    const result = agencyCreateSchema.safeParse(validAgency)
    expect(result.success).toBe(true)
  })

  it('aceita phone E.164 válido', () => {
    const result = agencyCreateSchema.safeParse({ ...validAgency, phone: '+5511987654321' })
    expect(result.success).toBe(true)
  })

  it('rejeita phone inválido (sem +)', () => {
    const result = agencyCreateSchema.safeParse({ ...validAgency, phone: '11987654321' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('phone')
  })

  it('rejeita phone E.164 incompleto', () => {
    const result = agencyCreateSchema.safeParse({ ...validAgency, phone: '+5511987' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('phone')
  })

  it('aceita phone de outro país válido', () => {
    const result = agencyCreateSchema.safeParse({ ...validAgency, phone: '+351912345678' })
    expect(result.success).toBe(true)
  })
})
