import {
  translateInstallmentKind,
  translatePaymentMethod,
  translatePaymentStatus,
} from '@cacenot/construct-pro-api-client/enums'
import type { ColumnDef } from '@tanstack/react-table'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ExternalLink, Info } from 'lucide-react'
import { navigate } from 'vike/client/router'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { SortableHeader } from '@/components/ui/sortable-header'
import type { InstallmentSummaryItemResponse } from '@/hooks/use-installments'
import { installmentDaysOverdue, isInstallmentOverdue } from '@/lib/installment-overdue'
import { formatDocument } from '@/lib/text-formatters'
import { formatCurrency, getInitials } from '@/lib/utils'
import { InstallmentStatusBadge } from './installment-status-badge'

export interface InstallmentsTableMeta {
  sort: string
  onSort: (field: string) => void
}

type Payment = NonNullable<InstallmentSummaryItemResponse['payments']>[number]

type MoneyObject = { cents: number; decimal: string; brl: string }

/** Reexport: a inadimplência derivada (lib/installment-overdue) é a fonte única. */
export { isInstallmentOverdue }

function PaymentsHoverContent({
  payments,
  paid_amount,
  remaining_amount,
}: {
  payments: Payment[]
  paid_amount: MoneyObject
  remaining_amount: MoneyObject
}) {
  return (
    <HoverCardContent className="w-72 p-4" align="start">
      <p className="mb-2 text-sm font-semibold">Pagamentos</p>
      {payments.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhum pagamento registrado</p>
      ) : (
        <div className="flex flex-col gap-2">
          {payments.map((p, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: payments have no stable key
            <div key={i} className="flex flex-col gap-0.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium">{translatePaymentMethod(p.method, 'pt-BR')}</span>
                <span className="tabular-nums">
                  {formatCurrency(p.allocation_amount.cents / 100)}
                </span>
              </div>
              {p.allocation_amount.cents !== p.payment_amount.cents && (
                <div className="flex items-center justify-between text-muted-foreground/70">
                  <span className="text-[11px] italic">Pgto. total</span>
                  <span className="tabular-nums text-[11px]">
                    {formatCurrency(p.payment_amount.cents / 100)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-muted-foreground">
                <span>{translatePaymentStatus(p.status, 'pt-BR')}</span>
                <span>
                  {p.paid_at ? format(parseISO(p.paid_at), 'dd/MM/yyyy', { locale: ptBR }) : '—'}
                </span>
              </div>
            </div>
          ))}
          <div className="mt-1 flex flex-col gap-1 border-t pt-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-success">Total pago</span>
              <span className="tabular-nums font-medium text-success">
                {formatCurrency(paid_amount.cents / 100)}
              </span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Restante</span>
              <span className="tabular-nums">{formatCurrency(remaining_amount.cents / 100)}</span>
            </div>
          </div>
        </div>
      )}
    </HoverCardContent>
  )
}

/** Mini-perfil do cliente em popover (substitui o link para abrir o cliente). */
function CustomerCell({
  customer,
}: {
  customer: NonNullable<InstallmentSummaryItemResponse['customer']>
}) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="w-fit max-w-full cursor-pointer truncate text-left text-sm font-medium hover:underline focus-visible:underline focus-visible:outline-none"
            onClick={(event) => event.stopPropagation()}
          >
            {customer.full_name}
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-72 p-0"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center gap-3 p-4">
            <Avatar className="size-10">
              <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                {getInitials(customer.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold">{customer.full_name}</span>
              {customer.cpf_cnpj && (
                <span className="text-xs tabular-nums text-muted-foreground">
                  {formatDocument(customer.cpf_cnpj)}
                </span>
              )}
            </div>
          </div>
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 font-normal"
              onClick={(event) => {
                event.stopPropagation()
                navigate(`/clientes/${customer.id}`)
              }}
            >
              <ExternalLink className="size-3.5 text-muted-foreground" />
              Abrir cliente
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      {customer.cpf_cnpj && (
        <span className="truncate text-xs tabular-nums text-muted-foreground">
          {formatDocument(customer.cpf_cnpj)}
        </span>
      )}
    </div>
  )
}

export const installmentsColumns: ColumnDef<InstallmentSummaryItemResponse>[] = [
  {
    id: 'customer',
    header: 'Cliente',
    // No mobile a célula trunca (max-w) para Valor e Status caberem na viewport;
    // o nome completo está a um toque (painel de detalhe).
    meta: { className: 'max-w-24 sm:max-w-48 md:max-w-none', skeleton: { lines: 2 } },
    cell: ({ row }) => {
      const { customer } = row.original
      if (!customer) return <span className="text-muted-foreground">—</span>
      return <CustomerCell customer={customer} />
    },
  },
  {
    id: 'unit',
    header: 'Unidade',
    // Mobile mostra o essencial de triagem (cliente, valor, status); unidade
    // entra a partir de md e vencimento a partir de sm (atraso já está no badge).
    meta: {
      className: 'hidden md:table-cell',
      headClassName: 'hidden md:table-cell',
      skeleton: { lines: 2 },
    },
    cell: ({ row }) => {
      const { unit, project } = row.original
      if (!unit && !project) return <span className="text-muted-foreground">—</span>
      return (
        <div className="flex min-w-0 flex-col gap-0.5">
          {unit && <span className="truncate text-sm font-medium">{unit.name}</span>}
          {project && (
            <span className="truncate text-xs text-muted-foreground">{project.name}</span>
          )}
        </div>
      )
    },
  },
  {
    id: 'amount',
    meta: { skeleton: { lines: 2 } },
    header: ({ table }) => {
      const meta = table.options.meta as InstallmentsTableMeta | undefined
      if (!meta) return 'Valor'
      return (
        <SortableHeader
          label="Valor"
          field="current_amount_cents"
          currentSort={meta.sort}
          onSort={meta.onSort}
        />
      )
    },
    cell: ({ row }) => {
      const { current_amount, paid_amount, remaining_amount, kind } = row.original
      const payments: Payment[] = row.original.payments ?? []
      return (
        <HoverCard>
          <HoverCardTrigger asChild>
            <div className="flex w-fit cursor-default flex-col gap-0.5">
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium tabular-nums">
                  {formatCurrency(current_amount.cents / 100)}
                </span>
                {/* Affordance de hover: irrelevante no touch, some em telas estreitas */}
                <Info className="hidden size-3 shrink-0 text-muted-foreground/50 sm:block" />
              </div>
              <span className="text-xs text-muted-foreground">
                {translateInstallmentKind(kind, 'pt-BR')}
              </span>
            </div>
          </HoverCardTrigger>
          <PaymentsHoverContent
            payments={payments}
            paid_amount={paid_amount}
            remaining_amount={remaining_amount}
          />
        </HoverCard>
      )
    },
  },
  {
    id: 'due_date',
    meta: {
      className: 'hidden sm:table-cell',
      headClassName: 'hidden sm:table-cell',
      skeleton: { lines: 2 },
    },
    header: ({ table }) => {
      const meta = table.options.meta as InstallmentsTableMeta | undefined
      if (!meta) return 'Vencimento'
      return (
        <SortableHeader
          label="Vencimento"
          field="due_date"
          currentSort={meta.sort}
          onSort={meta.onSort}
        />
      )
    },
    cell: ({ row }) => {
      const dueDate = parseISO(row.original.due_date)
      const overdue = isInstallmentOverdue(row.original)
      const days = installmentDaysOverdue(row.original)
      return (
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-sm tabular-nums">{format(dueDate, 'dd/MM/yyyy')}</span>
          <span
            className={`text-xs ${overdue ? 'font-medium text-destructive' : 'text-muted-foreground'}`}
          >
            {overdue && days > 0
              ? `há ${days} ${days === 1 ? 'dia' : 'dias'}`
              : formatDistanceToNow(dueDate, { addSuffix: true, locale: ptBR })}
          </span>
        </div>
      )
    },
  },
  {
    id: 'status',
    header: 'Status',
    meta: { skeleton: { variant: 'badge' } },
    cell: ({ row }) => {
      const { status } = row.original
      if (!status) return null
      return (
        <InstallmentStatusBadge
          status={status}
          overdue={isInstallmentOverdue(row.original)}
          daysOverdue={installmentDaysOverdue(row.original)}
        />
      )
    },
  },
]
