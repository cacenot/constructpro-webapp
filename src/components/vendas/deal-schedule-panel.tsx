import {
  type components,
  translateInstallmentKind,
  translatePaymentMethod,
} from '@cacenot/construct-pro-api-client'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatLabel } from '@/components/vendas/data-row'
import { formatDate, formatMonthYear } from '@/lib/format-date'
import { cn, formatCurrency } from '@/lib/utils'
import { INSTALLMENT_KIND_LABELS, PAYMENT_METHOD_LABELS } from '@/schemas/sale.schema'

type ScheduleGroup = components['schemas']['ScheduleGroupSummary']

interface DealSchedulePanelProps {
  schedules: ScheduleGroup[]
  totalCount: number
  totalAmountCents: number
}

const KIND_DOT: Record<string, string> = {
  entry: 'bg-pipeline-proposta-dot',
  monthly: 'bg-pipeline-reservado-dot',
  yearly: 'bg-pipeline-fechado-dot',
  extra: 'bg-muted-foreground',
}

function kindLabel(kind: ScheduleGroup['kind']): string {
  return INSTALLMENT_KIND_LABELS[kind] ?? translateInstallmentKind(kind, 'pt-BR')
}

function phasePeriod(first: string, last: string): string {
  return first === last ? formatDate(first) : `${formatMonthYear(first)} – ${formatMonthYear(last)}`
}

export function DealSchedulePanel({
  schedules,
  totalCount,
  totalAmountCents,
}: DealSchedulePanelProps) {
  const [showTable, setShowTable] = useState(false)

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Cronograma de parcelas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timeline de fases — entrada → mensais → reforços, lendo da esquerda p/ direita */}
        <div className="flex flex-wrap gap-px overflow-hidden rounded-lg border bg-border">
          {schedules.map((group) => (
            <div
              key={`${group.kind}-${group.first_due_date}`}
              className="min-w-[180px] flex-1 space-y-1 bg-card p-4"
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'size-1.5 rounded-full',
                    KIND_DOT[group.kind] ?? 'bg-muted-foreground'
                  )}
                />
                <StatLabel>{kindLabel(group.kind)}</StatLabel>
              </div>
              <p className="tabular-nums text-lg font-semibold leading-tight">
                <span className="font-mono">{group.count}×</span>{' '}
                <span className="text-sm font-normal text-muted-foreground">
                  {formatCurrency(group.amount.cents / 100)}
                </span>
              </p>
              <p className="tabular-nums text-sm text-muted-foreground">
                {formatCurrency(group.total_amount.cents / 100)}
              </p>
              <p className="font-mono text-xs text-muted-foreground">
                {phasePeriod(group.first_due_date, group.last_due_date)}
              </p>
            </div>
          ))}
        </div>

        {/* Resumo + drill-down da tabela completa */}
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-mono tabular-nums text-foreground">{totalCount}</span> parcelas ·{' '}
            <span className="tabular-nums text-foreground">
              {formatCurrency(totalAmountCents / 100)}
            </span>
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={() => setShowTable((v) => !v)}
            aria-expanded={showTable}
          >
            {showTable ? 'Ocultar detalhes' : 'Ver cronograma detalhado'}
            <ChevronDown
              className={cn(
                'size-4 transition-transform motion-reduce:transition-none',
                showTable && 'rotate-180'
              )}
            />
          </Button>
        </div>

        {showTable && (
          <div className="-mx-6 border-t">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-6">Tipo</TableHead>
                  <TableHead className="px-6 text-right">Qtd</TableHead>
                  <TableHead className="px-6 text-right">Valor/parcela</TableHead>
                  <TableHead className="px-6 text-right">Total</TableHead>
                  <TableHead className="hidden px-6 md:table-cell">Período</TableHead>
                  <TableHead className="hidden px-6 lg:table-cell">Forma de pagamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((group) => (
                  <TableRow key={`row-${group.kind}-${group.first_due_date}`}>
                    <TableCell className="px-6 font-medium">{kindLabel(group.kind)}</TableCell>
                    <TableCell className="px-6 text-right font-mono tabular-nums">
                      {group.count}
                    </TableCell>
                    <TableCell className="px-6 text-right tabular-nums">
                      {formatCurrency(group.amount.cents / 100)}
                    </TableCell>
                    <TableCell className="px-6 text-right tabular-nums">
                      {formatCurrency(group.total_amount.cents / 100)}
                    </TableCell>
                    <TableCell className="hidden px-6 tabular-nums md:table-cell">
                      {phasePeriod(group.first_due_date, group.last_due_date)}
                    </TableCell>
                    <TableCell className="hidden px-6 text-muted-foreground lg:table-cell">
                      {PAYMENT_METHOD_LABELS[group.payment_method] ??
                        translatePaymentMethod(group.payment_method, 'pt-BR')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="px-6 font-semibold">Total</TableCell>
                  <TableCell className="px-6 text-right font-mono font-semibold tabular-nums">
                    {totalCount}
                  </TableCell>
                  <TableCell className="px-6" />
                  <TableCell className="px-6 text-right font-semibold tabular-nums">
                    {formatCurrency(totalAmountCents / 100)}
                  </TableCell>
                  <TableCell className="hidden px-6 md:table-cell" />
                  <TableCell className="hidden px-6 lg:table-cell" />
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
