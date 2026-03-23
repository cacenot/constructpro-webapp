import type { components } from '@cacenot/construct-pro-api-client/schema'
import { AlertTriangle, Calendar } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

type CustomerInstallmentOverview = components['schemas']['CustomerInstallmentOverview']

interface CustomerOverdueAlertProps {
  data: CustomerInstallmentOverview
}

export function CustomerOverdueAlert({ data }: CustomerOverdueAlertProps) {
  if (data.overdue_count === 0) return null

  return (
    <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="size-4 text-destructive" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-destructive">
          {data.overdue_count} parcela{data.overdue_count > 1 ? 's' : ''} em atraso
        </p>
        <p className="tabular-nums text-xs text-destructive/70">
          Total em atraso: {formatCurrency(data.overdue_amount_cents / 100)}
        </p>
      </div>
    </div>
  )
}

export function NextDueCard({ data }: { data: CustomerInstallmentOverview }) {
  if (!data.next_due_date || data.next_due_amount_cents == null) return null

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
        <Calendar className="size-5 text-blue-600 dark:text-blue-400" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Próximo Vencimento</p>
        <p className="tabular-nums font-semibold">
          {formatCurrency(data.next_due_amount_cents / 100)}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            em{' '}
            {new Date(data.next_due_date).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </span>
        </p>
      </div>
    </div>
  )
}
