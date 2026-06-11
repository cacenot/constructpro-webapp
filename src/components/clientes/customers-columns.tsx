import type { components } from '@cacenot/construct-pro-api-client'
import { getCustomerTypeOptions } from '@cacenot/construct-pro-api-client'

type CustomerResponse = components['schemas']['CustomerResponse']

import type { ColumnDef, Table } from '@tanstack/react-table'
import { navigate } from 'vike/client/router'
import { Badge } from '@/components/ui/badge'
import { MutedCell, PrimaryCell, RowActionsMenu } from '@/components/ui/data-table-cells'
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { SortableHeader } from '@/components/ui/sortable-header'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatDocument, formatPhone, whatsappLink } from '@/lib/text-formatters'
import { formatId } from '@/lib/utils'

export interface CustomersTableMeta {
  sort: string
  onSort: (value: string) => void
}

const typeOptions = getCustomerTypeOptions('pt-BR')

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-label="WhatsApp">
      <title>WhatsApp</title>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}

export const customersColumns: ColumnDef<CustomerResponse>[] = [
  {
    id: 'id',
    header: ({ table }) => {
      const meta = table.options.meta as CustomersTableMeta | undefined
      if (!meta) return 'ID'
      return <SortableHeader label="ID" field="id" currentSort={meta.sort} onSort={meta.onSort} />
    },
    cell: ({ row }) => (
      <Badge variant="secondary" className="font-mono text-xs tabular-nums">
        {formatId(row.original.id)}
      </Badge>
    ),
  },
  {
    id: 'full_name',
    header: ({ table }) => {
      const meta = table.options.meta as CustomersTableMeta | undefined
      if (!meta) return 'Nome'
      return (
        <SortableHeader
          label="Nome"
          field="full_name"
          currentSort={meta.sort}
          onSort={meta.onSort}
        />
      )
    },
    cell: ({ row }) => (
      <PrimaryCell
        title={row.original.full_name}
        subtitle={formatDocument(row.original.cpf_cnpj)}
      />
    ),
  },
  {
    id: 'type',
    header: 'Tipo',
    cell: ({ row }) => {
      const option = typeOptions.find((o) => o.value === row.original.type)
      return (
        <Badge variant="outline" className="text-xs">
          {option?.label ?? row.original.type}
        </Badge>
      )
    },
    meta: { className: 'hidden md:table-cell', headClassName: 'hidden md:table-cell' },
  },
  {
    id: 'location',
    header: 'Localização',
    cell: ({ row }) => {
      const { city, state } = row.original
      const location = city && state ? `${city} - ${state}` : (city ?? null)
      return <MutedCell>{location || null}</MutedCell>
    },
    meta: { className: 'hidden md:table-cell', headClassName: 'hidden md:table-cell' },
  },
  {
    id: 'phone',
    header: 'Telefone',
    cell: ({ row }) => {
      const { phone } = row.original
      if (!phone) return <MutedCell>{null}</MutedCell>
      return (
        <div className="flex items-center gap-2">
          <MutedCell>{formatPhone(phone)}</MutedCell>
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href={whatsappLink(phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-success hover:text-success/80 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <WhatsAppIcon className="size-4" />
              </a>
            </TooltipTrigger>
            <TooltipContent>
              <p>Abrir WhatsApp</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )
    },
    meta: { className: 'hidden sm:table-cell', headClassName: 'hidden sm:table-cell' },
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => <CustomerRowActions customer={row.original} />,
    meta: { align: 'right' },
  },
]

function CustomerRowActions({ customer }: { customer: CustomerResponse }) {
  return (
    <RowActionsMenu>
      <DropdownMenuItem onClick={() => navigate(`/clientes/${customer.id}`)}>
        Ver detalhes
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => navigate(`/clientes/${customer.id}/editar`)}>
        Editar
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => navigate(`/vendas/novo?cliente=${customer.id}`)}>
        Nova venda
      </DropdownMenuItem>
    </RowActionsMenu>
  )
}

// Re-export type for use in table component
export type { CustomerResponse, Table }
