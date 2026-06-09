import type { components } from '@cacenot/construct-pro-api-client'
import { type Vital, VitalsStrip } from '@/components/empreendimentos/vitals-strip'
import { formatCurrency, formatPercent } from '@/lib/utils'

type ProjectUnitSummary = components['schemas']['ProjectUnitSummary']
type ProjectFinancialSummary = components['schemas']['ProjectFinancialSummary']

interface ProjectVitalsStripProps {
  unitSummary?: ProjectUnitSummary | null
  financialSummary?: ProjectFinancialSummary | null
}

/**
 * Painel de instrumentos do empreendimento: saúde lida em segundos, persistente
 * acima das abas. Inadimplência salta em coral — é o gargalo que o diretor não
 * pode perder. Adapta-se aos summaries disponíveis.
 */
export function ProjectVitalsStrip({ unitSummary, financialSummary }: ProjectVitalsStripProps) {
  const vitals: Vital[] = []

  if (unitSummary) {
    const soldPct =
      unitSummary.total_units > 0 ? (unitSummary.sold_count / unitSummary.total_units) * 100 : 0

    vitals.push({
      label: 'Unidades',
      value: unitSummary.total_units,
      sub: `${unitSummary.sold_count} vendidas · ${unitSummary.available_count} disponíveis`,
    })
    vitals.push({
      label: 'Vendido',
      value: `${formatPercent(soldPct)}%`,
      sub: `${unitSummary.sold_count} de ${unitSummary.total_units} unidades`,
    })
    vitals.push({
      label: 'VGV',
      value: formatCurrency(unitSummary.total_vgv.cents / 100),
      sub: `vendido ${formatCurrency(unitSummary.sold_vgv.cents / 100)}`,
    })
  }

  if (financialSummary) {
    const paid = financialSummary.total_paid.cents > 0
    vitals.push({
      label: 'Recebido',
      value: formatCurrency(financialSummary.total_paid.cents / 100),
      sub: `${formatPercent(Number(financialSummary.payment_progress_percentage))}% do principal`,
      tone: paid ? 'success' : 'default',
    })

    const defaulting = financialSummary.overdue_contracts
    vitals.push({
      label: 'Inadimplência',
      value: defaulting,
      sub: defaulting > 0 ? `de ${financialSummary.total_contracts} contratos` : 'carteira em dia',
      tone: defaulting > 0 ? 'destructive' : 'default',
    })
  }

  if (vitals.length === 0) return null

  return <VitalsStrip vitals={vitals} />
}
