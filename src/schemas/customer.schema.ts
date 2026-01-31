import { validateCNPJ, validateCPF } from '@cacenot/construct-pro-api-client'
import { z } from 'zod'

/**
 * Text input max lengths
 */
export const TEXT_LIMITS = {
  FULL_NAME: 120,
  LEGAL_NAME: 150,
  EMAIL: 255,
  ADDRESS: 200,
  ADDRESS_NUMBER: 20,
  NEIGHBORHOOD: 100,
  CITY: 100,
  STATE: 50,
  POSTAL_CODE: 20,
  COMPLEMENT: 100,
  BIRTH_PLACE: 100,
  CITIZENSHIP: 100,
  RG: 30,
  RG_ISSUER: 50,
} as const

/**
 * Validates CPF document
 */
const cpfSchema = z.string().refine(
  (val) => {
    const digits = val.replace(/\D/g, '')
    if (digits.length !== 11) return false
    return validateCPF(digits)
  },
  { message: 'CPF inválido' }
)

/**
 * Validates CNPJ document
 */
const cnpjSchema = z.string().refine(
  (val) => {
    const digits = val.replace(/\D/g, '')
    if (digits.length !== 14) return false
    return validateCNPJ(digits)
  },
  { message: 'CNPJ inválido' }
)

/**
 * Birth date validation (DD/MM/YYYY format)
 */
const birthDateSchema = z
  .string()
  .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Formato inválido. Use DD/MM/AAAA')
  .refine(
    (val) => {
      const parts = val.split('/').map(Number)
      const day = parts[0]
      const month = parts[1]
      const year = parts[2]

      if (day === undefined || month === undefined || year === undefined) {
        return false
      }

      const date = new Date(year, month - 1, day)

      // Check if date is valid
      if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return false
      }

      // Check if date is in the past
      if (date >= new Date()) {
        return false
      }

      // Check if age is reasonable (0-150 years)
      const age = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
      return age >= 0 && age <= 150
    },
    { message: 'Data de nascimento inválida' }
  )

/**
 * Optional birth date schema
 */
const birthDateOptionalSchema = z
  .string()
  .optional()
  .nullable()
  .refine(
    (val) => {
      if (!val || val.trim() === '') return true
      return birthDateSchema.safeParse(val).success
    },
    { message: 'Data de nascimento inválida' }
  )

/**
 * Required phone validation (E.164 format)
 */
const phoneRequiredSchema = z.string().refine(
  (val) => {
    if (!val || val.trim() === '') return false
    return /^\+[1-9]\d{1,14}$/.test(val)
  },
  { message: 'Telefone é obrigatório' }
)

/**
 * Schema for Pessoa Física (Individual)
 */
export const customerPFCreateSchema = z.object({
  type: z.literal('individual'),
  full_name: z
    .string()
    .min(3, 'Nome completo é obrigatório')
    .max(TEXT_LIMITS.FULL_NAME, `Máximo de ${TEXT_LIMITS.FULL_NAME} caracteres`),
  cpf_cnpj: cpfSchema,
  email: z
    .string()
    .email('Email inválido')
    .max(TEXT_LIMITS.EMAIL)
    .optional()
    .nullable()
    .or(z.literal('')),
  phone: phoneRequiredSchema,
  birthday: birthDateOptionalSchema,
  gender: z.enum(['male', 'female']).optional().nullable(),
  marital_status: z
    .enum(['single', 'married', 'divorced', 'widowed', 'stable union'])
    .optional()
    .nullable(),
  rg: z.string().max(TEXT_LIMITS.RG).optional().nullable(),
  rg_issuer: z.string().max(TEXT_LIMITS.RG_ISSUER).optional().nullable(),
  rg_issue_state: z.string().optional().nullable(),
  address: z.string().max(TEXT_LIMITS.ADDRESS).optional().nullable(),
  address_number: z.string().max(TEXT_LIMITS.ADDRESS_NUMBER).optional().nullable(),
  neighborhood: z.string().max(TEXT_LIMITS.NEIGHBORHOOD).optional().nullable(),
  city: z.string().max(TEXT_LIMITS.CITY).optional().nullable(),
  state: z.string().max(TEXT_LIMITS.STATE).optional().nullable(),
  postal_code: z.string().max(TEXT_LIMITS.POSTAL_CODE).optional().nullable(),
  complement: z.string().max(TEXT_LIMITS.COMPLEMENT).optional().nullable(),
  country: z.string().min(1),
})

/**
 * Schema for Pessoa Jurídica (Company)
 */
export const customerPJCreateSchema = z.object({
  type: z.literal('company'),
  full_name: z
    .string()
    .min(3, 'Nome fantasia é obrigatório')
    .max(TEXT_LIMITS.FULL_NAME, `Máximo de ${TEXT_LIMITS.FULL_NAME} caracteres`),
  legal_name: z
    .string()
    .min(3, 'Razão social é obrigatória')
    .max(TEXT_LIMITS.LEGAL_NAME, `Máximo de ${TEXT_LIMITS.LEGAL_NAME} caracteres`),
  cpf_cnpj: cnpjSchema,
  email: z
    .string()
    .email('Email inválido')
    .max(TEXT_LIMITS.EMAIL)
    .optional()
    .nullable()
    .or(z.literal('')),
  phone: phoneRequiredSchema,
  address: z.string().max(TEXT_LIMITS.ADDRESS).optional().nullable(),
  address_number: z.string().max(TEXT_LIMITS.ADDRESS_NUMBER).optional().nullable(),
  neighborhood: z.string().max(TEXT_LIMITS.NEIGHBORHOOD).optional().nullable(),
  city: z.string().max(TEXT_LIMITS.CITY).optional().nullable(),
  state: z.string().max(TEXT_LIMITS.STATE).optional().nullable(),
  postal_code: z.string().max(TEXT_LIMITS.POSTAL_CODE).optional().nullable(),
  complement: z.string().max(TEXT_LIMITS.COMPLEMENT).optional().nullable(),
  country: z.string().min(1),
})

/**
 * Update schema for Pessoa Física (all fields optional except cpf_cnpj which can't change)
 */
export const customerPFUpdateSchema = customerPFCreateSchema
  .omit({ cpf_cnpj: true })
  .partial()
  .extend({
    type: z.literal('individual'),
  })

/**
 * Update schema for Pessoa Jurídica (all fields optional except cpf_cnpj which can't change)
 */
export const customerPJUpdateSchema = customerPJCreateSchema
  .omit({ cpf_cnpj: true })
  .partial()
  .extend({
    type: z.literal('company'),
  })

/**
 * Inferred types
 */
export type CustomerPFCreateFormData = z.infer<typeof customerPFCreateSchema>
export type CustomerPJCreateFormData = z.infer<typeof customerPJCreateSchema>
export type CustomerPFUpdateFormData = z.infer<typeof customerPFUpdateSchema>
export type CustomerPJUpdateFormData = z.infer<typeof customerPJUpdateSchema>

// Combined types for easier handling
export type CustomerCreateFormData = CustomerPFCreateFormData | CustomerPJCreateFormData
export type CustomerUpdateFormData = CustomerPFUpdateFormData | CustomerPJUpdateFormData
