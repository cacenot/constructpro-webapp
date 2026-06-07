import type { components } from '@cacenot/construct-pro-api-client'
import { Layers } from 'lucide-react'
import { DataRow, DetailPanel } from '@/components/empreendimentos/detail-panel'
import { type Vital, VitalsStrip } from '@/components/empreendimentos/vitals-strip'
import { formatCurrency, formatPercent } from '@/lib/utils'

type ProjectUnitSummary = components['schemas']['ProjectUnitSummary']

interface UnitInventorySectionProps {
  data: ProjectUnitSummary
}

export function UnitInventorySection({ data }: UnitInventorySectionProps) {
  const availability = Number(data.availability_percentage)

  // O total de unidades já vive no strip de saúde da página; aqui é puro
  // breakdown por status, para não repetir o mesmo número-lede.
  const counts: Vital[] = [
    {
      label: 'Disponíveis',
      value: data.available_count,
      sub: `${formatPercent(availability)}% do total`,
      tone: 'success',
    },
    { label: 'Reservadas', value: data.reserved_count, tone: 'info' },
    { label: 'Vendidas', value: data.sold_count },
  ]
  if (data.unavailable_count > 0) {
    counts.push({ label: 'Indisponíveis', value: data.unavailable_count })
  }

  return (
    <div className="space-y-4">
      <VitalsStrip vitals={counts} />

      <DetailPanel title="VGV do inventário" icon={Layers}>
        <div className="grid gap-x-10 sm:grid-cols-2">
          <DataRow label="VGV total" value={formatCurrency(data.total_vgv.cents / 100)} strong />
          <DataRow
            label="VGV vendido"
            value={formatCurrency(data.sold_vgv.cents / 100)}
            tone={data.sold_vgv.cents > 0 ? 'success' : undefined}
          />
          <DataRow label="VGV disponível" value={formatCurrency(data.available_vgv.cents / 100)} />
          <DataRow label="Preço médio" value={formatCurrency(data.avg_unit_price.cents / 100)} />
        </div>
      </DetailPanel>
    </div>
  )
}
