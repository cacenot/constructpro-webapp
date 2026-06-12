import { UserPlus } from 'lucide-react'
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

      {/*
        Diferente das listas de domínio (fill-height + scroll infinito), membros vive
        num Card de altura natural dentro do SettingsLayout (master-detail). Sem um
        container de altura fixa o scroll infinito não tem onde ancorar, então aqui a
        paginação por offset (com URL-state via nuqs) é a escolha correta — não o
        padrão DataTableInfinite. Decisão intencional, não um desvio do plano.
      */}
      <Card className="overflow-hidden border-border/50">
        <MembersTable
          data={data}
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
          sort={sort}
          onEditRoles={setEditRolesMember}
          onRemove={setRemoveMember}
        />
        {!isError && <MembersPagination {...pagination} />}
      </Card>

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
