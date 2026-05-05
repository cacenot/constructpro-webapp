import { UnitCategory } from '@cacenot/construct-pro-api-client'
import { describe, expect, it } from 'vitest'
import { unitFormSchema } from '@/schemas/unit.schema'

const validUnit = {
  name: 'Apartamento 101',
  category: UnitCategory.apartment,
  project_id: 1,
  area: 72.5,
  price_cents: 50000000,
}

describe('unitFormSchema', () => {
  it('aceita unidade válida mínima', () => {
    expect(unitFormSchema.safeParse(validUnit).success).toBe(true)
  })

  it('aceita unidade com todos os campos opcionais', () => {
    const result = unitFormSchema.safeParse({
      ...validUnit,
      description: 'Apartamento espaçoso',
      bedrooms: 2,
      bathrooms: 1,
      garages: 1,
      floor: 1,
      features: ['Varanda', 'Suíte'],
    })
    expect(result.success).toBe(true)
  })

  it('rejeita nome vazio', () => {
    const result = unitFormSchema.safeParse({ ...validUnit, name: '' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('name')
  })

  it('rejeita project_id zero', () => {
    const result = unitFormSchema.safeParse({ ...validUnit, project_id: 0 })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('project_id')
  })

  it('rejeita area zero', () => {
    const result = unitFormSchema.safeParse({ ...validUnit, area: 0 })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('area')
  })

  it('rejeita price_cents zero', () => {
    const result = unitFormSchema.safeParse({ ...validUnit, price_cents: 0 })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('price_cents')
  })

  it('rejeita category inválida', () => {
    const result = unitFormSchema.safeParse({ ...validUnit, category: 'invalid_cat' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toContain('category')
  })

  it('rejeita bedrooms negativo', () => {
    const result = unitFormSchema.safeParse({ ...validUnit, bedrooms: -1 })
    expect(result.success).toBe(false)
  })
})
