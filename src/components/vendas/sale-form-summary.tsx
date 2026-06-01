import { ArrowDown, ArrowUp, CalendarClock, Equal, Receipt } from 'lucide-react'
import type { FieldArrayWithId } from 'react-hook-form'
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
  fields: FieldArrayWithId<SaleFormData, 'installment_schedules', 'id'>[]
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
    <Card>
      <CardHeader>
        <CardTitle>Resumo Financeiro</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!selectedUnit ? (
          <div className="flex flex-col items-center justify-center gap-2 py-6">
            <Receipt className="size-8 text-muted-foreground" />
            <p className="text-center text-sm text-muted-foreground">
              Selecione uma unidade para ver o resumo
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {currentStep >= 2 && (
                <div>
                  <p className="text-sm text-muted-foreground">Valor Financiado</p>
                  <p className="text-2xl font-bold tabular-nums">
                    R$ {formatCentsToDisplay(totalFinanced) || '0,00'}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">Preço da Unidade</p>
                <p className="text-2xl font-bold tabular-nums">
                  R$ {formatCentsToDisplay(unitPriceCents) || '0,00'}
                </p>
              </div>

              {selectedUnit && totalFinanced > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Diferença</p>
                  <div className="flex items-center gap-2">
                    {diff === 0 ? (
                      <>
                        <Equal className="size-5 text-success" />
                        <span className="text-sm font-medium text-success">Igual ao preço</span>
                      </>
                    ) : diff > 0 ? (
                      <>
                        <ArrowUp className="size-5 text-success" />
                        <div>
                          <p className="text-lg font-bold tabular-nums text-success">
                            + R$ {formatCentsToDisplay(diff)}
                          </p>
                          <p className="text-xs tabular-nums text-muted-foreground">
                            {diffPercent.toFixed(1)}% acima
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <ArrowDown className="size-5 text-warning" />
                        <div>
                          <p className="text-lg font-bold tabular-nums text-warning">
                            - R$ {formatCentsToDisplay(Math.abs(diff))}
                          </p>
                          <p className="text-xs tabular-nums text-muted-foreground">
                            {Math.abs(diffPercent).toFixed(1)}% abaixo
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {contractEnd.endDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Previsão de Término</p>
                  <div className="flex items-center gap-2">
                    <CalendarClock className="size-5 text-muted-foreground" />
                    <div>
                      <p className="text-lg font-bold tabular-nums">
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
            </div>

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
                    <p className="text-sm font-medium text-muted-foreground">Detalhamento</p>
                    <div className="space-y-1">
                      {groupTotals.map(({ kind, subtotal }) => (
                        <div key={kind} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {SIDEBAR_GROUP_LABELS[kind]}
                          </span>
                          <span className={cn('font-medium tabular-nums')}>
                            R$ {formatCentsToDisplay(subtotal)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )
            })()}
          </>
        )}
      </CardContent>
    </Card>
  )
}
