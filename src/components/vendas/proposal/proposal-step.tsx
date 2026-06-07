import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type StepState = 'active' | 'done' | 'todo'

interface ProposalStepProps {
  index: number
  state: StepState
  title: string
  /** Resumo compacto exibido quando a etapa está concluída e recolhida. */
  summary?: ReactNode
  /** Abre a etapa para edição (apenas quando concluída). */
  onEdit?: () => void
  /** Força o corpo expandido (modo leitura: todas as etapas abertas). */
  expanded?: boolean
  /** Corpo da etapa, exibido quando ativa. */
  children?: ReactNode
}

/**
 * Uma etapa do acordeão da proposta. Ativa → corpo expandido; concluída → linha de
 * resumo com "Editar"; futura → cabeçalho aguardando. Uma de cada vez, na vertical.
 */
export function ProposalStep({
  index,
  state,
  title,
  summary,
  onEdit,
  expanded,
  children,
}: ProposalStepProps) {
  const showBody = expanded ?? state === 'active'
  return (
    <section className="py-5 first:pt-0 last:pb-0">
      <div className="flex items-center gap-3">
        <StepMarker index={index} state={state} />
        <h2
          className={cn(
            'flex-1 text-sm font-semibold tracking-tight',
            state === 'todo' && 'text-muted-foreground'
          )}
        >
          {title}
        </h2>
        {state === 'done' && onEdit && !showBody && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="-mr-2 h-7 text-xs text-muted-foreground hover:text-foreground"
          >
            Editar
          </Button>
        )}
      </div>

      {!showBody && state === 'done' && summary != null && (
        <div className="mt-2 pl-10 text-xs text-muted-foreground">{summary}</div>
      )}
      {showBody && (
        <div className="mt-4 animate-in fade-in-0 duration-200 sm:pl-10">{children}</div>
      )}
    </section>
  )
}

function StepMarker({ index, state }: { index: number; state: StepState }) {
  if (state === 'done') {
    // Concluída = estado de sucesso (verde-esmeralda), não ação. O lima fica reservado
    // só para a etapa atual, preservando a One Voice Rule.
    return (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-success/50 bg-success/10 text-success">
        <Check className="size-4" />
      </span>
    )
  }
  if (state === 'active') {
    return (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
        {index + 1}
      </span>
    )
  }
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border text-xs font-medium text-muted-foreground">
      {index + 1}
    </span>
  )
}
