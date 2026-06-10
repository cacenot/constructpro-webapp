import { endOfMonth, format, startOfMonth, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useMemo } from 'react'
import { type Vital, VitalsStrip } from '@/components/empreendimentos/vitals-strip'
import { AnimatedNumber } from '@/components/ui/animated-number'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useInstallmentsCashflow,
  useInstallmentsFinancialSummary,
  useInstallmentsSummary,
} from '@/hooks/use-installments'
import { cashflowWindow, delinquencyRate, percentChange } from '@/lib/dashboard-metrics'
import { formatCurrency, formatPercent } from '@/lib/utils'

const fromCents = (cents: number) => formatCurrency(cents / 100)

const VITAL_LABELS = [
  'Carteira a receber',
  'Inadimplência',
  'Recebido no mês',
  'A receber no mês',
  'Contratos ativos',
]

/**
 * Hero do dashboard — os 5 vitais da carteira numa única superfície hairline.
 * Responde "como está minha carteira?" em uma olhada; o detalhe fica nas seções.
 */
export function DashboardVitals() {
  const win = useMemo(() => cashflowWindow(), [])
  const monthBounds = useMemo(() => {
    const start = startOfMonth(new Date())
    return { min: format(start, 'yyyy-MM-dd'), max: format(endOfMonth(start), 'yyyy-MM-dd') }
  }, [])

  const financial = useInstallmentsFinancialSummary({})
  const portfolio = useInstallmentsSummary({ page_size: 1 })
  const cashflow = useInstallmentsCashflow({ from: win.from, to: win.to })
  // Contagem de parcelas abertas vencendo no mês — chamada leve, só o bloco summary.
  const monthOpen = useInstallmentsSummary({
    'due_date[min]': monthBounds.min,
    'due_date[max]': monthBounds.max,
    page_size: 1,
  })

  if (financial.isLoading || portfolio.isLoading || cashflow.isLoading) {
    return (
      <VitalsStrip
        vitals={VITAL_LABELS.map((label) => ({
          label,
          value: <Skeleton className="h-7 w-24" />,
        }))}
      />
    )
  }

  const fin = financial.data ?? null
  const summary = portfolio.data?.summary ?? null
  const months = cashflow.data?.months ?? []

  const currentIdx = months.findIndex((m) => m.month.slice(0, 10) === win.currentIso)
  const received = currentIdx >= 0 ? (months[currentIdx]?.received?.cents ?? 0) : 0
  const prevReceived = currentIdx > 0 ? (months[currentIdx - 1]?.received?.cents ?? 0) : 0
  const dueProjected = currentIdx >= 0 ? (months[currentIdx]?.due_projected?.cents ?? 0) : 0
  const change = percentChange(received, prevReceived)
  const prevMonthName = format(subMonths(new Date(), 1), 'MMMM', { locale: ptBR })
  const monthName = format(new Date(), 'MMMM', { locale: ptBR })

  const overdueCents = summary?.total_overdue_amount?.cents ?? 0
  const remainingCents = summary?.total_remaining_amount?.cents ?? 0
  const rate = delinquencyRate(overdueCents, remainingCents)

  const monthSummary = monthOpen.data?.summary ?? null
  const monthOpenCount =
    (monthSummary?.scheduled_count ?? 0) +
    (monthSummary?.invoiced_count ?? 0) +
    (monthSummary?.partial_count ?? 0)

  const overdueContracts = fin?.overdue_contracts ?? 0

  const vitals: Vital[] = [
    {
      label: 'Carteira a receber',
      value: <AnimatedNumber value={fin?.total_outstanding?.cents ?? 0} format={fromCents} />,
      sub: `${fin?.active_contracts ?? 0} contratos · corrigida`,
    },
    {
      label: 'Inadimplência',
      value: rate == null ? '—' : `${formatPercent(rate)}%`,
      tone: rate != null && rate > 0 ? 'destructive' : 'default',
      sub: overdueCents > 0 ? `${fromCents(overdueCents)} vencidos` : 'Nada vencido',
    },
    {
      label: 'Recebido no mês',
      value: <AnimatedNumber value={received} format={fromCents} />,
      tone: 'success',
      sub:
        change == null ? (
          <span className="first-letter:capitalize">{monthName}</span>
        ) : (
          <span className={change >= 0 ? 'text-success' : 'text-destructive'}>
            {change >= 0 ? '▲' : '▼'} {formatPercent(Math.abs(change), 0)}% vs {prevMonthName}
          </span>
        ),
    },
    {
      label: 'A receber no mês',
      value: <AnimatedNumber value={dueProjected} format={fromCents} />,
      sub: `${monthOpenCount} ${monthOpenCount === 1 ? 'parcela vence' : 'parcelas vencem'} em ${monthName}`,
    },
    {
      label: 'Contratos ativos',
      value: <AnimatedNumber value={fin?.active_contracts ?? 0} />,
      sub:
        overdueContracts > 0 ? (
          <span className="text-destructive">
            {overdueContracts} {overdueContracts === 1 ? 'inadimplente' : 'inadimplentes'}
          </span>
        ) : (
          'Carteira em dia'
        ),
    },
  ]

  return <VitalsStrip vitals={vitals} />
}
