import * as React from 'react'
import { Input } from '@/components/ui/input'
import { maskBirthDate } from '@/lib/text-formatters'
import { cn } from '@/lib/utils'

export interface BirthDateInputProps
  extends Omit<React.ComponentProps<'input'>, 'onChange' | 'value' | 'type'> {
  value?: string
  onChange?: (value: string) => void
}

/**
 * Birth Date Input with DD/MM/YYYY masking
 */
const BirthDateInput = React.forwardRef<HTMLInputElement, BirthDateInputProps>(
  ({ className, value = '', onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const masked = maskBirthDate(e.target.value)
      onChange?.(masked)
    }

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        className={cn(className)}
        value={value}
        onChange={handleChange}
        maxLength={10}
        placeholder="DD/MM/AAAA"
        {...props}
      />
    )
  }
)
BirthDateInput.displayName = 'BirthDateInput'

export { BirthDateInput }
