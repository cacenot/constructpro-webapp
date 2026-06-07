import type { components } from '@cacenot/construct-pro-api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { DataRow } from '@/components/vendas/data-row'
import { formatCurrency, formatPercent } from '@/lib/utils'

type Sale = components['schemas']['SaleResponse']

interface DealCommissionPanelProps {
  sale: Sale
}

// A API já entrega a taxa pronta: `formatted` (display pt-BR) e `percentage`
// (string decimal). Preferimos o backend a recalcular de `ppm` no front.
function rateLabel(rate?: { formatted?: string; percentage?: string } | null): string {
  if (rate?.formatted) return rate.formatted
  if (rate?.percentage != null) return `${formatPercent(Number(rate.percentage), 2)}%`
  return '—'
}

export function DealCommissionPanel({ sale }: DealCommissionPanelProps) {
  const brokerPct = Number(sale.commission_broker_rate?.percentage ?? 0)
  const agencyPct = Number(sale.commission_agency_rate?.percentage ?? 0)
  const totalEstimated = ((brokerPct + agencyPct) / 100) * (sale.amount.cents / 100)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Comissão prevista</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <DataRow label="Corretor" value={sale.broker?.full_name ?? '—'} />
        <DataRow label="Taxa do corretor" value={rateLabel(sale.commission_broker_rate)} />
        {sale.agency_id && (
          <>
            <DataRow
              label="Imobiliária"
              value={sale.agency?.trade_name ?? sale.agency?.legal_name ?? '—'}
            />
            <DataRow label="Taxa da imobiliária" value={rateLabel(sale.commission_agency_rate)} />
          </>
        )}
        <Separator />
        <DataRow label="Total estimado" strong value={formatCurrency(totalEstimated)} />
      </CardContent>
    </Card>
  )
}
