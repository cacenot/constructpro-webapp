import type { ColumnDef } from '@tanstack/react-table'
import { navigate } from 'vike/client/router'
import { Badge } from '@/components/ui/badge'
import { DateCell, MoneyCell, PrimaryCell, RowActionsMenu } from '@/components/ui/data-table-cells'
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import type { ContractTableRow } from '@/hooks/use-contracts-table'
import { formatId } from '@/lib/utils'
import { ContractOverdueBadge } from './contract-overdue-badge'
import { ContractStatusBadge } from './contract-status-badge'

export function createContractColumns(): ColumnDef<ContractTableRow>[] {
  return [
    {
      id: 'id',
      header: 'ID',
      cell: ({ row }) => (
        <Badge variant="secondary" className="shrink-0 font-mono text-xs tabular-nums">
          {formatId(row.original.id)}
        </Badge>
      ),
    },
    {
      id: 'customer',
      header: 'Cliente',
      cell: ({ row }) => {
        const { sale, sale_id } = row.original
        const customerName = sale?.customer?.full_name || 'Cliente não informado'
        const projectName = sale?.unit?.project?.name || 'Empreendimento não informado'
        const unitName = sale?.unit?.name || 'Unidade não informada'
        return (
          <PrimaryCell
            title={customerName}
            subtitle={`Venda ${formatId(sale_id)} · ${projectName} - ${unitName}`}
          />
        )
      },
    },
    {
      id: 'principal',
      header: 'Valor Principal',
      cell: ({ row }) => <MoneyCell value={row.original.principal_amount.cents / 100} />,
      meta: {
        align: 'right',
        className: 'hidden lg:table-cell',
        headClassName: 'hidden lg:table-cell',
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <ContractStatusBadge status={row.original.status || 'pending'} />
          <ContractOverdueBadge isOverdue={row.original.is_overdue} />
        </div>
      ),
    },
    {
      id: 'signed_at',
      header: 'Assinatura',
      cell: ({ row }) =>
        row.original.signed_at ? (
          <DateCell date={row.original.signed_at} />
        ) : (
          <span className="text-sm italic text-muted-foreground">Aguardando</span>
        ),
      meta: {
        className: 'hidden xl:table-cell',
        headClassName: 'hidden xl:table-cell',
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => <ContractRowActions contract={row.original} />,
      meta: { align: 'right' },
    },
  ]
}

function ContractRowActions({ contract }: { contract: ContractTableRow }) {
  return (
    <RowActionsMenu>
      <DropdownMenuItem onClick={() => navigate(`/contratos/${contract.id}`)}>
        Ver detalhes
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => navigate(`/contratos/${contract.id}/editar`)}>
        Editar
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => navigate(`/vendas/${contract.sale_id}`)}>
        Ver venda relacionada
      </DropdownMenuItem>
      {contract.status === 'pending' && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate(`/contratos/${contract.id}/assinar`)}>
            Registrar assinatura
          </DropdownMenuItem>
        </>
      )}
      {contract.document_url && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => window.open(contract.document_url ?? '', '_blank')}>
            Baixar documento
          </DropdownMenuItem>
        </>
      )}
    </RowActionsMenu>
  )
}
