import { useApiClient } from '@cacenot/construct-pro-api-client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { UserResponse } from '@/hooks/use-members-table'
import { handleApiError, throwApiError } from '@/lib/api-error'
import { cn } from '@/lib/utils'
import { AVAILABLE_ROLES, getRoleLabel } from '@/schemas/member.schema'

interface EditRolesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: UserResponse | null
}

export function EditRolesDialog({ open, onOpenChange, member }: EditRolesDialogProps) {
  const { client } = useApiClient()
  const queryClient = useQueryClient()
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (member?.roles) {
      setSelectedRoles(new Set(member.roles.map((r) => r.name)))
    }
  }, [member])

  const currentRoles = member?.roles?.map((r) => r.name) ?? []
  const rolesToAdd = [...selectedRoles].filter((r) => !currentRoles.includes(r))
  const rolesToRemove = currentRoles.filter((r) => !selectedRoles.has(r))
  const hasChanges = rolesToAdd.length > 0 || rolesToRemove.length > 0

  const mutation = useMutation({
    mutationFn: async () => {
      if (!member) return

      for (const roleName of rolesToAdd) {
        const { error } = await client.POST('/api/v1/users/{user_id}/roles', {
          params: { path: { user_id: member.id } },
          body: { role_name: roleName },
        })
        if (error) throwApiError(error, `Erro ao adicionar permissão ${getRoleLabel(roleName)}`)
      }

      for (const roleName of rolesToRemove) {
        const { error } = await client.DELETE('/api/v1/users/{user_id}/roles/{role_name}', {
          params: { path: { user_id: member.id, role_name: roleName } },
        })
        if (error) throwApiError(error, `Erro ao remover permissão ${getRoleLabel(roleName)}`)
      }
    },
    onSuccess: () => {
      toast.success('Permissões atualizadas com sucesso')
      queryClient.invalidateQueries({ queryKey: ['members'] })
      onOpenChange(false)
    },
    onError: (error) => handleApiError(error, 'Erro ao atualizar permissões'),
  })

  function toggleRole(roleName: string) {
    setSelectedRoles((prev) => {
      const next = new Set(prev)
      if (next.has(roleName)) {
        if (next.size <= 1) {
          toast.error('O membro deve ter pelo menos uma permissão')
          return prev
        }
        next.delete(roleName)
      } else {
        next.add(roleName)
      }
      return next
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !mutation.isPending && onOpenChange(v)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gerenciar Permissões</DialogTitle>
          <DialogDescription>
            Selecione as permissões de{' '}
            <span className="font-medium text-foreground">{member?.full_name}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2 py-4">
          {AVAILABLE_ROLES.map((role) => {
            const isSelected = selectedRoles.has(role.value)
            return (
              <button
                key={role.value}
                type="button"
                onClick={() => toggleRole(role.value)}
                className={cn(
                  'inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                  isSelected
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-border bg-muted/50 text-muted-foreground hover:bg-muted'
                )}
              >
                {role.label}
              </button>
            )
          })}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancelar
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={!hasChanges || mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
