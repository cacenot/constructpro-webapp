import { Loader2 } from 'lucide-react'
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface SettingsNavItem {
  id: string
  label: string
}

/**
 * Guarda de alterações não salvas de uma seção. Uma seção com formulário se
 * registra (via `useSectionGuard`) para que o layout possa interceptar a troca
 * de seção e oferecer salvar/descartar.
 */
export interface SectionGuard {
  isDirty: boolean
  /** Valida e salva; retorna `true` se persistiu (libera a navegação). */
  save: () => Promise<boolean>
  /** Descarta as alterações (reset do formulário). */
  discard: () => void
}

type GuardGetter = () => SectionGuard

interface SettingsLayoutContextValue {
  activeSection: string
  registerGuard: (id: string, getter: GuardGetter | null) => void
}

const SettingsLayoutContext = createContext<SettingsLayoutContextValue | null>(null)

/** Id da seção ativa no SettingsLayout (consumido por SettingsSection e pelo form). */
export function useActiveSection(): string {
  return useContext(SettingsLayoutContext)?.activeSection ?? ''
}

/**
 * Registra o guard de alterações não salvas da seção `id`. O layout consulta o
 * guard ao tentar trocar de seção; se estiver "sujo", oferece salvar/descartar.
 */
export function useSectionGuard(id: string, guard: SectionGuard) {
  const ctx = useContext(SettingsLayoutContext)
  // Ref estável: registra um getter uma vez e mantém os valores atualizados a
  // cada render, sem re-registrar (evita loops de efeito).
  const guardRef = useRef(guard)
  guardRef.current = guard

  const registerGuard = ctx?.registerGuard
  useEffect(() => {
    if (!registerGuard) return
    registerGuard(id, () => guardRef.current)
    return () => registerGuard(id, null)
  }, [id, registerGuard])
}

interface SettingsLayoutProps {
  /** Seções na ordem da navegação; cada `id` deve casar com um SettingsSection. */
  sections: readonly SettingsNavItem[]
  children: ReactNode
}

/** Seção inicial: hash da URL (#correcao) se casar com uma seção; senão a primeira. */
function getInitialSection(sections: readonly SettingsNavItem[], fallback: string): string {
  if (typeof window === 'undefined') return fallback
  const hash = window.location.hash.slice(1)
  return sections.some((s) => s.id === hash) ? hash : fallback
}

/**
 * Layout de configuração master-detail: sub-navegação à esquerda seleciona a
 * seção; só a seção ativa aparece à direita. As seções inativas continuam
 * montadas (escondidas via CSS) para preservar o estado do formulário.
 * Padrão único compartilhado por "Minha conta" e "Organização".
 *
 * A seção ativa é refletida no hash da URL (`#id`) via `replaceState` — assim
 * refresh e links compartilhados (ex: `/organizacao#correcao`) caem na seção
 * certa, sem poluir o histórico de navegação.
 *
 * Ao sair de uma seção com alterações não salvas (guard registrado via
 * `useSectionGuard`), o layout pede para salvar ou descartar antes de trocar.
 */
export function SettingsLayout({ sections, children }: SettingsLayoutProps) {
  const [activeSection, setActiveSection] = useState<string>(() =>
    getInitialSection(sections, sections[0]?.id ?? '')
  )
  const [pendingSection, setPendingSection] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const guards = useRef<Map<string, GuardGetter>>(new Map())
  const registerGuard = useCallback((id: string, getter: GuardGetter | null) => {
    if (getter) guards.current.set(id, getter)
    else guards.current.delete(id)
  }, [])

  const applySection = useCallback((id: string) => {
    setActiveSection(id)
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${id}`)
    }
  }, [])

  const selectSection = (target: string) => {
    if (target === activeSection) return
    const guard = guards.current.get(activeSection)?.()
    if (guard?.isDirty) {
      setPendingSection(target)
      return
    }
    applySection(target)
  }

  const guardLabel = sections.find((s) => s.id === activeSection)?.label ?? ''

  const handleSave = async () => {
    const guard = guards.current.get(activeSection)?.()
    if (!guard) return
    setIsSaving(true)
    const ok = await guard.save()
    setIsSaving(false)
    // Sucesso → navega. Falha (validação/rede) → fecha o diálogo e mantém na
    // seção, com o erro inline visível.
    if (ok && pendingSection) applySection(pendingSection)
    setPendingSection(null)
  }

  const handleDiscard = () => {
    guards.current.get(activeSection)?.().discard()
    if (pendingSection) applySection(pendingSection)
    setPendingSection(null)
  }

  return (
    <SettingsLayoutContext.Provider value={{ activeSection, registerGuard }}>
      <div className="lg:grid lg:grid-cols-[13rem_1fr] lg:items-start lg:gap-10">
        <nav aria-label="Seções" className="mb-6 lg:mb-0">
          <ul className="-mx-1 flex gap-1 overflow-x-auto px-1 lg:sticky lg:top-6 lg:mx-0 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:px-0">
            {sections.map((section) => {
              const isActive = activeSection === section.id
              return (
                <li key={section.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => selectSection(section.id)}
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

      {/* Guard de alterações não salvas ao trocar de seção */}
      <AlertDialog
        open={pendingSection !== null}
        onOpenChange={(open) => {
          if (!open) setPendingSection(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Salvar alterações em “{guardLabel}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem alterações não salvas nesta seção. Deseja salvar antes de sair ou descartar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel>
            <Button type="button" variant="ghost" onClick={handleDiscard} disabled={isSaving}>
              Descartar
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="min-w-[120px]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar e sair'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsLayoutContext.Provider>
  )
}
