import { useApiClient } from '@cacenot/construct-pro-api-client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { UserResponse } from '@/hooks/use-members-table'
import { handleApiError, throwApiError } from '@/lib/api-error'

interface RemoveMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: UserResponse | null
}

export function RemoveMemberDialog({ open, onOpenChange, member }: RemoveMemberDialogProps) {
  const { client } = useApiClient()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      if (!member?.roles) return

      for (const role of member.roles) {
        const { error } = await client.DELETE('/api/v1/users/{user_id}/roles/{role_name}', {
          params: { path: { user_id: member.id, role_name: role.name } },
        })
        if (error) throwApiError(error, 'Erro ao remover membro da organização')
      }
    },
    onSuccess: () => {
      toast.success('Membro removido da organização')
      queryClient.invalidateQueries({ queryKey: ['members'] })
      onOpenChange(false)
    },
    onError: (error) => handleApiError(error, 'Erro ao remover membro da organização'),
  })

  return (
    <AlertDialog open={open} onOpenChange={(v) => !mutation.isPending && onOpenChange(v)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover membro</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja remover{' '}
            <span className="font-medium text-foreground">{member?.full_name}</span> da organização?
            Todas as permissões serão revogadas. Esta ação pode ser revertida adicionando o membro
            novamente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              mutation.mutate()
            }}
            disabled={mutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Remover
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
