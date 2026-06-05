import { createContext, type ReactNode, useContext, useState } from 'react'
import { cn } from '@/lib/utils'

export interface SettingsNavItem {
  id: string
  label: string
}

const ActiveSectionContext = createContext<string>('')

/** Id da seção ativa no SettingsLayout (consumido por SettingsSection e pelo form). */
export function useActiveSection() {
  return useContext(ActiveSectionContext)
}

interface SettingsLayoutProps {
  /** Seções na ordem da navegação; cada `id` deve casar com um SettingsSection. */
  sections: readonly SettingsNavItem[]
  children: ReactNode
}

/**
 * Layout de configuração master-detail: sub-navegação à esquerda seleciona a
 * seção; só a seção ativa aparece à direita. As seções inativas continuam
 * montadas (escondidas via CSS) para preservar o estado do formulário.
 * Padrão único compartilhado por "Minha conta" e "Organização".
 */
export function SettingsLayout({ sections, children }: SettingsLayoutProps) {
  const [activeSection, setActiveSection] = useState<string>(sections[0]?.id ?? '')

  return (
    <ActiveSectionContext.Provider value={activeSection}>
      <div className="lg:grid lg:grid-cols-[13rem_1fr] lg:items-start lg:gap-10">
        <nav aria-label="Seções" className="mb-6 lg:mb-0">
          <ul className="-mx-1 flex gap-1 overflow-x-auto px-1 lg:sticky lg:top-6 lg:mx-0 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:px-0">
            {sections.map((section) => {
              const isActive = activeSection === section.id
              return (
                <li key={section.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    aria-current={isActive ? 'true' : undefined}
                    className={cn(
                      'w-full whitespace-nowrap rounded-md px-3 py-1.5 text-left text-sm transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      isActive
                        ? 'bg-muted font-medium text-foreground'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    )}
                  >
                    {section.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="min-w-0">{children}</div>
      </div>
    </ActiveSectionContext.Provider>
  )
}
