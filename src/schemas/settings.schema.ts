import { validateCPF } from '@cacenot/construct-pro-api-client'
import { z } from 'zod'
import { TEXT_LIMITS } from './customer.schema'

/**
 * Settings-specific text limits
 */
export const SETTINGS_LIMITS = {
  DISPLAY_NAME: 50,
  PHOTO_URL: 500,
} as const

/**
 * Schema para atualização de perfil do usuário
 */
export const profileUpdateSchema = z.object({
  full_name: z
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(TEXT_LIMITS.FULL_NAME, `Nome deve ter no máximo ${TEXT_LIMITS.FULL_NAME} caracteres`),
  display_name: z
    .string()
    .min(2, 'Nome de exibição deve ter no mínimo 2 caracteres')
    .max(
      SETTINGS_LIMITS.DISPLAY_NAME,
      `Nome de exibição deve ter no máximo ${SETTINGS_LIMITS.DISPLAY_NAME} caracteres`
    )
    .nullable()
    .optional(),
  cpf: z.string().refine(
    (val) => {
      const digits = val.replace(/\D/g, '')
      if (digits.length !== 11) return false
      return validateCPF(digits)
    },
    { message: 'CPF inválido' }
  ),
  phone_number: z.string().min(10, 'Telefone inválido').nullable().optional().or(z.literal('')),
  photo_url: z
    .string()
    .url('URL inválida')
    .max(
      SETTINGS_LIMITS.PHOTO_URL,
      `URL deve ter no máximo ${SETTINGS_LIMITS.PHOTO_URL} caracteres`
    )
    .nullable()
    .optional()
    .or(z.literal('')),
})

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>

/**
 * Schema para troca de senha
 * Mesmos requisitos do registerSchema
 */
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Senha atual obrigatória'),
    newPassword: z
      .string()
      .min(6, 'Senha deve ter no mínimo 6 caracteres')
      .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
      .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
    confirmPassword: z.string().min(1, 'Confirmação obrigatória'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>
