import {
  translateInstallmentKind,
  translatePaymentMethod,
  useSale,
} from '@cacenot/construct-pro-api-client'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft, Download, ExternalLink } from 'lucide-react'
import { navigate } from 'vike/client/router'
import { usePageContext } from 'vike-react/usePageContext'
import { AppLayout } from '@/components/app-layout'
import { BalanceTimelineChart } from '@/components/contratos/balance-timeline-chart'
import { ContractStatusBadge } from '@/components/contratos/contract-status-badge'
import { CorrectionChart } from '@/components/contratos/correction-chart'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-36" />
          <Skeleton className="h-80" />
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

  const hasCorrectionData = correctionSummary && correctionSummary.correction_count > 0
  const hasPaymentData = paymentSummary && paymentSummary.payment_count > 0

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

        {/* === ZONA 1: Header Compacto === */}
        <div className="space-y-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1.5">
              <p className="text-lg font-semibold">{sale?.customer?.full_name ?? '—'}</p>
              <div className="flex items-center gap-3">
                <h1 className="text-sm font-medium text-muted-foreground">
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

          {/* Contexto inline: Cliente | Unidade | Financiamento */}
          <div className="flex flex-col gap-2 text-sm lg:flex-row lg:items-center lg:gap-0">
            {sale?.customer?.cpf_cnpj && (
              <>
                <span className="text-muted-foreground">
                  {formatDocument(sale.customer.cpf_cnpj)}
                  {sale.customer.email && ` · ${sale.customer.email}`}
                </span>
                <Separator orientation="vertical" className="mx-4 hidden h-4 lg:block" />
              </>
            )}
            <div className="flex items-center gap-2">
              <span className="font-medium">{sale?.unit?.name ?? '—'}</span>
              {sale?.unit?.project?.name && (
                <span className="text-muted-foreground">· {sale.unit.project.name}</span>
              )}
              {sale?.unit?.area && (
                <span className="text-muted-foreground">· {sale.unit.area} m²</span>
              )}
            </div>
            <Separator orientation="vertical" className="mx-4 hidden h-4 lg:block" />
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Índice:</span>
              <span className="font-medium">{contract.index_type_code}</span>
              <span className="text-muted-foreground">·</span>
              <span className="tabular-nums font-medium">
                {formatCurrency(contract.principal_amount_cents / 100)}
              </span>
            </div>
          </div>
        </div>

        {/* === ZONA 2: Resumo Financeiro === */}
        {financial && (
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Principal contratado</p>
                  <p className="tabular-nums mt-1 text-2xl font-bold">
                    {formatCurrency(financial.principal_amount_cents / 100)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saldo devedor</p>
                  <p
                    className={cn('tabular-nums mt-1 text-2xl font-bold', outstandingBalanceColor)}
                  >
                    {formatCurrency(financial.outstanding_balance_cents / 100)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total pago</p>
                  <p className="tabular-nums mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(financial.total_paid_cents / 100)}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Progresso</p>
                    <span className="tabular-nums text-sm font-semibold">
                      {Number(financial.payment_progress_percentage).toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={Number(financial.payment_progress_percentage)} />
                </div>
              </div>

              {(financial.total_correction_cents > 0 || financial.total_adjustment_cents !== 0) && (
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {financial.total_correction_cents > 0 && (
                    <span>Correção: +{formatCurrency(financial.total_correction_cents / 100)}</span>
                  )}
                  {financial.total_adjustment_cents !== 0 && (
                    <span>Ajustes: {formatCurrency(financial.total_adjustment_cents / 100)}</span>
                  )}
                </div>
              )}
            </CardContent>

            {/* Próximo vencimento */}
            {installmentSummary && (
              <>
                <Separator />
                <CardContent className="py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm text-muted-foreground">Próximo vencimento:</span>
                      {installmentSummary.next_due_date ? (
                        <>
                          <span className="text-lg font-bold">
                            {formatDate(installmentSummary.next_due_date)}
                          </span>
                          {installmentSummary.next_due_amount_cents != null && (
                            <span className="tabular-nums text-sm text-muted-foreground">
                              {formatCurrency(installmentSummary.next_due_amount_cents / 100)}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Sem parcelas pendentes
                        </span>
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
                </CardContent>
              </>
            )}
          </Card>
        )}

        {/* === Plano de Parcelas === */}
        {installmentSummary?.schedules && installmentSummary.schedules.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <h3 className="text-base font-semibold">Plano de Parcelas</h3>
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

        {/* === Correção Monetária & Pagamentos (Tabs) === */}
        {(hasCorrectionData || hasPaymentData) && (
          <Card>
            <Tabs defaultValue={hasCorrectionData ? 'correcao' : 'pagamentos'}>
              <CardHeader className="pb-0">
                <TabsList>
                  {hasCorrectionData && (
                    <TabsTrigger value="correcao">Correção Monetária</TabsTrigger>
                  )}
                  {hasPaymentData && <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>}
                </TabsList>
              </CardHeader>

              {/* Tab: Correção Monetária */}
              {hasCorrectionData && (
                <TabsContent value="correcao">
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {correctionSummary.correction_count}{' '}
                      {correctionSummary.correction_count === 1
                        ? 'mês corrigido'
                        : 'meses corrigidos'}{' '}
                      · Total:{' '}
                      <span className="tabular-nums font-medium">
                        {formatCurrency(correctionSummary.total_correction_cents / 100)}
                      </span>
                    </p>
                    {correctionSummary.entries && correctionSummary.entries.length > 0 && (
                      <CorrectionChart
                        entries={correctionSummary.entries}
                        totalCorrectionCents={correctionSummary.total_correction_cents}
                        principalAmountCents={contract.principal_amount_cents}
                      />
                    )}
                  </CardContent>
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
                </TabsContent>
              )}

              {/* Tab: Pagamentos */}
              {hasPaymentData && (
                <TabsContent value="pagamentos">
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total recebido: </span>
                        <span className="tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(paymentSummary.total_paid_cents / 100)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Nº de pagamentos: </span>
                        <span className="font-medium">{paymentSummary.payment_count}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Último pagamento: </span>
                        <span className="font-medium">
                          {formatDate(paymentSummary.last_payment_date)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  {paymentSummary.by_method && paymentSummary.by_method.length > 0 && (
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
                  )}
                </TabsContent>
              )}
            </Tabs>
          </Card>
        )}

        {/* === Evolução do Saldo === */}
        {balanceTimeline?.entries && balanceTimeline.entries.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <h3 className="text-base font-semibold">Evolução do Saldo</h3>
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
