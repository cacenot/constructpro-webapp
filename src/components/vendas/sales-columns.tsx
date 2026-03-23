import { SaleStatus } from '@cacenot/construct-pro-api-client'
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
import type { SaleSummaryResponse } from '@/hooks/use-sales-summary'
import { formatDocument } from '@/lib/text-formatters'
import { formatId } from '@/lib/utils'
import { SaleStatusBadge } from './sale-status-badge'

interface SalesColumnsCallbacks {
  onSignContract: (sale: SaleSummaryResponse) => void
  onPayEntry: (sale: SaleSummaryResponse) => void
  onApproveSale: (sale: SaleSummaryResponse) => void
}

export function createSalesColumns({
  onSignContract,
  onPayEntry,
  onApproveSale,
}: SalesColumnsCallbacks): ColumnDef<SaleSummaryResponse>[] {
  return [
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
              {unit?.project?.name || 'Empreendimento não informado'}
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
          <div className="hidden md:flex flex-col gap-0.5 w-48">
            <span className="truncate text-sm">{customer?.full_name || 'Não informado'}</span>
            <span className="text-xs text-muted-foreground truncate">
              {formatDocument(customer?.cpf_cnpj) || 'CPF/CNPJ não informado'}
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
      header: 'Vendedor / Data',
      cell: ({ row }) => {
        const { created_at, user } = row.original
        return (
          <div className="hidden md:flex flex-col gap-0.5 w-40">
            <span className="text-sm font-medium">{user?.full_name || 'Não informado'}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(created_at), {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>
          </div>
        )
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const sale = row.original
        const isProposal = sale.status === SaleStatus.proposal
        const canSign = sale.status === 'pending_signature'
        const canPayEntry = sale.status === 'pending_signature' || sale.status === 'pending_payment'

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
              {isProposal && (
                <DropdownMenuItem onClick={() => navigate(`/vendas/${sale.id}/editar`)}>
                  Editar
                </DropdownMenuItem>
              )}
              {isProposal && <DropdownMenuSeparator />}
              {isProposal && (
                <DropdownMenuItem onClick={() => onApproveSale(sale)}>
                  Aprovar proposta
                </DropdownMenuItem>
              )}
              {(canSign || canPayEntry) && <DropdownMenuSeparator />}
              {canSign && (
                <DropdownMenuItem onClick={() => onSignContract(sale)}>
                  Assinar contrato
                </DropdownMenuItem>
              )}
              {canPayEntry && (
                <DropdownMenuItem onClick={() => onPayEntry(sale)}>
                  Confirmar sinal
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
