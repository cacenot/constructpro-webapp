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

interface BrokerDeleteDialogProps {
  brokerId: number
  brokerName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function BrokerDeleteDialog({
  brokerId,
  brokerName,
  open,
  onOpenChange,
  onSuccess,
}: BrokerDeleteDialogProps) {
  const { client } = useApiClient()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await client.DELETE('/api/v1/brokers/{broker_id}', {
        params: { path: { broker_id: brokerId } },
      })
      if (error) throwApiError(error, 'Falha ao remover corretor')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brokers'] })
      toast.success('Corretor removido com sucesso!')
      onOpenChange(false)
      onSuccess?.()
    },
    onError: (error) => handleApiError(error, 'Falha ao remover corretor'),
  })

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir corretor?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação removerá o corretor <strong>{brokerName}</strong> do sistema. Deseja
            continuar?
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
