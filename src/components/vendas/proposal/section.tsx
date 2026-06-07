/** Classe do "label de console": minúsculo, caixa-alta, tracking largo, ash-muted. */
export const CONSOLE_LABEL =
  'text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-muted-foreground'

/** Reveal de estado: fade + slide curto, 200ms, ease-out. Vocabulário único de motion
 * para conteúdo que surge (linhas, campos condicionais, avisos). Respeita
 * prefers-reduced-motion via guard global em globals.css. */
export const REVEAL = 'animate-in fade-in-0 slide-in-from-top-1 duration-200 ease-out'
