import { useApiClient } from '@cacenot/construct-pro-api-client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useTenantConfig } from '@/hooks/use-tenant-config'
import { handleApiError } from '@/lib/api-error'
import type { TenantConfigFormData } from '@/schemas/tenant-config.schema'
import { useActiveSection } from './settings-layout'
import { CONFIG_IDS, TenantConfigForm } from './tenant-config-form'

/** Converte basis points → percentual (ex: 500 → 5.00) */
function bpsToPercent(bps: number | null | undefined, fallback: number): number {
  return (bps ?? fallback) / 100
}

/** Converte percentual → basis points (ex: 5.00 → 500) */
function percentToBps(pct: number): number {
  return Math.round(pct * 100)
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-5 w-44" />
      <Skeleton className="h-4 w-72" />
      <Skeleton className="h-32 w-full" />
    </div>
  )
}

/**
 * Seção autossuficiente de configuração da organização.
 * Usa o hook useTenantConfig() compartilhado (cache global via TanStack Query).
 */
export function TenantConfigSection() {
  const { client } = useApiClient()
  const queryClient = useQueryClient()
  const { data: config, isLoading, error, refetch } = useTenantConfig()
  // Skeleton/erro só fazem sentido quando uma seção de config está ativa
  // (no master-detail, com "Membros" ativo o config fica oculto).
  const isConfigActive = CONFIG_IDS.includes(useActiveSection())

  const updateMutation = useMutation({
    mutationFn: async (data: TenantConfigFormData) => {
      const response = await client.PATCH('/api/v1/tenant-config', {
        body: {
          available_index_types: data.restrict_index_types ? data.available_index_types : null,
          invoice_generation_timing: data.invoice_generation_timing,
          invoice_days_before_due:
            data.invoice_generation_timing === 'days_before_due'
              ? data.invoice_days_before_due
              : null,
          minimum_signal_percentage: percentToBps(data.minimum_signal_percentage),
          minimum_entry_percentage: percentToBps(data.minimum_entry_percentage),
          allow_partial_payments: data.allow_partial_payments,
          allow_partial_payments_for_entry: data.allow_partial_payments_for_entry,
          require_entry_payment_for_close: data.require_entry_payment_for_close,
          sale_lost_rule: data.sale_lost_rule,
          sale_lost_days_threshold:
            data.sale_lost_rule === 'days_in_pending_signature'
              ? data.sale_lost_days_threshold
              : null,
          apply_index_on_overdue_installments: data.apply_index_on_overdue_installments,
          // max_installments_per_month may not be in the generated client type yet
          ...(data.max_installments_per_month !== undefined
            ? { max_installments_per_month: data.max_installments_per_month }
            : {}),
          // biome-ignore lint/suspicious/noExplicitAny: field not yet in generated client type
        } as any,
      })
      if (!response.data) {
        throw new Error('Erro ao salvar configurações da organização')
      }
      return response.data
    },
    onSuccess: () => {
      toast.success('Configurações da organização salvas com sucesso')
      queryClient.invalidateQueries({ queryKey: ['tenant-config'] })
    },
    onError: (err: Error) => handleApiError(err, 'Erro ao salvar configurações da organização'),
  })

  if (isLoading) {
    return isConfigActive ? <LoadingSkeleton /> : null
  }

  if (error || !config) {
    if (!isConfigActive) return null
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="space-y-1">
          <p className="text-sm font-medium">
            Não foi possível carregar as configurações da organização
          </p>
          <p className="text-sm text-muted-foreground">Verifique sua conexão e tente novamente.</p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 size-4" />
          Tentar novamente
        </Button>
      </div>
    )
  }

  /** Mapeamento API → form: converte bps→% e null→array/toggle */
  const initialData: TenantConfigFormData = {
    restrict_index_types: config.available_index_types !== null,
    available_index_types: config.available_index_types ?? [],
    invoice_generation_timing: config.invoice_generation_timing ?? 'immediate',
    invoice_days_before_due: config.invoice_days_before_due ?? null,
    minimum_signal_percentage: bpsToPercent(config.minimum_signal_percentage, 500),
    minimum_entry_percentage: bpsToPercent(config.minimum_entry_percentage, 1000),
    allow_partial_payments: config.allow_partial_payments ?? false,
    allow_partial_payments_for_entry: config.allow_partial_payments_for_entry ?? true,
    require_entry_payment_for_close: config.require_entry_payment_for_close ?? false,
    sale_lost_rule: config.sale_lost_rule ?? 'disabled',
    sale_lost_days_threshold: config.sale_lost_days_threshold ?? null,
    apply_index_on_overdue_installments: config.apply_index_on_overdue_installments ?? true,
    max_installments_per_month:
      (config as { max_installments_per_month?: number }).max_installments_per_month ?? 2,
  }

  return (
    <TenantConfigForm
      initialData={initialData}
      onSubmit={async (data) => {
        await updateMutation.mutateAsync(data)
      }}
      isSubmitting={updateMutation.isPending}
    />
  )
}
