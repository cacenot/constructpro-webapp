import { describe, expect, it } from 'vitest'
import { brokerCreateSchema } from './broker.schema'

const VALID_CPF = '529.982.247-25'

const validBroker = {
  cpf: VALID_CPF,
  full_name: 'João da Silva Corretor',
  creci: 'CRECI-SP 12345',
}

describe('brokerCreateSchema — CPF', () => {
  it('aceita CPF válido com máscara', () => {
    expect(brokerCreateSchema.safeParse(validBroker).success).toBe(true)
  })

  it('rejeita CPF inválido', () => {
    const result = brokerCreateSchema.safeParse({ ...validBroker, cpf: '111.111.111-11' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('CPF inválido')
  })

  it('rejeita CPF vazio', () => {
    const result = brokerCreateSchema.safeParse({ ...validBroker, cpf: '' })
    expect(result.success).toBe(false)
  })
})

describe('brokerCreateSchema — full_name', () => {
  it('rejeita nome com 2 caracteres', () => {
    const result = brokerCreateSchema.safeParse({ ...validBroker, full_name: 'AB' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('full_name')
  })

  it('aceita nome com 3 caracteres', () => {
    const result = brokerCreateSchema.safeParse({ ...validBroker, full_name: 'Ana' })
    expect(result.success).toBe(true)
  })

  it('aceita nome com 120 caracteres', () => {
    const result = brokerCreateSchema.safeParse({
      ...validBroker,
      full_name: 'A'.repeat(120),
    })
    expect(result.success).toBe(true)
  })

  it('rejeita nome com 121 caracteres', () => {
    const result = brokerCreateSchema.safeParse({
      ...validBroker,
      full_name: 'A'.repeat(121),
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('full_name')
  })
})

describe('brokerCreateSchema — creci', () => {
  it('rejeita CRECI com 4 caracteres', () => {
    const result = brokerCreateSchema.safeParse({ ...validBroker, creci: 'ABCD' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('creci')
  })

  it('aceita CRECI com 5 caracteres', () => {
    const result = brokerCreateSchema.safeParse({ ...validBroker, creci: 'ABCDE' })
    expect(result.success).toBe(true)
  })

  it('aceita CRECI com 20 caracteres', () => {
    const result = brokerCreateSchema.safeParse({ ...validBroker, creci: 'A'.repeat(20) })
    expect(result.success).toBe(true)
  })

  it('rejeita CRECI com 21 caracteres', () => {
    const result = brokerCreateSchema.safeParse({ ...validBroker, creci: 'A'.repeat(21) })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('creci')
  })
})

describe('brokerCreateSchema — email (opcional)', () => {
  it('aceita email ausente', () => {
    const result = brokerCreateSchema.safeParse(validBroker)
    expect(result.success).toBe(true)
  })

  it('aceita email válido', () => {
    const result = brokerCreateSchema.safeParse({ ...validBroker, email: 'joao@example.com' })
    expect(result.success).toBe(true)
  })

  it('rejeita email inválido', () => {
    const result = brokerCreateSchema.safeParse({ ...validBroker, email: 'nao-e-email' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('email')
  })
})

describe('brokerCreateSchema — phone (opcional)', () => {
  it('aceita phone ausente', () => {
    const result = brokerCreateSchema.safeParse(validBroker)
    expect(result.success).toBe(true)
  })

  it('aceita phone E.164 válido', () => {
    const result = brokerCreateSchema.safeParse({ ...validBroker, phone: '+5511987654321' })
    expect(result.success).toBe(true)
  })

  it('rejeita phone inválido (sem +)', () => {
    const result = brokerCreateSchema.safeParse({ ...validBroker, phone: '11987654321' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('phone')
  })

  it('rejeita phone E.164 incompleto (passa formato mas número inválido)', () => {
    const result = brokerCreateSchema.safeParse({ ...validBroker, phone: '+5511987' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('phone')
  })

  it('aceita phone de outro país válido', () => {
    const result = brokerCreateSchema.safeParse({ ...validBroker, phone: '+351912345678' })
    expect(result.success).toBe(true)
  })
})
