import { Building2, Handshake, ReceiptText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { CommissionSummary } from '@/hooks/use-commissions-table'
import { formatCurrency } from '@/lib/utils'

interface CommissionSummaryCardsProps {
  summary: CommissionSummary | null | undefined
  isLoading: boolean
}

export function CommissionSummaryCards({ summary, isLoading }: CommissionSummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton list
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const brokerCents = summary?.total_broker_amount?.cents ?? 0
  const agencyCents = summary?.total_agency_amount?.cents ?? 0
  const totalCents = summary?.total_amount?.cents ?? 0

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Corretor
          </CardTitle>
          <Handshake className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="tabular-nums text-2xl font-bold tracking-tight">
            {formatCurrency(brokerCents / 100)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Imobiliária
          </CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="tabular-nums text-2xl font-bold tracking-tight">
            {formatCurrency(agencyCents / 100)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Geral</CardTitle>
          <ReceiptText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="tabular-nums text-2xl font-bold tracking-tight">
            {formatCurrency(totalCents / 100)}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
