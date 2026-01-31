import { getUFOptions, type UFType } from '@cacenot/construct-pro-api-client'
import * as React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const ufOptions = getUFOptions('pt-BR')

export interface UFSelectProps {
  value?: string
  onValueChange?: (value: UFType) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

/**
 * UF (Brazilian State) Select using API client enum
 */
const UFSelect = React.forwardRef<HTMLButtonElement, UFSelectProps>(
  ({ value, onValueChange, placeholder = 'Selecione o estado', disabled, className }, ref) => {
    return (
      <Select
        value={value}
        onValueChange={(val) => onValueChange?.(val as UFType)}
        disabled={disabled}
      >
        <SelectTrigger ref={ref} className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {ufOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }
)
UFSelect.displayName = 'UFSelect'

export { UFSelect }
