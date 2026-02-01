import {
  SaleStatus,
  getSaleStatusOptions,
  useSales,
} from '@cacenot/construct-pro-api-client'
import { Plus, Search, TrendingUp } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { navigate } from 'vike/client/router'
import { AppLayout } from '@/components/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { SaleRow } from '@/components/vendas/sale-row'
import { SaleRowSkeleton } from '@/components/vendas/sale-row-skeleton'
import { useAuth } from '@/contexts/auth-context'

const statusOptions = getSaleStatusOptions('pt-BR')

export default function VendasPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [periodFilter, setPeriodFilter] = useState<string>('all')
  const [onlyMySales, setOnlyMySales] = useState(false)
  const [page, setPage] = useState(1)
  const { user } = useAuth()

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const pageSize = Number.parseInt(import.meta.env.VITE_SALES_PAGE_SIZE ?? '', 10) || 20

  // Build query params
  const queryParams = useMemo(() => {
    const params: {
      page: number
      page_size: number
      search?: string
      status?: string[]
      user_id?: string
    } = {
      page,
      page_size: pageSize,
    }

    if (debouncedSearch) {
      params.search = debouncedSearch
    }

    if (statusFilter !== 'all') {
      params.status = [statusFilter]
    }

    if (onlyMySales && user) {
      params.user_id = user.uid
    }

    return params
  }, [page, pageSize, debouncedSearch, statusFilter, onlyMySales, user])

  const { data, isLoading } = useSales(queryParams)

  const sales = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const maxPagesToShow = 5
  const startPage = Math.max(
    1,
    Math.min(page - Math.floor(maxPagesToShow / 2), totalPages - maxPagesToShow + 1)
  )
  const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)
  const visiblePages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)

  const hasActiveFilters =
    search || statusFilter !== 'all' || periodFilter !== 'all' || onlyMySales

  const handleClearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setPeriodFilter('all')
    setOnlyMySales(false)
    setPage(1)
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vendas</h1>
            <p className="mt-2 text-muted-foreground">
              Acompanhe o funil de vendas e gerencie propostas, reservas e contratos.
            </p>
          </div>
          <Button className="gap-2" onClick={() => navigate('/vendas/novo')}>
            <Plus className="size-4" />
            Nova Venda
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, unidade, empreendimento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {Object.values(SaleStatus).map((value) => {
                const option = statusOptions.find((opt) => opt.value === value)
                return (
                  <SelectItem key={value} value={value}>
                    {option?.label || value}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          <Select
            value={periodFilter}
            onValueChange={(value) => {
              setPeriodFilter(value)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo o período</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="year">Este ano</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 border rounded-lg px-3 py-2">
            <Switch
              id="my-sales"
              checked={onlyMySales}
              onCheckedChange={(checked) => {
                setOnlyMySales(checked)
                setPage(1)
              }}
            />
            <Label htmlFor="my-sales" className="text-sm cursor-pointer">
              Apenas minhas vendas
            </Label>
          </div>
        </div>

        {/* Sales list */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <TrendingUp className="size-4" />
                {isLoading ? 'Carregando...' : `${total} vendas`}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <SaleRowSkeleton />
            ) : sales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <TrendingUp className="size-10 mb-4 opacity-40" />
                <p className="text-sm mb-2">
                  {hasActiveFilters
                    ? 'Nenhuma venda encontrada com os filtros aplicados.'
                    : 'Nenhuma venda cadastrada.'}
                </p>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" className="mt-2" onClick={handleClearFilters}>
                    Limpar filtros
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y">
                {sales.map((sale) => (
                  <SaleRow key={sale.id} sale={sale} />
                ))}
              </div>
            )}
          </CardContent>
          {totalPages > 1 && (
            <div className="flex flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1 || isLoading}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  Anterior
                </Button>
                {startPage > 1 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(1)}
                      disabled={isLoading}
                    >
                      1
                    </Button>
                    {startPage > 2 && <span className="px-1 text-muted-foreground">…</span>}
                  </>
                )}
                {visiblePages.map((pageNumber) => (
                  <Button
                    key={pageNumber}
                    variant={pageNumber === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPage(pageNumber)}
                    disabled={isLoading}
                  >
                    {pageNumber}
                  </Button>
                ))}
                {endPage < totalPages && (
                  <>
                    {endPage < totalPages - 1 && (
                      <span className="px-1 text-muted-foreground">…</span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(totalPages)}
                      disabled={isLoading}
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages || isLoading}
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  )
}
