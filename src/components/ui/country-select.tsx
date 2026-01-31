import { type CountryType, getCountryOptions } from '@cacenot/construct-pro-api-client'
import * as React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const countryOptions = getCountryOptions('pt-BR')

export interface CountrySelectProps {
  value?: string
  onValueChange?: (value: CountryType) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

/**
 * Country Select using API client enum
 * Default value is 'BR' (Brazil)
 */
const CountrySelect = React.forwardRef<HTMLButtonElement, CountrySelectProps>(
  ({ value, onValueChange, placeholder = 'Selecione o país', disabled, className }, ref) => {
    return (
      <Select
        value={value}
        onValueChange={(val) => onValueChange?.(val as CountryType)}
        disabled={disabled}
      >
        <SelectTrigger ref={ref} className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {countryOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }
)
CountrySelect.displayName = 'CountrySelect'

export { CountrySelect }
