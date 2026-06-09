import type { components } from '@cacenot/construct-pro-api-client'
import { Building2, UserRound, UsersRound } from 'lucide-react'
import type { ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { ContractStatusBadge } from '@/components/vendas/contract-status-badge'
import { StatLabel } from '@/components/vendas/data-row'
import { SaleStatusBadge } from '@/components/vendas/sale-status-badge'
import type { ContractDetailResponse } from '@/hooks/use-contract-detail'
import { getDealStage } from '@/lib/deal-state'
import { formatDate } from '@/lib/format-date'
import { formatDocument } from '@/lib/text-formatters'
import { cn, formatCurrency, formatId } from '@/lib/utils'

type Sale = components['schemas']['SaleResponse']

interface DealCockpitProps {
  sale: Sale
  contractDetail?: ContractDetailResponse
  isContractLoading?: boolean
  isContractError?: boolean
  actions: ReactNode
}

interface Stat {
  label: string
  value: ReactNode
  tone?: 'destructive'
}

function IdentityRow({ icon: Icon, children }: { icon: typeof Building2; children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{children}</span>
    </div>
  )
}

export function DealCockpit({
  sale,
  contractDetail,
  isContractLoading,
  isContractError,
  actions,
}: DealCockpitProps) {
  const metrics = sale.metrics
  const summary = sale.installment_summary
  const fin = contractDetail?.financial_summary
  const inst = contractDetail?.installment_summary
  const financialMode = !!fin
  const stageClosed = getDealStage(sale) === 'closed'
  // Vendas fechadas esperam dados financeiros ao vivo; mostre skeleton em vez de
  // piscar os vitais do plano enquanto o contrato carrega.
  const awaitingFinancial = stageClosed && !!isContractLoading && !fin
  // Falhou a saúde financeira ao vivo: não regredir para os vitais da proposta
  // (rótulo "Valor da proposta" num negócio fechado confunde). O corpo ao lado
  // já mostra o estado de erro com "Tentar novamente".
  const financialUnavailable = stageClosed && !!isContractError && !fin
  const contractStatus = contractDetail?.status
  const isActiveContract = contractStatus === 'active'

  // Headline + estatísticas de apoio, adaptados ao estado.
  let headlineLabel: string
  let headlineValue: string
  let progress: number | null = null
  let stats: Stat[]

  if (financialMode && fin) {
    const paidPct = Number(fin.payment_progress_percentage)
    headlineLabel = 'Saldo devedor'
    headlineValue = formatCurrency(fin.outstanding_balance.cents / 100)
    progress = Number.isFinite(paidPct) ? paidPct : null
    const overdue = inst?.overdue_count ?? 0
    stats = [
      {
        label: 'Pago',
        value: (
          <>
            {formatCurrency(fin.total_paid.cents / 100)}
            {progress != null && (
              <span className="ml-1.5 text-xs text-muted-foreground">({progress.toFixed(0)}%)</span>
            )}
          </>
        ),
      },
      {
        label: 'Parcelas pagas',
        value: (
          <span className="font-mono">
            {inst?.paid_count ?? 0}/{inst?.total_count ?? 0}
          </span>
        ),
      },
      overdue > 0
        ? {
            label: 'Em atraso',
            tone: 'destructive',
            value: (
              <span className="font-mono">
                {overdue} parcela{overdue > 1 ? 's' : ''}
              </span>
            ),
          }
        : {
            // Só faz sentido num contrato vivo; quitado/encerrado não têm "próxima".
            label: 'Próxima parcela',
            value:
              isActiveContract && inst?.next_due_date ? (
                <>
                  {inst.next_due_amount ? formatCurrency(inst.next_due_amount.cents / 100) : '—'}
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    {formatDate(inst.next_due_date)}
                  </span>
                </>
              ) : (
                '—'
              ),
          },
    ]
  } else {
    headlineLabel = 'Valor da proposta'
    headlineValue = formatCurrency(sale.amount.cents / 100)
    stats = []
    if (metrics?.entry_amount?.cents != null) {
      stats.push({
        label: 'Entrada',
        value: (
          <>
            {formatCurrency(metrics.entry_amount.cents / 100)}
            {metrics.entry_percentage != null && (
              <span className="ml-1.5 text-xs text-muted-foreground">
                ({Number(metrics.entry_percentage).toFixed(0)}%)
              </span>
            )}
          </>
        ),
      })
    }
    if (metrics?.financed_amount?.cents != null) {
      stats.push({
        label: 'Financiado',
        value: formatCurrency(metrics.financed_amount.cents / 100),
      })
    }
    if (summary?.total_count) {
      stats.push({
        label: 'Parcelas',
        value: <span className="font-mono">{summary.total_count}</span>,
      })
    }
  }

  return (
    <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
      {/* Identidade do negócio */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="font-mono text-3xl font-semibold tracking-tight">{formatId(sale.id)}</h1>
          {sale.status && <SaleStatusBadge status={sale.status} />}
        </div>
        <div className="space-y-1.5">
          <IdentityRow icon={Building2}>
            {sale.unit?.name ?? 'Unidade não informada'}
            {sale.unit?.project?.name && (
              <span className="text-muted-foreground"> · {sale.unit.project.name}</span>
            )}
          </IdentityRow>
          <IdentityRow icon={UserRound}>
            {sale.customer?.full_name ?? '—'}
            {sale.customer?.cpf_cnpj && (
              <span className="ml-1.5 font-mono text-muted-foreground">
                {formatDocument(sale.customer.cpf_cnpj)}
              </span>
            )}
          </IdentityRow>
          <IdentityRow icon={UsersRound}>{sale.user?.display_name ?? '—'}</IdentityRow>
        </div>
      </div>

      {/* Vitais adaptativos */}
      {awaitingFinancial ? (
        <Skeleton className="h-44 w-full rounded-lg" />
      ) : financialUnavailable ? (
        <div className="space-y-1 rounded-lg border bg-card p-4">
          <StatLabel>Saúde financeira</StatLabel>
          <p className="text-sm text-muted-foreground">Dados ao vivo indisponíveis no momento.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="space-y-1.5 p-4">
            <div className="flex items-center justify-between gap-2">
              <StatLabel>{headlineLabel}</StatLabel>
              {financialMode && contractDetail?.status && (
                <ContractStatusBadge status={contractDetail.status} />
              )}
            </div>
            <p className="tabular-nums text-2xl font-semibold leading-none tracking-tight">
              {headlineValue}
            </p>
            {progress != null && (
              <div
                role="progressbar"
                aria-label="Progresso de pagamento"
                aria-valuenow={Math.round(progress)}
                aria-valuemin={0}
                aria-valuemax={100}
                className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
              >
                <div
                  className="h-full rounded-full bg-pipeline-fechado-dot"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
            )}
          </div>
          {stats.length > 0 && (
            <dl className="divide-y border-t">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-baseline justify-between gap-3 px-4 py-3"
                >
                  <dt className="text-sm text-muted-foreground">{stat.label}</dt>
                  <dd
                    className={cn(
                      'text-right text-sm font-medium tabular-nums',
                      stat.tone === 'destructive' && 'text-destructive'
                    )}
                  >
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}

      {/* Ações */}
      {actions}
    </aside>
  )
}
