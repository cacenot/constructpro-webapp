import * as React from 'react'
import { cn } from '@/lib/utils'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** ease-out-quart: arranca rápido, desacelera no fim (sem bounce). */
const easeOutQuart = (t: number) => 1 - (1 - t) ** 4

interface AnimatedNumberProps {
  /** Valor-alvo (qualquer escala: centavos, contagem). */
  value: number
  /** Formata o valor interpolado já arredondado (ex.: centavos → "R$ x"). */
  format?: (n: number) => string
  /** Duração da contagem em ms. */
  durationMs?: number
  className?: string
}

/**
 * Conta de forma animada do valor anterior até o novo valor (roll-up), com ease-out.
 * Não anima no primeiro render nem quando o valor não muda. Interrupções retomam do
 * valor exibido (sem saltos). Respeita prefers-reduced-motion: salta direto ao alvo.
 */
export function AnimatedNumber({
  value,
  format = (n) => String(Math.round(n)),
  durationMs = 450,
  className,
}: AnimatedNumberProps) {
  const [display, setDisplay] = React.useState(value)
  // Valor numérico atualmente exibido — sobrevive a interrupções de animação.
  const currentRef = React.useRef(value)
  const rafRef = React.useRef<number | null>(null)
  const startRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    const to = value
    const from = currentRef.current
    if (from === to) return

    if (prefersReducedMotion()) {
      currentRef.current = to
      setDisplay(to)
      return
    }

    startRef.current = null
    const tick = (ts: number) => {
      if (startRef.current == null) startRef.current = ts
      const t = Math.min(1, (ts - startRef.current) / durationMs)
      const cur = from + (to - from) * easeOutQuart(t)
      currentRef.current = cur
      setDisplay(cur)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        currentRef.current = to
        setDisplay(to)
      }
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [value, durationMs])

  return <span className={cn('tabular-nums', className)}>{format(Math.round(display))}</span>
}
