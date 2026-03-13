import { z } from 'zod'

export const installmentKindValues = ['entry', 'monthly', 'yearly', 'extra'] as const
export const paymentMethodValues = ['boleto', 'pix', 'cash', 'transfer', 'card'] as const
export const recurrenceTypeValues = ['monthly', 'yearly'] as const

export const INSTALLMENT_KIND_LABELS: Record<string, string> = {
  entry: 'Entrada',
  monthly: 'Mensal',
  yearly: 'Anual',
  extra: 'Extra',
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  boleto: 'Boleto',
  pix: 'Pix',
  cash: 'Dinheiro',
  transfer: 'Transferência',
  card: 'Cartão',
}

const installmentScheduleSchema = z
  .object({
    kind: z.enum(installmentKindValues, {
      message: 'Tipo é obrigatório',
    }),
    payment_method: z.enum(paymentMethodValues, {
      message: 'Forma de pagamento é obrigatória',
    }),
    quantity: z.number().min(1, 'Quantidade deve ser pelo menos 1'),
    amount_cents: z.number().min(1, 'Valor deve ser maior que zero'),
    specific_date: z.string().nullable().optional(),
    recurrence_type: z.enum(recurrenceTypeValues).nullable().optional(),
    recurrence_day: z.number().min(1).max(31).nullable().optional(),
    recurrence_month: z.number().min(1).max(12).nullable().optional(),
    start_date: z.string().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.kind === 'entry') {
      if (!data.specific_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Data de pagamento é obrigatória para entrada',
          path: ['specific_date'],
        })
      }
    }

    if (data.kind === 'monthly' || data.kind === 'yearly') {
      if (!data.recurrence_day) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Dia de vencimento é obrigatório',
          path: ['recurrence_day'],
        })
      }
      if (!data.start_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Data de início é obrigatória',
          path: ['start_date'],
        })
      }
    }

    if (data.kind === 'yearly' && !data.recurrence_month) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Mês de vencimento é obrigatório para parcelas anuais',
        path: ['recurrence_month'],
      })
    }
  })

export const saleFormSchema = z.object({
  unit_id: z.number({ error: 'Unidade é obrigatória' }).min(1, 'Unidade é obrigatória'),
  customer_id: z.number({ error: 'Cliente é obrigatório' }).min(1, 'Cliente é obrigatório'),
  index_type_code: z.string().min(1, 'Índice de correção é obrigatório'),
  installment_schedules: z
    .array(installmentScheduleSchema)
    .min(1, 'Pelo menos uma parcela é obrigatória'),
})

export type SaleFormData = z.infer<typeof saleFormSchema>
export type InstallmentScheduleFormData = z.infer<typeof installmentScheduleSchema>

export const saleEditFormSchema = z.object({
  amount_cents: z.number().min(1, 'O valor negociado deve ser maior que zero'),
})

export type SaleEditFormData = z.infer<typeof saleEditFormSchema>
