import { z } from 'zod'

export const installmentPaymentSchema = z.object({
  amount: z
    .string()
    .min(1, 'Informe o valor do pagamento')
    .refine((val) => Number(val.replace(/\D/g, '')) > 0, 'Valor deve ser maior que zero'),
  payment_method: z.enum(['pix', 'cash', 'transfer', 'card'], {
    message: 'Selecione a forma de pagamento',
  }),
  paid_at: z.string().optional(),
  note: z.string().optional(),
})

export type InstallmentPaymentFormData = z.infer<typeof installmentPaymentSchema>
