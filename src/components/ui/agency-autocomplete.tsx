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

export interface SelectedAgency {
  id: number
  name: string
}

export interface AgencyAutocompleteProps {
  value: number | undefined | null
  onChange: (agency: SelectedAgency | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

type ApiClient = ReturnType<typeof useApiClient>['client']

function agencyName(a: { trade_name?: string | null; legal_name: string }): string {
  return a.trade_name ?? a.legal_name
}

async function searchAgencies(client: ApiClient, search: string) {
  const { data, error } = await client.GET('/api/v1/agencies', {
    params: { query: { search: search || undefined, page: 1, page_size: 20 } },
  })
  if (error) throw new Error('Falha ao buscar imobiliárias')
  return data
}

async function getAgencyById(client: ApiClient, id: number) {
  const { data, error } = await client.GET('/api/v1/agencies/{agency_id}', {
    params: { path: { agency_id: id } },
  })
  if (error) throw new Error('Falha ao carregar imobiliária')
  return data
}

export function AgencyAutocomplete({
  value,
  onChange,
  placeholder = 'Selecione uma imobiliária...',
  disabled = false,
  className,
}: AgencyAutocompleteProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [debouncedSearch, setDebouncedSearch] = React.useState('')
  const { client } = useApiClient()

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const selectedQuery = useQuery({
    queryKey: ['agency', value],
    queryFn: () => (value ? getAgencyById(client, value) : null),
    enabled: !!value,
    staleTime: 5 * 60 * 1000,
  })

  const searchResult = useQuery({
    queryKey: ['agencies-search', debouncedSearch],
    queryFn: () => searchAgencies(client, debouncedSearch),
    enabled: open,
    staleTime: 30 * 1000,
  })

  const agencies = searchResult.data?.items ?? []
  const isLoading = searchResult.isLoading
  const selected = selectedQuery.data

  const handleSelect = React.useCallback(
    (agency: (typeof agencies)[number]) => {
      onChange({ id: agency.id, name: agencyName(agency) })
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
            {value && selected ? (
              <span className="truncate">{agencyName(selected)}</span>
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
            placeholder="Buscar imobiliária..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : agencies.length === 0 ? (
              <CommandEmpty>
                {debouncedSearch ? 'Nenhuma imobiliária encontrada.' : 'Digite para buscar…'}
              </CommandEmpty>
            ) : (
              <CommandGroup heading="Imobiliárias">
                {agencies.map((agency) => (
                  <CommandItem
                    key={agency.id}
                    value={agency.id.toString()}
                    onSelect={() => handleSelect(agency)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn('mr-2 size-4', value === agency.id ? 'opacity-100' : 'opacity-0')}
                    />
                    <div className="flex flex-col">
                      <span>{agencyName(agency)}</span>
                      {agency.creci_j && (
                        <span className="text-xs text-muted-foreground">CRECI {agency.creci_j}</span>
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
                  Sem imobiliária
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
