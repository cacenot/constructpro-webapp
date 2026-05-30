import { validateCPF } from '@cacenot/construct-pro-api-client'
import { isValidPhoneNumber } from 'react-phone-number-input'
import { z } from 'zod'

const cpfSchema = z.string().refine(
  (val) => {
    const digits = val.replace(/\D/g, '')
    if (digits.length !== 11) return false
    return validateCPF(digits)
  },
  { message: 'CPF inválido' }
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

export const brokerCreateSchema = z.object({
  cpf: cpfSchema,
  full_name: z
    .string()
    .min(3, 'Nome completo deve ter no mínimo 3 caracteres')
    .max(120, 'Nome completo deve ter no máximo 120 caracteres'),
  creci: z
    .string()
    .min(5, 'CRECI deve ter no mínimo 5 caracteres')
    .max(20, 'CRECI deve ter no máximo 20 caracteres'),
  email: z.string().email('E-mail inválido').optional().nullable().or(z.literal('')),
  phone: phoneOptionalSchema,
})

export const brokerUpdateSchema = brokerCreateSchema.omit({ cpf: true }).partial()

export type BrokerCreateFormData = z.infer<typeof brokerCreateSchema>
export type BrokerUpdateFormData = z.infer<typeof brokerUpdateSchema>
