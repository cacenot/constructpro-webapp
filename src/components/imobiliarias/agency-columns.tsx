import type { ColumnDef } from '@tanstack/react-table'
import { useState } from 'react'
import { navigate } from 'vike/client/router'
import { MutedCell, PrimaryCell, RowActionsMenu } from '@/components/ui/data-table-cells'
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import type { AgencyResponse } from '@/hooks/use-agencies-table'
import { formatDocument } from '@/lib/text-formatters'
import { AgencyDeleteDialog } from './agency-delete-dialog'

export function createAgencyColumns(): ColumnDef<AgencyResponse>[] {
  return [
    {
      id: 'legal_name',
      header: 'Razão Social',
      cell: ({ row }) => (
        <PrimaryCell title={row.original.legal_name} subtitle={formatDocument(row.original.cnpj)} />
      ),
    },
    {
      id: 'trade_name',
      header: 'Nome Fantasia',
      cell: ({ row }) => (
        <MutedCell>
          {row.original.trade_name ? (
            <span className="block truncate max-w-[180px]">{row.original.trade_name}</span>
          ) : null}
        </MutedCell>
      ),
      meta: { className: 'hidden md:table-cell', headClassName: 'hidden md:table-cell' },
    },
    {
      id: 'creci_j',
      header: 'CRECI-J',
      cell: ({ row }) => <MutedCell>{row.original.creci_j}</MutedCell>,
    },
    {
      id: 'email',
      header: 'E-mail',
      cell: ({ row }) => (
        <MutedCell>
          {row.original.email ? (
            <span className="block truncate max-w-[180px]">{row.original.email}</span>
          ) : null}
        </MutedCell>
      ),
      meta: { className: 'hidden md:table-cell', headClassName: 'hidden md:table-cell' },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => <AgencyRowActions agency={row.original} />,
      meta: { align: 'right' },
    },
  ]
}

function AgencyRowActions({ agency }: { agency: AgencyResponse }) {
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <>
      <RowActionsMenu>
        <DropdownMenuItem onClick={() => navigate(`/imobiliarias/${agency.id}`)}>
          Ver detalhes
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate(`/imobiliarias/${agency.id}/editar`)}>
          Editar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => setDeleteOpen(true)}
        >
          Excluir
        </DropdownMenuItem>
      </RowActionsMenu>

      <AgencyDeleteDialog
        agencyId={agency.id}
        agencyName={agency.legal_name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onSuccess={() => navigate('/imobiliarias')}
      />
    </>
  )
}
