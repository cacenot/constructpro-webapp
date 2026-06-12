import type { ColumnDef } from '@tanstack/react-table'
import { DateCell, MoneyCell, MutedCell, PrimaryCell } from '@/components/ui/data-table-cells'
import type { CommissionItem } from '@/hooks/use-commissions-table'
import { formatId } from '@/lib/utils'

export function createCommissionColumns(): ColumnDef<CommissionItem>[] {
  return [
    {
      id: 'broker',
      header: 'Corretor',
      cell: ({ row }) => {
        const { broker, agency } = row.original
        const agencyName = agency?.trade_name ?? agency?.legal_name ?? undefined
        return <PrimaryCell title={broker?.full_name ?? '—'} subtitle={agencyName} />
      },
      meta: { skeleton: { lines: 2 } },
    },
    {
      id: 'sale',
      header: 'Venda',
      cell: ({ row }) => (
        <a
          href={`/vendas/${row.original.sale_id}`}
          className="font-mono text-sm text-primary hover:underline"
          onClick={(event) => event.stopPropagation()}
        >
          {formatId(row.original.sale_id)}
        </a>
      ),
      meta: { className: 'hidden sm:table-cell', headClassName: 'hidden sm:table-cell' },
    },
    {
      id: 'sale_closed_at',
      header: 'Data',
      cell: ({ row }) => <DateCell date={row.original.sale_closed_at} />,
      meta: { className: 'hidden md:table-cell', headClassName: 'hidden md:table-cell' },
    },
    {
      id: 'sale_amount',
      header: 'Valor Venda',
      cell: ({ row }) => <MoneyCell value={row.original.sale_amount_at_approval.cents / 100} />,
      meta: {
        align: 'right',
        className: 'hidden md:table-cell',
        headClassName: 'hidden md:table-cell',
      },
    },
    {
      id: 'broker_rate',
      header: 'Taxa Corretor',
      cell: ({ row }) => (
        <span className="tabular-nums">
          <MutedCell>{row.original.broker_rate?.formatted ?? null}</MutedCell>
        </span>
      ),
      meta: {
        align: 'right',
        className: 'hidden lg:table-cell',
        headClassName: 'hidden lg:table-cell',
      },
    },
    {
      id: 'agency_rate',
      header: 'Taxa Imob.',
      cell: ({ row }) => (
        <span className="tabular-nums">
          <MutedCell>{row.original.agency_rate?.formatted ?? null}</MutedCell>
        </span>
      ),
      meta: {
        align: 'right',
        className: 'hidden lg:table-cell',
        headClassName: 'hidden lg:table-cell',
      },
    },
    {
      id: 'total_amount',
      header: 'Comissão Total',
      cell: ({ row }) => (
        <span className="font-semibold">
          <MoneyCell value={row.original.total_amount.cents / 100} />
        </span>
      ),
      meta: { align: 'right' },
    },
  ]
}
