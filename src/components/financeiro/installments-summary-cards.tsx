import { AlertTriangle, CheckCircle2, Clock, Receipt } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { InstallmentListSummary } from '@/hooks/use-installments'
import { formatCurrency } from '@/lib/utils'

interface InstallmentsSummaryCardsProps {
  summary: InstallmentListSummary | null | undefined
  isLoading: boolean
}

export function InstallmentsSummaryCards({ summary, isLoading }: InstallmentsSummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton list
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-32" />
              <Skeleton className="mt-1 h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const totalCents = summary?.total_current_amount_cents ?? 0
  const receivedCents = summary?.total_paid_amount_cents ?? 0
  const overdueCents = summary?.total_overdue_amount_cents ?? 0
  const overdueCount = summary?.overdue_count ?? 0
  const toReceiveCents = Math.max(0, totalCents - receivedCents)

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Emitido</CardTitle>
          <Receipt className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="tabular-nums text-2xl font-bold tracking-tight">
            {formatCurrency(totalCents / 100)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Recebido</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="tabular-nums text-2xl font-bold tracking-tight text-emerald-600">
            {formatCurrency(receivedCents / 100)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Em Atraso</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="tabular-nums text-2xl font-bold tracking-tight text-red-600">
            {formatCurrency(overdueCents / 100)}
          </div>
          {overdueCount > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              {overdueCount} {overdueCount === 1 ? 'parcela' : 'parcelas'}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">A Receber</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="tabular-nums text-2xl font-bold tracking-tight">
            {formatCurrency(toReceiveCents / 100)}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
