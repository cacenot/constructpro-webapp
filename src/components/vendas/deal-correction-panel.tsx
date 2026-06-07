import type { components } from '@cacenot/construct-pro-api-client'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { formatMonthYear } from '@/lib/format-date'
import { formatCompactCurrency, formatCurrency } from '@/lib/utils'

type CorrectionSummary = components['schemas']['ContractCorrectionSummary']

interface DealCorrectionPanelProps {
  correction: CorrectionSummary
}

const chartConfig = {
  amount: { label: 'Correção', color: 'var(--color-chart-3)' },
} satisfies ChartConfig

function CorrectionTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: { monthLabel: string; index: string; pct: string; amount: number } }>
}) {
  if (!active || !payload?.length) return null
  const p = payload[0]?.payload
  if (!p) return null
  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-medium capitalize">{p.monthLabel}</p>
      <p className="text-muted-foreground">
        {p.index} · {p.pct}
      </p>
      <p className="tabular-nums">{formatCurrency(p.amount)}</p>
    </div>
  )
}

export function DealCorrectionPanel({ correction }: DealCorrectionPanelProps) {
  const data =
    correction.entries?.map((entry) => ({
      monthLabel: formatMonthYear(entry.reference_month),
      index: entry.index_type_code,
      pct: entry.variation.formatted,
      amount: entry.amount.cents / 100,
    })) ?? []

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Correção monetária</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-sm text-muted-foreground">Total aplicado</span>
          <span className="tabular-nums text-lg font-semibold">
            {formatCurrency(correction.total_correction.cents / 100)}
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
              em {correction.correction_count} {correction.correction_count === 1 ? 'mês' : 'meses'}
            </span>
          </span>
        </div>

        {data.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-44 w-full">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="monthLabel"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={20}
                interval="preserveStartEnd"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={52}
                tickFormatter={(v) => formatCompactCurrency(v, 1)}
              />
              <ChartTooltip content={<CorrectionTooltip />} />
              <Bar dataKey="amount" fill="var(--color-amount)" radius={[4, 4, 0, 0]} barSize={22} />
            </BarChart>
          </ChartContainer>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhuma correção aplicada ainda. Ela aparece mês a mês conforme o índice publica.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
