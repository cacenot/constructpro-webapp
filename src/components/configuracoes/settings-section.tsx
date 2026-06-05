import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useActiveSection } from './settings-layout'

interface SettingsSectionProps {
  /** Âncora/identificador que casa com o item de sub-navegação. */
  id: string
  title: string
  description?: string
  children: ReactNode
}

/**
 * Seção de configuração. Aparece apenas quando é a seção ativa do
 * SettingsLayout; quando inativa fica escondida via CSS (continua montada,
 * preservando o estado de formulários). Sem caixa: header + conteúdo.
 */
export function SettingsSection({ id, title, description, children }: SettingsSectionProps) {
  const activeSection = useActiveSection()
  const isActive = activeSection === id

  return (
    <section id={id} aria-hidden={!isActive} className={cn(!isActive && 'hidden')}>
      <div className="mb-6 space-y-1">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  )
}
