import { useApiClient, useSale } from '@cacenot/construct-pro-api-client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { CurrencyInput } from '@/components/ui/currency-input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { InstallmentResponse } from '@/hooks/use-installments'
import { installmentKeys, useInstallments } from '@/hooks/use-installments'
import { formatCurrency, formatId } from '@/lib/utils'
import {
  type InstallmentPaymentFormData,
  installmentPaymentSchema,
} from '@/schemas/installment-payment.schema'

// Two usage modes:
// - Direct mode: pass `installment` prop (financeiro — installment already known)
// - Entry mode: pass `saleId` prop (vendas — fetches entry installment internally)
type PayInstallmentDialogProps =
  | {
      open: boolean
      onOpenChange: (open: boolean) => void
      installment: InstallmentResponse | null
      saleId?: never
    }
  | {
      open: boolean
      onOpenChange: (open: boolean) => void
      saleId: number
      installment?: never
    }

export function PayInstallmentDialog({
  open,
  onOpenChange,
  installment,
  saleId,
}: PayInstallmentDialogProps) {
  const { client } = useApiClient()
  const queryClient = useQueryClient()

  const [paidDate, setPaidDate] = useState<Date>(new Date())
  const [calendarOpen, setCalendarOpen] = useState(false)

  const isEntryMode = saleId !== undefined

  // Entry mode: fetch sale → contractId → entry installment
  const { data: sale, isLoading: loadingSale } = useSale(saleId ?? 0)
  const contractId = sale?.contract?.id

  const { data: installmentsData, isLoading: loadingInstallment } = useInstallments(
    isEntryMode && open && contractId
      ? { contract_id: String(contractId), kind: ['entry'], page_size: 1 }
      : undefined
  )

  const entryInstallment = installmentsData?.items?.[0]
  const resolvedInstallment = installment ?? entryInstallment
  const isLoading = isEntryMode && (loadingSale || loadingInstallment)

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<InstallmentPaymentFormData>({
    resolver: zodResolver(installmentPaymentSchema),
    defaultValues: {
      amount_cents: installment?.current_amount_cents ?? 0,
      payment_method: undefined,
      paid_at: `${format(new Date(), 'yyyy-MM-dd')}T00:00:00Z`,
      note: '',
    },
  })

  // Pre-fill amount when entry installment loads asynchronously
  useEffect(() => {
    if (entryInstallment) {
      setValue('amount_cents', entryInstallment.current_amount_cents)
    }
  }, [entryInstallment, setValue])

  // Reset form when dialog opens with a new installment
  useEffect(() => {
    if (open && resolvedInstallment) {
      reset({
        amount_cents: resolvedInstallment.current_amount_cents,
        payment_method: undefined,
        paid_at: `${format(new Date(), 'yyyy-MM-dd')}T00:00:00Z`,
        note: '',
      })
      setPaidDate(new Date())
    }
  }, [open, resolvedInstallment, reset])

  const paymentMethod = watch('payment_method')

  const mutation = useMutation({
    mutationFn: async (data: InstallmentPaymentFormData) => {
      if (!resolvedInstallment) {
        throw new Error(
          isEntryMode ? 'Parcela de entrada não encontrada' : 'Parcela não selecionada'
        )
      }

      const { data: response, error } = await client.POST(
        '/api/v1/installments/{installment_id}/pay',
        {
          params: { path: { installment_id: resolvedInstallment.id } },
          body: {
            amount_cents: data.amount_cents,
            payment_method: data.payment_method,
            paid_at: data.paid_at || undefined,
            note: data.note || undefined,
          },
        }
      )

      if (error) {
        const detail = (error as { detail?: string }).detail
        throw new Error(detail || 'Falha ao registrar pagamento')
      }

      return response
    },
    onSuccess: () => {
      toast.success(
        isEntryMode
          ? 'Pagamento do sinal registrado com sucesso'
          : 'Pagamento registrado com sucesso'
      )
      queryClient.invalidateQueries({ queryKey: installmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: installmentKeys.summaries() })
      if (isEntryMode) {
        queryClient.invalidateQueries({ queryKey: ['sales'] })
      }
      reset()
      setPaidDate(new Date())
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
          <DialogTitle>
            {isEntryMode ? 'Confirmar Pagamento do Sinal' : 'Registrar Pagamento'}
          </DialogTitle>
          <DialogDescription>
            {isEntryMode ? (
              <>
                Proposta {formatId(saleId)}
                {resolvedInstallment && (
                  <>
                    {' — '}Vencimento: {resolvedInstallment.due_date} — Valor:{' '}
                    <span className="tabular-nums font-medium">
                      {formatCurrency(resolvedInstallment.current_amount_cents / 100)}
                    </span>
                  </>
                )}
              </>
            ) : (
              resolvedInstallment && (
                <>
                  Contrato #{resolvedInstallment.contract_id} — Vencimento:{' '}
                  {resolvedInstallment.due_date}
                  <br />
                  Valor da parcela:{' '}
                  <span className="tabular-nums font-medium">
                    {formatCurrency(resolvedInstallment.current_amount_cents / 100)}
                  </span>
                  {resolvedInstallment.remaining_amount && (
                    <>
                      {' — '}
                      Restante:{' '}
                      <span className="tabular-nums font-medium">
                        {formatCurrency(Number(resolvedInstallment.remaining_amount))}
                      </span>
                    </>
                  )}
                </>
              )
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : isEntryMode && !resolvedInstallment ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Parcela de entrada não encontrada para este contrato.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount_cents">Valor do pagamento</Label>
              <Controller
                control={control}
                name="amount_cents"
                render={({ field }) => (
                  <CurrencyInput id="amount_cents" value={field.value} onChange={field.onChange} />
                )}
              />
              {errors.amount_cents && (
                <p className="text-sm text-red-600">{errors.amount_cents.message}</p>
              )}
              {isEntryMode && (
                <p className="text-xs text-muted-foreground">
                  Pagamentos parciais serão alocados na parcela de entrada.
                </p>
              )}
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
              <Label>{isEntryMode ? 'Data do recebimento' : 'Data do pagamento'}</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start gap-2 font-normal">
                    <CalendarIcon className="size-4 text-muted-foreground" />
                    {format(paidDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={paidDate}
                    onSelect={(date) => {
                      if (date) {
                        setPaidDate(date)
                        setValue('paid_at', `${format(date, 'yyyy-MM-dd')}T00:00:00Z`)
                        setCalendarOpen(false)
                      }
                    }}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Observação (opcional)</Label>
              <Controller
                control={control}
                name="note"
                render={({ field }) => (
                  <Textarea
                    id="note"
                    placeholder="Observações sobre o pagamento..."
                    rows={2}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending
                  ? 'Registrando...'
                  : isEntryMode
                    ? 'Receber sinal/entrada'
                    : 'Registrar Pagamento'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
