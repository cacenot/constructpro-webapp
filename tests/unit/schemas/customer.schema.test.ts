import { describe, expect, it } from 'vitest'
import { customerPFCreateSchema, customerPJCreateSchema } from '@/schemas/customer.schema'

// CPF e CNPJ válidos para testes (algoritmo de validação real)
const VALID_CPF = '529.982.247-25' // CPF válido conhecido
const VALID_CNPJ = '11.222.333/0001-81' // CNPJ válido conhecido

const validPF = {
  type: 'individual' as const,
  full_name: 'Maria das Dores Silva',
  cpf_cnpj: VALID_CPF,
  phone: '+5511987654321',
  country: 'BR',
}

const validPJ = {
  type: 'company' as const,
  full_name: 'Construtora ABC',
  legal_name: 'Construtora ABC Ltda',
  cpf_cnpj: VALID_CNPJ,
  phone: '+5511987654321',
  country: 'BR',
}

describe('customerPFCreateSchema', () => {
  it('aceita PF válida mínima', () => {
    expect(customerPFCreateSchema.safeParse(validPF).success).toBe(true)
  })

  it('aceita PF com campos opcionais', () => {
    const result = customerPFCreateSchema.safeParse({
      ...validPF,
      email: 'maria@email.com',
      birthday: '15/06/1985',
      gender: 'female',
      marital_status: 'married',
      address: 'Rua das Flores, 100',
      city: 'São Paulo',
      state: 'SP',
    })
    expect(result.success).toBe(true)
  })

  it('rejeita nome com menos de 3 caracteres', () => {
    const result = customerPFCreateSchema.safeParse({ ...validPF, full_name: 'AB' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('full_name')
  })

  it('rejeita CPF inválido', () => {
    const result = customerPFCreateSchema.safeParse({ ...validPF, cpf_cnpj: '111.111.111-11' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('CPF inválido')
  })

  it('rejeita telefone vazio', () => {
    const result = customerPFCreateSchema.safeParse({ ...validPF, phone: '' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('phone')
  })

  it('rejeita email inválido quando preenchido', () => {
    const result = customerPFCreateSchema.safeParse({ ...validPF, email: 'nao-e-email' })
    expect(result.success).toBe(false)
  })

  it('aceita email vazio (campo opcional)', () => {
    const result = customerPFCreateSchema.safeParse({ ...validPF, email: '' })
    expect(result.success).toBe(true)
  })

  it('rejeita data de nascimento futura', () => {
    const result = customerPFCreateSchema.safeParse({ ...validPF, birthday: '01/01/2090' })
    expect(result.success).toBe(false)
  })
})

describe('customerPJCreateSchema', () => {
  it('aceita PJ válida mínima', () => {
    expect(customerPJCreateSchema.safeParse(validPJ).success).toBe(true)
  })

  it('rejeita CNPJ inválido', () => {
    const result = customerPJCreateSchema.safeParse({ ...validPJ, cpf_cnpj: '00.000.000/0000-00' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('CNPJ inválido')
  })

  it('rejeita razão social com menos de 3 caracteres', () => {
    const result = customerPJCreateSchema.safeParse({ ...validPJ, legal_name: 'AB' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('legal_name')
  })

  it('rejeita nome fantasia com menos de 3 caracteres', () => {
    const result = customerPJCreateSchema.safeParse({ ...validPJ, full_name: 'AB' })
    expect(result.success).toBe(false)
  })

  it('rejeita sem legal_name', () => {
    const { legal_name: _, ...withoutLegal } = validPJ
    const result = customerPJCreateSchema.safeParse(withoutLegal)
    expect(result.success).toBe(false)
  })
})
