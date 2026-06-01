import { validateCNPJ } from '@cacenot/construct-pro-api-client'
import { z } from 'zod'

export const PROJECT_TEXT_LIMITS = {
  NAME: 200,
  DESCRIPTION: 2000,
  ADDRESS: 200,
  NUMBER: 20,
  DISTRICT: 100,
  CITY: 100,
  STATE: 50,
  POSTAL_CODE: 20,
  FLOORS: 10,
  FEATURE: 100,
  TOTAL_AREA: 100,
  LEGAL_NAME: 200,
  TRADE_NAME: 200,
  STATE_REGISTRATION: 50,
  MUNICIPAL_REGISTRATION: 50,
  INCORPORATION_REGISTRY_NUMBER: 100,
  MOTHER_PROPERTY_REGISTRATION: 100,
  CONSTRUCTION_PERMIT_NUMBER: 100,
  OCCUPANCY_PERMIT_NUMBER: 100,
} as const

/**
 * Project status enum matching API
 */
export const projectStatusValues = ['construction', 'finished'] as const
export type ProjectStatusType = (typeof projectStatusValues)[number]

/**
 * Schema for project creation form
 */
export const projectCreateSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(PROJECT_TEXT_LIMITS.NAME, `Máximo ${PROJECT_TEXT_LIMITS.NAME} caracteres`),

  status: z.enum(projectStatusValues),

  description: z
    .string()
    .max(PROJECT_TEXT_LIMITS.DESCRIPTION, `Máximo ${PROJECT_TEXT_LIMITS.DESCRIPTION} caracteres`)
    .optional()
    .nullable(),

  address: z
    .string()
    .min(1, 'Endereço é obrigatório')
    .max(PROJECT_TEXT_LIMITS.ADDRESS, `Máximo ${PROJECT_TEXT_LIMITS.ADDRESS} caracteres`),

  number: z
    .string()
    .min(1, 'Número é obrigatório')
    .max(PROJECT_TEXT_LIMITS.NUMBER, `Máximo ${PROJECT_TEXT_LIMITS.NUMBER} caracteres`),

  district: z
    .string()
    .min(1, 'Bairro é obrigatório')
    .max(PROJECT_TEXT_LIMITS.DISTRICT, `Máximo ${PROJECT_TEXT_LIMITS.DISTRICT} caracteres`),

  city: z
    .string()
    .min(1, 'Cidade é obrigatória')
    .max(PROJECT_TEXT_LIMITS.CITY, `Máximo ${PROJECT_TEXT_LIMITS.CITY} caracteres`),

  state: z
    .string()
    .min(1, 'Estado é obrigatório')
    .max(PROJECT_TEXT_LIMITS.STATE, `Máximo ${PROJECT_TEXT_LIMITS.STATE} caracteres`),

  postal_code: z
    .string()
    .min(1, 'CEP é obrigatório')
    .max(PROJECT_TEXT_LIMITS.POSTAL_CODE, `Máximo ${PROJECT_TEXT_LIMITS.POSTAL_CODE} caracteres`),

  floors: z
    .string()
    .max(PROJECT_TEXT_LIMITS.FLOORS, `Máximo ${PROJECT_TEXT_LIMITS.FLOORS} caracteres`)
    .optional()
    .nullable(),

  delivery_date: z.string().optional().nullable(),

  features: z.array(z.string().max(PROJECT_TEXT_LIMITS.FEATURE)).optional(),

  total_area: z
    .string()
    .max(PROJECT_TEXT_LIMITS.TOTAL_AREA, `Máximo ${PROJECT_TEXT_LIMITS.TOTAL_AREA} caracteres`)
    .optional()
    .nullable(),

  cnpj: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val) return true
        const digits = val.replace(/\D/g, '')
        if (digits.length !== 14) return false
        return validateCNPJ(digits)
      },
      { message: 'CNPJ inválido' }
    ),

  legal_name: z
    .string()
    .max(PROJECT_TEXT_LIMITS.LEGAL_NAME, `Máximo ${PROJECT_TEXT_LIMITS.LEGAL_NAME} caracteres`)
    .optional()
    .nullable(),

  trade_name: z
    .string()
    .max(PROJECT_TEXT_LIMITS.TRADE_NAME, `Máximo ${PROJECT_TEXT_LIMITS.TRADE_NAME} caracteres`)
    .optional()
    .nullable(),

  state_registration: z
    .string()
    .max(
      PROJECT_TEXT_LIMITS.STATE_REGISTRATION,
      `Máximo ${PROJECT_TEXT_LIMITS.STATE_REGISTRATION} caracteres`
    )
    .optional()
    .nullable(),

  municipal_registration: z
    .string()
    .max(
      PROJECT_TEXT_LIMITS.MUNICIPAL_REGISTRATION,
      `Máximo ${PROJECT_TEXT_LIMITS.MUNICIPAL_REGISTRATION} caracteres`
    )
    .optional()
    .nullable(),

  incorporation_registry_number: z
    .string()
    .max(
      PROJECT_TEXT_LIMITS.INCORPORATION_REGISTRY_NUMBER,
      `Máximo ${PROJECT_TEXT_LIMITS.INCORPORATION_REGISTRY_NUMBER} caracteres`
    )
    .optional()
    .nullable(),

  mother_property_registration: z
    .string()
    .max(
      PROJECT_TEXT_LIMITS.MOTHER_PROPERTY_REGISTRATION,
      `Máximo ${PROJECT_TEXT_LIMITS.MOTHER_PROPERTY_REGISTRATION} caracteres`
    )
    .optional()
    .nullable(),

  cno: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || val.replace(/\D/g, '').length === 12, {
      message: 'CNO deve ter exatamente 12 dígitos',
    }),

  construction_permit_number: z
    .string()
    .max(
      PROJECT_TEXT_LIMITS.CONSTRUCTION_PERMIT_NUMBER,
      `Máximo ${PROJECT_TEXT_LIMITS.CONSTRUCTION_PERMIT_NUMBER} caracteres`
    )
    .optional()
    .nullable(),

  occupancy_permit_number: z
    .string()
    .max(
      PROJECT_TEXT_LIMITS.OCCUPANCY_PERMIT_NUMBER,
      `Máximo ${PROJECT_TEXT_LIMITS.OCCUPANCY_PERMIT_NUMBER} caracteres`
    )
    .optional()
    .nullable(),
})

/**
 * Schema for project update form (all fields optional except status)
 */
export const projectUpdateSchema = projectCreateSchema.partial()

/**
 * Type for project creation form data
 */
export type ProjectCreateFormData = z.infer<typeof projectCreateSchema>

/**
 * Type for project update form data
 */
export type ProjectUpdateFormData = z.infer<typeof projectUpdateSchema>
