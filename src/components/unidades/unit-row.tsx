import { translateUnitCategory, type UnitResponse } from '@cacenot/construct-pro-api-client'
import { MoreVertical } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatCurrency, formatId } from '@/lib/utils'
import { UnitStatusBadge } from './unit-status-badge'

type Unit = UnitResponse

interface UnitRowProps {
  unit: Unit
  projectMap: Map<number, string>
}

export function UnitRow({ unit, projectMap }: UnitRowProps) {
  const projectName = projectMap.get(unit.project_id) || 'Empreendimento não encontrado'

  return (
    <div className="flex items-center gap-4 px-6 py-3">
      {/* ID Badge */}
      <Badge variant="secondary" className="shrink-0 tabular-nums font-mono text-xs">
        {formatId(unit.id)}
      </Badge>

      {/* Name + Project (stacked) */}
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <span className="truncate text-sm font-medium">{unit.name}</span>
        <span className="text-xs text-muted-foreground truncate">{projectName}</span>
      </div>

      {/* Category + Area */}
      <div className="hidden md:flex flex-col gap-1 w-44 shrink-0">
        <span className="text-sm">{translateUnitCategory(unit.category, 'pt-BR')}</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {unit.area ? `${unit.area}m²` : '—'}
        </span>
      </div>

      {/* Price */}
      <div className="hidden lg:block text-sm font-medium tabular-nums w-40 shrink-0">
        {formatCurrency(unit.price_cents / 100)}
      </div>

      {/* Status Badge */}
      <div className="w-32 shrink-0">
        <UnitStatusBadge status={unit.status ?? 'available'} />
      </div>

      {/* Actions Menu */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="shrink-0">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Ações</p>
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
          <DropdownMenuItem>Editar</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Criar venda</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
