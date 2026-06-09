import { useApiClient, useSale } from '@cacenot/construct-pro-api-client'
import { translateInstallmentKind } from '@cacenot/construct-pro-api-client/enums'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { contractDetailKeys } from '@/hooks/use-contract-detail'
import type { InstallmentResponse } from '@/hooks/use-installments'
import { installmentKeys, useInstallments } from '@/hooks/use-installments'
import { useTenantConfig } from '@/hooks/use-tenant-config'
import { handleApiError, throwApiError } from '@/lib/api-error'
import { installmentDaysOverdue, isInstallmentOverdue } from '@/lib/installment-overdue'
import { centsToReaisString, formatCurrency, formatId } from '@/lib/utils'
import {
  type InstallmentPaymentFormData,
  installmentPaymentSchema,
} from '@/schemas/installment-payment.schema'
import { InstallmentStatusBadge } from './installment-status-badge'

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

  const { data: tenantConfig } = useTenantConfig()
  const [paidDate, setPaidDate] = useState<Date>(new Date())
  const [calendarOpen, setCalendarOpen] = useState(false)

  const isEntryMode = saleId !== undefined

  // Entry mode: fetch sale → contractId → entry installment
  const { data: sale, isLoading: loadingSale } = useSale(saleId ?? 0)
  const contractId = sale?.contract?.id

  const { data: installmentsData, isLoading: loadingInstallment } = useInstallments(
    isEntryMode && open && contractId
      ? { contract_id: contractId, kind: ['entry'], page_size: 1 }
      : undefined
  )

  const entryInstallment = installmentsData?.items?.[0]
  const resolvedInstallment = installment ?? entryInstallment
  const isLoading = isEntryMode && (loadingSale || loadingInstallment)

  const isEntryInstallment = resolvedInstallment?.kind === 'entry'
  const allowPartialPayments = isEntryInstallment
    ? (tenantConfig?.allow_partial_payments_for_entry ?? true)
    : (tenantConfig?.allow_partial_payments ?? false)
  const maxAmountCents = resolvedInstallment?.current_amount?.cents ?? 0

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
      amount_cents: installment?.current_amount?.cents ?? 0,
      payment_method: undefined,
      paid_at: `${format(new Date(), 'yyyy-MM-dd')}T00:00:00Z`,
      note: '',
    },
  })

  // Pre-fill amount when entry installment loads asynchronously
  useEffect(() => {
    if (entryInstallment) {
      setValue('amount_cents', entryInstallment.current_amount?.cents ?? 0)
    }
  }, [entryInstallment, setValue])

  // Reset form when dialog opens with a new installment
  useEffect(() => {
    if (open && resolvedInstallment) {
      reset({
        amount_cents: resolvedInstallment.current_amount?.cents ?? 0,
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
            amount: centsToReaisString(data.amount_cents),
            payment_method: data.payment_method,
            paid_at: data.paid_at || undefined,
            note: data.note || undefined,
          },
        }
      )

      if (error) throwApiError(error, 'Falha ao registrar pagamento')

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
      // Atualiza a saúde financeira ao vivo do deal console (['contracts','detail',id])
      // — o prefixo invalida o detalhe do contrato afetado pelo pagamento.
      queryClient.invalidateQueries({ queryKey: contractDetailKeys.details() })
      if (isEntryMode) {
        queryClient.invalidateQueries({ queryKey: ['sales'] })
      }
      reset()
      setPaidDate(new Date())
      onOpenChange(false)
    },
    onError: (error) => handleApiError(error, 'Erro ao registrar pagamento'),
  })

  const onSubmit = handleSubmit((data) => mutation.mutate(data))

  const overdue = resolvedInstallment ? isInstallmentOverdue(resolvedInstallment) : false
  const daysOverdue = resolvedInstallment ? installmentDaysOverdue(resolvedInstallment) : 0
  const currentCents = resolvedInstallment?.current_amount?.cents ?? 0
  const remainingCents = resolvedInstallment?.remaining_amount?.cents ?? currentCents
  const isPartiallyPaid = remainingCents > 0 && remainingCents < currentCents

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
        {/* Foco no topo: a parcela selecionada (valor, identidade, vencimento, status). */}
        <SheetHeader className="gap-3 border-b p-5">
          <div className="flex items-center justify-between gap-3 pr-6">
            <SheetTitle className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {isEntryMode ? 'Pagamento do sinal' : 'Registrar pagamento'}
            </SheetTitle>
            {resolvedInstallment?.status && (
              <InstallmentStatusBadge
                status={resolvedInstallment.status}
                overdue={overdue}
                daysOverdue={daysOverdue}
              />
            )}
          </div>

          {resolvedInstallment ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-3xl font-semibold tracking-tight tabular-nums">
                {formatCurrency(currentCents / 100)}
              </span>
              <SheetDescription className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                <span className="font-mono tabular-nums text-foreground/80">
                  {isEntryMode
                    ? `Proposta ${formatId(saleId)}`
                    : `#${resolvedInstallment.contract_id}`}
                  {resolvedInstallment.installment_number != null &&
                    ` · Parcela ${resolvedInstallment.installment_number}`}
                </span>
                <span aria-hidden>·</span>
                <span>{translateInstallmentKind(resolvedInstallment.kind, 'pt-BR')}</span>
              </SheetDescription>
              <span
                className={`text-sm ${overdue ? 'font-medium text-destructive' : 'text-muted-foreground'}`}
              >
                Vence{' '}
                {format(parseISO(resolvedInstallment.due_date), "dd 'de' MMM. 'de' yyyy", {
                  locale: ptBR,
                })}
                {overdue &&
                  daysOverdue > 0 &&
                  ` · há ${daysOverdue} ${daysOverdue === 1 ? 'dia' : 'dias'}`}
              </span>
              {isPartiallyPaid && (
                <span className="text-sm text-muted-foreground">
                  Restante{' '}
                  <span className="font-medium tabular-nums text-foreground">
                    {formatCurrency(remainingCents / 100)}
                  </span>
                </span>
              )}
            </div>
          ) : (
            <SheetDescription>
              {isEntryMode
                ? 'Buscando a parcela de entrada deste contrato...'
                : 'Selecione uma parcela para registrar o pagamento.'}
            </SheetDescription>
          )}
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col">
          {isLoading ? (
            <div className="flex flex-1 items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : isEntryMode && !resolvedInstallment ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">
              Parcela de entrada não encontrada para este contrato.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-5 overflow-y-auto p-5">
                <div className="space-y-2">
                  <Label htmlFor="amount_cents">Valor do pagamento</Label>
                  <Controller
                    control={control}
                    name="amount_cents"
                    render={({ field }) => (
                      <CurrencyInput
                        id="amount_cents"
                        value={field.value}
                        onChange={(cents) => {
                          const clamped =
                            maxAmountCents > 0 ? Math.min(cents, maxAmountCents) : cents
                          field.onChange(clamped)
                        }}
                        readOnly={!allowPartialPayments}
                      />
                    )}
                  />
                  {errors.amount_cents && (
                    <p className="text-sm text-destructive">{errors.amount_cents.message}</p>
                  )}
                  {!allowPartialPayments && (
                    <p className="text-xs text-muted-foreground">
                      Pagamento parcial não está habilitado para este tipo de parcela.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Forma de pagamento</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={(val) =>
                      setValue(
                        'payment_method',
                        val as InstallmentPaymentFormData['payment_method']
                      )
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
                    <p className="text-sm text-destructive">{errors.payment_method.message}</p>
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
              </div>

              <SheetFooter className="flex-row justify-end gap-2 border-t">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending
                    ? 'Registrando...'
                    : isEntryMode
                      ? 'Receber sinal/entrada'
                      : 'Registrar pagamento'}
                </Button>
              </SheetFooter>
            </form>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
