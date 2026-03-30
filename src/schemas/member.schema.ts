import { validateCPF } from '@cacenot/construct-pro-api-client'
import { z } from 'zod'

export const AVAILABLE_ROLES = [
  { value: 'admin', label: 'Administrador' },
  { value: 'manager', label: 'Gerente' },
  { value: 'financial', label: 'Financeiro' },
  { value: 'viewer', label: 'Visualizador' },
] as const

export type RoleName = (typeof AVAILABLE_ROLES)[number]['value']

export function getRoleLabel(roleName: string): string {
  return AVAILABLE_ROLES.find((r) => r.value === roleName)?.label ?? roleName
}

export const createMemberSchema = z.object({
  email: z.string().email('E-mail inválido'),
  full_name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(120),
  cpf: z.string().refine(
    (val) => {
      const digits = val.replace(/\D/g, '')
      if (digits.length !== 11) return false
      return validateCPF(digits)
    },
    { message: 'CPF inválido' }
  ),
  phone_number: z.string().min(10, 'Telefone inválido').nullable().optional().or(z.literal('')),
  role_name: z.string().min(1, 'Selecione uma permissão'),
})

export type CreateMemberFormData = z.infer<typeof createMemberSchema>
