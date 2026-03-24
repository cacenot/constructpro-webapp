import { translateInstallmentKind } from '@cacenot/construct-pro-api-client'
import type { ColumnDef } from '@tanstack/react-table'
import { format, formatDistanceToNow, isPast, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowDown, ArrowUp, ArrowUpDown, MoreVertical } from 'lucide-react'
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { InstallmentResponse } from '@/hooks/use-installments'
import { formatCurrency } from '@/lib/utils'
import { InstallmentStatusBadge } from './installment-status-badge'

export interface InstallmentsTableMeta {
  onPayInstallment: (installment: InstallmentResponse) => void
  onIssueBoleto: (installment: InstallmentResponse) => void
  onViewDetails: (installment: InstallmentResponse) => void
  sort: string
  onSort: (field: string) => void
}

function SortableHeader({
  label,
  field,
  currentSort,
  onSort,
}: {
  label: string
  field: string
  currentSort: string
  onSort: (field: string) => void
}) {
  const [currentField, currentDir] = currentSort.split(':')
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

export const installmentsColumns: ColumnDef<InstallmentResponse>[] = [
  {
    id: 'installment_id',
    header: ({ table }) => {
      const meta = table.options.meta as InstallmentsTableMeta | undefined
      if (!meta) return 'Parcela'
      return (
        <SortableHeader label="Parcela" field="id" currentSort={meta.sort} onSort={meta.onSort} />
      )
    },
    cell: ({ row }) => (
      <Badge variant="secondary" className="tabular-nums font-mono text-xs shrink-0">
        #{row.original.contract_id}
        {row.original.installment_number != null && `-${row.original.installment_number}`}
      </Badge>
    ),
  },
  {
    id: 'kind',
    header: 'Tipo',
    cell: ({ row }) => (
      <Badge variant="outline" className="text-xs shrink-0">
        {translateInstallmentKind(row.original.kind, 'pt-BR')}
      </Badge>
    ),
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
      const { current_amount_cents, paid_amount, remaining_amount, status } = row.original
      const isPaid = status === 'paid'
      return (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium tabular-nums">
            {formatCurrency(current_amount_cents / 100)}
          </span>
          {!isPaid && (
            <div className="flex items-center gap-2 text-xs tabular-nums">
              <span className="text-emerald-700 dark:text-emerald-400">{paid_amount}</span>
              <span className="text-muted-foreground">Rest: {remaining_amount}</span>
            </div>
          )}
        </div>
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
      const { status } = row.original
      if (!status) return null
      return (
        <div className="w-32 shrink-0">
          <InstallmentStatusBadge status={status} />
        </div>
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
            <DropdownMenuItem onClick={() => meta?.onViewDetails(installment)}>
              Ver detalhes
            </DropdownMenuItem>
            {canPay && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => meta?.onPayInstallment(installment)}>
                  Registrar pagamento
                </DropdownMenuItem>
              </>
            )}
            {canIssueBoleto && (
              <DropdownMenuItem onClick={() => meta?.onIssueBoleto(installment)}>
                Emitir boleto
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
