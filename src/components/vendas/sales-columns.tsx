import { SaleStatus } from '@cacenot/construct-pro-api-client'
import type { ColumnDef } from '@tanstack/react-table'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { navigate } from 'vike/client/router'
import { Badge } from '@/components/ui/badge'
import { PrimaryCell, RowActionsMenu } from '@/components/ui/data-table-cells'
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
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
        <Badge variant="secondary" className="shrink-0 font-mono text-xs tabular-nums">
          {formatId(row.original.id)}
        </Badge>
      ),
      meta: { skeleton: { variant: 'badge' } },
    },
    {
      id: 'unit',
      header: 'Unidade / Empreend.',
      cell: ({ row }) => (
        <PrimaryCell
          title={row.original.unit?.name || 'Unidade não informada'}
          subtitle={row.original.unit?.project?.name || 'Empreendimento não informado'}
        />
      ),
      meta: { skeleton: { lines: 2 } },
    },
    {
      id: 'customer',
      header: 'Cliente',
      cell: ({ row }) => (
        <PrimaryCell
          title={row.original.customer?.full_name || 'Não informado'}
          subtitle={formatDocument(row.original.customer?.cpf_cnpj) || undefined}
        />
      ),
      meta: {
        className: 'hidden md:table-cell',
        headClassName: 'hidden md:table-cell',
        skeleton: { lines: 2 },
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) =>
        row.original.status ? <SaleStatusBadge status={row.original.status} /> : null,
      meta: { skeleton: { variant: 'badge' } },
    },
    {
      id: 'created_at',
      header: 'Vendedor / Data',
      cell: ({ row }) => (
        <PrimaryCell
          title={row.original.user?.display_name || 'Não informado'}
          subtitle={formatDistanceToNow(new Date(row.original.created_at), {
            addSuffix: true,
            locale: ptBR,
          })}
        />
      ),
      meta: {
        className: 'hidden md:table-cell',
        headClassName: 'hidden md:table-cell',
        skeleton: { lines: 2 },
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
          <RowActionsMenu>
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
              <DropdownMenuItem onClick={() => onPayEntry(sale)}>Confirmar sinal</DropdownMenuItem>
            )}
          </RowActionsMenu>
        )
      },
      meta: { align: 'right', skeleton: { variant: 'actions' } },
    },
  ]
}
