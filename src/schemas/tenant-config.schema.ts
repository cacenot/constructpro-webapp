import { z } from 'zod'

/**
 * Schema Zod para o formulário de configuração do tenant.
 *
 * Convenções:
 * - Percentuais em % no form (ex: 5.00), convertidos para basis points (500) ao enviar
 * - `restrict_index_types` é um toggle UI: true → available_index_types é array; false → null
 * - Campos condicionais validados via superRefine
 */
export const tenantConfigSchema = z
  .object({
    // --- Índices econômicos ---
    restrict_index_types: z.boolean(),
    available_index_types: z.array(z.string()),

    // --- Emissão de boletos ---
    invoice_generation_timing: z.enum(['immediate', 'days_before_due']),
    invoice_days_before_due: z
      .number()
      .int('Deve ser um número inteiro')
      .min(1, 'Mínimo de 1 dia')
      .max(90, 'Máximo de 90 dias')
      .nullable()
      .optional(),

    // --- Pagamentos (percentuais em %) ---
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

    // --- Automação comercial ---
    sale_lost_rule: z.enum(['disabled', 'days_in_pending_signature']),
    sale_lost_days_threshold: z
      .number()
      .int('Deve ser um número inteiro')
      .min(1, 'Mínimo de 1 dia')
      .max(365, 'Máximo de 365 dias')
      .nullable()
      .optional(),

    // --- Correção monetária ---
    correction_basis: z.enum(['outstanding_balance', 'total_contract_value']),
    apply_index_on_overdue_installments: z.boolean(),
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

export type TenantConfigFormData = z.infer<typeof tenantConfigSchema>
