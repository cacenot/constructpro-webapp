import { type RefObject, useEffect, useRef } from 'react'

interface UseIntersectionOptions {
  /** Liga/desliga o observer sem desmontar a sentinela (ex.: pausar quando não há próxima página). */
  enabled?: boolean
  /** Container de scroll usado como raiz. Default: viewport. */
  root?: RefObject<Element | null>
  /** Margem de antecipação. `'200px'` dispara antes de a sentinela entrar de fato em tela. */
  rootMargin?: string
  threshold?: number | number[]
}

/**
 * Observa uma sentinela e dispara `onIntersect` quando ela entra na área visível
 * da raiz. Base do infinite scroll (ver data-table-infinite) e de qualquer reveal
 * sob demanda. O callback é mantido em ref, então mudá-lo não recria o observer.
 */
export function useIntersection<T extends HTMLElement = HTMLDivElement>(
  onIntersect: () => void,
  { enabled = true, root, rootMargin = '0px', threshold = 0 }: UseIntersectionOptions = {}
): RefObject<T | null> {
  const ref = useRef<T>(null)
  const callback = useRef(onIntersect)
  callback.current = onIntersect

  useEffect(() => {
    const target = ref.current
    if (!target || !enabled) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) callback.current()
        }
      },
      { root: root?.current ?? null, rootMargin, threshold }
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [enabled, root, rootMargin, threshold])

  return ref
}
