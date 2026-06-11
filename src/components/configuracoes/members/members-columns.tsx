import type { ColumnDef } from '@tanstack/react-table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { DateCell, MutedCell, PrimaryCell, RowActionsMenu } from '@/components/ui/data-table-cells'
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { SortableHeader } from '@/components/ui/sortable-header'
import type { UserResponse } from '@/hooks/use-members-table'
import { formatDocument, formatPhone } from '@/lib/text-formatters'
import { getInitials } from '@/lib/utils'
import { getRoleLabel } from '@/schemas/member.schema'

export interface MembersTableMeta {
  sort: string
  onSort: (field: string) => void
}

interface MembersColumnsCallbacks {
  onEditRoles: (member: UserResponse) => void
  onRemove: (member: UserResponse) => void
}

export function createMembersColumns({
  onEditRoles,
  onRemove,
}: MembersColumnsCallbacks): ColumnDef<UserResponse>[] {
  return [
    {
      id: 'full_name',
      header: ({ table }) => {
        const meta = table.options.meta as MembersTableMeta | undefined
        if (!meta) return 'Nome'
        return (
          <SortableHeader
            label="Nome"
            field="full_name"
            currentSort={meta.sort}
            onSort={meta.onSort}
          />
        )
      },
      // A âncora compõe avatar + PrimaryCell lado a lado (spec §2.7 opção a): a
      // receita base não carrega avatar, então a coluna o renderiza inline.
      cell: ({ row }) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="size-8 shrink-0">
            <AvatarImage src={row.original.photo_url ?? undefined} alt={row.original.full_name} />
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {getInitials(row.original.full_name)}
            </AvatarFallback>
          </Avatar>
          <PrimaryCell title={row.original.full_name} subtitle={row.original.email} />
        </div>
      ),
    },
    {
      id: 'cpf',
      header: 'CPF',
      cell: ({ row }) => (
        <MutedCell>
          <span className="tabular-nums">{formatDocument(row.original.cpf)}</span>
        </MutedCell>
      ),
      meta: { className: 'hidden md:table-cell', headClassName: 'hidden md:table-cell' },
    },
    {
      id: 'phone_number',
      header: 'Telefone',
      cell: ({ row }) => (
        <MutedCell>
          {row.original.phone_number ? formatPhone(row.original.phone_number) : null}
        </MutedCell>
      ),
      meta: { className: 'hidden lg:table-cell', headClassName: 'hidden lg:table-cell' },
    },
    {
      id: 'roles',
      header: 'Permissões',
      cell: ({ row }) => {
        const roles = row.original.roles
        if (!roles || roles.length === 0) {
          return <span className="text-xs text-muted-foreground">Sem permissão</span>
        }
        return (
          <div className="flex flex-wrap gap-1">
            {roles.map((role) => (
              <Badge key={role.id} variant="secondary" className="text-xs">
                {getRoleLabel(role.name)}
              </Badge>
            ))}
          </div>
        )
      },
    },
    {
      id: 'created_at',
      header: ({ table }) => {
        const meta = table.options.meta as MembersTableMeta | undefined
        if (!meta) return 'Cadastro'
        return (
          <SortableHeader
            label="Cadastro"
            field="created_at"
            currentSort={meta.sort}
            onSort={meta.onSort}
          />
        )
      },
      cell: ({ row }) => <DateCell date={row.original.created_at} />,
      meta: { className: 'hidden lg:table-cell', headClassName: 'hidden lg:table-cell' },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const member = row.original
        return (
          <RowActionsMenu>
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
          </RowActionsMenu>
        )
      },
      meta: { align: 'right' },
    },
  ]
}
