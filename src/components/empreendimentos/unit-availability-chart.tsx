import type { components } from '@cacenot/construct-pro-api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type ProjectUnitSummary = components['schemas']['ProjectUnitSummary']

interface UnitAvailabilityChartProps {
  data: ProjectUnitSummary
}

interface StatusBarProps {
  label: string
  value: number
  total: number
  colorClass: string
  barClass: string
}

function StatusBar({ label, value, total, colorClass, barClass }: StatusBarProps) {
  const pct = total > 0 ? (value / total) * 100 : 0

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <div className={cn('size-2.5 rounded-full', colorClass)} />
          <span>{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="tabular-nums font-medium">{value}</span>
          <span className="tabular-nums text-xs text-muted-foreground">({pct.toFixed(1)}%)</span>
        </div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all', barClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function UnitAvailabilityChart({ data }: UnitAvailabilityChartProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Disponibilidade de Unidades</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-center space-y-4">
        <StatusBar
          label="Disponivel"
          value={data.available_count}
          total={data.total_units}
          colorClass="bg-emerald-500"
          barClass="bg-emerald-500"
        />
        <StatusBar
          label="Reservadas"
          value={data.reserved_count}
          total={data.total_units}
          colorClass="bg-blue-500"
          barClass="bg-blue-500"
        />
        <StatusBar
          label="Vendidas"
          value={data.sold_count}
          total={data.total_units}
          colorClass="bg-emerald-600"
          barClass="bg-emerald-600"
        />
        {data.unavailable_count > 0 && (
          <StatusBar
            label="Indisponiveis"
            value={data.unavailable_count}
            total={data.total_units}
            colorClass="bg-muted-foreground/50"
            barClass="bg-muted-foreground/50"
          />
        )}
      </CardContent>
    </Card>
  )
}
