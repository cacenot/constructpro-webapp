import { useApiClient } from '@cacenot/construct-pro-api-client'
import { useQuery } from '@tanstack/react-query'
import { Check, ChevronsUpDown, Home, Loader2 } from 'lucide-react'
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

export interface SelectedUnit {
  id: number
  name: string
  price_cents: number
  project_name?: string
}

export interface UnitAutocompleteProps {
  value: number | undefined | null
  onChange: (unit: SelectedUnit | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

type ApiClient = ReturnType<typeof useApiClient>['client']

async function searchUnits(client: ApiClient, search: string) {
  const { data, error } = await client.GET('/api/v1/units', {
    params: {
      query: {
        search: search || undefined,
        status: ['available'],
        page: 1,
        page_size: 20,
      },
    },
  })

  if (error) {
    throw new Error('Falha ao buscar unidades')
  }

  return data
}

async function getUnitById(client: ApiClient, id: number) {
  const { data, error } = await client.GET('/api/v1/units/{unit_id}', {
    params: {
      path: { unit_id: id },
    },
  })

  if (error) {
    throw new Error('Falha ao carregar unidade')
  }

  return data
}

async function fetchProjectNames(client: ApiClient) {
  const { data, error } = await client.GET('/api/v1/projects', {
    params: {
      query: {
        page: 1,
        page_size: 100,
      },
    },
  })

  if (error) {
    throw new Error('Falha ao carregar empreendimentos')
  }

  const map = new Map<number, string>()
  for (const project of data?.items ?? []) {
    map.set(project.id, project.name)
  }
  return map
}

export function UnitAutocomplete({
  value,
  onChange,
  placeholder = 'Selecione uma unidade...',
  disabled = false,
  className,
}: UnitAutocompleteProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [debouncedSearch, setDebouncedSearch] = React.useState('')
  const { client } = useApiClient()

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const selectedUnitQuery = useQuery({
    queryKey: ['unit', value],
    queryFn: () => (value ? getUnitById(client, value) : null),
    enabled: !!value,
    staleTime: 5 * 60 * 1000,
  })

  const searchQuery = useQuery({
    queryKey: ['units-search', debouncedSearch],
    queryFn: () => searchUnits(client, debouncedSearch),
    enabled: open,
    staleTime: 30 * 1000,
  })

  const projectNamesQuery = useQuery({
    queryKey: ['project-names-map'],
    queryFn: () => fetchProjectNames(client),
    enabled: open || !!value,
    staleTime: 10 * 60 * 1000,
  })

  const projectNames = projectNamesQuery.data ?? new Map<number, string>()
  const units = searchQuery.data?.items ?? []
  const isLoading = searchQuery.isLoading
  const selectedUnit = selectedUnitQuery.data

  const handleSelect = React.useCallback(
    (unit: (typeof units)[number]) => {
      onChange({
        id: unit.id,
        name: unit.name,
        price_cents: unit.price_cents,
        project_name: projectNames.get(unit.project_id),
      })
      setOpen(false)
      setSearch('')
    },
    [onChange, projectNames]
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
            <Home className="size-4 shrink-0 text-muted-foreground" />
            {value && selectedUnit ? (
              <div className="flex flex-col items-start truncate">
                <span className="truncate text-sm">{selectedUnit.name}</span>
                {projectNames.get(selectedUnit.project_id) && (
                  <span className="truncate text-xs text-muted-foreground">
                    {projectNames.get(selectedUnit.project_id)}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Buscar unidade..." value={search} onValueChange={setSearch} />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : units.length === 0 ? (
              <CommandEmpty>
                {debouncedSearch
                  ? 'Nenhuma unidade disponível encontrada.'
                  : 'Digite para buscar...'}
              </CommandEmpty>
            ) : (
              <CommandGroup heading="Unidades Disponíveis">
                {units.map((unit) => (
                  <CommandItem
                    key={unit.id}
                    value={unit.id.toString()}
                    onSelect={() => handleSelect(unit)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn('mr-2 size-4', value === unit.id ? 'opacity-100' : 'opacity-0')}
                    />
                    <div className="flex flex-col">
                      <span>{unit.name}</span>
                      {projectNames.get(unit.project_id) && (
                        <span className="text-xs text-muted-foreground">
                          {projectNames.get(unit.project_id)}
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
