import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { SettingsLayout, useSectionGuard } from '@/components/configuracoes/settings-layout'

// ---------------------------------------------------------------------------
// Fixture — seções de navegação reutilizadas nos testes
// ---------------------------------------------------------------------------
const sections = [
  { id: 'primeira', label: 'Primeira Seção' },
  { id: 'segunda', label: 'Segunda Seção' },
  { id: 'terceira', label: 'Terceira Seção' },
] as const

// ---------------------------------------------------------------------------
// Helper — componente filho que registra um guard "sujo" via useSectionGuard
// ---------------------------------------------------------------------------
function DirtySection({
  id,
  onSave,
  onDiscard,
}: {
  id: string
  onSave?: () => Promise<boolean>
  onDiscard?: () => void
}) {
  useSectionGuard(id, {
    isDirty: true,
    save: onSave ?? (() => Promise.resolve(true)),
    discard: onDiscard ?? vi.fn(),
  })
  return <div>Conteúdo de {id}</div>
}

// ---------------------------------------------------------------------------
// Helper — renderiza SettingsLayout com seções padrão e filhos opcionais
// ---------------------------------------------------------------------------
function renderLayout(children?: React.ReactNode) {
  return render(
    <SettingsLayout sections={sections}>{children ?? <div>Conteúdo</div>}</SettingsLayout>
  )
}

