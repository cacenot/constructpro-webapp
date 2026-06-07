import type { components } from '@cacenot/construct-pro-api-client'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { StatLabel } from '@/components/vendas/data-row'
import { formatMonthYear } from '@/lib/format-date'
import { formatCompactCurrency, formatCurrency } from '@/lib/utils'

type FinancialSummary = components['schemas']['ContractFinancialSummary']
type BalanceTimeline = components['schemas']['ContractBalanceTimeline']
type ContractStatus = components['schemas']['ContractStatus']

interface DealFinancialPanelProps {
  financial: FinancialSummary
  timeline?: BalanceTimeline | null
  status?: ContractStatus
}

interface Cell {
  label: string
  value: string
}

/** Mensagem do bloco do gráfico quando não há série pra plotar, ajustada ao estado do contrato. */
function emptyBalanceNote(status?: ContractStatus): string {
  switch (status) {
    case 'settled':
      return 'Quitado: saldo zerado, financiamento concluído.'
    case 'terminated':
      return 'Contrato rescindido.'
    case 'canceled':
      return 'Contrato cancelado.'
    default:
      return 'A evolução do saldo aparece aqui após a primeira correção ou pagamento.'
  }
}

const chartConfig = {
  balance: { label: 'Saldo devedor', color: 'var(--color-chart-2)' },
} satisfies ChartConfig

function BalanceTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: { monthLabel: string; balance: number } }>
}) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload
  if (!point) return null
  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-medium capitalize">{point.monthLabel}</p>
      <p className="tabular-nums">{formatCurrency(point.balance)}</p>
    </div>
  )
}

export function DealFinancialPanel({ financial, timeline, status }: DealFinancialPanelProps) {
  // Principal e pago sempre; correção/ajustes só quando há valor (sem ruído de zeros em quitados).
  const cells: Cell[] = [
    { label: 'Principal', value: formatCurrency(financial.principal_amount.cents / 100) },
    { label: 'Total pago', value: formatCurrency(financial.total_paid.cents / 100) },
  ]
  if (financial.total_correction.cents > 0) {
    cells.push({
      label: 'Correção aplicada',
      value: formatCurrency(financial.total_correction.cents / 100),
    })
  }
  if (financial.total_adjustment.cents !== 0) {
    cells.push({ label: 'Ajustes', value: formatCurrency(financial.total_adjustment.cents / 100) })
  }

  const chartData =
    timeline?.entries?.map((entry) => ({
      monthLabel: formatMonthYear(entry.month),
      balance: entry.closing_balance.cents / 100,
    })) ?? []

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Saúde financeira</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* KPIs do ledger — flex preenche a linha qualquer que seja o nº de células */}
        <div className="flex flex-wrap gap-px overflow-hidden rounded-lg border bg-border">
          {cells.map((cell) => (
            <div key={cell.label} className="min-w-[140px] flex-1 space-y-1 bg-card p-4">
              <StatLabel>{cell.label}</StatLabel>
              <p className="tabular-nums text-lg font-semibold leading-none">{cell.value}</p>
            </div>
          ))}
        </div>

        {/* Saldo devedor no tempo */}
        {chartData.length > 1 ? (
          <div className="space-y-2">
            <StatLabel>Saldo devedor no tempo</StatLabel>
            <ChartContainer config={chartConfig} className="h-56 w-full">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="dealBalanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-balance)" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="var(--color-balance)" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="monthLabel"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={24}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={60}
                  tickFormatter={(v) => formatCompactCurrency(v)}
                />
                <ChartTooltip content={<BalanceTooltip />} />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="var(--color-balance)"
                  fill="url(#dealBalanceGradient)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ChartContainer>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{emptyBalanceNote(status)}</p>
        )}
      </CardContent>
    </Card>
  )
}
