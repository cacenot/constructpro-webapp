import type { components } from '@cacenot/construct-pro-api-client/schema'
import { Cell, Label, Pie, PieChart } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/utils'

type ProjectSalesSummary = components['schemas']['ProjectSalesSummary']

interface SalesPipelineSectionProps {
  data: ProjectSalesSummary
}

const COLORS = {
  closed: 'var(--color-emerald-500, #10b981)',
  pending_signature: 'var(--color-amber-500, #f59e0b)',
  pending_payment: 'var(--color-blue-500, #3b82f6)',
  lost: 'var(--color-red-500, #ef4444)',
}

const chartConfig = {
  closed: { label: 'Fechadas', color: COLORS.closed },
  pending_signature: { label: 'Aguard. Assinatura', color: COLORS.pending_signature },
  pending_payment: { label: 'Aguard. Pagamento', color: COLORS.pending_payment },
  lost: { label: 'Perdidas', color: COLORS.lost },
} satisfies ChartConfig

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: { name: string; value: number; total: number } }>
}) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  if (!entry) return null
  const data = entry.payload
  const pct = data.total > 0 ? ((data.value / data.total) * 100).toFixed(1) : '0'

  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-medium">{data.name}</p>
      <div className="flex justify-between gap-6">
        <span className="text-muted-foreground">Quantidade</span>
        <span className="font-medium">{data.value}</span>
      </div>
      <div className="flex justify-between gap-6">
        <span className="text-muted-foreground">Percentual</span>
        <span className="font-medium">{pct}%</span>
      </div>
    </div>
  )
}

export function SalesPipelineSection({ data }: SalesPipelineSectionProps) {
  const pieData = [
    { name: 'Fechadas', value: data.closed_count, fill: COLORS.closed, total: data.total_sales },
    {
      name: 'Aguard. Assinatura',
      value: data.pending_signature_count,
      fill: COLORS.pending_signature,
      total: data.total_sales,
    },
    {
      name: 'Aguard. Pagamento',
      value: data.pending_payment_count,
      fill: COLORS.pending_payment,
      total: data.total_sales,
    },
    { name: 'Perdidas', value: data.lost_count, fill: COLORS.lost, total: data.total_sales },
  ].filter((d) => d.value > 0)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Pipeline de Vendas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Donut Chart */}
          <div className="flex items-center justify-center">
            {pieData.length === 0 ? (
              <div className="flex h-55 flex-col items-center justify-center gap-2 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">Nenhuma venda registrada</p>
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="mx-auto aspect-square h-55">
                <PieChart>
                  <ChartTooltip content={<CustomTooltip />} />
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={90}
                    strokeWidth={2}
                    stroke="var(--color-background)"
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="fill-foreground text-3xl font-bold"
                              >
                                {data.total_sales}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy ?? 0) + 20}
                                className="fill-muted-foreground text-xs"
                              >
                                vendas
                              </tspan>
                            </text>
                          )
                        }
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
          </div>

          {/* KPI list */}
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-full bg-emerald-500" />
                  <span className="text-sm">Fechadas</span>
                </div>
                <span className="tabular-nums text-sm font-medium">{data.closed_count}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-full bg-amber-500" />
                  <span className="text-sm">Aguard. Assinatura</span>
                </div>
                <span className="tabular-nums text-sm font-medium">
                  {data.pending_signature_count}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-full bg-blue-500" />
                  <span className="text-sm">Aguard. Pagamento</span>
                </div>
                <span className="tabular-nums text-sm font-medium">
                  {data.pending_payment_count}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-full bg-red-500" />
                  <span className="text-sm">Perdidas</span>
                </div>
                <span className="tabular-nums text-sm font-medium">{data.lost_count}</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Vendido</span>
                <span className="tabular-nums text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(data.total_sold_cents / 100)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Em Propostas</span>
                <span className="tabular-nums text-sm font-medium">
                  {formatCurrency(data.total_proposal_cents / 100)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Preço Médio</span>
                <span className="tabular-nums text-sm font-medium">
                  {formatCurrency(data.avg_sale_price_cents / 100)}
                </span>
              </div>
              {data.avg_discount_percentage != null && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Desconto Médio</span>
                  <span className="tabular-nums text-sm font-medium">
                    {Number(data.avg_discount_percentage).toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
