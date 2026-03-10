import { translateInstallmentKind } from '@cacenot/construct-pro-api-client'
import type { ColumnDef } from '@tanstack/react-table'
import { format, formatDistanceToNow, isPast, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MoreVertical } from 'lucide-react'
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
}

export const installmentsColumns: ColumnDef<InstallmentResponse>[] = [
  {
    id: 'contract',
    header: 'Contrato',
    cell: ({ row }) => (
      <Badge variant="secondary" className="tabular-nums font-mono text-xs shrink-0">
        #{row.original.contract_id}
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
    header: 'Valor',
    cell: ({ row }) => {
      const { current_amount_cents, base_amount_cents } = row.original
      const hasCorrectionDiff = current_amount_cents !== base_amount_cents
      return (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium tabular-nums">
            {formatCurrency(current_amount_cents / 100)}
          </span>
          {hasCorrectionDiff && (
            <span className="text-xs text-muted-foreground tabular-nums">
              Base {formatCurrency(base_amount_cents / 100)}
            </span>
          )}
        </div>
      )
    },
  },
  {
    id: 'paid_remaining',
    header: 'Pago / Restante',
    cell: ({ row }) => {
      const { paid_amount, remaining_amount } = row.original
      return (
        <div className="hidden lg:flex flex-col gap-0.5 w-36">
          <span className="text-sm tabular-nums text-emerald-700 dark:text-emerald-400">
            {paid_amount}
          </span>
          <span className="text-xs tabular-nums text-muted-foreground">
            Restante: {remaining_amount}
          </span>
        </div>
      )
    },
  },
  {
    id: 'due_date',
    header: 'Vencimento',
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
            <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
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
