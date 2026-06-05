import { useApiClient } from '@cacenot/construct-pro-api-client'
import { useQuery } from '@tanstack/react-query'
import { Building2, Check, ChevronsUpDown, Loader2, X } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface ProjectFilterProps {
  /** Empreendimento selecionado (null = todos) */
  value: number | null
  onChange: (id: number | null) => void
  placeholder?: string
  disabled?: boolean
}

export function ProjectFilter({
  value,
  onChange,
  placeholder = 'Empreendimento',
  disabled = false,
}: ProjectFilterProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [debouncedSearch, setDebouncedSearch] = React.useState('')
  const { client } = useApiClient()

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  // Resolve o nome pelo id para suportar deep-links (URL guarda só o id).
  const selectedQuery = useQuery({
    queryKey: ['project', value],
    queryFn: async () => {
      const { data, error } = await client.GET('/api/v1/projects/{project_id}', {
        params: { path: { project_id: value as number } },
      })
      if (error) throw new Error('Falha ao carregar empreendimento')
      return data
    },
    enabled: !!value,
    staleTime: 5 * 60 * 1000,
  })

  // Busca server-side — page_size 20 por página, sem cap fixo.
  const searchQuery = useQuery({
    queryKey: ['projects-filter-search', debouncedSearch],
    queryFn: async () => {
      const { data, error } = await client.GET('/api/v1/projects', {
        params: { query: { search: debouncedSearch || undefined, page: 1, page_size: 20 } },
      })
      if (error) throw new Error('Falha ao buscar empreendimentos')
      return data
    },
    enabled: open,
    staleTime: 30 * 1000,
  })

  const projects = searchQuery.data?.items ?? []
  const total = searchQuery.data?.total ?? 0
  const hasMore = !debouncedSearch && total > projects.length
  const selectedName = selectedQuery.data?.name

  const handleSelect = (project: (typeof projects)[number]) => {
    onChange(project.id)
    setOpen(false)
    setSearch('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onChange(null)
  }

  const triggerLabel = value
    ? selectedQuery.isLoading
      ? 'Carregando…'
      : (selectedName ?? placeholder)
    : placeholder

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              'min-w-44 max-w-56 justify-between gap-2 text-left font-normal',
              !value && 'text-muted-foreground'
            )}
          >
            <Building2 className="size-4 shrink-0 opacity-60" />
            <span className="flex-1 truncate">{triggerLabel}</span>
            {!value && <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Buscar empreendimento..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {searchQuery.isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
              ) : projects.length === 0 ? (
                <CommandEmpty>
                  {debouncedSearch ? 'Nenhum empreendimento encontrado.' : 'Digite para buscar...'}
                </CommandEmpty>
              ) : (
                <CommandGroup>
                  {projects.map((project) => (
                    <CommandItem
                      key={project.id}
                      value={String(project.id)}
                      onSelect={() => handleSelect(project)}
                    >
                      <Check
                        className={cn(
                          'mr-2 size-4',
                          value === project.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-sm">{project.name}</span>
                        {project.city && project.state && (
                          <span className="text-xs text-muted-foreground">
                            {project.city}, {project.state}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
            {hasMore && (
              <p className="border-t px-3 py-2 text-center text-xs text-muted-foreground">
                Mostrando os primeiros {projects.length} de {total} — busque para refinar.
              </p>
            )}
          </Command>
        </PopoverContent>
      </Popover>
      {value && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleClear}
              type="button"
              aria-label="Limpar filtro de empreendimento"
              className="inline-flex shrink-0 items-center justify-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-3.5 opacity-60 hover:opacity-100" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Limpar filtro</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
