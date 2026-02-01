import { useApiClient } from '@cacenot/construct-pro-api-client'
import { useQuery } from '@tanstack/react-query'
import { Building2, Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import * as React from 'react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

/**
 * Project data returned from selection
 */
export interface SelectedProject {
  id: number
  name: string
  floors: number | null
}

export interface ProjectAutocompleteProps {
  /** Selected project ID */
  value: number | undefined | null
  /** Called when selection changes */
  onChange: (project: SelectedProject | null) => void
  /** Placeholder text */
  placeholder?: string
  /** Whether the input is disabled */
  disabled?: boolean
  /** Class name for the trigger container */
  className?: string
}

type ApiClient = ReturnType<typeof useApiClient>['client']

async function searchProjects(client: ApiClient, search: string) {
  const { data, error } = await client.GET('/api/v1/projects', {
    params: {
      query: {
        search: search || undefined,
        page: 1,
        page_size: 20,
      },
    },
  })

  if (error) {
    throw new Error('Falha ao buscar empreendimentos')
  }

  return data
}

async function getProjectById(client: ApiClient, id: number) {
  const { data, error } = await client.GET('/api/v1/projects/{id}', {
    params: {
      path: { id },
    },
  })

  if (error) {
    throw new Error('Falha ao carregar empreendimento')
  }

  return data
}

/**
 * Parse floors string from project to number
 */
function parseFloors(floors: string | null | undefined): number | null {
  if (!floors) return null
  const parsed = Number.parseInt(floors, 10)
  return Number.isNaN(parsed) ? null : parsed
}

/**
 * Autocomplete component for selecting projects
 * Searches via API with debounce
 */
export function ProjectAutocomplete({
  value,
  onChange,
  placeholder = 'Selecione um empreendimento...',
  disabled = false,
  className,
}: ProjectAutocompleteProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [debouncedSearch, setDebouncedSearch] = React.useState('')
  const { client } = useApiClient()

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Fetch selected project details (for displaying name when value is set externally)
  const selectedProjectQuery = useQuery({
    queryKey: ['project', value],
    queryFn: () => (value ? getProjectById(client, value) : null),
    enabled: !!value,
    staleTime: 5 * 60 * 1000, // 5 min cache
  })

  // Search projects
  const searchQuery = useQuery({
    queryKey: ['projects-search', debouncedSearch],
    queryFn: () => searchProjects(client, debouncedSearch),
    enabled: open,
    staleTime: 30 * 1000, // 30 sec cache for search results
  })

  const projects = searchQuery.data?.items ?? []
  const isLoading = searchQuery.isLoading

  const selectedProject = selectedProjectQuery.data

  const handleSelect = React.useCallback(
    (project: NonNullable<typeof searchQuery.data>['items'][number]) => {
      onChange({
        id: project.id,
        name: project.name,
        floors: parseFloors(project.floors),
      })
      setOpen(false)
      setSearch('')
    },
    [onChange]
  )

  const handleClear = React.useCallback(() => {
    onChange(null)
    setSearch('')
  }, [onChange])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <Building2 className="size-4 shrink-0 text-muted-foreground" />
            {value && selectedProject ? (
              <span className="truncate">{selectedProject.name}</span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar empreendimento..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : projects.length === 0 ? (
              <CommandEmpty>
                {debouncedSearch ? 'Nenhum empreendimento encontrado.' : 'Digite para buscar...'}
              </CommandEmpty>
            ) : (
              <CommandGroup heading="Empreendimentos">
                {projects.map((project) => (
                  <CommandItem
                    key={project.id}
                    value={project.id.toString()}
                    onSelect={() => handleSelect(project)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        'mr-2 size-4',
                        value === project.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{project.name}</span>
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
            {value && (
              <CommandGroup>
                <CommandItem
                  onSelect={handleClear}
                  className="cursor-pointer justify-center text-muted-foreground"
                >
                  Limpar seleção
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
