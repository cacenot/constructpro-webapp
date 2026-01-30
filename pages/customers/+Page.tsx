import { getCustomerTypeOptions, useCustomers } from '@cacenot/construct-pro-api-client'
import { Edit, Eye, MoreVertical, Search, TrendingUp, UserPlus, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/app-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-label="WhatsApp">
      <title>WhatsApp</title>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}

function formatCpfCnpj(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  if (digits.length === 14) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }
  return value
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  // Remove country code (55) if present
  const local = digits.startsWith('55') ? digits.slice(2) : digits
  if (local.length === 11) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`
  }
  if (local.length === 10) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`
  }
  return phone
}

function whatsappLink(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return `https://wa.me/${digits}`
}

const typeOptions = getCustomerTypeOptions('pt-BR')

function CustomerSkeleton() {
  return (
    <div className="divide-y">
      {Array.from({ length: 6 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
        <div key={i} className="flex items-center gap-4 px-6 py-3">
          <Skeleton className="h-5 w-12 shrink-0" />
          <div className="flex flex-col gap-2 flex-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
          <div className="hidden md:block flex-1">
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="size-4" />
          </div>
          <Skeleton className="size-8 shrink-0" />
        </div>
      ))}
    </div>
  )
}

type Customer = NonNullable<ReturnType<typeof useCustomers>['data']>['items'][number]

function CustomerRow({ customer }: { customer: Customer }) {
  const location =
    customer.city && customer.state ? `${customer.city} - ${customer.state}` : customer.city || ''

  return (
    <div className="flex items-center gap-4 px-6 py-3">
      {/* ID Badge */}
      <Badge variant="secondary" className="shrink-0 tabular-nums font-mono text-xs">
        #{customer.id}
      </Badge>

      {/* Customer Info */}
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <span className="truncate text-sm font-medium">{customer.full_name}</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatCpfCnpj(customer.cpf_cnpj)}
        </span>
      </div>

      {/* Location */}
      <div className="hidden md:block flex-1">
        <span className="text-sm text-muted-foreground">{location}</span>
      </div>

      {/* Phone + WhatsApp */}
      <div className="flex items-center gap-2 shrink-0">
        {customer.phone ? (
          <>
            <span className="hidden sm:inline text-sm tabular-nums text-muted-foreground">
              {formatPhone(customer.phone)}
            </span>
            <a
              href={whatsappLink(customer.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-success hover:text-success/80 transition-colors"
              title="Abrir WhatsApp"
            >
              <WhatsAppIcon className="size-4" />
            </a>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </div>

      {/* Actions Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="shrink-0">
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <Eye className="size-4" />
            Ver detalhes
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Edit className="size-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <TrendingUp className="size-4" />
            Nova venda
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default function CustomersPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data, isLoading } = useCustomers({
    search: debouncedSearch || undefined,
    type: typeFilter !== 'all' ? [typeFilter] : undefined,
    page_size: 50,
  })

  const customers = data?.items ?? []

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
            <p className="mt-2 text-muted-foreground">Gerencie sua base de clientes e contatos.</p>
          </div>
          <Button className="gap-2">
            <UserPlus className="size-4" />
            Novo Cliente
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, e-mail ou documento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Tipo de pessoa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {typeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Customer list */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Users className="size-4" />
                {isLoading ? 'Carregando...' : `${data?.total ?? 0} clientes`}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <CustomerSkeleton />
            ) : customers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Users className="size-10 mb-4 opacity-40" />
                <p className="text-sm">Nenhum cliente encontrado.</p>
              </div>
            ) : (
              <div className="divide-y">
                {customers.map((customer) => (
                  <CustomerRow key={customer.id} customer={customer} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
