import { useApiClient } from '@cacenot/construct-pro-api-client'
import { useQuery } from '@tanstack/react-query'
import { Check, ChevronsUpDown, Loader2, User } from 'lucide-react'
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

export interface SelectedCustomer {
  id: number
  full_name: string
}

export interface CustomerAutocompleteProps {
  value: number | undefined | null
  onChange: (customer: SelectedCustomer | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

type ApiClient = ReturnType<typeof useApiClient>['client']

async function searchCustomers(client: ApiClient, search: string) {
  const { data, error } = await client.GET('/api/v1/customers', {
    params: {
      query: {
        search: search || undefined,
        is_draft: 'false',
        page: 1,
        page_size: 20,
      },
    },
  })

  if (error) {
    throw new Error('Falha ao buscar clientes')
  }

  return data
}

async function getCustomerById(client: ApiClient, id: number) {
  const { data, error } = await client.GET('/api/v1/customers/{customer_id}', {
    params: {
      path: { customer_id: id },
    },
  })

  if (error) {
    throw new Error('Falha ao carregar cliente')
  }

  return data
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

export function CustomerAutocomplete({
  value,
  onChange,
  placeholder = 'Selecione um cliente...',
  disabled = false,
  className,
}: CustomerAutocompleteProps) {
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

  const selectedCustomerQuery = useQuery({
    queryKey: ['customer', value],
    queryFn: () => (value ? getCustomerById(client, value) : null),
    enabled: !!value,
    staleTime: 5 * 60 * 1000,
  })

  const searchQuery = useQuery({
    queryKey: ['customers-search', debouncedSearch],
    queryFn: () => searchCustomers(client, debouncedSearch),
    enabled: open,
    staleTime: 30 * 1000,
  })

  const customers = searchQuery.data?.items ?? []
  const isLoading = searchQuery.isLoading
  const selectedCustomer = selectedCustomerQuery.data

  const handleSelect = React.useCallback(
    (customer: (typeof customers)[number]) => {
      onChange({
        id: customer.id,
        full_name: customer.full_name,
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
            <User className="size-4 shrink-0 text-muted-foreground" />
            {value && selectedCustomer ? (
              <span className="truncate">{selectedCustomer.full_name}</span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Buscar cliente..." value={search} onValueChange={setSearch} />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : customers.length === 0 ? (
              <CommandEmpty>
                {debouncedSearch ? 'Nenhum cliente encontrado.' : 'Digite para buscar...'}
              </CommandEmpty>
            ) : (
              <CommandGroup heading="Clientes">
                {customers.map((customer) => (
                  <CommandItem
                    key={customer.id}
                    value={customer.id.toString()}
                    onSelect={() => handleSelect(customer)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        'mr-2 size-4',
                        value === customer.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{customer.full_name}</span>
                      {customer.cpf_cnpj && (
                        <span className="text-xs text-muted-foreground">
                          {formatDocument(customer.cpf_cnpj)}
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
