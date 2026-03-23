import { type CustomerResponse, getCustomerTypeOptions } from '@cacenot/construct-pro-api-client'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown, MoreVertical } from 'lucide-react'
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatDocument, formatPhone, whatsappLink } from '@/lib/text-formatters'
import { formatId } from '@/lib/utils'

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-label="WhatsApp">
      <title>WhatsApp</title>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}

const typeOptions = getCustomerTypeOptions('pt-BR')

function SortIcon({ column, sort }: { column: string; sort: string }) {
  if (!sort.startsWith(column)) return <ArrowUpDown className="ml-1 size-3 text-muted-foreground" />
  return sort.endsWith(':asc') ? (
    <ArrowUp className="ml-1 size-3" />
  ) : (
    <ArrowDown className="ml-1 size-3" />
  )
}

interface CustomersColumnsCallbacks {
  sort: string
  onSort: (value: string) => void
}

export function createCustomersColumns({
  sort,
  onSort,
}: CustomersColumnsCallbacks): ColumnDef<CustomerResponse>[] {
  function toggleSort(column: string) {
    if (sort === `${column}:desc`) {
      onSort(`${column}:asc`)
    } else {
      onSort(`${column}:desc`)
    }
  }

  return [
    {
      id: 'id',
      header: () => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 font-medium"
          onClick={() => toggleSort('id')}
        >
          ID
          <SortIcon column="id" sort={sort} />
        </Button>
      ),
      cell: ({ row }) => (
        <Badge variant="secondary" className="tabular-nums font-mono text-xs shrink-0">
          {formatId(row.original.id)}
        </Badge>
      ),
    },
    {
      id: 'full_name',
      header: () => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 font-medium"
          onClick={() => toggleSort('full_name')}
        >
          Nome
          <SortIcon column="full_name" sort={sort} />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="truncate text-sm font-medium">{row.original.full_name}</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatDocument(row.original.cpf_cnpj)}
          </span>
        </div>
      ),
    },
    {
      id: 'type',
      header: 'Tipo',
      cell: ({ row }) => {
        const option = typeOptions.find((o) => o.value === row.original.type)
        return (
          <div className="hidden md:block">
            <Badge variant="outline" className="text-xs">
              {option?.label ?? row.original.type}
            </Badge>
          </div>
        )
      },
    },
    {
      id: 'location',
      header: () => <span className="hidden md:block">Localização</span>,
      cell: ({ row }) => {
        const { city, state } = row.original
        const location = city && state ? `${city} - ${state}` : (city ?? '')
        return (
          <span className="hidden md:block text-sm text-muted-foreground">{location || '—'}</span>
        )
      },
    },
    {
      id: 'phone',
      header: () => <span className="hidden sm:block">Telefone</span>,
      cell: ({ row }) => {
        const { phone } = row.original
        if (!phone) {
          return <span className="hidden sm:block text-xs text-muted-foreground">—</span>
        }
        return (
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-sm tabular-nums text-muted-foreground">{formatPhone(phone)}</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={whatsappLink(phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-success hover:text-success/80 transition-colors"
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
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const customer = row.original
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
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
