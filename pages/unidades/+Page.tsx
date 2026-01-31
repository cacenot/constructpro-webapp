import {
  getUnitCategoryOptions,
  getUnitStatusOptions,
  UnitCategory,
  UnitStatus,
  useApiClient,
} from '@cacenot/construct-pro-api-client'
import { useQuery } from '@tanstack/react-query'
import { Building2, Plus, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
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
import { UnitRow } from '@/components/unidades/unit-row'
import { UnitRowSkeleton } from '@/components/unidades/unit-row-skeleton'

type ApiClient = ReturnType<typeof useApiClient>['client']

type UnitsQueryParams = {
  search?: string
  status?: string[]
  category?: string[]
  page?: number
  page_size?: number
}

async function fetchUnits(client: ApiClient, params: UnitsQueryParams) {
  const { data, error } = await client.GET('/api/v1/units', {
    params: {
      query: params,
    },
  })

  if (error) {
    throw new Error('Falha ao carregar unidades')
  }

  return data
}

async function fetchAllProjects(client: ApiClient) {
  const { data, error } = await client.GET('/api/v1/projects', {
    params: {
      query: { page: 1, page_size: 100 },
    },
  })

  if (error) {
    throw new Error('Falha ao carregar empreendimentos')
  }

  return data
}

type UnitsResponse = Awaited<ReturnType<typeof fetchUnits>>
type Unit = NonNullable<UnitsResponse>['items'][number]

const statusOptions = getUnitStatusOptions('pt-BR')
const categoryOptions = getUnitCategoryOptions('pt-BR')

export default function UnidadesPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const { client } = useApiClient()

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const pageSize = Number.parseInt(import.meta.env.VITE_UNITS_PAGE_SIZE ?? '', 10) || 20

  const unitsQuery = useQuery({
    queryKey: ['units', debouncedSearch || '', statusFilter, categoryFilter, page, pageSize],
    queryFn: () =>
      fetchUnits(client, {
        search: debouncedSearch || undefined,
        status: statusFilter !== 'all' ? [statusFilter] : undefined,
        category: categoryFilter !== 'all' ? [categoryFilter] : undefined,
        page,
        page_size: pageSize,
      }),
  })

  const projectsQuery = useQuery({
    queryKey: ['projects-all'],
    queryFn: () => fetchAllProjects(client),
    staleTime: 5 * 60 * 1000, // 5 min cache
  })

  const projectMap = useMemo(
    () => new Map(projectsQuery.data?.items?.map((p) => [p.id, p.name]) ?? []),
    [projectsQuery.data]
  )

  const units = unitsQuery.data?.items ?? []
  const total = unitsQuery.data?.total ?? 0
  const isLoading = unitsQuery.isLoading || projectsQuery.isLoading

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const maxPagesToShow = 5
  const startPage = Math.max(
    1,
    Math.min(page - Math.floor(maxPagesToShow / 2), totalPages - maxPagesToShow + 1)
  )
  const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)
  const visiblePages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)

  const hasActiveFilters = search || statusFilter !== 'all' || categoryFilter !== 'all'

  const handleClearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setCategoryFilter('all')
    setPage(1)
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Unidades</h1>
            <p className="mt-2 text-muted-foreground">
              Gerencie as unidades dos seus empreendimentos e controle disponibilidade.
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="size-4" />
            Nova Unidade
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, empreendimento..."
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
              {Object.values(UnitStatus).map((value) => {
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
            value={categoryFilter}
            onValueChange={(value) => {
              setCategoryFilter(value)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {Object.values(UnitCategory).map((value) => {
                const option = categoryOptions.find((opt) => opt.value === value)
                return (
                  <SelectItem key={value} value={value}>
                    {option?.label || value}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Units list */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Building2 className="size-4" />
                {isLoading ? 'Carregando...' : `${total} unidades`}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <UnitRowSkeleton />
            ) : units.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Building2 className="size-10 mb-4 opacity-40" />
                <p className="text-sm mb-2">
                  {hasActiveFilters
                    ? 'Nenhuma unidade encontrada com os filtros aplicados.'
                    : 'Nenhuma unidade cadastrada.'}
                </p>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" className="mt-2" onClick={handleClearFilters}>
                    Limpar filtros
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y">
                {units.map((unit: Unit) => (
                  <UnitRow key={unit.id} unit={unit} projectMap={projectMap} />
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
                    <Button variant="outline" size="sm" onClick={() => setPage(1)}>
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
                    <Button variant="outline" size="sm" onClick={() => setPage(totalPages)}>
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
