import * as React from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/**
 * Parse a BRL formatted currency string to cents (integer)
 * @param value - Formatted string like "R$ 1.234,56" or "1234,56"
 * @returns Integer cents (e.g., 123456 for R$ 1.234,56)
 */
export function parseCurrencyToCents(value: string): number {
  if (!value) return 0

  // Remove currency symbol, spaces, and thousand separators
  const cleaned = value
    .replace(/R\$\s?/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')

  // Replace decimal comma with dot and parse
  const withDot = cleaned.replace(',', '.')
  const parsed = Number.parseFloat(withDot)

  if (Number.isNaN(parsed)) return 0

  // Convert to cents (multiply by 100 and round to avoid floating point issues)
  return Math.round(parsed * 100)
}

/**
 * Format cents (integer) to BRL currency display string
 * @param cents - Integer cents (e.g., 123456)
 * @returns Formatted string like "1.234,56"
 */
export function formatCentsToDisplay(cents: number): string {
  if (!cents || cents === 0) return ''

  const reais = cents / 100
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(reais)
}

/**
 * Mask input value to BRL currency format as user types
 * @param value - Raw input value
 * @returns Formatted value with proper separators
 */
function maskCurrency(value: string): string {
  // Remove everything except digits
  let digits = value.replace(/\D/g, '')

  // Remove leading zeros (but keep at least one)
  digits = digits.replace(/^0+/, '') || '0'

  // Pad with zeros if needed (minimum 3 digits for cents)
  while (digits.length < 3) {
    digits = `0${digits}`
  }

  // Split into reais and centavos
  const centavos = digits.slice(-2)
  const reais = digits.slice(0, -2)

  // Format reais with thousand separators
  const formattedReais = reais.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

  return `${formattedReais},${centavos}`
}

export interface CurrencyInputProps
  extends Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange' | 'type'> {
  /** Value in cents (integer) */
  value: number | undefined | null
  /** Called when value changes, receives cents (integer) */
  onChange: (cents: number) => void
  /** Whether to show R$ prefix */
  showPrefix?: boolean
}

/**
 * Currency input component for BRL values
 * Displays formatted value (R$ 1.234,56) but stores as cents (integer)
 */
export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, showPrefix = true, className, placeholder, ...props }, ref) => {
    // Convert cents to display value
    const displayValue = React.useMemo(() => {
      if (value === null || value === undefined || value === 0) return ''
      return formatCentsToDisplay(value)
    }, [value])

    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value

        // If empty, set to 0
        if (!rawValue) {
          onChange(0)
          return
        }

        // Mask the input
        const masked = maskCurrency(rawValue)

        // Parse to cents and emit
        const cents = parseCurrencyToCents(masked)
        onChange(cents)
      },
      [onChange]
    )

    return (
      <div className="relative">
        {showPrefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            R$
          </span>
        )}
        <Input
          ref={ref}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder ?? '0,00'}
          className={cn(showPrefix && 'pl-10', 'tabular-nums', className)}
          {...props}
        />
      </div>
    )
  }
)

CurrencyInput.displayName = 'CurrencyInput'
