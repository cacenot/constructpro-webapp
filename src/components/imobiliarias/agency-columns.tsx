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
import type { AgencyResponse } from '@/hooks/use-agencies-table'
import { formatDocument } from '@/lib/text-formatters'
import { AgencyDeleteDialog } from './agency-delete-dialog'

export function createAgencyColumns(): ColumnDef<AgencyResponse>[] {
  return [
    {
      id: 'legal_name',
      header: 'Razão Social',
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="truncate text-sm font-medium">{row.original.legal_name}</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatDocument(row.original.cnpj)}
          </span>
        </div>
      ),
    },
    {
      id: 'trade_name',
      header: () => <span className="hidden md:block">Nome Fantasia</span>,
      cell: ({ row }) => (
        <span className="hidden md:block text-sm text-muted-foreground truncate max-w-[180px]">
          {row.original.trade_name || '—'}
        </span>
      ),
    },
    {
      id: 'creci_j',
      header: 'CRECI-J',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.creci_j}</span>
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
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const agency = row.original
        return <AgencyRowActions agency={agency} />
      },
    },
  ]
}

function AgencyRowActions({ agency }: { agency: AgencyResponse }) {
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
        </DropdownMenuContent>
      </DropdownMenu>

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
