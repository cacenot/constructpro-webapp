import { ArrowLeft, ArrowRight, Loader2, Save } from 'lucide-react'
import * as React from 'react'
import { type UseFormReturn, useFieldArray, useWatch } from 'react-hook-form'
import type { SelectedAgency } from '@/components/ui/agency-autocomplete'
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
import type { SelectedBroker } from '@/components/ui/broker-autocomplete'
import { Button } from '@/components/ui/button'
import { formatCentsToDisplay } from '@/components/ui/currency-input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { computeProposalVitals } from '@/lib/proposal-vitals'
import { InstallmentLedger } from './installment-ledger'
import { ProposalMediation } from './proposal-mediation'
import { ProposalStep, type StepState } from './proposal-step'
import { ProposalVitals } from './proposal-vitals'

const money = (cents: number) => `R$ ${formatCentsToDisplay(cents) || '0,00'}`

// Campos validados ao concluir cada etapa. Partes: só no modo criação (edição é leitura).
const STEP_FIELDS: Record<'create' | 'edit', string[][]> = {
  create: [['unit_id', 'customer_id'], ['index_type_code', 'installment_schedules'], []],
  edit: [[], ['index_type_code', 'installment_schedules'], []],
}

interface DataProps {
  indexTypes: { code: string }[]
  indexTypesLoading: boolean
  maxInstallmentsPerMonth: number
  maxCommissionRate: number
}

interface ProposalWorkbenchProps extends DataProps {
  // biome-ignore lint/suspicious/noExplicitAny: suporta SaleFormData e SaleEditFormData
  form: UseFormReturn<any>
  mode: 'create' | 'edit'
  eyebrow: string
  title: string
  /** Corpo da etapa Partes (autocomplete na criação, leitura na edição). */
  parties: React.ReactNode
  /** Resumo compacto das partes, exibido quando a etapa 1 está recolhida. */
  partiesSummary: React.ReactNode
  statusBadge?: React.ReactNode
  notice?: React.ReactNode
  unitPriceCents: number
  /** Edição bloqueada (status ≠ proposta): tudo em leitura, sem navegação por etapas. */
  disabled?: boolean
  isSubmitting?: boolean
  submitLabel: string
  // biome-ignore lint/suspicious/noExplicitAny: payload do schema ativo
  onSubmit: (data: any) => void | Promise<void>
  onCancel: () => void
}

