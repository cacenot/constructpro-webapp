import { Check } from 'lucide-react'
import type { ComponentType } from 'react'
import { cn } from '@/lib/utils'

export interface SegmentedOption {
  value: string | number
  label: string
  icon?: ComponentType<{ className?: string }>
}

interface SegmentedControlProps {
  options: SegmentedOption[]
  value: string | number
  onChange: (value: string | number) => void
  className?: string
}

/**
 * Controle segmentado (estilo iOS): trilha no tom sunken (`bg-muted`), segmento
 * ativo elevado por tom (`bg-elevated`, mais claro = mais alto — Tonal Lift Rule)
 * e marcado por um check lima. Sem cores novas além da lima de seleção.
 * Usado em Aparência, parcelas, timing de emissão e regra de venda perdida.
 */
export function SegmentedControl({ options, value, onChange, className }: SegmentedControlProps) {
  return (
    <div
      className={cn('flex w-fit max-w-full overflow-x-auto rounded-md bg-muted p-0.5', className)}
    >
      {options.map((option) => {
        const selected = value === option.value
        const Icon = option.icon
        return (
          <button
            key={String(option.value)}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex items-center justify-center gap-2 whitespace-nowrap rounded-[5px] px-3 py-1.5 text-sm transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              selected
                ? 'bg-elevated font-medium text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {Icon && <Icon className="size-4" />}
            {option.label}
            {selected && <Check className="size-3.5 text-primary" />}
          </button>
        )
      })}
    </div>
  )
}
