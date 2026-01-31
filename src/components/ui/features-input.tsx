import { Check, ChevronsUpDown, X } from 'lucide-react'
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

export interface FeaturesInputProps {
  /** Current list of features */
  value: string[]
  /** Called when features change */
  onChange: (features: string[]) => void
  /** Suggested features for the dropdown */
  suggestions?: string[]
  /** Placeholder text */
  placeholder?: string
  /** Maximum length for each feature */
  maxLength?: number
  /** Whether the input is disabled */
  disabled?: boolean
  /** Class name for the container */
  className?: string
}

/**
 * Default suggested features for real estate projects
 */
export const DEFAULT_PROJECT_FEATURES = [
  'Piscina',
  'Academia',
  'Salão de Festas',
  'Churrasqueira',
  'Playground',
  'Quadra Esportiva',
  'Pet Place',
  'Bicicletário',
  'Coworking',
  'Lavanderia',
  'Rooftop',
  'Portaria 24h',
  'Elevador',
  'Vagas de Garagem',
  'Área Gourmet',
  'Sauna',
  'Spa',
  'Espaço Kids',
  'Jardim',
  'Horta Comunitária',
]

/**
 * Features input with pills and multi-select dropdown
 */
export function FeaturesInput({
  value,
  onChange,
  suggestions = DEFAULT_PROJECT_FEATURES,
  placeholder = 'Adicionar característica...',
  maxLength = 100,
  disabled = false,
  className,
}: FeaturesInputProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Filter out already selected items from suggestions
  const availableSuggestions = React.useMemo(
    () => suggestions.filter((s) => !value.includes(s)),
    [suggestions, value]
  )

  // Filter suggestions based on input
  const filteredSuggestions = React.useMemo(() => {
    if (!inputValue.trim()) return availableSuggestions
    const search = inputValue.toLowerCase()
    return availableSuggestions.filter((s) => s.toLowerCase().includes(search))
  }, [availableSuggestions, inputValue])

  const handleAddFeature = React.useCallback(
    (feature: string) => {
      const trimmed = feature.trim()
      if (!trimmed || value.includes(trimmed)) return
      onChange([...value, trimmed])
      setInputValue('')
      setOpen(false)
    },
    [value, onChange]
  )

  const handleRemoveFeature = React.useCallback(
    (feature: string) => {
      onChange(value.filter((f) => f !== feature))
    },
    [value, onChange]
  )

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && inputValue.trim()) {
        e.preventDefault()
        handleAddFeature(inputValue)
      } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
        // Remove last tag on backspace if input is empty
        const lastFeature = value[value.length - 1]
        if (lastFeature) {
          handleRemoveFeature(lastFeature)
        }
      }
    },
    [inputValue, value, handleAddFeature, handleRemoveFeature]
  )

  return (
    <div className={cn('space-y-3', className)}>
      {/* Pills display */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((feature) => (
            <span
              key={feature}
              className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary"
            >
              {feature}
              <button
                type="button"
                onClick={() => handleRemoveFeature(feature)}
                disabled={disabled}
                className="ml-1 rounded-full p-0.5 hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                aria-label={`Remover ${feature}`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input with suggestions dropdown */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div
            className={cn(
              'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
              'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value.slice(0, maxLength))}
              onKeyDown={handleKeyDown}
              onFocus={() => setOpen(true)}
              placeholder={placeholder}
              disabled={disabled}
              className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
            />
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Buscar ou digitar..."
              value={inputValue}
              onValueChange={setInputValue}
              className="sr-only"
            />
            <CommandList>
              {/* Custom item option */}
              {inputValue.trim() && !suggestions.includes(inputValue.trim()) && (
                <CommandGroup heading="Adicionar novo">
                  <CommandItem
                    onSelect={() => handleAddFeature(inputValue)}
                    className="cursor-pointer"
                  >
                    <Check className="mr-2 size-4 opacity-0" />
                    <span>Adicionar "{inputValue.trim()}"</span>
                  </CommandItem>
                </CommandGroup>
              )}

              {/* Suggested items */}
              {filteredSuggestions.length > 0 && (
                <CommandGroup heading="Sugestões">
                  {filteredSuggestions.map((suggestion) => (
                    <CommandItem
                      key={suggestion}
                      onSelect={() => handleAddFeature(suggestion)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          'mr-2 size-4',
                          value.includes(suggestion) ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {suggestion}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {filteredSuggestions.length === 0 && !inputValue.trim() && (
                <CommandEmpty>Nenhuma sugestão disponível</CommandEmpty>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
