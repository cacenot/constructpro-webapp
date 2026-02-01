import * as React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface FloorSelectProps {
  /** Selected floor number (0 = térreo, 1 = 1º andar, etc.) */
  value: number | undefined | null
  /** Called when selection changes */
  onChange: (floor: number | null) => void
  /** Maximum number of floors from the project */
  maxFloors: number | null | undefined
  /** Placeholder text */
  placeholder?: string
  /** Whether the input is disabled */
  disabled?: boolean
  /** Class name for the trigger */
  className?: string
}

/**
 * Generate floor label
 * @param floor - Floor number (0 = térreo)
 */
function getFloorLabel(floor: number): string {
  if (floor === 0) return 'Térreo'
  if (floor === 1) return '1º Andar'
  if (floor === 2) return '2º Andar'
  if (floor === 3) return '3º Andar'
  return `${floor}º Andar`
}

/**
 * Generate floor options based on max floors
 */
function generateFloorOptions(
  maxFloors: number | null | undefined
): { value: number; label: string }[] {
  // Default to showing at least ground floor + 10 floors if no max specified
  const max = maxFloors ?? 10

  const options: { value: number; label: string }[] = []

  for (let i = 0; i <= max; i++) {
    options.push({
      value: i,
      label: getFloorLabel(i),
    })
  }

  return options
}

/**
 * Floor select component with dynamic options based on project
 */
export function FloorSelect({
  value,
  onChange,
  maxFloors,
  placeholder = 'Selecione o andar',
  disabled = false,
  className,
}: FloorSelectProps) {
  const options = React.useMemo(() => generateFloorOptions(maxFloors), [maxFloors])

  const handleChange = React.useCallback(
    (val: string) => {
      if (val === '') {
        onChange(null)
        return
      }
      onChange(Number.parseInt(val, 10))
    },
    [onChange]
  )

  // Disable if no project selected (maxFloors is null/undefined and no explicit floors)
  const isDisabled = disabled || maxFloors === null || maxFloors === undefined

  return (
    <Select
      value={value !== null && value !== undefined ? value.toString() : ''}
      onValueChange={handleChange}
      disabled={isDisabled}
    >
      <SelectTrigger className={className}>
        <SelectValue
          placeholder={isDisabled ? 'Selecione o empreendimento primeiro' : placeholder}
        />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value.toString()}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
