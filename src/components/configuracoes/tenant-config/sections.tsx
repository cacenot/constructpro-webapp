import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, X } from 'lucide-react'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { useIndexTypes } from '@/hooks/use-index-types'
import type { useTenantConfig } from '@/hooks/use-tenant-config'
import {
  type AutomacaoFormData,
  automacaoSchema,
  type BoletosFormData,
  boletosSchema,
  type CorrecaoFormData,
  correcaoSchema,
  type IndicesFormData,
  indicesSchema,
  type PagamentosFormData,
  type ParcelasFormData,
  pagamentosSchema,
  parcelasSchema,
} from '@/schemas/tenant-config.schema'
import { SegmentedControl } from '../segmented-control'
import { ConfigSectionForm } from './config-section-form'
import {
  blockNonIntegerKeys,
  bpsToPercent,
  clampDays,
  INVOICE_TIMING_OPTIONS,
  percentToBps,
  SALE_LOST_OPTIONS,
  SWITCH_GROUP,
  SWITCH_ROW,
} from './helpers'
import { useTenantConfigUpdate } from './use-tenant-config-update'

type TenantConfig = NonNullable<ReturnType<typeof useTenantConfig>['data']>

interface SectionProps {
  config: TenantConfig
}

/* ─── Índices Econômicos ─────────────────────────────────────────────── */
export function IndicesSection({ config }: SectionProps) {
  const update = useTenantConfigUpdate()
  const form = useForm<IndicesFormData>({
    resolver: zodResolver(indicesSchema),
    defaultValues: {
      restrict_index_types: config.available_index_types !== null,
      available_index_types: config.available_index_types ?? [],
    },
  })

  const restrictIndexTypes = useWatch({ control: form.control, name: 'restrict_index_types' })
  const availableIndexTypes = useWatch({ control: form.control, name: 'available_index_types' })

  const { data: indexCatalog = [] } = useIndexTypes()
  const [indexComboOpen, setIndexComboOpen] = useState(false)
  const [indexQuery, setIndexQuery] = useState('')

  const addIndexType = (rawCode: string) => {
    const code = rawCode.trim().toUpperCase().slice(0, 24)
    if (!code) return
    const current = form.getValues('available_index_types') ?? []
    if (!current.includes(code)) {
      form.setValue('available_index_types', [...current, code], { shouldDirty: true })
    }
    setIndexQuery('')
  }

  const removeIndexType = (code: string) => {
    const current = form.getValues('available_index_types') ?? []
    form.setValue(
      'available_index_types',
      current.filter((c) => c !== code),
      { shouldDirty: true }
    )
  }

  const normalizedQuery = indexQuery.trim().toUpperCase()
  const selectedIndices = new Set(availableIndexTypes ?? [])
  const indexSuggestions = indexCatalog.filter(
    (it) => !selectedIndices.has(it.code) && it.code.toUpperCase().includes(normalizedQuery)
  )
  const canCreateIndex =
    normalizedQuery.length > 0 &&
    !indexCatalog.some((it) => it.code.toUpperCase() === normalizedQuery) &&
    !selectedIndices.has(normalizedQuery)

  return (
    <ConfigSectionForm
      id="indices"
      title="Índices Econômicos"
      description="Defina quais índices de correção estão disponíveis para este tenant"
      form={form}
      onPersist={async (data) => {
        await update.mutateAsync({
          available_index_types: data.restrict_index_types ? data.available_index_types : null,
        })
      }}
    >
      <div className="space-y-4">
        <div className={SWITCH_GROUP}>
          <FormField
            control={form.control}
            name="restrict_index_types"
            render={({ field }) => (
              <FormItem className={SWITCH_ROW}>
                <div className="space-y-0.5">
                  <FormLabel className="text-sm font-medium">
                    Restringir tipos de índice disponíveis
                  </FormLabel>
                  <FormDescription>
                    Quando ativado, somente os índices listados abaixo estarão disponíveis
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {restrictIndexTypes && (
          <div className="space-y-3">
            {availableIndexTypes && availableIndexTypes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {availableIndexTypes.map((code) => (
                  <Badge key={code} variant="secondary" className="gap-1 pr-1 font-mono">
                    {code}
                    <button
                      type="button"
                      onClick={() => removeIndexType(code)}
                      className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={`Remover ${code}`}
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <Popover open={indexComboOpen} onOpenChange={setIndexComboOpen}>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  <Plus className="mr-1 size-3.5" />
                  Adicionar índice
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-[320px] p-0">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Buscar ou digitar código"
                    value={indexQuery}
                    onValueChange={setIndexQuery}
                    maxLength={24}
                  />
                  <CommandList>
                    {indexSuggestions.length === 0 && !canCreateIndex && (
                      <CommandEmpty>Nenhum índice encontrado.</CommandEmpty>
                    )}
                    <CommandGroup>
                      {indexSuggestions.map((it) => (
                        <CommandItem
                          key={it.code}
                          value={it.code}
                          onSelect={() => addIndexType(it.code)}
                        >
                          <span className="shrink-0 whitespace-nowrap font-mono">{it.code}</span>
                          {it.description && (
                            <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                              {it.description}
                            </span>
                          )}
                        </CommandItem>
                      ))}
                      {canCreateIndex && (
                        <CommandItem
                          value={`create-${normalizedQuery}`}
                          onSelect={() => addIndexType(normalizedQuery)}
                        >
                          <Plus className="mr-2 size-3.5" />
                          Adicionar “<span className="font-mono">{normalizedQuery}</span>”
                        </CommandItem>
                      )}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
    </ConfigSectionForm>
  )
}

/* ─── Emissão de Boletos ─────────────────────────────────────────────── */
export function BoletosSection({ config }: SectionProps) {
  const update = useTenantConfigUpdate()
  const form = useForm<BoletosFormData>({
    resolver: zodResolver(boletosSchema),
    defaultValues: {
      invoice_generation_timing: config.invoice_generation_timing ?? 'immediate',
      invoice_days_before_due: config.invoice_days_before_due ?? null,
    },
  })
  const invoiceTiming = useWatch({ control: form.control, name: 'invoice_generation_timing' })

  return (
    <ConfigSectionForm
      id="boletos"
      title="Emissão de Boletos"
      description="Quando os boletos/faturas devem ser gerados"
      form={form}
      onPersist={async (data) => {
        await update.mutateAsync({
          invoice_generation_timing: data.invoice_generation_timing,
          invoice_days_before_due:
            data.invoice_generation_timing === 'days_before_due'
              ? data.invoice_days_before_due
              : null,
        })
      }}
    >
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="invoice_generation_timing"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Timing de emissão</FormLabel>
              <FormControl>
                <SegmentedControl
                  aria-label="Timing de emissão"
                  options={INVOICE_TIMING_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {invoiceTiming === 'days_before_due' && (
          <FormField
            control={form.control}
            name="invoice_days_before_due"
            render={({ field }) => (
              <FormItem className="max-w-[200px]">
                <FormLabel>Dias antes do vencimento *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="number"
                      min={1}
                      max={90}
                      step={1}
                      className="pr-12"
                      {...field}
                      value={field.value ?? ''}
                      onKeyDown={blockNonIntegerKeys}
                      onChange={(e) => field.onChange(clampDays(e.target.value, 90))}
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                      dias
                    </span>
                  </div>
                </FormControl>
                <FormDescription>Entre 1 e 90 dias</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
    </ConfigSectionForm>
  )
}

/* ─── Pagamentos ─────────────────────────────────────────────────────── */
export function PagamentosSection({ config }: SectionProps) {
  const update = useTenantConfigUpdate()
  const form = useForm<PagamentosFormData>({
    resolver: zodResolver(pagamentosSchema),
    defaultValues: {
      minimum_signal_percentage: bpsToPercent(config.minimum_signal_percentage, 500),
      minimum_entry_percentage: bpsToPercent(config.minimum_entry_percentage, 1000),
      allow_partial_payments: config.allow_partial_payments ?? false,
      allow_partial_payments_for_entry: config.allow_partial_payments_for_entry ?? true,
      require_entry_payment_for_close: config.require_entry_payment_for_close ?? false,
    },
  })

  return (
    <ConfigSectionForm
      id="pagamentos"
      title="Pagamentos"
      description="Percentuais mínimos e regras de pagamento parcial"
      form={form}
      onPersist={async (data) => {
        await update.mutateAsync({
          minimum_signal_percentage: percentToBps(data.minimum_signal_percentage),
          minimum_entry_percentage: percentToBps(data.minimum_entry_percentage),
          allow_partial_payments: data.allow_partial_payments,
          allow_partial_payments_for_entry: data.allow_partial_payments_for_entry,
          require_entry_payment_for_close: data.require_entry_payment_for_close,
        })
      }}
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="minimum_signal_percentage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Percentual mínimo de sinal</FormLabel>
                <FormControl>
                  <div className="relative max-w-[220px]">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      className="pr-9"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                      %
                    </span>
                  </div>
                </FormControl>
                <FormDescription>Ex: 5 para 5%</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="minimum_entry_percentage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Percentual mínimo de entrada</FormLabel>
                <FormControl>
                  <div className="relative max-w-[220px]">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      className="pr-9"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                      %
                    </span>
                  </div>
                </FormControl>
                <FormDescription>Ex: 10 para 10%</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className={SWITCH_GROUP}>
          <FormField
            control={form.control}
            name="allow_partial_payments"
            render={({ field }) => (
              <FormItem className={SWITCH_ROW}>
                <div className="space-y-0.5">
                  <FormLabel className="text-sm font-medium">Permitir pagamento parcial</FormLabel>
                  <FormDescription>Permite pagamento parcial em parcelas normais</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="allow_partial_payments_for_entry"
            render={({ field }) => (
              <FormItem className={SWITCH_ROW}>
                <div className="space-y-0.5">
                  <FormLabel className="text-sm font-medium">
                    Permitir pagamento parcial da entrada
                  </FormLabel>
                  <FormDescription>
                    Permite pagamento parcial especificamente para parcelas de entrada/sinal
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="require_entry_payment_for_close"
            render={({ field }) => (
              <FormItem className={SWITCH_ROW}>
                <div className="space-y-0.5">
                  <FormLabel className="text-sm font-medium">
                    Exigir pagamento da entrada para fechar venda
                  </FormLabel>
                  <FormDescription>
                    Ao assinar, a venda só fecha após a quitação integral da entrada (todas as
                    parcelas de entrada pagas)
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </div>
    </ConfigSectionForm>
  )
}

/* ─── Parcelas por Mês ───────────────────────────────────────────────── */
export function ParcelasSection({ config }: SectionProps) {
  const update = useTenantConfigUpdate()
  const form = useForm<ParcelasFormData>({
    resolver: zodResolver(parcelasSchema),
    defaultValues: {
      max_installments_per_month: config.max_installments_per_month ?? 2,
    },
  })

  return (
    <ConfigSectionForm
      id="parcelas"
      title="Parcelas por Mês"
      description="Máximo de parcelas com vencimento no mesmo mês-calendário"
      form={form}
      onPersist={async (data) => {
        await update.mutateAsync({
          max_installments_per_month: data.max_installments_per_month,
        })
      }}
    >
      <FormField
        control={form.control}
        name="max_installments_per_month"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Limite mensal</FormLabel>
            <FormControl>
              <SegmentedControl
                aria-label="Parcelas por mês"
                options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }))}
                value={field.value}
                onChange={(value) => field.onChange(Number(value))}
              />
            </FormControl>
            <FormDescription>
              {field.value} parcela{field.value > 1 ? 's' : ''} por mês (padrão: 2)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </ConfigSectionForm>
  )
}

/* ─── Automação Comercial ────────────────────────────────────────────── */
export function AutomacaoSection({ config }: SectionProps) {
  const update = useTenantConfigUpdate()
  const form = useForm<AutomacaoFormData>({
    resolver: zodResolver(automacaoSchema),
    defaultValues: {
      sale_lost_rule: config.sale_lost_rule ?? 'disabled',
      sale_lost_days_threshold: config.sale_lost_days_threshold ?? null,
    },
  })
  const saleLostRule = useWatch({ control: form.control, name: 'sale_lost_rule' })

  return (
    <ConfigSectionForm
      id="automacao"
      title="Automação Comercial"
      description="Regras para marcação automática de vendas como perdidas"
      form={form}
      onPersist={async (data) => {
        await update.mutateAsync({
          sale_lost_rule: data.sale_lost_rule,
          sale_lost_days_threshold:
            data.sale_lost_rule === 'days_in_pending_signature'
              ? data.sale_lost_days_threshold
              : null,
        })
      }}
    >
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="sale_lost_rule"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Regra de venda perdida</FormLabel>
              <FormControl>
                <SegmentedControl
                  aria-label="Regra de venda perdida"
                  options={SALE_LOST_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {saleLostRule === 'days_in_pending_signature' && (
          <FormField
            control={form.control}
            name="sale_lost_days_threshold"
            render={({ field }) => (
              <FormItem className="max-w-[200px]">
                <FormLabel>Dias aguardando assinatura *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="number"
                      min={1}
                      max={365}
                      step={1}
                      className="pr-12"
                      {...field}
                      value={field.value ?? ''}
                      onKeyDown={blockNonIntegerKeys}
                      onChange={(e) => field.onChange(clampDays(e.target.value, 365))}
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                      dias
                    </span>
                  </div>
                </FormControl>
                <FormDescription>Entre 1 e 365 dias</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
    </ConfigSectionForm>
  )
}

/* ─── Correção Monetária ─────────────────────────────────────────────── */
export function CorrecaoSection({ config }: SectionProps) {
  const update = useTenantConfigUpdate()
  const form = useForm<CorrecaoFormData>({
    resolver: zodResolver(correcaoSchema),
    defaultValues: {
      apply_index_on_overdue_installments: config.apply_index_on_overdue_installments ?? true,
    },
  })

  return (
    <ConfigSectionForm
      id="correcao"
      title="Correção Monetária"
      description="Aplicação de correções por índice nas parcelas"
      form={form}
      onPersist={async (data) => {
        await update.mutateAsync({
          apply_index_on_overdue_installments: data.apply_index_on_overdue_installments,
        })
      }}
    >
      <div className={SWITCH_GROUP}>
        <FormField
          control={form.control}
          name="apply_index_on_overdue_installments"
          render={({ field }) => (
            <FormItem className={SWITCH_ROW}>
              <div className="space-y-0.5">
                <FormLabel className="text-sm font-medium">
                  Aplicar índice em parcelas vencidas
                </FormLabel>
                <FormDescription>
                  Correções por índice também serão aplicadas em parcelas em atraso
                </FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </ConfigSectionForm>
  )
}
