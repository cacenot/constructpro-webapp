import { type Vital, VitalsStrip, VitalsStripSkeleton } from '@/components/ui/vitals-strip'
import type { InstallmentListSummary, ProjectFinancialSummary } from '@/hooks/use-installments'
import { formatCurrency } from '@/lib/utils'

interface InstallmentsVitalsStripProps {
  summary: InstallmentListSummary | null | undefined
  financialSummary?: ProjectFinancialSummary | null | undefined
  isLoading: boolean
  withContracts?: boolean
}

/** Percentual pt-BR sem casas falsas: 62 → "62", 62.5 → "62,5". */
function pct(value: number): string {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
}

/**
 * Pulso da carteira de recebíveis — lido em segundos, persistente no topo do
 * /financeiro. Recebido (entrou), A receber (saldo), Em atraso (o gargalo, em
 * coral) e Correção acumulada (o reajuste por índice, em âmbar). Todos os números
 * refletem os filtros aplicados (agregação no servidor sobre toda a base).
 */
export function InstallmentsVitalsStrip({
  summary,
  financialSummary,
  isLoading,
  withContracts,
}: InstallmentsVitalsStripProps) {
  if (isLoading) return <VitalsStripSkeleton count={withContracts ? 5 : 4} />

  const issued = summary?.total_current_amount?.cents ?? 0
  const paid = summary?.total_paid_amount?.cents ?? 0
  const remaining = summary?.total_remaining_amount?.cents ?? Math.max(0, issued - paid)
  const overdue = summary?.total_overdue_amount?.cents ?? 0
  const correction = summary?.total_correction_amount?.cents ?? 0
  const overdueCount = summary?.overdue_count ?? 0
  const paidPct = issued > 0 ? (paid / issued) * 100 : 0

  const vitals: Vital[] = [
    {
      label: 'Recebido',
      value: formatCurrency(paid / 100),
      sub: `${pct(paidPct)}% do emitido`,
      tone: paid > 0 ? 'success' : 'default',
    },
    {
      label: 'A receber',
      value: formatCurrency(remaining / 100),
      sub: 'saldo em aberto',
    },
    {
      label: 'Em atraso',
      value: formatCurrency(overdue / 100),
      sub:
        overdueCount > 0
          ? `${overdueCount} ${overdueCount === 1 ? 'parcela vencida' : 'parcelas vencidas'}`
          : 'carteira em dia',
      tone: overdue > 0 ? 'destructive' : 'default',
    },
    {
      label: 'Correção',
      value: formatCurrency(correction / 100),
      sub: 'reajuste acumulado',
      tone: correction > 0 ? 'warning' : 'default',
    },
  ]

  // KPI de nível ledger (contratos), além das parcelas. Saúde da carteira em
  // contratos ativos, com a inadimplência contratual no detalhe.
  if (withContracts && financialSummary) {
    const active = financialSummary.active_contracts ?? 0
    const defaulting = financialSummary.overdue_contracts ?? 0
    vitals.push({
      label: 'Contratos',
      value: active.toLocaleString('pt-BR'),
      sub:
        defaulting > 0
          ? `${defaulting} ${defaulting === 1 ? 'inadimplente' : 'inadimplentes'}`
          : 'todos em dia',
      subTone: defaulting > 0 ? 'destructive' : undefined,
    })
  }

  return <VitalsStrip vitals={vitals} />
}
