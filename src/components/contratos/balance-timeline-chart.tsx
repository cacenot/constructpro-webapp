import type { components } from '@cacenot/construct-pro-api-client'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from 'recharts'
import { type ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { formatCurrency } from '@/lib/utils'

type BalanceTimelineEntry = components['schemas']['BalanceTimelineEntry']

interface BalanceTimelineChartProps {
  entries: BalanceTimelineEntry[]
  principalAmountCents: number
}

const chartConfig = {
  closingBalance: {
    label: 'Saldo devedor',
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
  payload?: Array<{ payload: BalanceTimelineEntry }>
}) {
  if (!active || !payload?.length) return null
  const data = payload[0]?.payload
  if (!data) return null

  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
      <p className="mb-1.5 font-medium">{formatMonth(data.month)}</p>
      <div className="grid gap-1">
        <div className="flex justify-between gap-6">
          <span className="text-muted-foreground">Abertura</span>
          <span className="tabular-nums font-medium">
            {formatCurrency(data.opening_balance_cents / 100)}
          </span>
        </div>
        {data.corrections_cents !== 0 && (
          <div className="flex justify-between gap-6">
            <span className="text-muted-foreground">Correções</span>
            <span className="tabular-nums font-medium text-amber-600 dark:text-amber-400">
              +{formatCurrency(data.corrections_cents / 100)}
            </span>
          </div>
        )}
        {data.payments_cents !== 0 && (
          <div className="flex justify-between gap-6">
            <span className="text-muted-foreground">Pagamentos</span>
            <span className="tabular-nums font-medium text-emerald-600 dark:text-emerald-400">
              -{formatCurrency(data.payments_cents / 100)}
            </span>
          </div>
        )}
        {data.adjustments_cents !== 0 && (
          <div className="flex justify-between gap-6">
            <span className="text-muted-foreground">Ajustes</span>
            <span className="tabular-nums font-medium">
              {formatCurrency(data.adjustments_cents / 100)}
            </span>
          </div>
        )}
        <div className="mt-1 flex justify-between gap-6 border-t pt-1">
          <span className="font-medium">Fechamento</span>
          <span className="tabular-nums font-semibold">
            {formatCurrency(data.closing_balance_cents / 100)}
          </span>
        </div>
      </div>
    </div>
  )
}

export function BalanceTimelineChart({ entries, principalAmountCents }: BalanceTimelineChartProps) {
  const chartData = entries.map((entry) => ({
    ...entry,
    month_label: formatMonth(entry.month),
    closing_balance: entry.closing_balance_cents / 100,
  }))

  const principalValue = principalAmountCents / 100

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-closingBalance)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--color-closingBalance)" stopOpacity={0.05} />
          </linearGradient>
        </defs>
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
        <ReferenceLine
          y={principalValue}
          stroke="var(--color-muted-foreground)"
          strokeDasharray="4 4"
          strokeOpacity={0.5}
          label={{
            value: 'Principal',
            position: 'insideTopRight',
            fill: 'var(--color-muted-foreground)',
            fontSize: 11,
          }}
        />
        <Area
          type="monotone"
          dataKey="closing_balance"
          stroke="var(--color-closingBalance)"
          fill="url(#balanceGradient)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  )
}
