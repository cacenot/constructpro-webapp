import { useProjects } from '@cacenot/construct-pro-api-client'
import { Building2, Plus, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { navigate } from 'vike/client/router'
import { AppLayout } from '@/components/app-layout'
import { ProjectCard } from '@/components/projects/project-card'
import { ProjectCardSkeleton } from '@/components/projects/project-card-skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ProjectsPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const pageSize = Number.parseInt(import.meta.env.VITE_PROJECTS_PAGE_SIZE ?? '', 10) || 20

  const { data, isLoading, error } = useProjects({
    page,
    page_size: pageSize,
    search: debouncedSearch || undefined,
  })

  const projects = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const maxPagesToShow = 5
  const startPage = Math.max(
    1,
    Math.min(page - Math.floor(maxPagesToShow / 2), totalPages - maxPagesToShow + 1)
  )
  const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)
  const visiblePages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)

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

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, localização..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Content */}
        {error ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Building2 className="mb-4 size-16 text-destructive" />
            <h3 className="mb-1 text-lg font-semibold">Erro ao carregar</h3>
            <p className="text-sm text-muted-foreground">
              Falha ao carregar empreendimentos. Tente novamente.
            </p>
          </div>
        ) : isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 className="mb-4 size-16 text-muted-foreground opacity-20" />
            <h3 className="mb-1 text-lg font-semibold">Nenhum empreendimento encontrado</h3>
            <p className="max-w-md text-sm text-muted-foreground">
              {search
                ? `Não encontramos resultados para "${search}". Tente outro termo.`
                : 'Adicione seu primeiro empreendimento para começar.'}
            </p>
            {!search && (
              <Button className="mt-6 gap-2" onClick={() => navigate('/empreendimentos/novo')}>
                <Plus className="size-4" />
                Novo Empreendimento
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Grid de cards */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
          </>
        )}
      </div>
    </AppLayout>
  )
}
