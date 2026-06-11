import { endOfMonth, format, parseISO, subDays } from 'date-fns'

/** Faixas de envelhecimento da inadimplência (espelham InstallmentAging do backend). */
export type AgingBucketKey = 'not_due' | 'd1_30' | 'd31_60' | 'd61_90' | 'd90_plus'

// Parcelas com saldo em aberto (não pagas, não canceladas) — o recorte que o
// aging mede. Usado no cross-filter de uma faixa para a tabela do /financeiro.
export const OPEN_STATUSES = 'scheduled,invoiced,partial'

/** Traduz a faixa de aging em intervalo de vencimento (due_date) relativo a hoje. */
export function agingDueRange(
  bucket: AgingBucketKey,
  today = new Date()
): { min: string; max: string } {
  const fmt = (date: Date) => format(date, 'yyyy-MM-dd')
  switch (bucket) {
    case 'not_due':
      return { min: fmt(today), max: '' }
    case 'd1_30':
      return { min: fmt(subDays(today, 30)), max: fmt(subDays(today, 1)) }
    case 'd31_60':
      return { min: fmt(subDays(today, 60)), max: fmt(subDays(today, 31)) }
    case 'd61_90':
      return { min: fmt(subDays(today, 90)), max: fmt(subDays(today, 61)) }
    case 'd90_plus':
      return { min: '', max: fmt(subDays(today, 91)) }
  }
}

/**
 * Deep-link do /financeiro recortado numa faixa de aging. Os params espelham os
 * parsers nuqs de use-installments-table (status, duePreset, dueMin, dueMax).
 */
export function agingBucketHref(bucket: AgingBucketKey, today = new Date()): string {
  const { min, max } = agingDueRange(bucket, today)
  const params = new URLSearchParams({ status: OPEN_STATUSES, duePreset: 'custom' })
  if (min) params.set('dueMin', min)
  if (max) params.set('dueMax', max)
  return `/financeiro?${params.toString()}`
}

/**
 * Deep-link do /financeiro recortado nos vencimentos de um mês (recebe o ISO do
 * primeiro dia, ex. "2026-07-01" — formato dos meses do /installments/cashflow).
 * Sem recorte de status: recebidas e a receber, reconciliando com o gráfico.
 */
export function monthDueHref(monthIso: string): string {
  const start = parseISO(monthIso)
  const params = new URLSearchParams({
    duePreset: 'custom',
    dueMin: format(start, 'yyyy-MM-dd'),
    dueMax: format(endOfMonth(start), 'yyyy-MM-dd'),
  })
  return `/financeiro?${params.toString()}`
}
