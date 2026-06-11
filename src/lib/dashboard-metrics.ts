import { addMonths, format, startOfMonth, subMonths } from 'date-fns'

/**
 * Inadimplência da carteira em % (fórmula Sienge): vencido / (vencido + a vencer).
 * O denominador é o saldo remanescente total (`total_remaining_amount`), que já
 * é vencido + a vencer. Null quando não há carteira (evita 0/0).
 */
export function delinquencyRate(overdueCents: number, remainingCents: number): number | null {
  if (remainingCents <= 0) return null
  return (overdueCents / remainingCents) * 100
}

/** Variação % vs valor anterior (ex.: recebido no mês vs mês passado). Null sem base. */
export function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null
  return ((current - previous) / previous) * 100
}

/**
 * Janela do gráfico de recebimento do dashboard: 3 meses de realizado + mês
 * corrente + 2 de projeção. `from`/`to` no formato YYYY-MM do /installments/cashflow;
 * `currentIso` no formato dos itens (`months[].month` = primeiro dia do mês).
 */
export function cashflowWindow(today = new Date()): {
  from: string
  to: string
  currentIso: string
} {
  const base = startOfMonth(today)
  return {
    from: format(subMonths(base, 3), 'yyyy-MM'),
    to: format(addMonths(base, 2), 'yyyy-MM'),
    currentIso: format(base, 'yyyy-MM-dd'),
  }
}
