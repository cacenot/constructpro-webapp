import type { components } from '@cacenot/construct-pro-api-client'
import { Cell, Label, Pie, PieChart } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/utils'

type CustomerPaymentSummary = components['schemas']['CustomerPaymentSummary']

interface CustomerPaymentMethodChartProps {
  data: CustomerPaymentSummary
}

const METHOD_CONFIG: Record<string, { label: string; color: string }> = {
  pix: { label: 'PIX', color: 'var(--color-emerald-500, #10b981)' },
  boleto: { label: 'Boleto', color: 'var(--color-blue-500, #3b82f6)' },
  transfer: { label: 'Transferência', color: 'var(--color-amber-500, #f59e0b)' },
  card: { label: 'Cartão', color: 'var(--color-purple-500, #a855f7)' },
  cash: { label: 'Dinheiro', color: 'var(--color-gray-500, #6b7280)' },
}

const chartConfig = Object.fromEntries(
  Object.entries(METHOD_CONFIG).map(([key, { label, color }]) => [key, { label, color }])
) satisfies ChartConfig

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: { name: string; value: number; total: number; amount: string } }>
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
        <span className="text-muted-foreground">Valor</span>
        <span className="font-medium">{data.amount}</span>
      </div>
      <div className="flex justify-between gap-6">
        <span className="text-muted-foreground">Percentual</span>
        <span className="font-medium">{pct}%</span>
      </div>
    </div>
  )
}

export function CustomerPaymentMethodChart({ data }: CustomerPaymentMethodChartProps) {
  const byMethod: components['schemas']['PaymentMethodBreakdown'][] = data.by_method ?? []
  const totalCount = byMethod.reduce((sum: number, m) => sum + m.count, 0)

  const pieData = byMethod
    .map((m) => ({
      name: METHOD_CONFIG[m.method]?.label ?? m.method,
      value: m.count,
      fill: METHOD_CONFIG[m.method]?.color ?? '#6b7280',
      total: totalCount,
      amount: formatCurrency(m.total_cents / 100),
    }))
    .filter((d) => d.value > 0)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Métodos de Pagamento</CardTitle>
      </CardHeader>
      <CardContent>
        {pieData.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">Nenhum pagamento registrado</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Donut Chart */}
            <div className="flex items-center justify-center">
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
                                {totalCount}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy ?? 0) + 20}
                                className="fill-muted-foreground text-xs"
                              >
                                pagamentos
                              </tspan>
                            </text>
                          )
                        }
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
            </div>

            {/* Legend */}
            <div className="space-y-3">
              <div className="space-y-2">
                {byMethod.map((m) => (
                  <div key={m.method} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: METHOD_CONFIG[m.method]?.color ?? '#6b7280' }}
                      />
                      <span className="text-sm">{METHOD_CONFIG[m.method]?.label ?? m.method}</span>
                    </div>
                    <span className="tabular-nums text-sm font-medium">{m.count}</span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-2">
                {byMethod.map((m) => (
                  <div key={m.method} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {METHOD_CONFIG[m.method]?.label ?? m.method}
                    </span>
                    <span className="tabular-nums text-sm font-medium">
                      {formatCurrency(m.total_cents / 100)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
