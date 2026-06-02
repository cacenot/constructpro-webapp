import { useApiClient } from '@cacenot/construct-pro-api-client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { handleApiError, throwApiError } from '@/lib/api-error'

interface UnitDeleteDialogProps {
  unitId: number
  unitName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UnitDeleteDialog({ unitId, unitName, open, onOpenChange }: UnitDeleteDialogProps) {
  const { client } = useApiClient()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await client.DELETE('/api/v1/units/{unit_id}', {
        params: { path: { unit_id: unitId } },
      })
      if (error) throwApiError(error, 'Falha ao remover unidade')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units-summary'] })
      toast.success('Unidade removida com sucesso!')
      onOpenChange(false)
    },
    onError: (error) => handleApiError(error, 'Falha ao remover unidade'),
  })

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir unidade?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação removerá a unidade <strong>{unitName}</strong> do sistema. Deseja continuar?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              'Excluir'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
