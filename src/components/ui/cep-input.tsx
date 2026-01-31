import { maskCEP } from '@cacenot/construct-pro-api-client'
import { Loader2 } from 'lucide-react'
import * as React from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface BrasilApiCepResponse {
  cep: string
  state: string
  city: string
  neighborhood: string
  street: string
  service?: string
  location?: {
    type: string
    coordinates: {
      latitude: number
      longitude: number
    }
  }
}

/**
 * Fetches address data from Brasil API CEP V2
 */
export async function fetchCepData(cep: string): Promise<BrasilApiCepResponse | null> {
  const digits = cep.replace(/\D/g, '')
  if (digits.length !== 8) return null

  try {
    const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${digits}`)
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

export interface CEPInputProps
  extends Omit<React.ComponentProps<'input'>, 'onChange' | 'value' | 'type'> {
  value?: string
  onChange?: (value: string) => void
  /** Called when CEP data is fetched successfully */
  onCepFetched?: (data: BrasilApiCepResponse) => void
  /** Whether to auto-fetch address on complete CEP */
  autoFetch?: boolean
  /** Country code - only fetches if BR */
  country?: string
}

/**
 * CEP Input with automatic masking (XXXXX-XXX) and optional Brasil API integration
 */
const CEPInput = React.forwardRef<HTMLInputElement, CEPInputProps>(
  (
    { className, value = '', onChange, onCepFetched, autoFetch = true, country = 'BR', ...props },
    ref
  ) => {
    const [isLoading, setIsLoading] = React.useState(false)
    const lastFetchedCep = React.useRef<string>('')

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const masked = maskCEP(e.target.value)
      onChange?.(masked)
    }

    // Auto-fetch when CEP is complete
    React.useEffect(() => {
      const digits = value.replace(/\D/g, '')

      // Only fetch for Brazil and when we have 8 digits
      if (
        autoFetch &&
        country === 'BR' &&
        digits.length === 8 &&
        digits !== lastFetchedCep.current &&
        onCepFetched
      ) {
        lastFetchedCep.current = digits
        setIsLoading(true)

        fetchCepData(digits)
          .then((data) => {
            if (data) {
              onCepFetched(data)
            }
          })
          .finally(() => {
            setIsLoading(false)
          })
      }
    }, [value, autoFetch, country, onCepFetched])

    return (
      <div className="relative">
        <Input
          ref={ref}
          type="text"
          inputMode="numeric"
          className={cn('pr-8', className)}
          value={value}
          onChange={handleChange}
          maxLength={9}
          placeholder="00000-000"
          {...props}
        />
        {isLoading && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    )
  }
)
CEPInput.displayName = 'CEPInput'

/**
 * Generic postal code input for non-BR countries (no mask)
 */
export interface PostalCodeInputProps
  extends Omit<React.ComponentProps<'input'>, 'onChange' | 'value' | 'type'> {
  value?: string
  onChange?: (value: string) => void
}

const PostalCodeInput = React.forwardRef<HTMLInputElement, PostalCodeInputProps>(
  ({ className, value = '', onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.value)
    }

    return (
      <Input
        ref={ref}
        type="text"
        className={cn(className)}
        value={value}
        onChange={handleChange}
        maxLength={20}
        placeholder="Código postal"
        {...props}
      />
    )
  }
)
PostalCodeInput.displayName = 'PostalCodeInput'

export { CEPInput, PostalCodeInput }
