import * as React from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface AreaInputProps
  extends Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange' | 'type'> {
  /** Area value in square meters */
  value: number | undefined | null
  /** Called when value changes */
  onChange: (area: number | null) => void
}

/**
 * Area input component with m² suffix
 * Accepts decimal values with step 0.01
 */
export const AreaInput = React.forwardRef<HTMLInputElement, AreaInputProps>(
  ({ value, onChange, className, placeholder, ...props }, ref) => {
    // Convert number to display string
    const displayValue = React.useMemo(() => {
      if (value === null || value === undefined) return ''
      return value.toString().replace('.', ',')
    }, [value])

    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value

        // If empty, set to null
        if (!rawValue) {
          onChange(null)
          return
        }

        // Allow only digits and comma/dot
        const cleaned = rawValue.replace(/[^\d,.]/g, '')

        // Replace comma with dot for parsing
        const withDot = cleaned.replace(',', '.')

        // Parse and validate
        const parsed = Number.parseFloat(withDot)

        if (Number.isNaN(parsed)) {
          onChange(null)
          return
        }

        // Round to 2 decimal places
        const rounded = Math.round(parsed * 100) / 100
        onChange(rounded)
      },
      [onChange]
    )

    // Handle blur to format the value properly
    const onBlurProp = props.onBlur
    const handleBlur = React.useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        if (value !== null && value !== undefined) {
          // Ensure 2 decimal places on blur
          const formatted = value.toFixed(2).replace('.', ',')
          e.target.value = formatted
        }
        onBlurProp?.(e)
      },
      [value, onBlurProp]
    )

    return (
      <div className="relative">
        <Input
          ref={ref}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder ?? '0,00'}
          className={cn('pr-10 tabular-nums', className)}
          {...props}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          m²
        </span>
      </div>
    )
  }
)

AreaInput.displayName = 'AreaInput'
