import { Loader2, Save } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import type { FieldValues, UseFormReturn } from 'react-hook-form'
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
import { Form } from '@/components/ui/form'
import { useSectionGuard } from '../settings-layout'
import { SettingsSection } from '../settings-section'

interface ConfigSectionFormProps<T extends FieldValues> {
  id: string
  title: string
  description?: string
  /** Instância de form criada pela seção (com seu próprio sub-schema). */
  form: UseFormReturn<T>
  /** Persiste apenas os campos desta seção (PATCH parcial). Deve lançar em erro. */
  onPersist: (data: T) => Promise<void>
  /** Campos da seção (FormField usando `form.control`). */
  children: ReactNode
}

/**
 * Casca de uma seção de configuração: um formulário independente com barra de
 * salvar/descartar própria, confirmação antes de gravar (estas regras afetam
 * contratos e carteira) e registro do guard de alterações não salvas — o
 * `SettingsLayout` intercepta a troca de seção se houver mudança pendente.
 */
export function ConfigSectionForm<T extends FieldValues>({
  id,
  title,
  description,
  form,
  onPersist,
  children,
}: ConfigSectionFormProps<T>) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const isDirty = form.formState.isDirty

  // Persiste e re-baseia o form (novo "limpo"). Retorna se gravou com sucesso.
  const persist = async (): Promise<boolean> => {
    setIsSaving(true)
    try {
      const data = form.getValues()
      await onPersist(data)
      form.reset(data)
      return true
    } catch {
      // erro já tratado no onError da mutation (toast)
      return false
    } finally {
      setIsSaving(false)
    }
  }

  // Guard de navegação: valida e salva direto (o diálogo do guard já confirma a
  // saída da seção, evitando dois diálogos encadeados).
  useSectionGuard(id, {
    isDirty,
    save: async () => {
      const valid = await form.trigger()
      return valid ? persist() : false
    },
    discard: () => form.reset(),
  })

  const handleConfirmedSubmit = async () => {
    if (await persist()) setConfirmOpen(false)
  }

  return (
    <SettingsSection id={id} title={title} description={description}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(() => setConfirmOpen(true))} className="max-w-3xl">
          {children}

          {isDirty && (
            <div className="sticky bottom-0 z-10 mt-8 flex items-center justify-between gap-4 border-t border-border/60 bg-background py-4">
              <p className="text-sm text-muted-foreground">Você tem alterações não salvas</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => form.reset()}
                  disabled={isSaving}
                >
                  Descartar
                </Button>
                <Button type="submit" disabled={isSaving} className="min-w-[160px]">
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 size-4" />
                      Salvar alterações
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </form>
      </Form>

      {/* Confirmação — estas regras afetam contratos e carteira (mantida em todas as seções) */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Salvar “{title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Estas regras afetam novos contratos, a geração de boletos e o cálculo da carteira.
              Confirme que os valores estão corretos antes de aplicar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel>
            <Button onClick={handleConfirmedSubmit} disabled={isSaving} className="min-w-[140px]">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Confirmar e salvar'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsSection>
  )
}
