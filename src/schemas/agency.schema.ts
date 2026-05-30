import { validateCNPJ } from '@cacenot/construct-pro-api-client'
import { isValidPhoneNumber } from 'react-phone-number-input'
import { z } from 'zod'

const cnpjSchema = z.string().refine(
  (val) => {
    const digits = val.replace(/\D/g, '')
    if (digits.length !== 14) return false
    return validateCNPJ(digits)
  },
  { message: 'CNPJ inválido' }
)

const phoneOptionalSchema = z
  .string()
  .optional()
  .nullable()
  .refine(
    (val) => {
      if (!val || val.trim() === '') return true
      return isValidPhoneNumber(val)
    },
    { message: 'Telefone inválido' }
  )

export const agencyCreateSchema = z.object({
  cnpj: cnpjSchema,
  legal_name: z
    .string()
    .min(3, 'Razão social deve ter no mínimo 3 caracteres')
    .max(160, 'Razão social deve ter no máximo 160 caracteres'),
  trade_name: z
    .string()
    .max(120, 'Nome fantasia deve ter no máximo 120 caracteres')
    .optional()
    .nullable()
    .or(z.literal('')),
  creci_j: z
    .string()
    .min(5, 'CRECI-J deve ter no mínimo 5 caracteres')
    .max(20, 'CRECI-J deve ter no máximo 20 caracteres'),
  email: z.string().email('E-mail inválido').optional().nullable().or(z.literal('')),
  phone: phoneOptionalSchema,
})

export const agencyUpdateSchema = agencyCreateSchema.omit({ cnpj: true }).partial()

export type AgencyCreateFormData = z.infer<typeof agencyCreateSchema>
export type AgencyUpdateFormData = z.infer<typeof agencyUpdateSchema>
