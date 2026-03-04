import { getContractStatusOptions, useSales } from '@cacenot/construct-pro-api-client'
import { subDays, subYears } from 'date-fns'
import { FileText, Plus, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { navigate } from 'vike/client/router'
import { AppLayout } from '@/components/app-layout'
import { ContractRow } from '@/components/contratos/contract-row'
import { ContractRowSkeleton } from '@/components/contratos/contract-row-skeleton'
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
import { useContracts } from '@/hooks/useContracts'

const statusOptions = getContractStatusOptions('pt-BR')

const indexTypeOptions = [
  { value: 'all', label: 'Todos os índices' },
  { value: 'CUB', label: 'CUB' },
  { value: 'IGPM', label: 'IGP-M' },
  { value: 'IPCA', label: 'IPCA' },
]

const periodOptions = [
  { value: 'all', label: 'Todo o período' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
  { value: 'year', label: 'Este ano' },
]

export default function ContratosPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [indexTypeFilter, setIndexTypeFilter] = useState<string>('all')
  const [periodFilter, setPeriodFilter] = useState<string>('all')
  const [onlyPendingContracts, setOnlyPendingContracts] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const pageSize = Number.parseInt(import.meta.env.VITE_CONTRACTS_PAGE_SIZE ?? '', 10) || 20

  // Build query params
  const queryParams = useMemo(() => {
    const params: {
      page: number
      page_size: number
      sale_id?: string
      status?: string[]
      index_type_code?: string
      'signed_at[min]'?: string
      'signed_at[max]'?: string
    } = {
      page,
      page_size: pageSize,
    }

    if (debouncedSearch) {
      params.sale_id = debouncedSearch
    }

    if (statusFilter !== 'all') {
      params.status = [statusFilter]
    }

    if (onlyPendingContracts) {
      params.status = ['pending']
    }

    if (indexTypeFilter !== 'all') {
      params.index_type_code = indexTypeFilter
    }

    // Period filter for signed_at
    if (periodFilter !== 'all') {
      const now = new Date()
      if (periodFilter === '30d') {
        params['signed_at[min]'] = subDays(now, 30).toISOString()
      } else if (periodFilter === '90d') {
        params['signed_at[min]'] = subDays(now, 90).toISOString()
      } else if (periodFilter === 'year') {
        params['signed_at[min]'] = subYears(now, 1).toISOString()
      }
    }

    return params
  }, [
    page,
    pageSize,
    debouncedSearch,
    statusFilter,
    onlyPendingContracts,
    indexTypeFilter,
    periodFilter,
  ])

  const { data, isLoading } = useContracts(queryParams)

  const contracts = data?.items ?? []
  const total = data?.total ?? 0

  // Fetch sales for the contracts
  const { data: salesData } = useSales({
    page: 1,
    page_size: 100, // Fetch enough to cover all contracts on page
  })

  // Create a map of sale_id -> SaleResponse for quick lookup
  const salesMap = useMemo(() => {
    const map = new Map()
    if (salesData?.items) {
      for (const sale of salesData.items) {
        map.set(sale.id, sale)
      }
    }
    return map
  }, [salesData])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const maxPagesToShow = 5
  const startPage = Math.max(
    1,
    Math.min(page - Math.floor(maxPagesToShow / 2), totalPages - maxPagesToShow + 1)
  )
  const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)
  const visiblePages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)

  const hasActiveFilters =
    search ||
    statusFilter !== 'all' ||
    indexTypeFilter !== 'all' ||
    periodFilter !== 'all' ||
    onlyPendingContracts

  const handleClearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setIndexTypeFilter('all')
    setPeriodFilter('all')
    setOnlyPendingContracts(false)
    setPage(1)
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Contratos</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie contratos de financiamento e acompanhe o ciclo de vida dos contratos.
            </p>
          </div>
          <Button onClick={() => navigate('/contratos/novo')}>
            <Plus className="mr-2 size-4" />
            Novo Contrato
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, venda..."
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
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={indexTypeFilter}
            onValueChange={(value) => {
              setIndexTypeFilter(value)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Índice" />
            </SelectTrigger>
            <SelectContent>
              {indexTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
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
              {periodOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 border rounded-lg px-3 py-2">
            <Switch
              id="only-pending"
              checked={onlyPendingContracts}
              onCheckedChange={(checked) => {
                setOnlyPendingContracts(checked)
                setPage(1)
              }}
            />
            <Label htmlFor="only-pending" className="text-sm cursor-pointer">
              Apenas contratos pendentes
            </Label>
          </div>
        </div>

        {/* List Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-5" />
              {total} {total === 1 ? 'contrato' : 'contratos'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <ContractRowSkeleton />
            ) : contracts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <FileText className="size-10 mb-4 opacity-40" />
                <p className="text-sm text-muted-foreground mb-2">
                  {hasActiveFilters
                    ? 'Nenhum contrato encontrado com os filtros aplicados.'
                    : 'Nenhum contrato cadastrado.'}
                </p>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                    Limpar filtros
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y">
                {contracts.map((contract) => (
                  <ContractRow
                    key={contract.id}
                    contract={contract}
                    sale={salesMap.get(contract.sale_id)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {!isLoading && contracts.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
            >
              Anterior
            </Button>

            {startPage > 1 && (
              <>
                <Button
                  variant={page === 1 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPage(1)}
                  disabled={isLoading}
                >
                  1
                </Button>
                {startPage > 2 && <span className="px-2 text-muted-foreground">...</span>}
              </>
            )}

            {visiblePages.map((p) => (
              <Button
                key={p}
                variant={page === p ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPage(p)}
                disabled={isLoading}
              >
                {p}
              </Button>
            ))}

            {endPage < totalPages && (
              <>
                {endPage < totalPages - 1 && (
                  <span className="px-2 text-muted-foreground">...</span>
                )}
                <Button
                  variant={page === totalPages ? 'default' : 'outline'}
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
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || isLoading}
            >
              Próxima
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
