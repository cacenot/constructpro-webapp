import type { components } from '@cacenot/construct-pro-api-client/schema'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts'
import { type ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { formatCurrency } from '@/lib/utils'

type CorrectionMonthEntry = components['schemas']['CorrectionMonthEntry']

interface CorrectionChartProps {
  entries: CorrectionMonthEntry[]
  totalCorrectionCents: number
  principalAmountCents: number
}

const chartConfig = {
  correction: {
    label: 'Correção',
    color: 'var(--color-primary)',
  },
} satisfies ChartConfig

function formatMonth(dateStr: string): string {
  try {
    const normalized = dateStr.length === 7 ? `${dateStr}-01` : dateStr
    return format(new Date(normalized), 'MMM/yy', { locale: ptBR })
  } catch {
    return dateStr
  }
}

function formatCompactCurrency(value: number): string {
  if (value >= 1_000_000) return `R$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `R$${(value / 1_000).toFixed(0)}k`
  return `R$${value.toFixed(0)}`
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: CorrectionMonthEntry & { month_label: string; amount: number } }>
}) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload

  const variationPct = (data.variation_ppm / 10000).toFixed(2)
  const isPositive = data.variation_ppm >= 0

  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
      <p className="mb-1.5 font-medium">{data.month_label}</p>
      <div className="grid gap-1">
        <div className="flex justify-between gap-6">
          <span className="text-muted-foreground">Índice</span>
          <span className="font-mono font-medium">{data.index_type_code}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-muted-foreground">Variação</span>
          <span
            className={`tabular-nums font-medium ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
          >
            {isPositive ? '+' : ''}
            {variationPct}%
          </span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-muted-foreground">Valor</span>
          <span className="tabular-nums font-medium">
            {formatCurrency(data.amount_cents / 100)}
          </span>
        </div>
      </div>
    </div>
  )
}

export function CorrectionChart({
  entries,
  totalCorrectionCents,
  principalAmountCents,
}: CorrectionChartProps) {
  const chartData = entries.map((entry) => ({
    ...entry,
    month_label: formatMonth(entry.reference_month),
    amount: entry.amount_cents / 100,
  }))

  const impactPct =
    principalAmountCents > 0
      ? ((totalCorrectionCents / principalAmountCents) * 100).toFixed(2)
      : '0.00'

  return (
    <div className="space-y-3">
      <ChartContainer config={chartConfig} className="h-[250px] w-full">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="month_label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval="preserveStartEnd"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={formatCompactCurrency}
            width={70}
          />
          <ChartTooltip content={<CustomTooltip />} />
          <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
            {chartData.map((entry) => (
              <Cell
                key={entry.reference_month}
                fill={
                  entry.variation_ppm >= 0
                    ? 'var(--color-emerald-500, #10b981)'
                    : 'var(--color-red-500, #ef4444)'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
      <p className="text-center text-xs text-muted-foreground">
        Impacto total: {formatCurrency(totalCorrectionCents / 100)} ({impactPct}% sobre o principal)
      </p>
    </div>
  )
}
