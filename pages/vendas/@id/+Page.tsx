import {
  SaleStatus,
  translateContractStatus,
  translateInstallmentKind,
  translatePaymentMethod,
  useSale,
} from '@cacenot/construct-pro-api-client'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft, Building2, FileText, Pencil, User, Wallet } from 'lucide-react'
import { useState } from 'react'
import { navigate } from 'vike/client/router'
import { usePageContext } from 'vike-react/usePageContext'
import { AppLayout } from '@/components/app-layout'
import { PayInstallmentDialog } from '@/components/financeiro/pay-installment-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { SaleStatusBadge } from '@/components/vendas/sale-status-badge'
import { SignContractDialog } from '@/components/vendas/sign-contract-dialog'
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
    return format(new Date(dateStr), 'MMM/yy', { locale: ptBR })
  } catch {
    return dateStr
  }
}

const CONTRACT_STATUS_COLORS: Record<string, string> = {
  pending:
    'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300',
  active:
    'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300',
  in_default:
    'border-red-500/30 bg-red-500/10 text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300',
  settled:
    'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-300',
  canceled:
    'border-zinc-500/30 bg-zinc-500/10 text-zinc-600 dark:border-zinc-400/30 dark:bg-zinc-400/10 dark:text-zinc-400',
  terminated:
    'border-zinc-500/30 bg-zinc-500/10 text-zinc-600 dark:border-zinc-400/30 dark:bg-zinc-400/10 dark:text-zinc-400',
}

