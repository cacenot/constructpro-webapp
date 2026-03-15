import { useApiClient } from '@cacenot/construct-pro-api-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import type { TenantConfigFormData } from '@/schemas/tenant-config.schema'
import { TenantConfigForm } from './tenant-config-form'

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
    <div className="space-y-6">
      {(['indices', 'boletos', 'pagamentos', 'automacao', 'correcao'] as const).map((section) => (
        <div key={section} className="rounded-2xl border border-border/50 p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  )
}

/**
 * Seção autossuficiente de configuração da organização.
 * Gerencia internamente o fetch e a mutação do tenant config.
 */
export function TenantConfigSection() {
  const { client } = useApiClient()
  const queryClient = useQueryClient()

  const {
    data: config,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['tenant-config'],
    queryFn: async () => {
      const response = await client.GET('/api/v1/tenant-config')
      if (!response.data) {
        throw new Error('Erro ao carregar configurações da organização')
      }
      return response.data
    },
  })

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
          correction_basis: data.correction_basis,
          apply_index_on_overdue_installments: data.apply_index_on_overdue_installments,
        },
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
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao salvar configurações da organização')
    },
  })

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (error || !config) {
    return (
      <div className="rounded-2xl border border-border/50 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Erro ao carregar configurações da organização. Tente novamente.
        </p>
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
    correction_basis: config.correction_basis ?? 'outstanding_balance',
    apply_index_on_overdue_installments: config.apply_index_on_overdue_installments ?? true,
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
