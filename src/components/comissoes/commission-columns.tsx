import type { ColumnDef } from '@tanstack/react-table'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { CommissionItem } from '@/hooks/use-commissions-table'
import { formatCurrency } from '@/lib/utils'

export const commissionColumns: ColumnDef<CommissionItem>[] = [
  {
    accessorKey: 'sale_closed_at',
    header: 'Data',
    cell: ({ row }) => {
      const value = row.original.sale_closed_at
      return (
        <span className="tabular-nums">
          {format(parseISO(value), 'dd/MM/yyyy', { locale: ptBR })}
        </span>
      )
    },
  },
  {
    accessorKey: 'sale_id',
    header: 'Venda',
    cell: ({ row }) => {
      const saleId = row.original.sale_id
      return (
        <a href={`/vendas/${saleId}`} className="font-medium text-primary hover:underline">
          #{String(saleId).slice(0, 8).toUpperCase()}
        </a>
      )
    },
  },
  {
    accessorKey: 'broker',
    header: 'Corretor',
    cell: ({ row }) => {
      const broker = row.original.broker
      return <span>{broker?.full_name ?? '—'}</span>
    },
  },
  {
    accessorKey: 'agency',
    header: 'Imobiliária',
    meta: { className: 'hidden md:table-cell' },
    cell: ({ row }) => {
      const agency = row.original.agency
      const name = agency?.trade_name ?? agency?.legal_name
      return <span className="hidden md:table-cell">{name ?? '—'}</span>
    },
  },
  {
    accessorKey: 'sale_amount_at_approval',
    header: () => <span className="hidden md:table-cell">Valor Venda</span>,
    cell: ({ row }) => {
      const amount = row.original.sale_amount_at_approval
      return (
        <span className="hidden md:table-cell tabular-nums text-right">
          {formatCurrency(amount.cents / 100)}
        </span>
      )
    },
  },
  {
    accessorKey: 'broker_rate',
    header: () => <span className="hidden lg:table-cell">Taxa Corretor</span>,
    cell: ({ row }) => {
      const rate = row.original.broker_rate
      return (
        <span className="hidden lg:table-cell tabular-nums text-right">
          {rate ? rate.formatted : '—'}
        </span>
      )
    },
  },
  {
    accessorKey: 'agency_rate',
    header: () => <span className="hidden lg:table-cell">Taxa Imob.</span>,
    cell: ({ row }) => {
      const rate = row.original.agency_rate
      return (
        <span className="hidden lg:table-cell tabular-nums text-right">
          {rate ? rate.formatted : '—'}
        </span>
      )
    },
  },
  {
    accessorKey: 'total_amount',
    header: () => <span className="text-right">Comissão Total</span>,
    cell: ({ row }) => {
      const amount = row.original.total_amount
      return (
        <span className="tabular-nums text-right block">{formatCurrency(amount.cents / 100)}</span>
      )
    },
  },
]
