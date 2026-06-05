import type { components } from '@cacenot/construct-pro-api-client'
import { translateUnitStatus } from '@cacenot/construct-pro-api-client'

type UnitResponse = components['schemas']['UnitResponse']

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type UnitStatus = NonNullable<UnitResponse['status']>

// Glow-pill consistente com os demais status do app (venda, contrato, empreendimento):
// tinte translúcido + texto saturado + hairline da cor, via tokens --color-pipeline-*.
// Paleta "semáforo imobiliário": disponível=verde, reservado=âmbar, vendido=azul, indisponível=coral.
const statusStyles: Record<UnitStatus, string> = {
  available:
    'rounded-full border bg-pipeline-fechado text-pipeline-fechado-fg border-pipeline-fechado-dot/30',
  reserved:
    'rounded-full border bg-pipeline-proposta text-pipeline-proposta-fg border-pipeline-proposta-dot/30',
  sold: 'rounded-full border bg-pipeline-reservado text-pipeline-reservado-fg border-pipeline-reservado-dot/30',
  unavailable:
    'rounded-full border bg-pipeline-perdido text-pipeline-perdido-fg border-pipeline-perdido-dot/30',
}

export function UnitStatusBadge({ status }: { status: UnitStatus }) {
  return (
    <Badge variant="ghost" className={cn(statusStyles[status])}>
      {translateUnitStatus(status, 'pt-BR')}
    </Badge>
  )
}
