import { differenceInCalendarDays, parseISO } from 'date-fns'

/**
 * Inadimplência de parcela como condição derivada — fonte única para badge, realce
 * de linha, filtro e painel. "Em atraso" não é um status do backend; é calculado.
 *
 * Regra canônica (espelha `overdue_count`/`aging` de /installments/summary):
 *   is_overdue := due_date < hoje ∧ status ∈ {scheduled,invoiced,partial} ∧ restante > 0
 *
 * Quando o backend passar a expor `is_overdue`/`days_overdue` no item (construct-pro-api
 * #145), eles são usados como verdade; até lá, derivamos no front com a mesma regra.
 */

const OPEN_STATUSES = new Set(['scheduled', 'invoiced', 'partial'])

/** Forma mínima aceita — qualquer resposta de parcela (summary, item, detalhe). */
export interface OverdueLike {
  due_date: string
  status?: string | null
  remaining_amount?: { cents: number } | null
  /** Fonte de verdade do backend (#145). Ausente hoje → cai no fallback derivado. */
  is_overdue?: boolean
  days_overdue?: number
}

function matchesOverdueRule(installment: OverdueLike): boolean {
  const status = installment.status ?? ''
  const remaining = installment.remaining_amount?.cents ?? 0
  if (!OPEN_STATUSES.has(status) || remaining <= 0) return false
  return differenceInCalendarDays(new Date(), parseISO(installment.due_date)) > 0
}

/** `true` se a parcela está vencida e ainda em aberto — o gargalo da carteira. */
export function isInstallmentOverdue(installment: OverdueLike): boolean {
  if (typeof installment.is_overdue === 'boolean') return installment.is_overdue
  return matchesOverdueRule(installment)
}

/** Dias corridos desde o vencimento quando em atraso; `0` caso contrário. */
export function installmentDaysOverdue(installment: OverdueLike): number {
  if (typeof installment.days_overdue === 'number') return Math.max(0, installment.days_overdue)
  if (!matchesOverdueRule(installment)) return 0
  return Math.max(0, differenceInCalendarDays(new Date(), parseISO(installment.due_date)))
}
