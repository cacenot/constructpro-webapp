import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'
import { navigate } from 'vike/client/router'
import { Card } from '@/components/ui/card'
import { type ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { LegendDot } from '@/components/ui/legend-dot'
import { Skeleton } from '@/components/ui/skeleton'
import { useInstallmentsCashflow } from '@/hooks/use-installments'
import { cashflowWindow } from '@/lib/dashboard-metrics'
import { monthDueHref } from '@/lib/installment-aging'
import { cn, formatCurrency } from '@/lib/utils'

const chartConfig = {
  received: { label: 'Recebido', color: 'var(--color-success)' },
  due: { label: 'A receber', color: 'var(--color-info)' },
} satisfies ChartConfig

interface CashflowDatum {
  monthIso: string
  label: string
  received: number
  due: number
}

function monthAbbrev(iso: string): string {
  return format(parseISO(iso), 'MMM', { locale: ptBR }).replace('.', '')
}

/**
 * Recebimento 6m — realizado (esmeralda) vs a receber por vencimento (azul),
 * versão compacta do dashboard. Clicar num mês recorta o /financeiro nos
 * vencimentos daquele mês. Mesma linguagem de cores do app inteiro.
 */
export function CashflowCard() {
  const win = useMemo(() => cashflowWindow(), [])
  const { data, isLoading, isError } = useInstallmentsCashflow({ from: win.from, to: win.to })

  const chartData: CashflowDatum[] = useMemo(
    () =>
      (data?.months ?? []).map((month) => ({
        monthIso: month.month,
        label: monthAbbrev(month.month),
        received: (month.received?.cents ?? 0) / 100,
        due: (month.due_projected?.cents ?? 0) / 100,
      })),
    [data]
  )

  const hasMovement = chartData.some((d) => d.received > 0 || d.due > 0)

  if (isLoading) return <CashflowCardSkeleton />

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 p-5 pb-2">
        <div>
          <h3 className="text-sm font-semibold">Recebimento</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Realizado vs a receber · 6 meses</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <LegendDot className="bg-success" label="Recebido" />
          <LegendDot className="bg-info" label="A receber" />
        </div>
      </header>

      {isError ? (
        <CashflowNote>Não foi possível carregar o recebimento.</CashflowNote>
      ) : !hasMovement ? (
        <CashflowNote>Sem movimentação no período.</CashflowNote>
      ) : (
        <div className="px-2 pb-3 pt-1">
          <ChartContainer
            config={chartConfig}
            className="h-44 w-full [&_.recharts-bar_path]:cursor-pointer"
          >
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
              onClick={(state) => {
                const datum = state?.activePayload?.[0]?.payload as CashflowDatum | undefined
                if (datum) navigate(monthDueHref(datum.monthIso))
              }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval={0}
              />
              <ChartTooltip content={<CashflowTooltip />} />
              <Bar dataKey="received" fill="var(--color-received)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="due" fill="var(--color-due)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>
      )}
    </Card>
  )
}

function CashflowNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-5 pb-5">
      <div className="flex h-36 items-center justify-center rounded-lg border border-dashed">
        <p className="text-sm text-muted-foreground">{children}</p>
      </div>
    </div>
  )
}

function CashflowTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: CashflowDatum }>
}) {
  if (!active || !payload?.length) return null
  const datum = payload[0]?.payload
  if (!datum) return null
  const fullMonth = format(parseISO(datum.monthIso), "MMMM 'de' yyyy", { locale: ptBR })

  return (
    <div className="min-w-44 rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="mb-1.5 font-medium capitalize">{fullMonth}</p>
      <div className="flex flex-col gap-1">
        <TooltipRow dotClass="bg-success" label="Recebido" value={datum.received} />
        <TooltipRow dotClass="bg-info" label="A receber" value={datum.due} />
      </div>
    </div>
  )
}

function TooltipRow({
  dotClass,
  label,
  value,
}: {
  dotClass: string
  label: string
  value: number
}) {
  return (
    <div className="flex items-center justify-between gap-6">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <span className={cn('size-2 rounded-full', dotClass)} />
        {label}
      </span>
      <span className="font-medium tabular-nums text-foreground">{formatCurrency(value)}</span>
    </div>
  )
}

function CashflowCardSkeleton() {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <header className="flex items-start justify-between gap-4 p-5 pb-2">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-44" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
        </div>
      </header>
      <div className="px-5 pb-5 pt-2">
        <div className="flex h-36 items-end gap-3">
          {[55, 70, 45, 85, 60, 75].map((h, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton bars
            <Skeleton key={i} className="flex-1 rounded-t" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    </Card>
  )
}
