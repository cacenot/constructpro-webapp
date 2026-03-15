import {
  getCorrectionBasisOptions,
  getInvoiceGenerationTimingOptions,
  getSaleLostAutomationRuleOptions,
} from '@cacenot/construct-pro-api-client'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus, Save, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { type TenantConfigFormData, tenantConfigSchema } from '@/schemas/tenant-config.schema'

interface TenantConfigFormProps {
  initialData: TenantConfigFormData
  onSubmit: (data: TenantConfigFormData) => Promise<void>
  isSubmitting?: boolean
}

/**
 * Formulário de configuração do tenant, organizado em 5 seções temáticas.
 */
export function TenantConfigForm({
  initialData,
  onSubmit,
  isSubmitting = false,
}: TenantConfigFormProps) {
  const form = useForm<TenantConfigFormData>({
    resolver: zodResolver(tenantConfigSchema),
    defaultValues: initialData,
  })

  const invoiceTiming = useWatch({ control: form.control, name: 'invoice_generation_timing' })
  const saleLostRule = useWatch({ control: form.control, name: 'sale_lost_rule' })
  const restrictIndexTypes = useWatch({ control: form.control, name: 'restrict_index_types' })
  const availableIndexTypes = useWatch({ control: form.control, name: 'available_index_types' })

  // --- Tags input local state ---
  const [indexTypeInput, setIndexTypeInput] = useState('')
  const indexInputRef = useRef<HTMLInputElement>(null)

  const addIndexType = () => {
    const code = indexTypeInput.trim().toUpperCase()
    if (!code) return
    const current = form.getValues('available_index_types') ?? []
    if (current.includes(code)) {
      setIndexTypeInput('')
      return
    }
    form.setValue('available_index_types', [...current, code], { shouldDirty: true })
    setIndexTypeInput('')
    indexInputRef.current?.focus()
  }

  const removeIndexType = (code: string) => {
    const current = form.getValues('available_index_types') ?? []
    form.setValue(
      'available_index_types',
      current.filter((c) => c !== code),
      { shouldDirty: true }
    )
  }

  const invoiceTimingOptions = getInvoiceGenerationTimingOptions()
  const saleLostRuleOptions = getSaleLostAutomationRuleOptions()
  const correctionBasisOptions = getCorrectionBasisOptions()

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* ─── Índices Econômicos ───────────────────────────────────── */}
        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base font-semibold">Índices Econômicos</CardTitle>
            <CardDescription>
              Defina quais índices de correção estão disponíveis para este tenant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="restrict_index_types"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/50 p-4">
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

            {restrictIndexTypes && (
              <div className="space-y-3">
                {/* Tags */}
                {availableIndexTypes && availableIndexTypes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {availableIndexTypes.map((code) => (
                      <Badge key={code} variant="secondary" className="gap-1 pr-1">
                        {code}
                        <button
                          type="button"
                          onClick={() => removeIndexType(code)}
                          className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                          aria-label={`Remover ${code}`}
                        >
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Input de adição */}
                <div className="flex gap-2">
                  <Input
                    ref={indexInputRef}
                    value={indexTypeInput}
                    onChange={(e) => setIndexTypeInput(e.target.value.toUpperCase())}
                    placeholder="Ex: IPCA"
                    className="max-w-[180px]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addIndexType()
                      }
                    }}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addIndexType}>
                    <Plus className="mr-1 size-3.5" />
                    Adicionar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Pressione Enter ou clique em Adicionar para incluir um código
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── Emissão de Boletos ───────────────────────────────────── */}
        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base font-semibold">Emissão de Boletos</CardTitle>
            <CardDescription>Quando os boletos/faturas devem ser gerados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="invoice_generation_timing"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timing de emissão</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {invoiceTimingOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      <Input
                        type="number"
                        min={1}
                        max={90}
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value ? Number(e.target.value) : null)
                        }
                      />
                    </FormControl>
                    <FormDescription>Entre 1 e 90 dias</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        {/* ─── Pagamentos ───────────────────────────────────────────── */}
        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base font-semibold">Pagamentos</CardTitle>
            <CardDescription>Percentuais mínimos e regras de pagamento parcial</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Percentuais */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="minimum_signal_percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Percentual mínimo de sinal (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={0.01}
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
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
                    <FormLabel>Percentual mínimo de entrada (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={0.01}
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>Ex: 10 para 10%</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Switches */}
            <div className="space-y-3">
              <FormField
                control={form.control}
                name="allow_partial_payments"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/50 p-4">
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
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/50 p-4">
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
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/50 p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-medium">
                        Exigir pagamento da entrada para fechar venda
                      </FormLabel>
                      <FormDescription>
                        Ao assinar o contrato, a venda só é fechada após o pagamento do sinal
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* ─── Automação Comercial ──────────────────────────────────── */}
        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base font-semibold">Automação Comercial</CardTitle>
            <CardDescription>
              Regras para marcação automática de vendas como perdidas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="sale_lost_rule"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Regra de venda perdida</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {saleLostRuleOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      <Input
                        type="number"
                        min={1}
                        max={365}
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value ? Number(e.target.value) : null)
                        }
                      />
                    </FormControl>
                    <FormDescription>Entre 1 e 365 dias</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        {/* ─── Correção Monetária ───────────────────────────────────── */}
        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base font-semibold">Correção Monetária</CardTitle>
            <CardDescription>Base de cálculo e aplicação de correções por índice</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="correction_basis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base de cálculo</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {correctionBasisOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="apply_index_on_overdue_installments"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/50 p-4">
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
          </CardContent>
        </Card>

        {/* ─── Ações ────────────────────────────────────────────────── */}
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isSubmitting} className="min-w-[160px]">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 size-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
