import { ArrowDown, ArrowUp, CalendarClock, Equal, Receipt } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCentsToDisplay } from '@/components/ui/currency-input'
import { Separator } from '@/components/ui/separator'
import type { SelectedUnit } from '@/components/ui/unit-autocomplete'
import { formatBRDate } from '@/lib/installment-utils'
import { cn } from '@/lib/utils'
import {
  type InstallmentKind,
  installmentKindValues,
  type SaleFormData,
} from '@/schemas/sale.schema'

const SIDEBAR_GROUP_LABELS: Record<InstallmentKind, string> = {
  entry: 'Entradas',
  regular: 'Parcelas Regulares',
  balloon: 'Balões / Reforços',
  key_delivery: 'Entrega das Chaves',
  extra: 'Extras',
}

interface SaleFormSummaryProps {
  selectedUnit: SelectedUnit | null
  watchedSchedules: SaleFormData['installment_schedules'] | undefined
  totalFinanced: number
  contractEnd: { endDate: Date | null; totalMonths: number }
  currentStep: 1 | 2 | 3
}

export function SaleFormSummary({
  selectedUnit,
  watchedSchedules,
  totalFinanced,
  contractEnd,
  currentStep,
}: SaleFormSummaryProps) {
  const unitPriceCents = selectedUnit?.price_cents ?? 0
  const diff = totalFinanced - unitPriceCents
  const diffPercent = unitPriceCents > 0 ? (diff / unitPriceCents) * 100 : 0

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border bg-muted/40 px-5 py-4">
        <div className="flex items-center gap-2">
          <Receipt className="size-4 shrink-0 text-muted-foreground" />
          <CardTitle className="text-sm font-semibold">Resumo Financeiro</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-5">
        {!selectedUnit ? (
          <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Receipt className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Nenhuma unidade selecionada</p>
              <p className="mt-1 max-w-[200px] text-xs text-muted-foreground">
                Selecione uma unidade no passo 1 para acompanhar os números
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Valor Financiado — hero quando step >= 2 */}
            {currentStep >= 2 && (
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">Valor Financiado</p>
                <p className="font-mono text-2xl font-semibold tabular-nums">
                  R$&nbsp;{formatCentsToDisplay(totalFinanced) || '0,00'}
                </p>
              </div>
            )}

            {/* Preço da Unidade */}
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Preço da Unidade</p>
              <p
                className={cn(
                  'font-mono tabular-nums',
                  currentStep >= 2
                    ? 'text-sm font-medium text-muted-foreground'
                    : 'text-2xl font-semibold'
                )}
              >
                R$&nbsp;{formatCentsToDisplay(unitPriceCents) || '0,00'}
              </p>
            </div>

            {/* Diferença */}
            {totalFinanced > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Diferença</p>
                {diff === 0 ? (
                  <div className="inline-flex items-center gap-1.5 rounded-md bg-success/10 px-2.5 py-1">
                    <Equal className="size-3 text-success" />
                    <span className="text-xs font-medium text-success">Igual ao preço</span>
                  </div>
                ) : diff > 0 ? (
                  <div className="space-y-0.5">
                    <div className="inline-flex items-center gap-1.5 rounded-md bg-success/10 px-2.5 py-1">
                      <ArrowUp className="size-3 text-success" />
                      <span className="font-mono text-xs font-medium tabular-nums text-success">
                        +R$&nbsp;{formatCentsToDisplay(diff)}
                      </span>
                    </div>
                    <p className="ml-1 text-xs tabular-nums text-muted-foreground">
                      {diffPercent.toFixed(1)}% acima
                    </p>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    <div className="inline-flex items-center gap-1.5 rounded-md bg-warning/10 px-2.5 py-1">
                      <ArrowDown className="size-3 text-warning" />
                      <span className="font-mono text-xs font-medium tabular-nums text-warning">
                        -R$&nbsp;{formatCentsToDisplay(Math.abs(diff))}
                      </span>
                    </div>
                    <p className="ml-1 text-xs tabular-nums text-muted-foreground">
                      {Math.abs(diffPercent).toFixed(1)}% abaixo
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Previsão de Término */}
            {contractEnd.endDate && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Previsão de Término</p>
                <div className="flex items-center gap-2">
                  <CalendarClock className="size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="font-mono text-sm font-semibold tabular-nums">
                      {formatBRDate(contractEnd.endDate)}
                    </p>
                    {contractEnd.totalMonths > 0 && (
                      <p className="text-xs tabular-nums text-muted-foreground">
                        {contractEnd.totalMonths} meses
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Detalhamento por grupo */}
            {(() => {
              if (!watchedSchedules || watchedSchedules.length === 0) return null
              const groupTotals = installmentKindValues
                .map((kind) => ({
                  kind,
                  subtotal: watchedSchedules.reduce(
                    (sum, s) => (s.kind === kind ? sum + (s.quantity ?? 0) * (s.amount ?? 0) : sum),
                    0
                  ),
                }))
                .filter(({ subtotal }) => subtotal > 0)
              if (groupTotals.length === 0) return null
              return (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Detalhamento</p>
                    <div className="space-y-1.5">
                      {groupTotals.map(({ kind, subtotal }) => (
                        <div key={kind} className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {SIDEBAR_GROUP_LABELS[kind]}
                          </span>
                          <span className="font-mono text-xs font-medium tabular-nums">
                            R$&nbsp;{formatCentsToDisplay(subtotal)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
