import { useApiClient } from '@cacenot/construct-pro-api-client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
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
import { formatId } from '@/lib/utils'

interface ApproveSaleDialogProps {
  saleId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ApproveSaleDialog({ saleId, open, onOpenChange }: ApproveSaleDialogProps) {
  const { client } = useApiClient()
  const queryClient = useQueryClient()

  const approveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await client.POST('/api/v1/sales/{sale_id}/approve', {
        params: { path: { sale_id: saleId } },
      })

      if (error) {
        throw new Error((error as { detail?: string }).detail || 'Erro ao aprovar proposta')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['sales-summary'] })
      toast.success('Proposta aprovada! Contrato e parcelas gerados com sucesso.')
      onOpenChange(false)
    },
    onError: (err) => {
      toast.error(err.message || 'Erro ao aprovar proposta')
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Aprovar Proposta {formatId(saleId)}</DialogTitle>
          <DialogDescription>
            Ao aprovar, o contrato e as parcelas serão gerados e a unidade será reservada. Esta ação
            não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={approveMutation.isPending}
          >
            Cancelar
          </Button>
          <Button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}>
            {approveMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Aprovar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