export default function SaleDetailPage() {
  const pageContext = usePageContext()
  const saleId = Number(pageContext.routeParams?.id)

  const [signOpen, setSignOpen] = useState(false)
  const [payEntryOpen, setPayEntryOpen] = useState(false)

  const { data: sale, isLoading, error } = useSale(saleId)

  const canSign = sale?.status === SaleStatus.pending_signature && !!sale.contract
  const canPayEntry =
    (sale?.status === SaleStatus.pending_signature ||
      sale?.status === SaleStatus.pending_payment) &&
    !!sale.contract
  const canEdit = sale?.status === SaleStatus.pending_signature

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
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-36" />
            <Skeleton className="h-36" />
          </div>
          <Skeleton className="h-48" />
        </div>
      </AppLayout>
    )
  }

  if (error || !sale) {
    return (
      <AppLayout>
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
          <p className="text-lg text-muted-foreground">Proposta não encontrada</p>
          <Button variant="link" onClick={() => navigate('/vendas')}>
            Voltar para lista
          </Button>
        </div>
      </AppLayout>
    )
  }

  const metrics = sale.metrics
  const discountCents = metrics?.discount_cents ?? sale.unit_price_cents - sale.amount_cents
  const discountPctStr = metrics
    ? metrics.discount_percentage
    : sale.unit_price_cents > 0
      ? ((discountCents / sale.unit_price_cents) * 100).toFixed(2)
      : '0'

  const summary = sale.installment_summary
  const totalInstallments = summary?.total_count ?? 0
  const totalAmount = summary?.total_amount_cents
    ? formatCurrency(summary.total_amount_cents / 100)
    : formatCurrency(sale.amount_cents / 100)

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Breadcrumb / back */}
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 gap-1.5 text-muted-foreground"
          onClick={() => navigate('/vendas')}
        >
          <ArrowLeft className="size-4" />
          Voltar para Vendas
        </Button>

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">Proposta {formatId(sale.id)}</h1>
              {sale.status && <SaleStatusBadge status={sale.status} />}
            </div>
            <p className="text-sm text-muted-foreground">
              Criada em {formatDate(sale.created_at)}
              {sale.updated_at && ` · Atualizada em ${formatDate(sale.updated_at)}`}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {canEdit && (
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => navigate(`/vendas/${saleId}/editar`)}
              >
                <Pencil className="size-4" />
                Editar
              </Button>
            )}
            {canSign && (
              <Button variant="outline" className="gap-2" onClick={() => setSignOpen(true)}>
                <FileText className="size-4" />
                Assinar Contrato
              </Button>
            )}
            {canPayEntry && (
              <Button className="gap-2" onClick={() => setPayEntryOpen(true)}>
                <Wallet className="size-4" />
                Receber sinal/entrada
              </Button>
            )}
          </div>
        </div>

        {/* Info cards — 3 columns */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Unit */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Building2 className="size-4" />
                Unidade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="font-semibold">{sale.unit?.name ?? '—'}</p>
              <p className="text-sm text-muted-foreground">
                {sale.unit?.project?.name ?? 'Empreendimento não informado'}
              </p>
              {sale.unit?.area && (
                <p className="text-xs text-muted-foreground">{sale.unit.area} m²</p>
              )}
            </CardContent>
          </Card>

          {/* Customer */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <User className="size-4" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="font-semibold">{sale.customer?.full_name ?? '—'}</p>
              {sale.customer?.cpf_cnpj && (
                <p className="text-sm text-muted-foreground">
                  {formatDocument(sale.customer.cpf_cnpj)}
                </p>
              )}
              {sale.customer?.email && (
                <p className="text-xs text-muted-foreground">{sale.customer.email}</p>
              )}
            </CardContent>
          </Card>

          {/* Vendedor */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <User className="size-4" />
                Vendedor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className="font-semibold">{sale.user?.full_name ?? '—'}</p>
              <p className="text-xs text-muted-foreground">
                Proposta criada em {formatDate(sale.created_at)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Values + Contract — 2 columns */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Valores */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Valores da Proposta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Valor total da proposta</span>
                <span className="tabular-nums font-semibold">
                  {formatCurrency(sale.amount_cents / 100)}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Preço de tabela</span>
                <span className="tabular-nums text-sm">
                  {formatCurrency(sale.unit_price_cents / 100)}
                </span>
              </div>
              {discountCents !== 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {discountCents > 0 ? 'Desconto' : 'Acréscimo'}
                  </span>
                  <span
                    className={cn(
                      'tabular-nums text-sm',
                      discountCents > 0 ? 'text-emerald-600' : 'text-red-600'
                    )}
                  >
                    {discountCents > 0 ? '-' : '+'}
                    {formatCurrency(Math.abs(discountCents) / 100)}{' '}
                    <span className="text-xs opacity-70">
                      ({Math.abs(Number(discountPctStr)).toFixed(1)}%)
                    </span>
                  </span>
                </div>
              )}
              {metrics?.price_per_sqm_cents != null && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Preço por m²</span>
                  <span className="tabular-nums text-sm">
                    {formatCurrency(metrics.price_per_sqm_cents / 100)}
                  </span>
                </div>
              )}
              {summary && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Período</span>
                    <span className="tabular-nums text-sm">
                      {formatDate(summary.first_due_date)} – {formatDate(summary.last_due_date)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total de parcelas</span>
                    <span className="tabular-nums text-sm">{totalInstallments}</span>
                  </div>
                  {metrics?.entry_amount_cents != null && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Entrada</span>
                      <span className="tabular-nums text-sm">
                        {formatCurrency(metrics.entry_amount_cents / 100)}
                        {metrics.entry_percentage != null && (
                          <span className="ml-1.5 text-xs opacity-70">
                            ({Number(metrics.entry_percentage).toFixed(1)}%)
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  {metrics?.financed_amount_cents != null && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Valor financiado</span>
                      <span className="tabular-nums text-sm">
                        {formatCurrency(metrics.financed_amount_cents / 100)}
                      </span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Contrato */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Contrato</CardTitle>
            </CardHeader>
            <CardContent>
              {!sale.contract ? (
                <p className="text-sm text-muted-foreground">Nenhum contrato associado.</p>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    {sale.contract.status && (
                      <Badge
                        variant="ghost"
                        className={cn(
                          'rounded-full border',
                          CONTRACT_STATUS_COLORS[sale.contract.status] ??
                            CONTRACT_STATUS_COLORS.pending
                        )}
                      >
                        {translateContractStatus(sale.contract.status, 'pt-BR')}
                      </Badge>
                    )}
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Valor principal</span>
                    <span className="tabular-nums text-sm">
                      {formatCurrency(sale.contract.principal_amount_cents / 100)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Índice de correção</span>
                    <span className="text-sm">{sale.contract.index_type_code}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Assinado em</span>
                    <span className="text-sm">{formatDate(sale.contract.signed_at)}</span>
                  </div>
                  {sale.contract.document_url && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Documento</span>
                      <a
                        href={sale.contract.document_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        <FileText className="size-3.5" />
                        Ver contrato
                      </a>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cronograma de Parcelas */}
        {summary?.schedules && summary.schedules.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Cronograma de Parcelas</CardTitle>
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
                  {summary.schedules.map((schedule) => (
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
                      {totalInstallments}
                    </TableCell>
                    <TableCell className="px-6" />
                    <TableCell className="px-6 text-right tabular-nums font-semibold">
                      {totalAmount}
                    </TableCell>
                    <TableCell className="hidden px-6 md:table-cell" />
                    <TableCell className="hidden px-6 lg:table-cell" />
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      <SignContractDialog open={signOpen} onOpenChange={setSignOpen} saleId={saleId} />

      <PayInstallmentDialog open={payEntryOpen} onOpenChange={setPayEntryOpen} saleId={saleId} />
    </AppLayout>
  )
}
