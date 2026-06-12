import type { ColumnDef } from '@tanstack/react-table'
import { useState } from 'react'
import { navigate } from 'vike/client/router'
import { MutedCell, PrimaryCell, RowActionsMenu } from '@/components/ui/data-table-cells'
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import type { BrokerResponse } from '@/hooks/use-brokers-table'
import { formatDocument, formatPhone } from '@/lib/text-formatters'
import { BrokerDeleteDialog } from './broker-delete-dialog'

export function createBrokerColumns(): ColumnDef<BrokerResponse>[] {
  return [
    {
      id: 'full_name',
      header: 'Nome',
      cell: ({ row }) => (
        <PrimaryCell title={row.original.full_name} subtitle={formatDocument(row.original.cpf)} />
      ),
      meta: { skeleton: { lines: 2 } },
    },
    {
      id: 'creci',
      header: 'CRECI',
      cell: ({ row }) => <MutedCell>{row.original.creci}</MutedCell>,
    },
    {
      id: 'email',
      header: 'E-mail',
      cell: ({ row }) => <MutedCell>{row.original.email}</MutedCell>,
      meta: { className: 'hidden md:table-cell', headClassName: 'hidden md:table-cell' },
    },
    {
      id: 'phone',
      header: 'Telefone',
      cell: ({ row }) => (
        <MutedCell>{row.original.phone ? formatPhone(row.original.phone) : null}</MutedCell>
      ),
      meta: { className: 'hidden md:table-cell', headClassName: 'hidden md:table-cell' },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => <BrokerRowActions broker={row.original} />,
      meta: { align: 'right', skeleton: { variant: 'actions' } },
    },
  ]
}

function BrokerRowActions({ broker }: { broker: BrokerResponse }) {
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <>
      <RowActionsMenu>
        <DropdownMenuItem onClick={() => navigate(`/corretores/${broker.id}`)}>
          Ver detalhes
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate(`/corretores/${broker.id}/editar`)}>
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

      <BrokerDeleteDialog
        brokerId={broker.id}
        brokerName={broker.full_name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onSuccess={() => navigate('/corretores')}
      />
    </>
  )
}
