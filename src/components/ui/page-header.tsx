import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  /** Renderiza um back-button (link) com tooltip "Voltar" antes do título. */
  backHref?: string
  /** Ações à direita (botão único ou grupo). */
  action?: ReactNode
  className?: string
}

/**
 * Cabeçalho único de página: título no token `display` do DESIGN.md
 * (text-3xl/semibold), descrição opcional, back-button opcional e slot de ação.
 * Cobre listas, criação/edição e settings. Hero/detalhe usam componentes próprios.
 */
export function PageHeader({ title, description, backHref, action, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {backHref && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild variant="ghost" size="icon" className="mt-0.5 shrink-0">
                <a href={backHref} aria-label="Voltar">
                  <ArrowLeft className="size-4" aria-hidden="true" />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Voltar</p>
            </TooltipContent>
          </Tooltip>
        )}
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  )
}
