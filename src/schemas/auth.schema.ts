import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

export type LoginFormData = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    email: z.string().trim().email('E-mail inválido'),
    password: z
      .string()
      .min(6, 'Senha deve ter no mínimo 6 caracteres')
      .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
      .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
    confirmPassword: z.string().min(6, 'Confirmação de senha obrigatória'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

export type RegisterFormData = z.infer<typeof registerSchema>

export const resetPasswordSchema = z.object({
  email: z.string().trim().email('E-mail inválido'),
})

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

// Definição de nova senha a partir do link enviado por e-mail (oobCode).
// Mesmas regras de força do cadastro: mín. 6, 1 maiúscula, 1 número.
export const newPasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, 'Use no mínimo 6 caracteres')
      .regex(/[A-Z]/, 'Inclua ao menos uma letra maiúscula')
      .regex(/[0-9]/, 'Inclua ao menos um número'),
    confirmPassword: z.string().min(1, 'Confirme a nova senha'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

export type NewPasswordFormData = z.infer<typeof newPasswordSchema>
