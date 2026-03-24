import { Check, ChevronsUpDown, X } from 'lucide-react'
import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export interface MultiSelectOption {
  value: string
  label: string
}

interface MultiSelectFilterProps {
  options: MultiSelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
}

export function MultiSelectFilter({
  options,
  value,
  onChange,
  placeholder = 'Selecionar...',
}: MultiSelectFilterProps) {
  const [open, setOpen] = React.useState(false)

  const selectedLabels = value
    .map((v) => options.find((opt) => opt.value === v)?.label)
    .filter(Boolean)

  const handleToggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue))
    } else {
      onChange([...value, optionValue])
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onChange([])
  }

  const hasSelection = value.length > 0

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              'justify-between text-left font-normal gap-2 min-w-40',
              !hasSelection && 'text-muted-foreground'
            )}
          >
            <span className="flex-1 truncate">
              {hasSelection ? (
                <span className="flex items-center gap-1.5">
                  <span className="truncate">{selectedLabels[0]}</span>
                  {value.length > 1 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">
                      +{value.length - 1}
                    </Badge>
                  )}
                </span>
              ) : (
                placeholder
              )}
            </span>
            {!hasSelection && <ChevronsUpDown className="size-3.5 opacity-50 shrink-0" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-52 p-0" align="start">
          <Command>
            <CommandList>
              <CommandEmpty>Nenhuma opção encontrada.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const isSelected = value.includes(option.value)
                  return (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => handleToggle(option.value)}
                    >
                      <div
                        className={cn(
                          'mr-2 flex size-4 items-center justify-center rounded-sm border border-primary',
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'opacity-50 [&_svg]:invisible'
                        )}
                      >
                        <Check className="size-3" />
                      </div>
                      {option.label}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {hasSelection && (
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
