import { differenceInCalendarDays, parseISO } from 'date-fns'

/**
 * Inadimplência de parcela como condição derivada — fonte única para badge, realce
 * de linha, filtro e painel. "Em atraso" não é um status; é um sinal que o backend
 * calcula por parcela (`is_overdue`/`days_overdue`).
 *
 * O backend é a fonte de verdade (construct-pro-api #145, client ≥ 1.5.0): regra
 * `due_date < hoje ∧ não-cancelada ∧ restante > 0`, reconciliando com `overdue_count`
 * de /installments/summary. O fallback derivado abaixo é defensivo — só roda para uma
 * resposta de parcela que ainda não traga os campos (aproxima com status em aberto).
 */

const OPEN_STATUSES = new Set(['scheduled', 'invoiced', 'partial'])

/** Forma mínima aceita — qualquer resposta de parcela (summary, item, detalhe). */
export interface OverdueLike {
  due_date: string
  status?: string | null
  remaining_amount?: { cents: number } | null
  /** Fonte de verdade do backend (#145, client ≥ 1.5.0). Ausente → fallback derivado. */
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
