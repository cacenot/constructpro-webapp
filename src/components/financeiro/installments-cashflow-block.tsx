import { addMonths, format, parseISO, startOfMonth, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Label, ReferenceLine, XAxis, YAxis } from 'recharts'
import { Card } from '@/components/ui/card'
import { type ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { useInstallmentsCashflow } from '@/hooks/use-installments'
import { cn, formatCurrency } from '@/lib/utils'

interface InstallmentsCashflowBlockProps {
  projectId: number | null
  customerId: number | null
  onSelectMonth: (monthIso: string) => void
}

const chartConfig = {
  received: { label: 'Recebido', color: 'var(--color-success)' },
  due: { label: 'A receber', color: 'var(--color-info)' },
} satisfies ChartConfig

interface CashflowDatum {
  monthIso: string
  label: string
  received: number
  due: number
  correction: number
  refunded: number
}

/** Eixo Y em escala compacta (R$ 50k, R$ 1,2M) — milhões dançam menos que dígitos cheios. */
function compactBRL(value: number): string {
  if (value >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}M`
  }
  if (value >= 1_000) return `R$ ${Math.round(value / 1_000)}k`
  return `R$ ${value}`
}

function monthAbbrev(iso: string): string {
  return format(parseISO(iso), 'MMM', { locale: ptBR }).replace('.', '')
}

/**
 * Fluxo de caixa da carteira — a linha do tempo do caixa: o que entrou (Recebido,
 * esmeralda) contra o que se espera receber por vencimento (A receber, azul), mês a
 * mês. Uma régua "hoje" separa o realizado do projetado. Clicar num mês recorta a
 * aba Parcelas para os vencimentos daquele mês. Espelha GET /installments/cashflow.
 */
export function InstallmentsCashflowBlock({
  projectId,
  customerId,
  onSelectMonth,
}: InstallmentsCashflowBlockProps) {
  // Janela de 12 meses centrada à frente (3 atrás + atual + 8 à frente): contexto
  // recente do realizado e o horizonte de planejamento do caixa. Estável no mês.
  const { from, to, currentLabel, rangeCaption } = useMemo(() => {
    const base = startOfMonth(new Date())
    return {
      from: format(subMonths(base, 3), 'yyyy-MM'),
      to: format(addMonths(base, 8), 'yyyy-MM'),
      currentLabel: format(base, 'MMM', { locale: ptBR }).replace('.', ''),
      rangeCaption: `${format(subMonths(base, 3), 'MMM/yy', { locale: ptBR }).replace('.', '')} – ${format(addMonths(base, 8), 'MMM/yy', { locale: ptBR }).replace('.', '')}`,
    }
  }, [])

  const { data, isLoading, isError } = useInstallmentsCashflow({
    from,
    to,
    project_id: projectId,
    customer_id: customerId,
  })

  const chartData: CashflowDatum[] = useMemo(() => {
    return (data?.months ?? []).map((month) => ({
      monthIso: month.month,
      label: monthAbbrev(month.month),
      received: (month.received?.cents ?? 0) / 100,
      due: (month.due_projected?.cents ?? 0) / 100,
      correction: (month.correction?.cents ?? 0) / 100,
      refunded: (month.refunded?.cents ?? 0) / 100,
    }))
  }, [data])

  const hasMovement = chartData.some((d) => d.received > 0 || d.due > 0 || d.correction > 0)

  if (isLoading) return <CashflowBlockSkeleton />

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 p-5 pb-2">
        <div>
          <h3 className="text-sm font-semibold">Fluxo de caixa</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Recebido e a receber por mês · {rangeCaption}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <LegendDot className="bg-success" label="Recebido" />
          <LegendDot className="bg-info" label="A receber" />
        </div>
      </header>

      {isError ? (
        <CashflowNote>Não foi possível carregar o fluxo de caixa.</CashflowNote>
      ) : !hasMovement ? (
        <CashflowNote>Sem movimentação no período.</CashflowNote>
      ) : (
        <div className="px-2 pb-2 pt-1">
          <ChartContainer
            config={chartConfig}
            className="h-64 w-full [&_.recharts-bar_path]:cursor-pointer"
          >
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              onClick={(state) => {
                const datum = state?.activePayload?.[0]?.payload as CashflowDatum | undefined
                if (datum) onSelectMonth(datum.monthIso)
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
              <YAxis
                tickLine={false}
                axisLine={false}
                width={56}
                tickFormatter={(value: number) => compactBRL(value)}
              />
              <ChartTooltip content={<CashflowTooltip />} />
              <ReferenceLine x={currentLabel} stroke="var(--color-border)" strokeDasharray="4 4">
                <Label value="hoje" position="top" className="fill-muted-foreground text-[10px]" />
              </ReferenceLine>
              <Bar dataKey="received" fill="var(--color-received)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="due" fill="var(--color-due)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>
      )}
    </Card>
  )
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn('size-2 rounded-full', className)} />
      {label}
    </span>
  )
}

function CashflowNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-5 pb-5">
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
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
    <div className="min-w-44 rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
      <p className="mb-1.5 font-medium capitalize">{fullMonth}</p>
      <div className="flex flex-col gap-1">
        <TooltipRow dotClass="bg-success" label="Recebido" value={datum.received} />
        <TooltipRow dotClass="bg-info" label="A receber" value={datum.due} />
        {datum.correction > 0 && (
          <TooltipRow dotClass="bg-warning" label="Correção" value={datum.correction} />
        )}
        {datum.refunded > 0 && (
          <TooltipRow dotClass="bg-muted-foreground" label="Estornos" value={datum.refunded} />
        )}
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

function CashflowBlockSkeleton() {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <header className="flex items-start justify-between gap-4 p-5 pb-2">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-56" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-20" />
        </div>
      </header>
      <div className="px-5 pb-5 pt-2">
        <div className="flex h-56 items-end gap-2">
          {[40, 65, 30, 80, 55, 70, 45, 90, 60, 75, 50, 85].map((h, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton bars
            <Skeleton key={i} className="flex-1 rounded-t" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    </Card>
  )
}
