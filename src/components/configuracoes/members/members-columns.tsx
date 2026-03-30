import type { ColumnDef } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown, MoreVertical } from 'lucide-react'
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
import type { UserResponse } from '@/hooks/use-members-table'
import { formatDocument, formatPhone } from '@/lib/text-formatters'
import { getRoleLabel } from '@/schemas/member.schema'

function SortIcon({ column, sort }: { column: string; sort: string }) {
  if (!sort.startsWith(column)) return <ArrowUpDown className="ml-1 size-3 text-muted-foreground" />
  return sort.endsWith(':asc') ? (
    <ArrowUp className="ml-1 size-3" />
  ) : (
    <ArrowDown className="ml-1 size-3" />
  )
}

interface MembersColumnsCallbacks {
  sort: string
  onSort: (value: string) => void
  onEditRoles: (member: UserResponse) => void
  onRemove: (member: UserResponse) => void
}

export function createMembersColumns({
  sort,
  onSort,
  onEditRoles,
  onRemove,
}: MembersColumnsCallbacks): ColumnDef<UserResponse>[] {
  function toggleSort(column: string) {
    if (sort === `${column}:desc`) {
      onSort(`${column}:asc`)
    } else {
      onSort(`${column}:desc`)
    }
  }

  return [
    {
      id: 'full_name',
      header: () => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 font-medium"
          onClick={() => toggleSort('full_name')}
        >
          Nome
          <SortIcon column="full_name" sort={sort} />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="truncate text-sm font-medium">{row.original.full_name}</span>
          <span className="truncate text-xs text-muted-foreground">{row.original.email}</span>
        </div>
      ),
    },
    {
      id: 'cpf',
      header: 'CPF',
      cell: ({ row }) => (
        <span className="hidden md:block text-sm tabular-nums text-muted-foreground">
          {formatDocument(row.original.cpf)}
        </span>
      ),
    },
    {
      id: 'phone_number',
      header: 'Telefone',
      cell: ({ row }) => (
        <span className="hidden lg:block text-sm text-muted-foreground">
          {row.original.phone_number ? formatPhone(row.original.phone_number) : '—'}
        </span>
      ),
    },
    {
      id: 'roles',
      header: 'Permissões',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.roles?.map((role) => (
            <Badge key={role.id} variant="secondary" className="text-xs">
              {getRoleLabel(role.name)}
            </Badge>
          )) ?? <span className="text-xs text-muted-foreground">Sem permissão</span>}
        </div>
      ),
    },
    {
      id: 'created_at',
      header: () => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 font-medium hidden lg:inline-flex"
          onClick={() => toggleSort('created_at')}
        >
          Cadastro
          <SortIcon column="created_at" sort={sort} />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="hidden lg:block text-sm text-muted-foreground tabular-nums">
          {new Date(row.original.created_at).toLocaleDateString('pt-BR')}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const member = row.original
        return (
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8">
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Ações</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEditRoles(member)}>
                Gerenciar Permissões
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onRemove(member)}
              >
                Remover da Organização
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