export function ProposalWorkbench({
  form,
  mode,
  eyebrow,
  title,
  parties,
  partiesSummary,
  statusBadge,
  notice,
  unitPriceCents,
  disabled = false,
  isSubmitting = false,
  submitLabel,
  onSubmit,
  onCancel,
  indexTypes,
  indexTypesLoading,
  maxInstallmentsPerMonth,
  maxCommissionRate,
}: ProposalWorkbenchProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'installment_schedules',
  })

  const watchedSchedules = useWatch({ control: form.control, name: 'installment_schedules' })
  const watchedBrokerId = useWatch({ control: form.control, name: 'broker_id' })
  const watchedAgencyId = useWatch({ control: form.control, name: 'agency_id' })
  const watchedBrokerRate = useWatch({ control: form.control, name: 'commission_broker_rate' })
  const watchedAgencyRate = useWatch({ control: form.control, name: 'commission_agency_rate' })
  const sameIndexForAll = (useWatch({ control: form.control, name: 'same_index_for_all' }) ??
    true) as boolean

  // Erros são exibidos ao Continuar/Salvar (via form.trigger). Depois disso, cada erro
  // se limpa sozinho assim que o campo é corrigido — revalidamos apenas o campo alterado
  // que já tem erro, sem exigir novo submit e sem "acender" campos ainda intocados.
  React.useEffect(() => {
    const sub = form.watch((_values, { name }) => {
      if (name && form.getFieldState(name).error) form.trigger(name)
    })
    return () => sub.unsubscribe()
  }, [form])

  const vitals = React.useMemo(
    () =>
      computeProposalVitals(watchedSchedules, unitPriceCents, maxInstallmentsPerMonth, {
        brokerId: watchedBrokerId,
        brokerRate: watchedBrokerRate,
        agencyRate: watchedAgencyRate,
        capPercent: maxCommissionRate,
      }),
    [
      watchedSchedules,
      unitPriceCents,
      maxInstallmentsPerMonth,
      watchedBrokerId,
      watchedBrokerRate,
      watchedAgencyRate,
      maxCommissionRate,
    ]
  )

  // Edição bloqueada abre tudo de uma vez (leitura); criação/edição livre usa etapas.
  const [currentStep, setCurrentStep] = React.useState(0)
  const [maxReached, setMaxReached] = React.useState(disabled ? 2 : 0)
  // Nomes selecionados na mediação, para o resumo da etapa (autocomplete busca por id).
  const [brokerName, setBrokerName] = React.useState<string | null>(null)
  const [agencyName, setAgencyName] = React.useState<string | null>(null)
  // Confirmação ao avançar da etapa de pagamento com total fora do preço de tabela.
  const [showDivergence, setShowDivergence] = React.useState(false)

  const handleBrokerSelect = React.useCallback((broker: SelectedBroker | null) => {
    setBrokerName(broker?.full_name ?? null)
    if (!broker) setAgencyName(null)
  }, [])
  const handleAgencySelect = React.useCallback((agency: SelectedAgency | null) => {
    setAgencyName(agency?.name ?? null)
  }, [])

  const handleToggleIndex = React.useCallback(
    (value: boolean) => {
      form.setValue('same_index_for_all', value)
      const schedules = form.getValues('installment_schedules')
      if (!value) {
        const globalIndex = form.getValues('index_type_code')
        if (globalIndex) {
          schedules.forEach((_: unknown, i: number) => {
            form.setValue(`installment_schedules.${i}.index_type_code`, globalIndex)
          })
        }
      } else {
        const firstNonEntry = schedules.find((s: { kind: string }) => s.kind !== 'entry') as
          | { index_type_code?: string }
          | undefined
        form.setValue('index_type_code', firstNonEntry?.index_type_code ?? '')
      }
    },
    [form]
  )

  const goTo = React.useCallback((step: number) => {
    setCurrentStep(step)
    setMaxReached((m) => Math.max(m, step))
  }, [])

  const hasDivergence = unitPriceCents > 0 && Math.abs(vitals.diff) > 0

  const handleContinue = React.useCallback(async () => {
    const stepFields = STEP_FIELDS[mode][currentStep] ?? []
    const ok = stepFields.length === 0 || (await form.trigger(stepFields))
    if (!ok) return
    // Ao sair do plano de pagamento, confirma se o total foge do preço de tabela.
    if (currentStep === 1 && hasDivergence) {
      setShowDivergence(true)
      return
    }
    goTo(Math.min(currentStep + 1, 2))
  }, [mode, currentStep, form, goTo, hasDivergence])

  const handleSave = React.useCallback(async () => {
    const ok = await form.trigger()
    if (!ok) {
      const errs = form.formState.errors
      if (mode === 'create' && (errs.unit_id || errs.customer_id)) setCurrentStep(0)
      else if (errs.index_type_code || errs.installment_schedules) setCurrentStep(1)
      return
    }
    if (vitals.commission?.exceedsCap) {
      form.setError('commission_broker_rate', {
        type: 'manual',
        message: 'A soma das comissões excede o teto da organização.',
      })
      setCurrentStep(2)
      return
    }
    await onSubmit(form.getValues())
  }, [form, mode, vitals.commission, onSubmit])

  const stepState = (i: number): StepState =>
    disabled ? 'done' : i === currentStep ? 'active' : i <= maxReached ? 'done' : 'todo'

  const paymentSummary = () => {
    const idx = sameIndexForAll ? form.getValues('index_type_code') || '—' : 'índices por grupo'
    const n = vitals.count
    return `${idx} · ${n} ${n === 1 ? 'parcela' : 'parcelas'} · ${money(vitals.total)}`
  }

  const mediationSummary = () => {
    if (!watchedBrokerId) return 'Sem mediação'
    const names = [brokerName ?? 'Corretor']
    if (watchedAgencyId) names.push(agencyName ?? 'Imobiliária')
    const c = vitals.commission
    return `${names.join(' + ')}${c ? ` · ${c.totalPercent.toString().replace('.', ',')}%` : ''}`
  }

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()} className="relative">
        <div className="space-y-8">
          {/* Header */}
          <header className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onCancel}
                  className="-ml-2 shrink-0"
                >
                  <ArrowLeft className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Voltar para Vendas</p>
              </TooltipContent>
            </Tooltip>
            <div className="min-w-0">
              <p className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                {eyebrow}
              </p>
              <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            </div>
            {statusBadge != null && <div className="ml-auto shrink-0">{statusBadge}</div>}
          </header>

          {notice}

          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
            {/* Acordeão de etapas */}
            <div className="divide-y divide-border">
              {/* Etapa 1 — Partes e unidade */}
              <ProposalStep
                index={0}
                state={stepState(0)}
                expanded={disabled || undefined}
                title="Unidade e cliente"
                summary={partiesSummary}
                onEdit={() => setCurrentStep(0)}
              >
                {parties}
                {!disabled && (
                  <StepFooter
                    primary={
                      <Button type="button" onClick={handleContinue}>
                        Continuar
                        <ArrowRight className="size-4" />
                      </Button>
                    }
                  />
                )}
              </ProposalStep>

              {/* Etapa 2 — Plano de pagamento */}
              <ProposalStep
                index={1}
                state={stepState(1)}
                expanded={disabled || undefined}
                title="Plano de pagamento"
                summary={paymentSummary()}
                onEdit={() => goTo(1)}
              >
                <div className="space-y-6">
                  {/* Índice + switch agrupados: o switch controla este índice */}
                  <div className="space-y-3 rounded-lg border border-border p-4 sm:p-5">
                    <div className="flex items-center gap-2.5">
                      <Switch
                        id="same-index"
                        checked={sameIndexForAll}
                        onCheckedChange={handleToggleIndex}
                        disabled={disabled}
                      />
                      <label
                        htmlFor="same-index"
                        className="cursor-pointer text-sm font-medium leading-none"
                      >
                        Mesmo índice para toda a proposta
                      </label>
                    </div>
                    {sameIndexForAll ? (
                      <FormField
                        control={form.control}
                        name="index_type_code"
                        render={({ field }) => (
                          <FormItem className="max-w-xs">
                            <FormLabel>Índice de correção *</FormLabel>
                            <Select
                              value={field.value ?? ''}
                              onValueChange={field.onChange}
                              disabled={disabled || indexTypesLoading}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full font-mono">
                                  <SelectValue
                                    placeholder={indexTypesLoading ? 'Carregando…' : 'Selecione'}
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {indexTypes.map((t) => (
                                  <SelectItem
                                    key={t.code}
                                    value={t.code}
                                    className="font-mono text-xs"
                                  >
                                    {t.code}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Cada grupo de parcelas terá seu próprio índice, definido abaixo.
                      </p>
                    )}
                  </div>

                  <InstallmentLedger
                    form={form}
                    fields={fields}
                    append={append}
                    remove={remove}
                    watchedSchedules={watchedSchedules}
                    disabled={disabled}
                    sameIndexForAll={sameIndexForAll}
                    indexTypes={indexTypes}
                    indexTypesLoading={indexTypesLoading}
                    violations={vitals.perMonthViolations}
                    maxInstallmentsPerMonth={maxInstallmentsPerMonth}
                  />
                </div>

                {!disabled && (
                  <StepFooter
                    back={() => setCurrentStep(0)}
                    backLabel="Voltar"
                    primary={
                      <Button type="button" onClick={handleContinue}>
                        Continuar
                        <ArrowRight className="size-4" />
                      </Button>
                    }
                  />
                )}
              </ProposalStep>

              {/* Etapa 3 — Mediação */}
              <ProposalStep
                index={2}
                state={stepState(2)}
                expanded={disabled || undefined}
                title="Mediação"
                summary={mediationSummary()}
                onEdit={() => goTo(2)}
              >
                <ProposalMediation
                  form={form}
                  watchedBrokerId={watchedBrokerId}
                  watchedAgencyId={watchedAgencyId}
                  maxCommissionRate={maxCommissionRate}
                  onBrokerSelect={handleBrokerSelect}
                  onAgencySelect={handleAgencySelect}
                  disabled={disabled}
                />

                {!disabled && (
                  <StepFooter
                    back={() => setCurrentStep(1)}
                    backLabel="Voltar"
                    primary={
                      <Button type="button" onClick={handleSave} disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Salvando…
                          </>
                        ) : (
                          <>
                            <Save className="size-4" />
                            {submitLabel}
                          </>
                        )}
                      </Button>
                    }
                  />
                )}
              </ProposalStep>
            </div>

            {/* Instrumentos (sticky no desktop) */}
            <aside className="lg:sticky lg:top-6 lg:self-start">
              <ProposalVitals vitals={vitals} hasUnit={unitPriceCents > 0} />
            </aside>
          </div>
        </div>
      </form>

      <AlertDialog open={showDivergence} onOpenChange={setShowDivergence}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Total fora do preço de tabela</AlertDialogTitle>
            <AlertDialogDescription>
              O total da proposta ({money(vitals.total)}) está {pct(Math.abs(vitals.diffPercent))}{' '}
              {vitals.diff < 0 ? 'abaixo' : 'acima'} do preço de tabela ({money(unitPriceCents)}),
              uma diferença de {money(Math.abs(vitals.diff))}. Deseja prosseguir mesmo assim?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Revisar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowDivergence(false)
                goTo(2)
              }}
            >
              Prosseguir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Form>
  )
}

const pct = (value: number) => `${value.toFixed(1).replace('.', ',')}%`

function StepFooter({
  back,
  backLabel = 'Voltar',
  primary,
}: {
  back?: () => void
  backLabel?: string
  primary: React.ReactNode
}) {
  return (
    <div
      className={`mt-6 flex items-center gap-3 border-t border-border pt-5 ${back ? 'justify-between' : 'justify-end'}`}
    >
      {back && (
        <Button type="button" variant="outline" onClick={back}>
          {backLabel}
        </Button>
      )}
      {primary}
    </div>
  )
}
