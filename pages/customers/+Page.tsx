import { getCustomerTypeOptions, useCustomers } from '@cacenot/construct-pro-api-client'
import { MessageSquare, Search, UserPlus, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

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
        <div key={i} className="flex items-center justify-between px-6 py-3">
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
          <div className="hidden sm:block">
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="size-5 rounded-full" />
          </div>
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
    <div className="flex items-center justify-between px-6 py-3">
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <span className="truncate text-sm font-medium">{customer.full_name}</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatCpfCnpj(customer.cpf_cnpj)}
        </span>
      </div>
      <div className="hidden sm:block flex-1 text-center">
        <span className="text-sm text-muted-foreground">{location}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {customer.phone ? (
          <>
            <span className="text-sm tabular-nums text-muted-foreground">
              {formatPhone(customer.phone)}
            </span>
            <a
              href={whatsappLink(customer.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 hover:text-emerald-700 transition-colors"
              title="Abrir WhatsApp"
            >
              <MessageSquare className="size-4" />
            </a>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </div>
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
            <p className="mt-1 text-muted-foreground">Gerencie sua base de clientes e contatos.</p>
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
                <Users className="size-10 mb-3 opacity-40" />
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
