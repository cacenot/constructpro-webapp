import { maskCNPJ, maskCPF } from '@cacenot/construct-pro-api-client'
import * as React from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface CPFInputProps
  extends Omit<React.ComponentProps<'input'>, 'onChange' | 'value' | 'type'> {
  value?: string
  onChange?: (value: string) => void
}

/**
 * CPF Input with automatic masking (XXX.XXX.XXX-XX)
 */
const CPFInput = React.forwardRef<HTMLInputElement, CPFInputProps>(
  ({ className, value = '', onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const masked = maskCPF(e.target.value)
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
        maxLength={14}
        placeholder="000.000.000-00"
        {...props}
      />
    )
  }
)
CPFInput.displayName = 'CPFInput'

export interface CNPJInputProps
  extends Omit<React.ComponentProps<'input'>, 'onChange' | 'value' | 'type'> {
  value?: string
  onChange?: (value: string) => void
}

/**
 * CNPJ Input with automatic masking (XX.XXX.XXX/XXXX-XX)
 */
const CNPJInput = React.forwardRef<HTMLInputElement, CNPJInputProps>(
  ({ className, value = '', onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const masked = maskCNPJ(e.target.value)
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
        maxLength={18}
        placeholder="00.000.000/0000-00"
        {...props}
      />
    )
  }
)
CNPJInput.displayName = 'CNPJInput'

export { CPFInput, CNPJInput }
