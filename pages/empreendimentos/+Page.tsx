import { Building2, Plus, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { navigate } from 'vike/client/router'
import { AppLayout } from '@/components/app-layout'
import { ProjectCard } from '@/components/projects/project-card'
import { ProjectCardSkeleton } from '@/components/projects/project-card-skeleton'
import { ProjectsPagination } from '@/components/projects/projects-pagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useProjectsSummary } from '@/hooks/useProjects'

type StatusFilter = 'all' | 'construction' | 'finished'

const GRID_COLS = 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'

export default function ProjectsPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const pageSize = Number.parseInt(import.meta.env.VITE_PROJECTS_PAGE_SIZE ?? '', 10) || 20

  const { data, isLoading, error, refetch } = useProjectsSummary({
    page,
    page_size: pageSize,
    search: debouncedSearch || undefined,
    status: statusFilter === 'all' ? undefined : [statusFilter],
  })

  const projects = data?.items ?? []
  const total = data?.total ?? 0
  const hasActiveFilters = Boolean(debouncedSearch) || statusFilter !== 'all'
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  function handleStatusChange(value: StatusFilter) {
    setStatusFilter(value)
    setPage(1)
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Empreendimentos</h1>
            <p className="mt-2 text-muted-foreground">
              Gerencie seus projetos imobiliários e acompanhe o progresso.
            </p>
          </div>
          <Button className="gap-2" onClick={() => navigate('/empreendimentos/novo')}>
            <Plus className="size-4" />
            Novo Empreendimento
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, localização..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="construction">Em Construção</SelectItem>
              <SelectItem value="finished">Finalizado</SelectItem>
            </SelectContent>
          </Select>
          {!isLoading && !error && (
            <span className="text-sm text-muted-foreground tabular-nums sm:ml-auto">
              {total} {total === 1 ? 'empreendimento' : 'empreendimentos'}
            </span>
          )}
        </div>

        {/* Content */}
        {error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 className="mb-4 size-16 text-destructive" />
            <h3 className="mb-1 text-lg font-semibold">Erro ao carregar</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              Falha ao carregar empreendimentos. Tente novamente.
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : isLoading ? (
          <div className={GRID_COLS}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <ProjectCardSkeleton key={n} />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 className="mb-4 size-16 text-muted-foreground opacity-20" />
            <h3 className="mb-1 text-lg font-semibold">Nenhum empreendimento encontrado</h3>
            <p className="max-w-md text-sm text-muted-foreground">
              {hasActiveFilters
                ? 'Nenhum resultado para os filtros aplicados. Ajuste a busca ou o status.'
                : 'Adicione seu primeiro empreendimento para começar.'}
            </p>
            {!hasActiveFilters && (
              <Button className="mt-6 gap-2" onClick={() => navigate('/empreendimentos/novo')}>
                <Plus className="size-4" />
                Novo Empreendimento
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Grid de cards */}
            <div className={GRID_COLS}>
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>

            {/* Paginação */}
            <ProjectsPagination
              page={page}
              totalPages={totalPages}
              total={total}
              pageSize={pageSize}
              isLoading={isLoading}
              setPage={setPage}
            />
          </>
        )}
      </div>
    </AppLayout>
  )
}
