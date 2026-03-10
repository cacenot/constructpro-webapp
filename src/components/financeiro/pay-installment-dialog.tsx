import { useApiClient } from '@cacenot/construct-pro-api-client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { InstallmentResponse } from '@/hooks/use-installments'
import { installmentKeys } from '@/hooks/use-installments'
import { formatCurrency } from '@/lib/utils'
import {
  type InstallmentPaymentFormData,
  installmentPaymentSchema,
} from '@/schemas/installment-payment.schema'

interface PayInstallmentDialogProps {
  installment: InstallmentResponse | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function parseCurrencyToCents(value: string): number {
  const digits = value.replace(/\D/g, '')
  return Number(digits)
}

export function PayInstallmentDialog({
  installment,
  open,
  onOpenChange,
}: PayInstallmentDialogProps) {
  const { client } = useApiClient()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<InstallmentPaymentFormData>({
    resolver: zodResolver(installmentPaymentSchema),
    defaultValues: {
      amount: installment ? (installment.current_amount_cents / 100).toFixed(2) : '',
      payment_method: undefined,
      paid_at: '',
      note: '',
    },
  })

  const paymentMethod = watch('payment_method')

  const mutation = useMutation({
    mutationFn: async (data: InstallmentPaymentFormData) => {
      if (!installment) throw new Error('Parcela não selecionada')

      const { data: response, error } = await client.POST(
        '/api/v1/installments/{installment_id}/pay',
        {
          params: { path: { installment_id: installment.id } },
          body: {
            amount_cents: parseCurrencyToCents(data.amount),
            payment_method: data.payment_method,
            paid_at: data.paid_at || undefined,
            note: data.note || undefined,
          },
        }
      )

      if (error) {
        throw new Error('Falha ao registrar pagamento')
      }

      return response
    },
    onSuccess: () => {
      toast.success('Pagamento registrado com sucesso')
      queryClient.invalidateQueries({ queryKey: installmentKeys.lists() })
      reset()
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao registrar pagamento')
    },
  })

  const onSubmit = handleSubmit((data) => mutation.mutate(data))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
          <DialogDescription>
            {installment && (
              <>
                Contrato #{installment.contract_id} — Vencimento: {installment.due_date}
                <br />
                Valor da parcela:{' '}
                <span className="tabular-nums font-medium">
                  {formatCurrency(installment.current_amount_cents / 100)}
                </span>
                {' — '}
                Restante:{' '}
                <span className="tabular-nums font-medium">{installment.remaining_amount}</span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Valor do pagamento</Label>
            <Input
              id="amount"
              placeholder="0.00"
              className="tabular-nums"
              {...register('amount')}
            />
            {errors.amount && <p className="text-sm text-red-600">{errors.amount.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Forma de pagamento</Label>
            <Select
              value={paymentMethod}
              onValueChange={(val) =>
                setValue('payment_method', val as InstallmentPaymentFormData['payment_method'])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">Pix</SelectItem>
                <SelectItem value="cash">Dinheiro</SelectItem>
                <SelectItem value="transfer">Transferência</SelectItem>
                <SelectItem value="card">Cartão</SelectItem>
              </SelectContent>
            </Select>
            {errors.payment_method && (
              <p className="text-sm text-red-600">{errors.payment_method.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="paid_at">Data do pagamento (opcional)</Label>
            <Input id="paid_at" type="datetime-local" {...register('paid_at')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Observação (opcional)</Label>
            <Textarea
              id="note"
              placeholder="Observações sobre o pagamento..."
              rows={2}
              {...register('note')}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Registrando...' : 'Registrar Pagamento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
