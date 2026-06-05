import { z } from 'zod'

/**
 * Schemas Zod da configuração do tenant, um por seção da tela de Organização.
 *
 * Cada seção é um formulário independente (salva via PATCH parcial), então a
 * validação também é por seção. Validações condicionais (campo obrigatório que
 * depende de outro) ficam em `superRefine` dentro da própria seção.
 *
 * Convenções:
 * - Percentuais em % no form (ex: 5.00); convertidos para basis points (500) ao enviar
 * - `restrict_index_types` é um toggle UI: true → available_index_types é array; false → null
 */

// --- Índices econômicos ---
export const indicesSchema = z.object({
  restrict_index_types: z.boolean(),
  available_index_types: z.array(z.string()),
})
export type IndicesFormData = z.infer<typeof indicesSchema>

// --- Emissão de boletos ---
export const boletosSchema = z
  .object({
    invoice_generation_timing: z.enum(['immediate', 'days_before_due']),
    invoice_days_before_due: z
      .number()
      .int('Deve ser um número inteiro')
      .min(1, 'Mínimo de 1 dia')
      .max(90, 'Máximo de 90 dias')
      .nullable()
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.invoice_generation_timing === 'days_before_due' &&
      (data.invoice_days_before_due === null || data.invoice_days_before_due === undefined)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['invoice_days_before_due'],
        message: 'Obrigatório quando a emissão é dias antes do vencimento',
      })
    }
  })
export type BoletosFormData = z.infer<typeof boletosSchema>

// --- Pagamentos (percentuais em %) ---
export const pagamentosSchema = z.object({
  minimum_signal_percentage: z
    .number({ error: 'Informe um percentual válido' })
    .min(0, 'Mínimo de 0%')
    .max(100, 'Máximo de 100%'),
  minimum_entry_percentage: z
    .number({ error: 'Informe um percentual válido' })
    .min(0, 'Mínimo de 0%')
    .max(100, 'Máximo de 100%'),
  allow_partial_payments: z.boolean(),
  allow_partial_payments_for_entry: z.boolean(),
  require_entry_payment_for_close: z.boolean(),
})
export type PagamentosFormData = z.infer<typeof pagamentosSchema>

// --- Parcelas por mês ---
export const parcelasSchema = z.object({
  max_installments_per_month: z
    .number()
    .int('Deve ser inteiro')
    .min(1, 'Mínimo de 1')
    .max(5, 'Máximo de 5'),
})
export type ParcelasFormData = z.infer<typeof parcelasSchema>

// --- Automação comercial ---
export const automacaoSchema = z
  .object({
    sale_lost_rule: z.enum(['disabled', 'days_in_pending_signature']),
    sale_lost_days_threshold: z
      .number()
      .int('Deve ser um número inteiro')
      .min(1, 'Mínimo de 1 dia')
      .max(365, 'Máximo de 365 dias')
      .nullable()
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.sale_lost_rule === 'days_in_pending_signature' &&
      (data.sale_lost_days_threshold === null || data.sale_lost_days_threshold === undefined)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['sale_lost_days_threshold'],
        message: 'Obrigatório quando a automação está ativada',
      })
    }
  })
export type AutomacaoFormData = z.infer<typeof automacaoSchema>

// --- Correção monetária ---
export const correcaoSchema = z.object({
  apply_index_on_overdue_installments: z.boolean(),
})
export type CorrecaoFormData = z.infer<typeof correcaoSchema>
