import { useApiClient } from '@cacenot/construct-pro-api-client'
import { useQuery } from '@tanstack/react-query'
import { Check, ChevronsUpDown, Loader2, X } from 'lucide-react'
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
import { DateRangeFilter } from '@/components/ui/date-range-filter'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type {
  AgencyFilterValue,
  BrokerFilterValue,
  CommissionsTableFilters,
} from '@/hooks/use-commissions-table'
import { cn } from '@/lib/utils'

function BrokerFilterCombobox({
  value,
  onChange,
}: {
  value: BrokerFilterValue | null
  onChange: (v: BrokerFilterValue | null) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [debouncedSearch, setDebouncedSearch] = React.useState('')
  const { client } = useApiClient()

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data, isLoading } = useQuery({
    queryKey: ['brokers-filter-search', debouncedSearch],
    queryFn: async () => {
      const { data: resp, error } = await client.GET('/api/v1/brokers', {
        params: { query: { search: debouncedSearch || undefined, page: 1, page_size: 20 } },
      })
      if (error) throw new Error('Falha ao buscar corretores')
      return resp
    },
    enabled: open,
    staleTime: 30 * 1000,
  })

  const brokers = data?.items ?? []

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onChange(null)
  }

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              'justify-between text-left font-normal gap-2 min-w-44 max-w-56',
              !value && 'text-muted-foreground'
            )}
          >
            <span className="flex-1 truncate">{value ? value.full_name : 'Corretor'}</span>
            {!value && <ChevronsUpDown className="size-3.5 opacity-50 shrink-0" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
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
                <CommandEmpty>Nenhum corretor encontrado.</CommandEmpty>
              ) : (
                <CommandGroup>
                  {brokers.map((broker) => (
                    <CommandItem
                      key={broker.id}
                      value={String(broker.id)}
                      onSelect={() => {
                        onChange({ id: broker.id, full_name: broker.full_name })
                        setOpen(false)
                        setSearch('')
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 size-4',
                          value?.id === broker.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <span className="text-sm truncate">{broker.full_name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {value && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleClear}
              type="button"
              className="inline-flex items-center justify-center shrink-0"
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

function AgencyFilterCombobox({
  value,
  onChange,
}: {
  value: AgencyFilterValue | null
  onChange: (v: AgencyFilterValue | null) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [debouncedSearch, setDebouncedSearch] = React.useState('')
  const { client } = useApiClient()

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data, isLoading } = useQuery({
    queryKey: ['agencies-filter-search', debouncedSearch],
    queryFn: async () => {
      const { data: resp, error } = await client.GET('/api/v1/agencies', {
        params: { query: { search: debouncedSearch || undefined, page: 1, page_size: 20 } },
      })
      if (error) throw new Error('Falha ao buscar imobiliárias')
      return resp
    },
    enabled: open,
    staleTime: 30 * 1000,
  })

  const agencies = data?.items ?? []

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onChange(null)
  }

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              'justify-between text-left font-normal gap-2 min-w-44 max-w-56',
              !value && 'text-muted-foreground'
            )}
          >
            <span className="flex-1 truncate">{value ? value.name : 'Imobiliária'}</span>
            {!value && <ChevronsUpDown className="size-3.5 opacity-50 shrink-0" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
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
                <CommandEmpty>Nenhuma imobiliária encontrada.</CommandEmpty>
              ) : (
                <CommandGroup>
                  {agencies.map((agency) => {
                    const displayName = agency.trade_name ?? agency.legal_name
                    return (
                      <CommandItem
                        key={agency.id}
                        value={String(agency.id)}
                        onSelect={() => {
                          onChange({ id: agency.id, name: displayName })
                          setOpen(false)
                          setSearch('')
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 size-4',
                            value?.id === agency.id ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        <span className="text-sm truncate">{displayName}</span>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {value && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleClear}
              type="button"
              className="inline-flex items-center justify-center shrink-0"
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

export function CommissionFilters({
  brokerFilter,
  agencyFilter,
  periodRange,
  setBrokerFilter,
  setAgencyFilter,
  setPeriodRange,
}: CommissionsTableFilters) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <BrokerFilterCombobox value={brokerFilter} onChange={setBrokerFilter} />
      <AgencyFilterCombobox value={agencyFilter} onChange={setAgencyFilter} />
      <DateRangeFilter value={periodRange} onChange={setPeriodRange} placeholder="Período" />
    </div>
  )
}
