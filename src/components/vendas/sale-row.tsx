import type { SaleResponse } from '@cacenot/construct-pro-api-client'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MoreVertical } from 'lucide-react'
import { navigate } from 'vike/client/router'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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

type Sale = SaleResponse

interface SaleRowProps {
  sale: Sale
}

function getInitials(name?: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function calculateDiscount(salePrice: number, listPrice: number): string {
  if (listPrice === 0) return '0'
  const discount = ((listPrice - salePrice) / listPrice) * 100
  return discount.toFixed(0)
}

export function SaleRow({ sale }: SaleRowProps) {
  const hasDiscount = sale.amount_cents < sale.unit_price_cents

  return (
    <div className="flex items-center gap-4 px-6 py-3">
      {/* ID Badge */}
      <Badge variant="secondary" className="shrink-0 tabular-nums font-mono text-xs">
        {formatId(sale.id)}
      </Badge>

      {/* Venda Info (2 lines) */}
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <span className="truncate text-sm font-medium">{sale.unit?.name || 'Unidade não informada'}</span>
        <span className="text-xs text-muted-foreground truncate">
          {sale.unit?.project?.name || 'Empreendimento não informado'}
        </span>
      </div>

      {/* Cliente (hidden md:flex) */}
      <div className="hidden md:flex items-center gap-2 w-48 shrink-0">
        <Avatar className="size-6">
          <AvatarFallback className="text-xs">
            {getInitials(sale.customer?.full_name)}
          </AvatarFallback>
        </Avatar>
        <span className="truncate text-sm">{sale.customer?.full_name || 'Cliente não informado'}</span>
      </div>

      {/* Vendedor (hidden lg:flex) */}
      <div className="hidden lg:flex items-center gap-2 w-40 shrink-0">
        <Avatar className="size-5">
          <AvatarFallback className="text-[10px]">
            {getInitials(sale.user?.name || sale.user?.email)}
          </AvatarFallback>
        </Avatar>
        <span className="truncate text-xs">
          {sale.user?.name || sale.user?.email || 'Vendedor não informado'}
        </span>
      </div>

      {/* Valores com desconto (hidden xl:flex) */}
      <div className="hidden xl:flex flex-col gap-0.5 w-44 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium tabular-nums">
            {formatCurrency(sale.amount_cents / 100)}
          </span>
          {hasDiscount && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 leading-none">
              -{calculateDiscount(sale.amount_cents, sale.unit_price_cents)}%
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          De {formatCurrency(sale.unit_price_cents / 100)}
        </span>
      </div>

      {/* Status */}
      <div className="w-32 shrink-0">
        <SaleStatusBadge status={sale.status} />
      </div>

      {/* Tempo decorrido (hidden md:block) */}
      <div className="hidden md:block w-32 shrink-0">
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(sale.created_at), {
            addSuffix: true,
            locale: ptBR,
          })}
        </span>
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
    </div>
  )
}
