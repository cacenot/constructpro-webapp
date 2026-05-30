import type { ColumnDef } from '@tanstack/react-table'
import { MoreVertical } from 'lucide-react'
import { useState } from 'react'
import { navigate } from 'vike/client/router'
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
import type { BrokerResponse } from '@/hooks/use-brokers-table'
import { formatDocument, formatPhone } from '@/lib/text-formatters'
import { BrokerDeleteDialog } from './broker-delete-dialog'

export function createBrokerColumns(): ColumnDef<BrokerResponse>[] {
  return [
    {
      id: 'full_name',
      header: 'Nome',
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="truncate text-sm font-medium">{row.original.full_name}</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatDocument(row.original.cpf)}
          </span>
        </div>
      ),
    },
    {
      id: 'creci',
      header: 'CRECI',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.creci}</span>
      ),
    },
    {
      id: 'email',
      header: () => <span className="hidden md:block">E-mail</span>,
      cell: ({ row }) => (
        <span className="hidden md:block text-sm text-muted-foreground truncate max-w-[180px]">
          {row.original.email || '—'}
        </span>
      ),
    },
    {
      id: 'phone',
      header: () => <span className="hidden md:block">Telefone</span>,
      cell: ({ row }) => (
        <span className="hidden md:block text-sm text-muted-foreground tabular-nums">
          {row.original.phone ? formatPhone(row.original.phone) : '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const broker = row.original
        return <BrokerRowActions broker={broker} />
      },
    },
  ]
}

function BrokerRowActions({ broker }: { broker: BrokerResponse }) {
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <>
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
        </DropdownMenuContent>
      </DropdownMenu>

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
