import {
  translateInstallmentKind,
  translatePaymentMethod,
  useSale,
} from '@cacenot/construct-pro-api-client'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft, Building2, Download, ExternalLink, TrendingUp, User } from 'lucide-react'
import { navigate } from 'vike/client/router'
import { usePageContext } from 'vike-react/usePageContext'
import { AppLayout } from '@/components/app-layout'
import { BalanceTimelineChart } from '@/components/contratos/balance-timeline-chart'
import { ContractStatusBadge } from '@/components/contratos/contract-status-badge'
import { CorrectionChart } from '@/components/contratos/correction-chart'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useContract } from '@/hooks/useContracts'
import { formatDocument } from '@/lib/text-formatters'
import { cn, formatCurrency, formatId } from '@/lib/utils'
import { INSTALLMENT_KIND_LABELS, PAYMENT_METHOD_LABELS } from '@/schemas/sale.schema'

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR })
  } catch {
    return dateStr
  }
}

function formatMonthYear(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    // Handle both "YYYY-MM" (reference months) and "YYYY-MM-DD" (due dates)
    const normalized = dateStr.length === 7 ? `${dateStr}-01` : dateStr
    return format(new Date(normalized), 'MMM/yy', { locale: ptBR })
  } catch {
    return dateStr
  }
}

