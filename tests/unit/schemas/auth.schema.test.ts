import { describe, expect, it } from 'vitest'
import { loginSchema, registerSchema, resetPasswordSchema } from '@/schemas/auth.schema'

describe('loginSchema', () => {
  it('aceita credenciais válidas', () => {
    expect(loginSchema.safeParse({ email: 'user@test.com', password: 'Abc123' }).success).toBe(true)
  })

  it('rejeita email inválido', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'Abc123' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('Email inválido')
  })

  it('rejeita senha com menos de 6 caracteres', () => {
    const result = loginSchema.safeParse({ email: 'user@test.com', password: '123' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toMatch(/6 caracteres/)
  })

  it('rejeita campos ausentes', () => {
    expect(loginSchema.safeParse({}).success).toBe(false)
  })
})

describe('registerSchema', () => {
  const valid = {
    name: 'João Silva',
    email: 'joao@test.com',
    password: 'Senha123',
    confirmPassword: 'Senha123',
  }

  it('aceita dados válidos', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true)
  })

  it('rejeita nome com menos de 2 caracteres', () => {
    const result = registerSchema.safeParse({ ...valid, name: 'J' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toMatch(/2 caracteres/)
  })

  it('rejeita senha sem letra maiúscula', () => {
    const result = registerSchema.safeParse({ ...valid, password: 'senha123', confirmPassword: 'senha123' })
    expect(result.success).toBe(false)
    const messages = result.error?.issues.map((i) => i.message) ?? []
    expect(messages.some((m) => m.includes('maiúscula'))).toBe(true)
  })

  it('rejeita senha sem número', () => {
    const result = registerSchema.safeParse({ ...valid, password: 'SenhaSemNum', confirmPassword: 'SenhaSemNum' })
    expect(result.success).toBe(false)
    const messages = result.error?.issues.map((i) => i.message) ?? []
    expect(messages.some((m) => m.includes('número'))).toBe(true)
  })

  it('rejeita quando senhas não coincidem', () => {
    const result = registerSchema.safeParse({ ...valid, confirmPassword: 'Diferente1' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('As senhas não coincidem')
    expect(result.error?.issues[0]?.path).toContain('confirmPassword')
  })
})

describe('resetPasswordSchema', () => {
  it('aceita email válido', () => {
    expect(resetPasswordSchema.safeParse({ email: 'user@test.com' }).success).toBe(true)
  })

  it('rejeita email inválido', () => {
    expect(resetPasswordSchema.safeParse({ email: 'invalido' }).success).toBe(false)
  })
})
