import { AlertCircle, Lock } from 'lucide-react'
import type { ReactNode } from 'react'
import { CostaraMark } from '@/components/costara-mark'
import { cn } from '@/lib/utils'

/**
 * Shell de autenticação — "o limiar da Sala de Controle".
 * Grafite quente, grade blueprint que evoca o imóvel na planta, o logo
 * centralizado acima do card e um rodapé de operação. Compartilhado por login,
 * recuperação e redefinição de senha para uma única voz visual.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
      {/* Atmosfera (tom, não cor): halo de tela ligada + grade técnica */}
      <div aria-hidden className="auth-glow pointer-events-none absolute inset-0" />
      <div aria-hidden className="auth-grid pointer-events-none absolute inset-0" />

      {/* Módulo de foco, com o logo centralizado logo acima do card */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-12">
        <div className="auth-rise w-full max-w-[400px]">
          <div className="mb-7 flex items-center justify-center gap-3">
            <CostaraMark className="h-10 w-auto text-primary" />
            <span className="font-semibold text-xl tracking-tight">Costara</span>
          </div>
          {children}
        </div>
      </main>

      {/* Rodapé de operação */}
      <footer className="relative z-10 flex items-center justify-center gap-2 px-6 py-6 text-xs text-muted-foreground">
        <Lock className="size-3.5" aria-hidden />
        <span>Acesso restrito à equipe da incorporadora</span>
      </footer>
    </div>
  )
}

/** Painel de foco: a "módulo ativo" do console sobre a planta. */
export function AuthCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'relative rounded-lg border border-border bg-card p-6 shadow-lg sm:p-7',
        className
      )}
    >
      {/* topo "aceso": highlight tonal de 1px (luz, não cor) */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-foreground/10 to-transparent"
      />
      {children}
    </div>
  )
}

interface AuthHeadingProps {
  overline?: string
  title: string
  description?: ReactNode
}

/** Cabeçalho do painel: overline em label de console + título + apoio. */
export function AuthHeading({ overline, title, description }: AuthHeadingProps) {
  return (
    <div className="mb-6 space-y-2">
      {overline ? (
        <p className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {overline}
        </p>
      ) : null}
      <h1 className="text-balance font-semibold text-3xl text-foreground leading-tight tracking-tight">
        {title}
      </h1>
      {description ? (
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
    </div>
  )
}

/** Erro inline na voz de console: tinte coral, borda completa, sem faixa lateral. */
export function AuthAlert({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex animate-in items-start gap-2.5 slide-in-from-top-1 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 fade-in-0 text-destructive text-sm duration-200"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span className="leading-snug">{children}</span>
    </div>
  )
}
