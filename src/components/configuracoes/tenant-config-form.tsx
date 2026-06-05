import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus, Save, X } from 'lucide-react'
import { type KeyboardEvent, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
  Form,
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
import { type TenantConfigFormData, tenantConfigSchema } from '@/schemas/tenant-config.schema'
import { SegmentedControl } from './segmented-control'
import { useActiveSection } from './settings-layout'
import { SettingsSection } from './settings-section'

interface TenantConfigFormProps {
  initialData: TenantConfigFormData
  onSubmit: (data: TenantConfigFormData) => Promise<void>
  isSubmitting?: boolean
}

/** Seções deste formulário — a barra de salvar só aparece quando uma delas está ativa. */
export const CONFIG_IDS = ['indices', 'boletos', 'pagamentos', 'parcelas', 'automacao', 'correcao']

/** Opções dos selects em PT (os helpers da API retornam rótulos em inglês). */
const INVOICE_TIMING_OPTIONS = [
  { value: 'immediate', label: 'Imediato' },
  { value: 'days_before_due', label: 'Dias antes do vencimento' },
]
const SALE_LOST_OPTIONS = [
  { value: 'disabled', label: 'Desativado' },
  { value: 'days_in_pending_signature', label: 'Dias aguardando assinatura' },
]

/** Hairline que separa linhas de switch dentro de uma seção, sem caixa. */
const SWITCH_GROUP = 'divide-y divide-border/60 border-y border-border/60'
const SWITCH_ROW = 'flex flex-row items-center justify-between gap-4 py-4'

/** Inteiro de dias entre 1 e `max`; clampa entrada inválida (negativos, 0, acima do máximo). */
function clampDays(raw: string, max: number): number | null {
  if (raw === '') return null
  const n = Math.floor(Number(raw))
  if (Number.isNaN(n)) return null
  return Math.min(Math.max(n, 1), max)
}

/** Bloqueia teclas que produziriam dias não-inteiros/negativos (-, +, ., e). */
function blockNonIntegerKeys(e: KeyboardEvent<HTMLInputElement>) {
  if (['e', 'E', '+', '-', '.', ','].includes(e.key)) e.preventDefault()
}

/**
 * Formulário de configuração do tenant, em 6 seções temáticas. A sub-navegação
 * mora no `SettingsLayout` (os `id`s casam com ela); só a seção ativa aparece.
 * Salvar fica numa barra fixa que só aparece numa seção de config com mudança e
 * confirma antes de gravar (regras que afetam contratos e carteira).
 */
export function TenantConfigForm({
  initialData,
  onSubmit,
  isSubmitting = false,
}: TenantConfigFormProps) {
  const activeSection = useActiveSection()
  const form = useForm<TenantConfigFormData>({
    resolver: zodResolver(tenantConfigSchema),
    defaultValues: initialData,
  })

  const invoiceTiming = useWatch({ control: form.control, name: 'invoice_generation_timing' })
  const saleLostRule = useWatch({ control: form.control, name: 'sale_lost_rule' })
  const restrictIndexTypes = useWatch({ control: form.control, name: 'restrict_index_types' })
  const availableIndexTypes = useWatch({ control: form.control, name: 'available_index_types' })

  const isDirty = form.formState.isDirty
  const showSaveBar = isDirty && CONFIG_IDS.includes(activeSection)
  const [confirmOpen, setConfirmOpen] = useState(false)

  // --- Combobox de índices (catálogo real do backend) ---
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

  const handleConfirmedSubmit = async () => {
    try {
      const data = form.getValues()
      await onSubmit(data)
      form.reset(data) // novo baseline: limpa o estado "não salvo"
      setConfirmOpen(false)
    } catch {
      // erro já tratado no onError da mutation (toast); mantém o diálogo aberto
    }
  }

  return (
    <Form {...form}>
      {/* Form com largura legível; a tabela de Membros (fora daqui) usa a largura toda */}
      <form onSubmit={form.handleSubmit(() => setConfirmOpen(true))} className="max-w-3xl">
        {/* ─── Índices Econômicos ─── */}
        <SettingsSection
          id="indices"
          title="Índices Econômicos"
          description="Defina quais índices de correção estão disponíveis para este tenant"
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
                              <span className="shrink-0 whitespace-nowrap font-mono">
                                {it.code}
                              </span>
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
        </SettingsSection>

        {/* ─── Emissão de Boletos ─── */}
        <SettingsSection
          id="boletos"
          title="Emissão de Boletos"
          description="Quando os boletos/faturas devem ser gerados"
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
        </SettingsSection>

        {/* ─── Pagamentos ─── */}
        <SettingsSection
          id="pagamentos"
          title="Pagamentos"
          description="Percentuais mínimos e regras de pagamento parcial"
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
                      <FormLabel className="text-sm font-medium">
                        Permitir pagamento parcial
                      </FormLabel>
                      <FormDescription>
                        Permite pagamento parcial em parcelas normais
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
        </SettingsSection>

        {/* ─── Parcelas por Mês ─── */}
        <SettingsSection
          id="parcelas"
          title="Parcelas por Mês"
          description="Máximo de parcelas com vencimento no mesmo mês-calendário"
        >
          <FormField
            control={form.control}
            name="max_installments_per_month"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Limite mensal</FormLabel>
                <FormControl>
                  <SegmentedControl
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
        </SettingsSection>

        {/* ─── Automação Comercial ─── */}
        <SettingsSection
          id="automacao"
          title="Automação Comercial"
          description="Regras para marcação automática de vendas como perdidas"
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
        </SettingsSection>

        {/* ─── Correção Monetária ─── */}
        <SettingsSection
          id="correcao"
          title="Correção Monetária"
          description="Aplicação de correções por índice nas parcelas"
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
        </SettingsSection>

        {/* ─── Barra de salvar fixa (só numa seção de config com alterações) ─── */}
        {showSaveBar && (
          <div className="sticky bottom-0 z-10 mt-8 flex items-center justify-between gap-4 border-t border-border/60 bg-background py-4">
            <p className="text-sm text-muted-foreground">Você tem alterações não salvas</p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => form.reset()}
                disabled={isSubmitting}
              >
                Descartar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="min-w-[160px]">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 size-4" />
                    Salvar alterações
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </form>

      {/* ─── Confirmação (regra que afeta contratos e carteira) ─── */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Salvar configurações da organização?</AlertDialogTitle>
            <AlertDialogDescription>
              Estas regras afetam novos contratos, a geração de boletos e o cálculo da carteira.
              Confirme que os valores estão corretos antes de aplicar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <Button
              onClick={handleConfirmedSubmit}
              disabled={isSubmitting}
              className="min-w-[140px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Confirmar e salvar'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Form>
  )
}
