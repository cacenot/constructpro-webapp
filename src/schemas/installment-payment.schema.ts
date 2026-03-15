import { z } from 'zod'

export const installmentPaymentSchema = z.object({
  amount_cents: z.number().int().positive('Valor deve ser maior que zero'),
  payment_method: z.enum(['pix', 'cash', 'transfer', 'card'], {
    message: 'Selecione a forma de pagamento',
  }),
  paid_at: z.string().optional(),
  note: z.string().optional(),
})

export type InstallmentPaymentFormData = z.infer<typeof installmentPaymentSchema>
