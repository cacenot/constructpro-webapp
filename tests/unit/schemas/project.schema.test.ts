import { describe, expect, it } from 'vitest'
import { projectCreateSchema, projectUpdateSchema } from '@/schemas/project.schema'

const validProject = {
  name: 'Residencial Ipiranga',
  status: 'construction' as const,
  address: 'Rua das Flores',
  number: '100',
  district: 'Centro',
  city: 'São Paulo',
  state: 'SP',
  postal_code: '01310-000',
}

describe('projectCreateSchema', () => {
  it('aceita projeto válido mínimo', () => {
    expect(projectCreateSchema.safeParse(validProject).success).toBe(true)
  })

  it('aceita projeto com campos opcionais', () => {
    const result = projectCreateSchema.safeParse({
      ...validProject,
      description: 'Descrição do empreendimento',
      delivery_date: '2027-12-01',
      features: ['Piscina', 'Academia'],
    })
    expect(result.success).toBe(true)
  })

  it('rejeita nome vazio', () => {
    const result = projectCreateSchema.safeParse({ ...validProject, name: '' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('name')
  })

  it('rejeita status inválido', () => {
    const result = projectCreateSchema.safeParse({ ...validProject, status: 'invalid' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('status')
  })

  it('aceita status "finished"', () => {
    expect(projectCreateSchema.safeParse({ ...validProject, status: 'finished' }).success).toBe(true)
  })

  it('rejeita endereço vazio', () => {
    const result = projectCreateSchema.safeParse({ ...validProject, address: '' })
    expect(result.success).toBe(false)
  })

  it('rejeita cidade vazia', () => {
    const result = projectCreateSchema.safeParse({ ...validProject, city: '' })
    expect(result.success).toBe(false)
  })

  it('rejeita nome excedendo limite de 200 caracteres', () => {
    const result = projectCreateSchema.safeParse({ ...validProject, name: 'A'.repeat(201) })
    expect(result.success).toBe(false)
  })
})

describe('projectUpdateSchema', () => {
  it('aceita objeto vazio (todos campos opcionais)', () => {
    expect(projectUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('aceita atualização parcial', () => {
    expect(projectUpdateSchema.safeParse({ name: 'Novo Nome' }).success).toBe(true)
  })

  it('rejeita status inválido mesmo em update', () => {
    const result = projectUpdateSchema.safeParse({ status: 'invalido' })
    expect(result.success).toBe(false)
  })
})
