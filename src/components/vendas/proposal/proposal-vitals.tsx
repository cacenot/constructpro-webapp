import { ArrowDown, ArrowUp, CalendarClock, Equal, Gauge } from 'lucide-react'
import * as React from 'react'
import { AnimatedNumber } from '@/components/ui/animated-number'
import { Button } from '@/components/ui/button'
import { formatCentsToDisplay } from '@/components/ui/currency-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatBRDate } from '@/lib/installment-utils'
import { isProposalBalanced, type ProposalVitals as Vitals } from '@/lib/proposal-vitals'
import { cn } from '@/lib/utils'
import type { InstallmentKind, SaleFormData } from '@/schemas/sale.schema'
import { GROUP_LABELS } from './constants'
import { InstallmentCalendar } from './installment-calendar'
import { CONSOLE_LABEL } from './section'

const money = (cents: number) => `R$ ${formatCentsToDisplay(cents) || '0,00'}`
const pct = (value: number) => `${value.toFixed(1).replace('.', ',')}%`

interface ProposalVitalsProps {
  vitals: Vitals
  /** Há unidade selecionada (preço de tabela disponível)? */
  hasUnit: boolean
  className?: string
  schedules?: SaleFormData['installment_schedules']
  /** Índice global da proposta (quando "mesmo índice"), para o calendário exibir o índice por parcela. */
  globalIndexCode?: string | null
  /** Para o controle "Distribuir": delega ao workbench/ledger que tem acesso ao form. */
  onDistribute?: (groupKind: InstallmentKind) => void
}

/**
 * Painel de instrumentos da proposta. Segue o princípio da VitalsStrip
 * (superfície bg-border, células bg-card separadas por gap-px), adaptado
 * à coluna estreita. Confronta o total contra o preço de tabela em tempo real.
 */
