import { CostaraMark } from '@/components/costara-mark'

/**
 * Tela de carregamento "boot do console" — o momento entre autenticar e o
 * console abrir. O mark respira com um halo lima (energia/estado), um trilho de
 * progresso indeterminado varre, e a fase real é anunciada. Substitui o spinner
 * nu do AuthGuard/TenantLoader. Respeita prefers-reduced-motion (ver globals).
 */
export function ConsoleBoot({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background text-foreground">
      <div aria-hidden className="auth-glow pointer-events-none absolute inset-0" />
      <div aria-hidden className="auth-grid pointer-events-none absolute inset-0" />

      <output aria-live="polite" className="relative z-10 flex flex-col items-center gap-7">
        <CostaraMark className="boot-breathe h-16 w-auto text-primary" />

        <div className="h-[3px] w-48 overflow-hidden rounded-full bg-muted">
          <div className="boot-sweep h-full w-1/3 rounded-full bg-primary" />
        </div>

        <p className="text-sm text-muted-foreground">{label}</p>
      </output>
    </div>
  )
}
