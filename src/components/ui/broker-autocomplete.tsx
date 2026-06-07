import { useApiClient } from '@cacenot/construct-pro-api-client'
import { useQuery } from '@tanstack/react-query'
import { Check, ChevronsUpDown, Loader2, UserRound } from 'lucide-react'
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

export interface SelectedBroker {
  id: number
  full_name: string
}

export interface BrokerAutocompleteProps {
  value: number | undefined | null
  onChange: (broker: SelectedBroker | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

type ApiClient = ReturnType<typeof useApiClient>['client']

async function searchBrokers(client: ApiClient, search: string) {
  const { data, error } = await client.GET('/api/v1/brokers', {
    params: { query: { search: search || undefined, page: 1, page_size: 20 } },
  })
  if (error) throw new Error('Falha ao buscar corretores')
  return data
}

async function getBrokerById(client: ApiClient, id: number) {
  const { data, error } = await client.GET('/api/v1/brokers/{broker_id}', {
    params: { path: { broker_id: id } },
  })
  if (error) throw new Error('Falha ao carregar corretor')
  return data
}

export function BrokerAutocomplete({
  value,
  onChange,
  placeholder = 'Selecione um corretor...',
  disabled = false,
  className,
}: BrokerAutocompleteProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [debouncedSearch, setDebouncedSearch] = React.useState('')
  const { client } = useApiClient()

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const selectedQuery = useQuery({
    queryKey: ['broker', value],
    queryFn: () => (value ? getBrokerById(client, value) : null),
    enabled: !!value,
    staleTime: 5 * 60 * 1000,
  })

  const searchResult = useQuery({
    queryKey: ['brokers-search', debouncedSearch],
    queryFn: () => searchBrokers(client, debouncedSearch),
    enabled: open,
    staleTime: 30 * 1000,
  })

  const brokers = searchResult.data?.items ?? []
  const isLoading = searchResult.isLoading
  const selected = selectedQuery.data

  const handleSelect = React.useCallback(
    (broker: (typeof brokers)[number]) => {
      onChange({ id: broker.id, full_name: broker.full_name })
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
            <UserRound className="size-4 shrink-0 text-muted-foreground" />
            {value && selected ? (
              <span className="truncate">{selected.full_name}</span>
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
            placeholder="Buscar corretor..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : brokers.length === 0 ? (
              <CommandEmpty>
                {debouncedSearch ? 'Nenhum corretor encontrado.' : 'Digite para buscar…'}
              </CommandEmpty>
            ) : (
              <CommandGroup heading="Corretores">
                {brokers.map((broker) => (
                  <CommandItem
                    key={broker.id}
                    value={broker.id.toString()}
                    onSelect={() => handleSelect(broker)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn('mr-2 size-4', value === broker.id ? 'opacity-100' : 'opacity-0')}
                    />
                    <div className="flex flex-col">
                      <span>{broker.full_name}</span>
                      {broker.creci && (
                        <span className="text-xs text-muted-foreground">CRECI {broker.creci}</span>
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
                  Sem corretor
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