export function ProposalVitals({
  vitals,
  hasUnit,
  className,
  schedules,
  globalIndexCode = null,
  onDistribute,
}: ProposalVitalsProps) {
  const { total, diff, diffPercent, entryTotal, entryPercent, financed, count, contractEnd } =
    vitals
  const hasPlan = total > 0

  // Índice de correção efetivo por grupo (o do grupo, senão o global). Entrada = sem índice.
  const indexByKind = React.useMemo(() => {
    const map = new Map<InstallmentKind, string | null>()
    for (const s of schedules ?? []) {
      if (s.kind === 'entry' || map.has(s.kind)) continue
      map.set(s.kind, s.index_type_code ?? globalIndexCode ?? null)
    }
    return map
  }, [schedules, globalIndexCode])

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2">
        <Gauge className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold tracking-tight">Resumo</h2>
      </div>

      {/* Total + reconciliação — merge do antigo "Total" com "Saldo da proposta" */}
      <div className="rounded-lg border border-border bg-card p-4">
        <span className={CONSOLE_LABEL}>Total da proposta</span>
        <AnimatedNumber
          value={total}
          format={money}
          className="mt-1.5 block text-2xl font-semibold leading-none tracking-tight"
        />
        <div className="mt-1.5">
          <DiffChip total={total} diff={diff} diffPercent={diffPercent} hasUnit={hasUnit} />
        </div>
        {vitals.valorPropostaCents > 0 && (
          <div className="mt-3 space-y-2 border-t border-border pt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-muted-foreground">Valor da proposta</span>
              <AnimatedNumber
                value={vitals.valorPropostaCents}
                format={money}
                className="text-sm font-medium"
              />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-medium">
                {isProposalBalanced(vitals)
                  ? 'Saldo'
                  : vitals.saldo > 0
                    ? 'Falta distribuir'
                    : 'Sobra'}
              </span>
              <AnimatedNumber
                value={Math.abs(vitals.saldo)}
                format={money}
                className={cn(
                  'text-base font-semibold',
                  isProposalBalanced(vitals) ? 'text-success' : 'text-warning'
                )}
              />
            </div>
            {!isProposalBalanced(vitals) && onDistribute && vitals.groups.length > 0 && (
              <DistributeControl groups={vitals.groups} onDistribute={onDistribute} />
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border">
        {/* Preço de tabela — referência */}
        <div className="col-span-2 flex flex-col gap-1 bg-card p-4">
          <span className={CONSOLE_LABEL}>Preço de tabela</span>
          {hasUnit ? (
            <AnimatedNumber
              value={vitals.unitPriceCents}
              format={money}
              className="text-sm font-medium text-muted-foreground"
            />
          ) : (
            <span className="text-sm text-muted-foreground">Selecione a unidade</span>
          )}
        </div>

        {/* Entrada / Financiado */}
        <div className="flex flex-col gap-1 bg-card p-4">
          <span className={CONSOLE_LABEL}>Entrada</span>
          <AnimatedNumber value={entryTotal} format={money} className="text-sm font-medium" />
          {hasPlan && (
            <div className="mt-1 space-y-1">
              <div
                className="h-1 overflow-hidden rounded-full bg-muted"
                role="img"
                aria-label={`Entrada representa ${pct(entryPercent)} do total da proposta`}
              >
                <div
                  className="h-full rounded-full bg-info transition-[width] duration-300 ease-out"
                  style={{ width: `${Math.min(entryPercent, 100)}%` }}
                />
              </div>
              <span className="text-[0.6875rem] tabular-nums text-muted-foreground">
                {pct(entryPercent)} do total
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1 bg-card p-4">
          <span className={CONSOLE_LABEL}>Financiado</span>
          <AnimatedNumber value={financed} format={money} className="text-sm font-medium" />
        </div>

        {/* Parcelas / Término */}
        <div className="flex flex-col gap-1 bg-card p-4">
          <span className={CONSOLE_LABEL}>Parcelas</span>
          {count > 0 ? (
            <AnimatedNumber value={count} className="text-sm font-medium" />
          ) : (
            <span className="text-sm font-medium tabular-nums text-muted-foreground">—</span>
          )}
        </div>
        <div className="flex flex-col gap-1 bg-card p-4">
          <span className={CONSOLE_LABEL}>Término</span>
          {contractEnd.endDate ? (
            <div className="flex items-center gap-1.5">
              <CalendarClock className="size-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-sm font-medium leading-tight tabular-nums">
                  {formatBRDate(contractEnd.endDate)}
                </p>
                {contractEnd.totalMonths > 0 && (
                  <p className="text-[0.6875rem] tabular-nums text-muted-foreground">
                    {contractEnd.totalMonths} meses
                  </p>
                )}
              </div>
            </div>
          ) : (
            <span className="text-sm tabular-nums text-muted-foreground">—</span>
          )}
        </div>

        {/* Comissão de mediação (custo interno, não abate da venda) */}
        {vitals.commission && (
          <div className="col-span-2 flex flex-col gap-1 bg-card p-4">
            <span className={CONSOLE_LABEL}>Comissão de mediação</span>
            <div className="flex items-baseline justify-between gap-2">
              <AnimatedNumber
                value={vitals.commission.amountCents}
                format={money}
                className="text-sm font-medium"
              />
              <span
                className={cn(
                  'text-xs tabular-nums',
                  vitals.commission.exceedsCap ? 'text-destructive' : 'text-muted-foreground'
                )}
              >
                {pct(vitals.commission.totalPercent)}
                {vitals.commission.capPercent > 0 && ` · teto ${pct(vitals.commission.capPercent)}`}
              </span>
            </div>
            {vitals.commission.exceedsCap && (
              <span className="text-[0.6875rem] text-destructive">
                Acima do teto da organização
              </span>
            )}
          </div>
        )}
      </div>

      {/* Detalhamento por grupo */}
      {vitals.groups.length > 0 && (
        <div className="space-y-2">
          <span className={CONSOLE_LABEL}>Detalhamento</span>
          <dl className="divide-y divide-border rounded-lg border border-border">
            {vitals.groups.map((g) => (
              <div key={g.kind} className="flex items-center justify-between px-3.5 py-2.5">
                <dt className="text-xs text-muted-foreground">
                  {GROUP_LABELS[g.kind]}
                  <span className="ml-1.5 tabular-nums text-muted-foreground/70">×{g.count}</span>
                  {indexByKind.get(g.kind) && (
                    <span className="ml-1.5 font-mono text-[0.625rem] uppercase text-muted-foreground/70">
                      {indexByKind.get(g.kind)}
                    </span>
                  )}
                </dt>
                <dd className="text-xs font-medium">
                  <AnimatedNumber value={g.subtotal} format={money} />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Calendário de parcelas */}
      {vitals.count > 0 && (
        <div className="space-y-2">
          <span className={CONSOLE_LABEL}>Calendário de parcelas</span>
          <InstallmentCalendar schedules={schedules} globalIndexCode={globalIndexCode} />
        </div>
      )}
    </div>
  )
}

function DistributeControl({
  groups,
  onDistribute,
}: {
  groups: Vitals['groups']
  onDistribute: (kind: InstallmentKind) => void
}) {
  const targets = groups.filter((g) => g.kind !== 'entry')
  const [kind, setKind] = React.useState(targets[0]?.kind)
  if (!targets.length || !kind) return null
  return (
    <div className="mt-1 flex gap-2">
      <Select value={kind} onValueChange={(v) => setKind(v as typeof kind)}>
        <SelectTrigger className="h-8 flex-1 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {targets.map((g) => (
            <SelectItem key={g.kind} value={g.kind} className="text-xs">
              {GROUP_LABELS[g.kind]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="button" size="sm" className="h-8" onClick={() => onDistribute(kind)}>
        Distribuir
      </Button>
    </div>
  )
}

function DiffChip({
  total,
  diff,
  diffPercent,
  hasUnit,
}: {
  total: number
  diff: number
  diffPercent: number
  hasUnit: boolean
}) {
  if (!hasUnit || total === 0) return null

  if (diff === 0) {
    return (
      <span className="inline-flex w-fit items-center gap-1.5 rounded-md bg-success/12 px-2 py-1 text-xs font-medium text-success">
        <Equal className="size-3.5" />
        No preço de tabela
      </span>
    )
  }

  // Abaixo do preço = desconto (atenção à margem) → âmbar. No preço ou ágio = bom → verde.
  const below = diff < 0
  const tone = below ? 'bg-warning/12 text-warning' : 'bg-success/12 text-success'
  const Icon = below ? ArrowDown : ArrowUp
  const sign = below ? '−' : '+'
  const label = below ? 'desconto' : 'ágio'

  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium tabular-nums',
        tone
      )}
    >
      <Icon className="size-3.5" />
      {sign}
      {formatCentsToDisplay(Math.abs(diff))} · {pct(Math.abs(diffPercent))} {label}
    </span>
  )
}
