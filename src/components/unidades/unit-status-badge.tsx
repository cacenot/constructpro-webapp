import type { components } from '@cacenot/construct-pro-api-client'
import { translateUnitStatus } from '@cacenot/construct-pro-api-client'

type UnitResponse = components['schemas']['UnitResponse']

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type UnitStatus = NonNullable<UnitResponse['status']>

// Glow-pill — semáforo imobiliário: disponível=verde, reservado=âmbar, vendido=azul, indisponível=coral.
// Usa tokens --color-unit-* (definidos em globals.css) para semântica independente do pipeline de vendas.
const statusStyles: Record<UnitStatus, string> = {
  available:
    'rounded-full border bg-unit-available text-unit-available-fg border-unit-available-dot/30',
  reserved:
    'rounded-full border bg-unit-reserved text-unit-reserved-fg border-unit-reserved-dot/30',
  sold: 'rounded-full border bg-unit-sold text-unit-sold-fg border-unit-sold-dot/30',
  unavailable:
    'rounded-full border bg-unit-unavailable text-unit-unavailable-fg border-unit-unavailable-dot/30',
}

export function UnitStatusBadge({ status }: { status: UnitStatus }) {
  return (
    <Badge variant="ghost" className={cn(statusStyles[status])}>
      {translateUnitStatus(status, 'pt-BR')}
    </Badge>
  )
}
