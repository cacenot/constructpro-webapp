import { Check } from 'lucide-react'
import { type ComponentType, type KeyboardEvent, useRef } from 'react'
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
  /** Tamanho compacto para uso inline (ex.: toggle R$/% dentro de um campo). */
  size?: 'default' | 'sm'
  /** Rótulo acessível do grupo, lido por leitores de tela. */
  'aria-label'?: string
}

/**
 * Controle segmentado (estilo iOS): trilha no tom sunken (`bg-muted`), segmento
 * ativo elevado por tom (`bg-elevated`, mais claro = mais alto — Tonal Lift Rule)
 * e marcado por um check lima. Sem cores novas além da lima de seleção.
 *
 * Acessibilidade: semântica de `radiogroup` (não toggles independentes) — setas
 * navegam e selecionam, com roving tabindex (só o item ativo é tabbável), como
 * um grupo de rádio nativo. Usado em Aparência, parcelas, timing de emissão e
 * regra de venda perdida.
 */
export function SegmentedControl({
  options,
  value,
  onChange,
  className,
  size = 'default',
  'aria-label': ariaLabel,
}: SegmentedControlProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const hasSelection = options.some((o) => o.value === value)

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = options.length - 1
    let next = -1
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = index === last ? 0 : index + 1
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = index === 0 ? last : index - 1
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = last
    const target = options[next]
    if (next === -1 || !target) return
    e.preventDefault()
    onChange(target.value)
    refs.current[next]?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn('flex w-fit max-w-full overflow-x-auto rounded-md bg-muted p-0.5', className)}
    >
      {options.map((option, index) => {
        const selected = value === option.value
        const Icon = option.icon
        // Roving tabindex: só o item ativo é tabbável (se nada está selecionado,
        // o primeiro fica alcançável). role/aria-checked dão a semântica de rádio.
        return (
          // biome-ignore lint/a11y/useSemanticElements: segmento estilizado segue o padrão radiogroup do WAI-ARIA APG (role em <button>); <input type=radio> não é estilizável como segmento
          <button
            key={String(option.value)}
            ref={(el) => {
              refs.current[index] = el
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected || (!hasSelection && index === 0) ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              'flex items-center justify-center whitespace-nowrap transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              size === 'sm'
                ? 'gap-1 rounded-[4px] px-2 py-0.5 text-xs'
                : 'gap-2 rounded-[5px] px-3 py-1.5 text-sm',
              selected
                ? 'bg-elevated font-medium text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {Icon && <Icon className={size === 'sm' ? 'size-3.5' : 'size-4'} />}
            {option.label}
            {selected && (
              <Check className={cn(size === 'sm' ? 'size-3' : 'size-3.5', 'text-primary')} />
            )}
          </button>
        )
      })}
    </div>
  )
}
