import type { components } from '@cacenot/construct-pro-api-client'

type SaleResponse = components['schemas']['SaleResponse']

import type { ColumnDef } from '@tanstack/react-table'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MoreVertical } from 'lucide-react'
import { navigate } from 'vike/client/router'
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
import { SaleStatusBadge } from './sale-status-badge'

function calculateDiscount(salePrice: number, listPrice: number): string {
  if (listPrice === 0) return '0'
  return (((listPrice - salePrice) / listPrice) * 100).toFixed(0)
}

export const salesColumns: ColumnDef<SaleResponse>[] = [
  {
    id: 'id',
    header: 'ID',
    cell: ({ row }) => (
      <Badge variant="secondary" className="tabular-nums font-mono text-xs shrink-0">
        {formatId(row.original.id)}
      </Badge>
    ),
  },
  {
    id: 'unit',
    header: 'Unidade / Empreendimento',
    cell: ({ row }) => {
      const { unit } = row.original
      return (
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="truncate text-sm font-medium">
            {unit?.name || 'Unidade não informada'}
          </span>
          <span className="text-xs text-muted-foreground truncate">
            {unit ? `Empreendimento #${unit.project_id}` : 'Empreendimento não informado'}
          </span>
        </div>
      )
    },
  },
  {
    id: 'customer',
    header: 'Cliente',
    cell: ({ row }) => {
      const { customer } = row.original
      return (
        <div className="hidden md:flex w-48">
          <span className="truncate text-sm">{customer?.full_name || 'Não informado'}</span>
        </div>
      )
    },
  },
  {
    id: 'amount',
    header: 'Valor',
    cell: ({ row }) => {
      const { amount_cents, unit_price_cents } = row.original
      const hasDiscount = amount_cents < unit_price_cents
      return (
        <div className="hidden xl:flex flex-col gap-0.5 w-44">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium tabular-nums">
              {formatCurrency(amount_cents / 100)}
            </span>
            {hasDiscount && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 leading-none">
                -{calculateDiscount(amount_cents, unit_price_cents)}%
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            De {formatCurrency(unit_price_cents / 100)}
          </span>
        </div>
      )
    },
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const { status } = row.original
      if (!status) return null
      return (
        <div className="w-28 shrink-0">
          <SaleStatusBadge status={status} />
        </div>
      )
    },
  },
  {
    id: 'created_at',
    header: 'Data / Vendedor',
    cell: ({ row }) => {
      const { created_at, user } = row.original
      return (
        <div className="hidden md:flex flex-col gap-0.5 w-40">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(created_at), {
              addSuffix: true,
              locale: ptBR,
            })}
          </span>
          <span className="text-xs">{user?.full_name || 'Não informado'}</span>
        </div>
      )
    },
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const sale = row.original
      return (
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
            <DropdownMenuItem onClick={() => navigate(`/vendas/${sale.id}`)}>
              Ver detalhes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/vendas/${sale.id}/editar`)}>
              Editar
            </DropdownMenuItem>
            {sale.status === 'reserved' && sale.contract && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(`/vendas/${sale.id}/contrato`)}>
                  Assinar contrato
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
