import { RefreshCw, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { UserResponse } from '@/hooks/use-members-table'
import { useMembersTable } from '@/hooks/use-members-table'
import { CreateMemberDialog } from './create-member-dialog'
import { EditRolesDialog } from './edit-roles-dialog'
import { MembersFilters } from './members-filters'
import { MembersPagination } from './members-pagination'
import { MembersTable } from './members-table'
import { RemoveMemberDialog } from './remove-member-dialog'

export function MembersSection() {
  const {
    data,
    isLoading,
    isError,
    refetch,
    hasActiveFilters,
    handleClearFilters,
    filters,
    pagination,
    sort,
  } = useMembersTable()

  const [createOpen, setCreateOpen] = useState(false)
  const [editRolesMember, setEditRolesMember] = useState<UserResponse | null>(null)
  const [removeMember, setRemoveMember] = useState<UserResponse | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <MembersFilters
          {...filters}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={() => setCreateOpen(true)}>
              <UserPlus className="mr-2 size-4" />
              Adicionar Membro
            </Button>
          </TooltipTrigger>
          <TooltipContent>Adicionar novo membro à organização</TooltipContent>
        </Tooltip>
      </div>

      {isError ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-border/50 py-16 text-center">
          <div className="space-y-1">
            <p className="text-sm font-medium">Não foi possível carregar os membros</p>
            <p className="text-sm text-muted-foreground">
              Verifique sua conexão e tente novamente.
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 size-4" />
            Tentar novamente
          </Button>
        </div>
      ) : (
        <Card className="overflow-hidden border-border/50">
          <MembersTable
            data={data}
            isLoading={isLoading}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={handleClearFilters}
            sort={sort}
            onEditRoles={setEditRolesMember}
            onRemove={setRemoveMember}
          />
          <MembersPagination {...pagination} />
        </Card>
      )}

      <CreateMemberDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditRolesDialog
        open={!!editRolesMember}
        onOpenChange={(open) => !open && setEditRolesMember(null)}
        member={editRolesMember}
      />
      <RemoveMemberDialog
        open={!!removeMember}
        onOpenChange={(open) => !open && setRemoveMember(null)}
        member={removeMember}
      />
    </div>
  )
}