export default function ContractDetailPage() {
  const pageContext = usePageContext()
  const contractId = Number(pageContext.routeParams?.id)

  const { data: contract, isLoading, error } = useContract(contractId)
  const saleId = contract?.sale_id ?? 0
  const { data: sale } = useSale(saleId)

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-12 w-80" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
          <div className="grid grid-cols-4 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-14" />
          <Skeleton className="h-48" />
        </div>
      </AppLayout>
    )
  }

  if (error || !contract) {
    return (
      <AppLayout>
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
          <p className="text-lg text-muted-foreground">Contrato não encontrado</p>
          <Button variant="link" onClick={() => navigate('/contratos')}>
            Voltar para lista
          </Button>
        </div>
      </AppLayout>
    )
  }

  const financial = contract.financial_summary
  const installmentSummary = contract.installment_summary
  const correctionSummary = contract.correction_summary
  const paymentSummary = contract.payment_summary
  const balanceTimeline = contract.balance_timeline

  const outstandingBalanceColor =
    contract.status === 'settled'
      ? 'text-emerald-600 dark:text-emerald-400'
      : contract.status === 'in_default'
        ? 'text-red-600 dark:text-red-400'
        : ''

  const totalScheduleAmount = installmentSummary?.total_amount_cents
    ? formatCurrency(installmentSummary.total_amount_cents / 100)
    : '—'

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Voltar */}
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 gap-1.5 text-muted-foreground"
          onClick={() => navigate('/contratos')}
        >
          <ArrowLeft className="size-4" />
          Voltar para Contratos
        </Button>

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                Contrato {formatId(contract.id)}
              </h1>
              {contract.status && <ContractStatusBadge status={contract.status} />}
            </div>
            <p className="text-sm text-muted-foreground">
              Criado em {formatDate(contract.created_at)}
              {contract.signed_at && ` · Assinado em ${formatDate(contract.signed_at)}`}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => navigate(`/vendas/${contract.sale_id}`)}
            >
              <ExternalLink className="size-4" />
              Ver Proposta
            </Button>
            {contract.document_url && (
              <Button variant="outline" className="gap-2" asChild>
                <a href={contract.document_url} target="_blank" rel="noreferrer">
                  <Download className="size-4" />
                  Baixar Contrato
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Cards de contexto */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Building2 className="size-4" />
                Unidade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="font-semibold">{sale?.unit?.name ?? '—'}</p>
              <p className="text-sm text-muted-foreground">{sale?.unit?.project?.name ?? '—'}</p>
              {sale?.unit?.area && (
                <p className="text-xs text-muted-foreground">{sale.unit.area} m²</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <User className="size-4" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="font-semibold">{sale?.customer?.full_name ?? '—'}</p>
              {sale?.customer?.cpf_cnpj && (
                <p className="text-sm text-muted-foreground">
                  {formatDocument(sale.customer.cpf_cnpj)}
                </p>
              )}
              {sale?.customer?.email && (
                <p className="text-xs text-muted-foreground">{sale.customer.email}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <TrendingUp className="size-4" />
                Financiamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="tabular-nums font-semibold">
                {formatCurrency(contract.principal_amount_cents / 100)}
              </p>
              <p className="text-sm text-muted-foreground">Índice: {contract.index_type_code}</p>
              {contract.signed_at && (
                <p className="text-xs text-muted-foreground">
                  Assinado em {formatDate(contract.signed_at)}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* KPI financeiros */}
        {financial && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Principal contratado</p>
                <p className="tabular-nums mt-1 text-2xl font-bold">
                  {formatCurrency(financial.principal_amount_cents / 100)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Saldo devedor</p>
                <p className={cn('tabular-nums mt-1 text-2xl font-bold', outstandingBalanceColor)}>
                  {formatCurrency(financial.outstanding_balance_cents / 100)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total pago</p>
                <p className="tabular-nums mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(financial.total_paid_cents / 100)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-2 pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Progresso</p>
                  <span className="tabular-nums text-sm font-semibold">
                    {Number(financial.payment_progress_percentage).toFixed(1)}%
                  </span>
                </div>
                <Progress value={Number(financial.payment_progress_percentage)} />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  {financial.total_correction_cents > 0 && (
                    <span>Correção: +{formatCurrency(financial.total_correction_cents / 100)}</span>
                  )}
                  {financial.total_adjustment_cents !== 0 && (
                    <span>Ajustes: {formatCurrency(financial.total_adjustment_cents / 100)}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Próximo vencimento + contadores */}
        {installmentSummary && (
          <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Próximo vencimento</p>
              {installmentSummary.next_due_date ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold">
                    {formatDate(installmentSummary.next_due_date)}
                  </span>
                  {installmentSummary.next_due_amount_cents != null && (
                    <span className="tabular-nums text-sm text-muted-foreground">
                      {formatCurrency(installmentSummary.next_due_amount_cents / 100)}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sem parcelas pendentes</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {(installmentSummary.paid_count ?? 0) > 0 && (
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:text-emerald-300"
                >
                  {installmentSummary.paid_count} pagas
                </Badge>
              )}
              {(installmentSummary.overdue_count ?? 0) > 0 && (
                <Badge
                  variant="outline"
                  className="border-red-500/30 bg-red-500/10 text-red-700 dark:border-red-400/30 dark:text-red-300"
                >
                  {installmentSummary.overdue_count} em atraso
                </Badge>
              )}
              <Badge variant="outline">{installmentSummary.total_count} total</Badge>
            </div>
          </div>
        )}

        {/* Plano de parcelas */}
        {installmentSummary?.schedules && installmentSummary.schedules.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Plano de Parcelas</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-6">Tipo</TableHead>
                    <TableHead className="px-6 text-right">Qtd</TableHead>
                    <TableHead className="px-6 text-right">Valor/Parcela</TableHead>
                    <TableHead className="px-6 text-right">Total</TableHead>
                    <TableHead className="hidden px-6 md:table-cell">Período</TableHead>
                    <TableHead className="hidden px-6 lg:table-cell">Forma de Pagamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {installmentSummary.schedules.map((schedule) => (
                    <TableRow key={`${schedule.kind}-${schedule.first_due_date}`}>
                      <TableCell className="px-6 font-medium">
                        {INSTALLMENT_KIND_LABELS[schedule.kind] ??
                          translateInstallmentKind(schedule.kind, 'pt-BR')}
                      </TableCell>
                      <TableCell className="px-6 text-right tabular-nums">
                        {schedule.count}
                      </TableCell>
                      <TableCell className="px-6 text-right tabular-nums">
                        {formatCurrency(schedule.amount_cents / 100)}
                      </TableCell>
                      <TableCell className="px-6 text-right tabular-nums">
                        {formatCurrency(schedule.total_amount_cents / 100)}
                      </TableCell>
                      <TableCell className="hidden px-6 md:table-cell">
                        {schedule.first_due_date === schedule.last_due_date ? (
                          formatDate(schedule.first_due_date)
                        ) : (
                          <span className="text-sm">
                            {formatMonthYear(schedule.first_due_date)} –{' '}
                            {formatMonthYear(schedule.last_due_date)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="hidden px-6 lg:table-cell">
                        {PAYMENT_METHOD_LABELS[schedule.payment_method] ??
                          translatePaymentMethod(schedule.payment_method, 'pt-BR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="px-6 font-semibold">Total</TableCell>
                    <TableCell className="px-6 text-right tabular-nums font-semibold">
                      {installmentSummary.total_count}
                    </TableCell>
                    <TableCell className="px-6" />
                    <TableCell className="px-6 text-right tabular-nums font-semibold">
                      {totalScheduleAmount}
                    </TableCell>
                    <TableCell className="hidden px-6 md:table-cell" />
                    <TableCell className="hidden px-6 lg:table-cell" />
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Histórico de correção monetária */}
        {correctionSummary && correctionSummary.correction_count > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Histórico de Correção Monetária</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {correctionSummary.correction_count}{' '}
                {correctionSummary.correction_count === 1 ? 'mês corrigido' : 'meses corrigidos'} ·
                Total:{' '}
                <span className="tabular-nums font-medium">
                  {formatCurrency(correctionSummary.total_correction_cents / 100)}
                </span>
              </p>
            </CardHeader>
            {correctionSummary.entries && correctionSummary.entries.length > 0 && (
              <CardContent>
                <CorrectionChart
                  entries={correctionSummary.entries}
                  totalCorrectionCents={correctionSummary.total_correction_cents}
                  principalAmountCents={contract.principal_amount_cents}
                />
              </CardContent>
            )}
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-6">Mês de Referência</TableHead>
                    <TableHead className="px-6">Índice</TableHead>
                    <TableHead className="px-6 text-right">Variação</TableHead>
                    <TableHead className="px-6 text-right">Valor Corrigido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {correctionSummary.entries?.map((entry) => (
                    <TableRow key={entry.reference_month}>
                      <TableCell className="px-6">
                        {formatMonthYear(entry.reference_month)}
                      </TableCell>
                      <TableCell className="px-6 font-mono text-sm">
                        {entry.index_type_code}
                      </TableCell>
                      <TableCell className="px-6 text-right tabular-nums">
                        <span
                          className={cn(
                            entry.variation_ppm >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                          )}
                        >
                          {entry.variation_ppm >= 0 ? '+' : ''}
                          {(entry.variation_ppm / 10000).toFixed(2)}%
                        </span>
                      </TableCell>
                      <TableCell className="px-6 text-right tabular-nums">
                        {formatCurrency(entry.amount_cents / 100)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="px-6 font-semibold" colSpan={3}>
                      Total
                    </TableCell>
                    <TableCell className="px-6 text-right tabular-nums font-semibold">
                      {formatCurrency(correctionSummary.total_correction_cents / 100)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Pagamentos */}
        {paymentSummary && paymentSummary.payment_count > 0 && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Resumo de Pagamentos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total recebido</span>
                  <span className="tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(paymentSummary.total_paid_cents / 100)}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Nº de pagamentos</span>
                  <span className="text-sm">{paymentSummary.payment_count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Último pagamento</span>
                  <span className="text-sm">{formatDate(paymentSummary.last_payment_date)}</span>
                </div>
              </CardContent>
            </Card>

            {paymentSummary.by_method && paymentSummary.by_method.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Por Forma de Pagamento</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="px-6">Método</TableHead>
                        <TableHead className="px-6 text-right">Qtd</TableHead>
                        <TableHead className="px-6 text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentSummary.by_method.map((item) => (
                        <TableRow key={item.method}>
                          <TableCell className="px-6">
                            {PAYMENT_METHOD_LABELS[item.method] ??
                              translatePaymentMethod(item.method, 'pt-BR')}
                          </TableCell>
                          <TableCell className="px-6 text-right tabular-nums">
                            {item.count}
                          </TableCell>
                          <TableCell className="px-6 text-right tabular-nums">
                            {formatCurrency(item.total_cents / 100)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Evolução do saldo */}
        {balanceTimeline?.entries && balanceTimeline.entries.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Evolução do Saldo</CardTitle>
            </CardHeader>
            <CardContent>
              <BalanceTimelineChart
                entries={balanceTimeline.entries}
                principalAmountCents={contract.principal_amount_cents}
              />
            </CardContent>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="px-6">Mês</TableHead>
                      <TableHead className="px-6 text-right">Abertura</TableHead>
                      <TableHead className="hidden px-6 text-right md:table-cell">
                        Correções
                      </TableHead>
                      <TableHead className="hidden px-6 text-right md:table-cell">
                        Pagamentos
                      </TableHead>
                      <TableHead className="hidden px-6 text-right lg:table-cell">
                        Ajustes
                      </TableHead>
                      <TableHead className="px-6 text-right">Fechamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {balanceTimeline.entries.map((entry) => (
                      <TableRow key={entry.month}>
                        <TableCell className="px-6">{formatMonthYear(entry.month)}</TableCell>
                        <TableCell className="px-6 text-right tabular-nums">
                          {formatCurrency(entry.opening_balance_cents / 100)}
                        </TableCell>
                        <TableCell className="hidden px-6 text-right tabular-nums md:table-cell">
                          {entry.corrections_cents !== 0 ? (
                            <span className="text-amber-600 dark:text-amber-400">
                              +{formatCurrency(entry.corrections_cents / 100)}
                            </span>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell className="hidden px-6 text-right tabular-nums md:table-cell">
                          {entry.payments_cents !== 0 ? (
                            <span className="text-emerald-600 dark:text-emerald-400">
                              -{formatCurrency(entry.payments_cents / 100)}
                            </span>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell className="hidden px-6 text-right tabular-nums lg:table-cell">
                          {entry.adjustments_cents !== 0
                            ? formatCurrency(entry.adjustments_cents / 100)
                            : '—'}
                        </TableCell>
                        <TableCell className="px-6 text-right tabular-nums font-medium">
                          {formatCurrency(entry.closing_balance_cents / 100)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
