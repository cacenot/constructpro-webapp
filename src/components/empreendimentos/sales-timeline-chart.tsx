import type { components } from '@cacenot/construct-pro-api-client'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Area, Bar, CartesianGrid, ComposedChart, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { formatCurrency } from '@/lib/utils'

type ProjectSalesTimeline = components['schemas']['ProjectSalesTimeline']

interface SalesTimelineChartProps {
  data: ProjectSalesTimeline
}

const chartConfig = {
  amount: {
    label: 'Valor Total',
    color: 'var(--color-primary)',
  },
  count: {
    label: 'Vendas',
    color: 'var(--color-amber-500, #f59e0b)',
  },
} satisfies ChartConfig

function formatMonth(dateStr: string): string {
  try {
    return format(new Date(dateStr), 'MMM/yy', { locale: ptBR })
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
  payload?: Array<{ payload: { monthLabel: string; amount: number; count: number } }>
}) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  if (!entry) return null
  const data = entry.payload

  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
      <p className="mb-1.5 font-medium capitalize">{data.monthLabel}</p>
      <div className="grid gap-1">
        <div className="flex justify-between gap-6">
          <span className="text-muted-foreground">Vendas</span>
          <span className="font-medium">{data.count}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-muted-foreground">Valor</span>
          <span className="tabular-nums font-medium">{formatCurrency(data.amount)}</span>
        </div>
      </div>
    </div>
  )
}

export function SalesTimelineChart({ data }: SalesTimelineChartProps) {
  const chartData = data.entries.map(
    (entry: { month: string; total_amount_cents: number; sales_count: number }) => ({
      monthLabel: formatMonth(entry.month),
      amount: entry.total_amount_cents / 100,
      count: entry.sales_count,
    })
  )

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Evolucao de Vendas</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-75 w-full">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="salesAmountGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-amount)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-amount)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="monthLabel"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="left"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={formatCompactCurrency}
              width={70}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={40}
              allowDecimals={false}
            />
            <ChartTooltip content={<CustomTooltip />} />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="amount"
              stroke="var(--color-amount)"
              fill="url(#salesAmountGradient)"
              strokeWidth={2.5}
            />
            <Bar
              yAxisId="right"
              dataKey="count"
              fill="var(--color-count)"
              radius={[6, 6, 0, 0]}
              opacity={0.7}
              barSize={24}
            />
          </ComposedChart>
        </ChartContainer>

        <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="size-2.5 rounded-full bg-primary" />
            Valor total
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-2.5 rounded-full bg-amber-500" />
            N. de vendas
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
