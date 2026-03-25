import {
  translateInstallmentKind,
  translatePaymentMethod,
  translatePaymentStatus,
} from '@cacenot/construct-pro-api-client/enums'
import type { ColumnDef } from '@tanstack/react-table'
import { format, formatDistanceToNow, isPast, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowDown, ArrowUp, ArrowUpDown, Info, MoreVertical } from 'lucide-react'
import { navigate } from 'vike/client/router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { InstallmentSummaryItemResponse } from '@/hooks/use-installments'
import { formatDocument } from '@/lib/text-formatters'
import { formatCurrency } from '@/lib/utils'
import { InstallmentStatusBadge } from './installment-status-badge'

export interface InstallmentsTableMeta {
  onPayInstallment: (installment: InstallmentSummaryItemResponse) => void
  onIssueBoleto: (installment: InstallmentSummaryItemResponse) => void
  onViewDetails: (installment: InstallmentSummaryItemResponse) => void
  sort: string
  onSort: (field: string) => void
}

type Payment = NonNullable<InstallmentSummaryItemResponse['payments']>[number]

function PaymentsHoverContent({
  payments,
  paid_amount,
  remaining_amount,
}: {
  payments: Payment[]
  paid_amount: string
  remaining_amount: string
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
                  {formatCurrency(p.allocation_amount_cents / 100)}
                </span>
              </div>
              {p.allocation_amount_cents !== p.payment_amount_cents && (
                <div className="flex items-center justify-between text-muted-foreground/70">
                  <span className="text-[11px] italic">Pgto. total</span>
                  <span className="tabular-nums text-[11px]">
                    {formatCurrency(p.payment_amount_cents / 100)}
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
              <span className="text-emerald-700 dark:text-emerald-400">Total pago</span>
              <span className="tabular-nums font-medium text-emerald-700 dark:text-emerald-400">
                {formatCurrency(Number(paid_amount))}
              </span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Restante</span>
              <span className="tabular-nums">{formatCurrency(Number(remaining_amount))}</span>
            </div>
          </div>
        </div>
      )}
    </HoverCardContent>
  )
}

function SortableHeader({
  label,
  field,
  currentSort,
  onSort,
}: {
  label: string
  field: string
  currentSort?: string
  onSort: (field: string) => void
}) {
  const parts = currentSort?.split(':') ?? ['', 'asc']
  const [currentField, currentDir] = parts
  const isActive = currentField === field

  const handleClick = () => {
    if (isActive && currentDir === 'asc') {
      onSort(`${field}:desc`)
    } else {
      onSort(`${field}:asc`)
    }
  }

  return (
    <Button variant="ghost" size="sm" className="-ml-3 h-8 gap-1" onClick={handleClick}>
      {label}
      {isActive ? (
        currentDir === 'asc' ? (
          <ArrowUp className="size-3.5" />
        ) : (
          <ArrowDown className="size-3.5" />
        )
      ) : (
        <ArrowUpDown className="size-3.5 opacity-40" />
      )}
    </Button>
  )
}

export const installmentsColumns: ColumnDef<InstallmentSummaryItemResponse>[] = [
  {
    id: 'contract_id',
    header: 'Contrato',
    cell: ({ row }) => (
      <Badge
        variant="secondary"
        className="tabular-nums font-mono text-xs shrink-0 cursor-pointer hover:bg-accent"
        onClick={(e) => {
          e.stopPropagation()
          navigate(`/contratos/${row.original.contract_id}`)
        }}
      >
        #{row.original.contract_id}
      </Badge>
    ),
  },
  {
    id: 'customer',
    header: 'Cliente',
    cell: ({ row }) => {
      const { customer } = row.original
      if (!customer) return <span className="text-muted-foreground">—</span>
      return (
        <div className="flex flex-col gap-0.5 min-w-0">
          <button
            type="button"
            className="text-sm font-medium hover:underline truncate cursor-pointer text-left"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/clientes/${customer.id}`)
            }}
          >
            {customer.full_name}
          </button>
          {customer.cpf_cnpj && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatDocument(customer.cpf_cnpj)}
            </span>
          )}
        </div>
      )
    },
  },
  {
    id: 'unit',
    header: 'Unidade',
    cell: ({ row }) => {
      const { unit, project } = row.original
      if (!unit && !project) return <span className="text-muted-foreground">—</span>
      return (
        <div className="flex flex-col gap-0.5 min-w-0">
          {unit && <span className="text-sm font-medium truncate">{unit.name}</span>}
          {project && (
            <button
              type="button"
              className="text-xs text-muted-foreground hover:underline truncate cursor-pointer text-left"
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/empreendimentos/${project.id}`)
              }}
            >
              {project.name}
            </button>
          )}
        </div>
      )
    },
  },
  {
    id: 'amount',
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
      const { current_amount_cents, paid_amount, remaining_amount, kind } = row.original
      const payments: Payment[] = row.original.payments ?? []
      return (
        <HoverCard>
          <HoverCardTrigger asChild>
            <div className="flex flex-col gap-0.5 cursor-default">
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium tabular-nums">
                  {formatCurrency(current_amount_cents / 100)}
                </span>
                <Info className="size-3 shrink-0 text-muted-foreground/50" />
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
      const isOverdue =
        isPast(dueDate) && row.original.status !== 'paid' && row.original.status !== 'canceled'
      return (
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-sm tabular-nums">{format(dueDate, 'dd/MM/yyyy')}</span>
          <span
            className={`text-xs ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-muted-foreground'}`}
          >
            {formatDistanceToNow(dueDate, { addSuffix: true, locale: ptBR })}
          </span>
        </div>
      )
    },
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const { status, paid_amount, remaining_amount } = row.original
      const payments: Payment[] = row.original.payments ?? []
      if (!status) return null
      return (
        <HoverCard>
          <HoverCardTrigger asChild>
            <div className="w-fit cursor-default">
              <InstallmentStatusBadge status={status} />
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
    id: 'actions',
    header: '',
    cell: ({ row, table }) => {
      const installment = row.original
      const meta = table.options.meta as InstallmentsTableMeta | undefined
      const canPay = installment.status !== 'paid' && installment.status !== 'canceled'
      const canIssueBoleto =
        (installment.status === 'scheduled' || installment.status === 'invoiced') &&
        installment.payment_method === 'boleto'

      return (
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="shrink-0">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ações</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                meta?.onViewDetails(installment)
              }}
            >
              Ver detalhes
            </DropdownMenuItem>
            {canPay && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    meta?.onPayInstallment(installment)
                  }}
                >
                  Registrar pagamento
                </DropdownMenuItem>
              </>
            )}
            {canIssueBoleto && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  meta?.onIssueBoleto(installment)
                }}
              >
                Emitir boleto
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
