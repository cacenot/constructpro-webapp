import type { components } from '@cacenot/construct-pro-api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { DataRow } from '@/components/vendas/data-row'
import { formatDate } from '@/lib/format-date'
import { formatCurrency } from '@/lib/utils'

type Sale = components['schemas']['SaleResponse']

interface DealValuesPanelProps {
  sale: Sale
}

export function DealValuesPanel({ sale }: DealValuesPanelProps) {
  const metrics = sale.metrics
  const summary = sale.installment_summary

  const discountCents =
    metrics?.discount?.cents ?? (sale.unit_price?.cents ?? 0) - (sale.amount?.cents ?? 0)
  const discountPct = metrics
    ? Number(metrics.discount_percentage)
    : (sale.unit_price?.cents ?? 0) > 0
      ? (discountCents / (sale.unit_price?.cents ?? 1)) * 100
      : 0
  const isDiscount = discountCents >= 0
  const cubQty = metrics?.cub_quantity != null ? Number(metrics.cub_quantity) : null

  const hasUnitMath =
    metrics?.price_per_sqm?.cents != null || cubQty != null || !!sale.index_type_code

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Valores da proposta</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <DataRow label="Preço de tabela" value={formatCurrency(sale.unit_price.cents / 100)} />
        {discountCents !== 0 && (
          <DataRow
            label={isDiscount ? 'Desconto' : 'Acréscimo'}
            tone={isDiscount ? 'success' : 'destructive'}
            value={
              <>
                {isDiscount ? '−' : '+'}
                {formatCurrency(Math.abs(discountCents) / 100)}{' '}
                <span className="text-xs opacity-70">
                  ({Math.abs(discountPct).toFixed(1).replace('.', ',')}%)
                </span>
              </>
            }
          />
        )}
        <Separator />
        <DataRow label="Valor da proposta" strong value={formatCurrency(sale.amount.cents / 100)} />

        {hasUnitMath && <Separator />}
        {metrics?.price_per_sqm?.cents != null && (
          <DataRow label="Preço por m²" value={formatCurrency(metrics.price_per_sqm.cents / 100)} />
        )}
        {cubQty != null && (
          <DataRow
            label="Equivalência em CUB"
            hint="Custo Unitário Básico da construção civil. Mostra quantos CUBs o valor da venda representa, pelo índice do estado e mês de referência."
            value={
              <>
                <span className="font-mono">
                  {cubQty.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  CUB
                </span>
                {metrics?.cub_index_code && (
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    {metrics.cub_index_code}
                    {metrics.cub_reference_month && ` · ${metrics.cub_reference_month}`}
                  </span>
                )}
              </>
            }
          />
        )}
        {sale.index_type_code && (
          <DataRow
            label="Índice de correção"
            hint="Índice econômico que corrige as parcelas ao longo do contrato (CUB, IGP-M, IPCA)."
            mono
            value={sale.index_type_code}
          />
        )}

        {summary?.first_due_date && summary?.last_due_date && (
          <>
            <Separator />
            <DataRow
              label="Período de pagamento"
              value={`${formatDate(summary.first_due_date)} – ${formatDate(summary.last_due_date)}`}
            />
          </>
        )}
      </CardContent>
    </Card>
  )
}
