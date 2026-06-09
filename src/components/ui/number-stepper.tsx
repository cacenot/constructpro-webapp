import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import * as React from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export interface NumberStepperProps {
  value: number | null | undefined
  onChange: (value: number) => void
  /** Marca o campo como tocado (RHF) ao interagir, para o erro limpar no change. */
  onBlur?: () => void
  min?: number
  max?: number
  step?: number
  /** Salto rápido (parcelas em 1 ano). Setas duplas ocultas quando ≤ step. */
  bigStep?: number
  /** Substantivo do passo simples, ex.: "mês" ou "parcela" (usado nas tooltips). */
  stepLabel?: string
  /** Substantivo do salto, ex.: "ano" (usado nas tooltips das setas duplas). */
  bigStepLabel?: string
  disabled?: boolean
  className?: string
  id?: string
  'aria-label'?: string
  'aria-invalid'?: boolean
}

/**
 * Campo numérico em uma linha, no idioma de navegação de calendário: setas simples
 * (‹ ›) ajustam de 1 em 1, setas duplas (« ») saltam um ano inteiro. Permite digitação
 * livre (limpar e digitar 12) — o valor é travado em [min, max] ao sair do campo.
 * Pensado para quantidade de parcelas.
 */
export function NumberStepper({
  value,
  onChange,
  onBlur,
  min = 1,
  max,
  step = 1,
  bigStep,
  stepLabel = 'parcela',
  bigStepLabel = 'ano',
  disabled = false,
  className,
  id,
  'aria-label': ariaLabel,
  'aria-invalid': ariaInvalid,
}: NumberStepperProps) {
  const [text, setText] = React.useState(value == null ? '' : String(value))

  // Mantém o texto em sincronia quando o valor muda por fora (setas, reset do form).
  React.useEffect(() => {
    setText(value == null ? '' : String(value))
  }, [value])

  const clamp = (n: number) => {
    let v = Number.isNaN(n) ? min : n
    if (min != null) v = Math.max(min, v)
    if (max != null) v = Math.min(max, v)
    return v
  }

  const current = value ?? min ?? 0

  const commit = (next: number) => {
    const c = clamp(next)
    setText(String(c))
    onChange(c)
    onBlur?.()
  }

  const canDec = !disabled && current > min
  const canInc = !disabled && (max == null || current < max)
  const showBig = bigStep != null && bigStep > step

  // Salto de ano "encaixa" no múltiplo do bigStep: de 1 vai para 12 (não 13),
  // mantendo as quantidades alinhadas a anos cheios.
  const snapUp = (m: number) => (Math.floor(current / m) + 1) * m
  const snapDown = (m: number) => (Math.ceil(current / m) - 1) * m

  return (
    <div
      className={cn(
        'flex h-9 items-stretch overflow-hidden rounded-md border border-input bg-background transition-[color,box-shadow] dark:bg-input/30',
        'focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50',
        ariaInvalid && 'border-destructive',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
    >
      {showBig && (
        <ArrowButton
          label={`Diminuir 1 ${bigStepLabel}`}
          edge="left"
          onClick={() => commit(snapDown(bigStep as number))}
          disabled={!canDec}
        >
          <ChevronsLeft className="size-3.5" />
        </ArrowButton>
      )}
      <ArrowButton
        label={`Diminuir 1 ${stepLabel}`}
        edge="left"
        onClick={() => commit(current - step)}
        disabled={!canDec}
      >
        <ChevronLeft className="size-3.5" />
      </ArrowButton>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid}
        disabled={disabled}
        value={text}
        onChange={(e) => {
          const raw = e.target.value.replace(/\D/g, '')
          setText(raw)
          if (raw === '') return
          const n = Number.parseInt(raw, 10)
          onChange(max != null ? Math.min(n, max) : n)
        }}
        onBlur={() => commit(text === '' ? min : Number.parseInt(text, 10))}
        className="w-full min-w-0 border-0 bg-transparent px-2 text-center text-sm font-medium tabular-nums outline-none disabled:cursor-not-allowed"
      />
      <ArrowButton
        label={`Adicionar 1 ${stepLabel}`}
        edge="right"
        onClick={() => commit(current + step)}
        disabled={!canInc}
      >
        <ChevronRight className="size-3.5" />
      </ArrowButton>
      {showBig && (
        <ArrowButton
          label={`Adicionar 1 ${bigStepLabel}`}
          edge="right"
          onClick={() => commit(snapUp(bigStep as number))}
          disabled={!canInc}
        >
          <ChevronsRight className="size-3.5" />
        </ArrowButton>
      )}
    </div>
  )
}

function ArrowButton({
  label,
  edge,
  onClick,
  disabled,
  children,
}: {
  label: string
  edge: 'left' | 'right'
  onClick: () => void
  disabled: boolean
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={onClick}
          disabled={disabled}
          className={cn(
            'flex w-7 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:bg-muted/70 disabled:pointer-events-none disabled:opacity-40',
            edge === 'left' ? 'border-r border-input' : 'border-l border-input'
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
