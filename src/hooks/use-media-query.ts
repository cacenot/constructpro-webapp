import * as React from 'react'

/**
 * Acompanha uma media query CSS em JS. Usado quando o layout precisa ramificar de
 * verdade (ex.: master-detail inline em telas largas vs. drawer overlay no resto),
 * além do que classes responsivas resolvem sozinhas. SPA (sem SSR): `window`
 * sempre existe, então inicializa já com o valor correto, sem flash.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  )

  React.useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}