// ---------------------------------------------------------------------------
// Testes
// ---------------------------------------------------------------------------
describe('SettingsLayout', () => {
  let replaceStateSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    replaceStateSpy = vi.spyOn(window.history, 'replaceState')
    // Garante hash limpo antes de cada teste
    window.location.hash = ''
  })

  afterEach(() => {
    replaceStateSpy.mockRestore()
    window.location.hash = ''
  })

  // -------------------------------------------------------------------------
  // Navegação básica
  // -------------------------------------------------------------------------
  describe('navegação básica', () => {
    it('renderiza um botão de nav para cada seção', () => {
      renderLayout()

      for (const section of sections) {
        expect(screen.getByRole('button', { name: section.label })).toBeDefined()
      }
    })

    it('a primeira seção começa ativa com aria-current="location"', () => {
      renderLayout()

      const primeiraBtn = screen.getByRole('button', { name: 'Primeira Seção' })
      expect(primeiraBtn.getAttribute('aria-current')).toBe('location')
    })

    it('as outras seções não têm aria-current por padrão', () => {
      renderLayout()

      const segundaBtn = screen.getByRole('button', { name: 'Segunda Seção' })
      const terceiraBtn = screen.getByRole('button', { name: 'Terceira Seção' })
      expect(segundaBtn.getAttribute('aria-current')).toBeNull()
      expect(terceiraBtn.getAttribute('aria-current')).toBeNull()
    })

    it('click em outra seção a torna ativa e atualiza aria-current', async () => {
      const user = userEvent.setup()
      renderLayout()

      await user.click(screen.getByRole('button', { name: 'Segunda Seção' }))

      const segundaBtn = screen.getByRole('button', { name: 'Segunda Seção' })
      expect(segundaBtn.getAttribute('aria-current')).toBe('location')

      const primeiraBtn = screen.getByRole('button', { name: 'Primeira Seção' })
      expect(primeiraBtn.getAttribute('aria-current')).toBeNull()
    })

    it('window.history.replaceState é chamado com #<id> ao navegar', async () => {
      const user = userEvent.setup()
      renderLayout()

      await user.click(screen.getByRole('button', { name: 'Segunda Seção' }))

      expect(replaceStateSpy).toHaveBeenCalledWith(null, '', '#segunda')
    })

    it('click na seção já ativa não chama replaceState', async () => {
      const user = userEvent.setup()
      renderLayout()

      // A primeira já é ativa
      await user.click(screen.getByRole('button', { name: 'Primeira Seção' }))

      expect(replaceStateSpy).not.toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------------------------
  // Hash inicial da URL
  // -------------------------------------------------------------------------
  describe('hash inicial da URL', () => {
    it('hash válido #segunda → segunda seção começa ativa', () => {
      window.location.hash = '#segunda'

      renderLayout()

      const segundaBtn = screen.getByRole('button', { name: 'Segunda Seção' })
      expect(segundaBtn.getAttribute('aria-current')).toBe('location')
    })

    it('hash inválido → primeira seção começa ativa', () => {
      window.location.hash = '#nao-existe'

      renderLayout()

      const primeiraBtn = screen.getByRole('button', { name: 'Primeira Seção' })
      expect(primeiraBtn.getAttribute('aria-current')).toBe('location')
    })

    it('sem hash → primeira seção começa ativa', () => {
      window.location.hash = ''

      renderLayout()

      const primeiraBtn = screen.getByRole('button', { name: 'Primeira Seção' })
      expect(primeiraBtn.getAttribute('aria-current')).toBe('location')
    })

    it('hash válido #terceira → terceira seção começa ativa', () => {
      window.location.hash = '#terceira'

      renderLayout()

      const terceiraBtn = screen.getByRole('button', { name: 'Terceira Seção' })
      expect(terceiraBtn.getAttribute('aria-current')).toBe('location')
    })
  })

  // -------------------------------------------------------------------------
  // Guard — seção limpa (sem guard ou isDirty=false)
  // -------------------------------------------------------------------------
  describe('guard — seção limpa', () => {
    it('sem guard registrado: click em outra seção navega imediatamente sem dialog', async () => {
      const user = userEvent.setup()
      renderLayout()

      await user.click(screen.getByRole('button', { name: 'Segunda Seção' }))

      // Não deve haver AlertDialog aberto
      expect(screen.queryByRole('alertdialog')).toBeNull()

      // Seção muda normalmente
      expect(
        screen.getByRole('button', { name: 'Segunda Seção' }).getAttribute('aria-current')
      ).toBe('location')
    })

    it('guard com isDirty=false: navega sem abrir dialog', async () => {
      const user = userEvent.setup()

      function CleanSection({ id }: { id: string }) {
        useSectionGuard(id, {
          isDirty: false,
          save: () => Promise.resolve(true),
          discard: vi.fn(),
        })
        return <div>Seção limpa {id}</div>
      }

      render(
        <SettingsLayout sections={sections}>
          <CleanSection id="primeira" />
        </SettingsLayout>
      )

      await user.click(screen.getByRole('button', { name: 'Segunda Seção' }))

      expect(screen.queryByRole('alertdialog')).toBeNull()
      expect(
        screen.getByRole('button', { name: 'Segunda Seção' }).getAttribute('aria-current')
      ).toBe('location')
    })
  })

  // -------------------------------------------------------------------------
  // Guard — seção suja (isDirty=true)
  // -------------------------------------------------------------------------
  describe('guard — seção suja (isDirty=true)', () => {
    // Helper: o título do dialog é dividido em múltiplos nós de texto pelo JSX,
    // então usamos um matcher customizado que verifica o textContent do elemento pai.
    const getDialogTitle = () =>
      screen.getByRole('heading', {
        name: (_, el) =>
          (el?.textContent ?? '').includes('Salvar alterações em') &&
          (el?.textContent ?? '').includes('Primeira Seção'),
      })

    it('click em outra seção abre AlertDialog com título correto', async () => {
      const user = userEvent.setup()

      render(
        <SettingsLayout sections={sections}>
          <DirtySection id="primeira" />
        </SettingsLayout>
      )

      await user.click(screen.getByRole('button', { name: 'Segunda Seção' }))

      // AlertDialog deve aparecer — o título do h2 contém o label da seção
      expect(getDialogTitle()).toBeDefined()
    })

    it('"Cancelar" → fecha o dialog e permanece na seção original', async () => {
      const user = userEvent.setup()

      render(
        <SettingsLayout sections={sections}>
          <DirtySection id="primeira" />
        </SettingsLayout>
      )

      await user.click(screen.getByRole('button', { name: 'Segunda Seção' }))
      // Dialog aberto
      expect(getDialogTitle()).toBeDefined()

      // O botão Cancelar é renderizado com data-slot="alert-dialog-cancel"
      await user.click(screen.getByRole('button', { name: 'Cancelar' }))

      // Dialog fechado
      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).toBeNull()
      })

      // Ainda na seção original
      expect(
        screen.getByRole('button', { name: 'Primeira Seção' }).getAttribute('aria-current')
      ).toBe('location')
      expect(
        screen.getByRole('button', { name: 'Segunda Seção' }).getAttribute('aria-current')
      ).toBeNull()
    })

    it('"Descartar" → chama guard.discard() e navega para a seção destino', async () => {
      const user = userEvent.setup()
      const onDiscard = vi.fn()

      render(
        <SettingsLayout sections={sections}>
          <DirtySection id="primeira" onDiscard={onDiscard} />
        </SettingsLayout>
      )

      await user.click(screen.getByRole('button', { name: 'Segunda Seção' }))
      await user.click(screen.getByRole('button', { name: 'Descartar' }))

      expect(onDiscard).toHaveBeenCalledOnce()

      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).toBeNull()
      })

      // Navegou para segunda
      expect(
        screen.getByRole('button', { name: 'Segunda Seção' }).getAttribute('aria-current')
      ).toBe('location')
      expect(replaceStateSpy).toHaveBeenCalledWith(null, '', '#segunda')
    })

    it('"Salvar e sair" com save retornando true → chama guard.save() e navega', async () => {
      const user = userEvent.setup()
      const onSave = vi.fn(() => Promise.resolve(true))

      render(
        <SettingsLayout sections={sections}>
          <DirtySection id="primeira" onSave={onSave} />
        </SettingsLayout>
      )

      await user.click(screen.getByRole('button', { name: 'Segunda Seção' }))
      await user.click(screen.getByRole('button', { name: 'Salvar e sair' }))

      expect(onSave).toHaveBeenCalledOnce()

      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).toBeNull()
      })

      // Navegou para segunda
      expect(
        screen.getByRole('button', { name: 'Segunda Seção' }).getAttribute('aria-current')
      ).toBe('location')
      expect(replaceStateSpy).toHaveBeenCalledWith(null, '', '#segunda')
    })

    it('"Salvar e sair" com save retornando false → fecha dialog e permanece na seção original', async () => {
      const user = userEvent.setup()
      const onSave = vi.fn(() => Promise.resolve(false))

      render(
        <SettingsLayout sections={sections}>
          <DirtySection id="primeira" onSave={onSave} />
        </SettingsLayout>
      )

      await user.click(screen.getByRole('button', { name: 'Segunda Seção' }))
      await user.click(screen.getByRole('button', { name: 'Salvar e sair' }))

      expect(onSave).toHaveBeenCalledOnce()

      await waitFor(() => {
        expect(screen.queryByRole('alertdialog')).toBeNull()
      })

      // Permaneceu na seção original
      expect(
        screen.getByRole('button', { name: 'Primeira Seção' }).getAttribute('aria-current')
      ).toBe('location')
      expect(
        screen.getByRole('button', { name: 'Segunda Seção' }).getAttribute('aria-current')
      ).toBeNull()

      // replaceState não foi chamado (nenhuma navegação)
      expect(replaceStateSpy).not.toHaveBeenCalled()
    })

    it('guard só intercepta a seção ativa — click na seção suja em si não abre dialog', async () => {
      const user = userEvent.setup()

      render(
        <SettingsLayout sections={sections}>
          <DirtySection id="primeira" />
        </SettingsLayout>
      )

      // Click na própria seção ativa (não deve abrir dialog)
      await user.click(screen.getByRole('button', { name: 'Primeira Seção' }))

      expect(screen.queryByRole('alertdialog')).toBeNull()
    })
  })

  // -------------------------------------------------------------------------
  // useActiveSection (via SettingsSection behavior)
  // -------------------------------------------------------------------------
  describe('contexto useActiveSection', () => {
    it('DirtySection recebe o id da seção ativa via contexto', async () => {
      const user = userEvent.setup()
      const onDiscard = vi.fn()

      render(
        <SettingsLayout sections={sections}>
          <DirtySection id="primeira" onDiscard={onDiscard} />
        </SettingsLayout>
      )

      // Navegar para terceira — guard da primeira deve interceptar
      await user.click(screen.getByRole('button', { name: 'Terceira Seção' }))

      // Dialog aberto com label da seção ativa (primeira)
      expect(
        screen.getByRole('heading', {
          name: (_, el) =>
            (el?.textContent ?? '').includes('Salvar alterações em') &&
            (el?.textContent ?? '').includes('Primeira Seção'),
        })
      ).toBeDefined()

      // Descartar → navega para terceira
      await user.click(screen.getByRole('button', { name: 'Descartar' }))

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Terceira Seção' }).getAttribute('aria-current')
        ).toBe('location')
      })

      expect(replaceStateSpy).toHaveBeenCalledWith(null, '', '#terceira')
    })
  })
})
