import { useApiClient } from '@cacenot/construct-pro-api-client'
import { useQuery } from '@tanstack/react-query'
import { Check, ChevronsUpDown, Loader2, User, X } from 'lucide-react'
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

export interface CustomerFilterValue {
  id: number
  full_name: string
}

interface CustomerFilterProps {
  value: CustomerFilterValue | null
  onChange: (customer: CustomerFilterValue | null) => void
  placeholder?: string
  disabled?: boolean
}

function formatDocument(doc: string | null | undefined): string {
  if (!doc) return ''
  const digits = doc.replace(/\D/g, '')
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  if (digits.length === 14) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }
  return doc
}

export function CustomerFilter({
  value,
  onChange,
  placeholder = 'Cliente',
  disabled = false,
}: CustomerFilterProps) {
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

  const searchQuery = useQuery({
    queryKey: ['customers-filter-search', debouncedSearch],
    queryFn: async () => {
      const { data, error } = await client.GET('/api/v1/customers', {
        params: {
          query: {
            search: debouncedSearch || undefined,
            is_draft: 'false',
            page: 1,
            page_size: 20,
          },
        },
      })
      if (error) throw new Error('Falha ao buscar clientes')
      return data
    },
    enabled: open,
    staleTime: 30 * 1000,
  })

  const customers = searchQuery.data?.items ?? []
  const isLoading = searchQuery.isLoading

  const handleSelect = (customer: (typeof customers)[number]) => {
    onChange({ id: customer.id, full_name: customer.full_name })
    setOpen(false)
    setSearch('')
  }

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
            disabled={disabled}
            className={cn(
              'justify-between text-left font-normal gap-2 min-w-44 max-w-56',
              !value && 'text-muted-foreground'
            )}
          >
            <User className="size-4 shrink-0 opacity-60" />
            <span className="flex-1 truncate">{value ? value.full_name : placeholder}</span>
            {!value && <ChevronsUpDown className="size-3.5 opacity-50 shrink-0" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Buscar por nome ou documento..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
              ) : customers.length === 0 ? (
                <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
              ) : (
                <CommandGroup>
                  {customers.map((customer) => (
                    <CommandItem
                      key={customer.id}
                      value={String(customer.id)}
                      onSelect={() => handleSelect(customer)}
                    >
                      <Check
                        className={cn(
                          'mr-2 size-4',
                          value?.id === customer.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm truncate">{customer.full_name}</span>
                        {customer.cpf_cnpj && (
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {formatDocument(customer.cpf_cnpj)}
                          </span>
                        )}
                      </div>
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
