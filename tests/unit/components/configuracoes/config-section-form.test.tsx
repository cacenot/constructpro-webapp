import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { ConfigSectionForm } from '@/components/configuracoes/tenant-config/config-section-form'
import { SettingsLayout } from '@/components/configuracoes/settings-layout'

// ── Schema e helper de render ──────────────────────────────────────────────────

const schema = z.object({ nome: z.string().min(1, 'Obrigatório') })
type FormData = z.infer<typeof schema>

const SECTIONS = [{ id: 'test', label: 'Teste' }] as const

interface TestFormProps {
  onPersist: (data: FormData) => Promise<void>
  defaultValues?: Partial<FormData>
}

/**
 * Componente auxiliar que monta o form dentro do SettingsLayout correto,
 * garantindo que o contexto de activeSection exista e a seção fique visível.
 */
function TestForm({ onPersist, defaultValues = { nome: '' } }: TestFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nome: defaultValues.nome ?? '' },
  })
  return (
    <SettingsLayout sections={SECTIONS}>
      <ConfigSectionForm id="test" title="Teste" form={form} onPersist={onPersist}>
        <input {...form.register('nome')} aria-label="Nome" />
      </ConfigSectionForm>
    </SettingsLayout>
  )
}

// ── Estado inicial (form limpo) ────────────────────────────────────────────────

describe('ConfigSectionForm — estado inicial (form limpo)', () => {
  it('barra "Você tem alterações não salvas" NÃO aparece com isDirty=false', () => {
    render(<TestForm onPersist={vi.fn()} />)
    expect(screen.queryByText(/você tem alterações não salvas/i)).toBeNull()
  })

  it('botões "Descartar" e "Salvar alterações" NÃO aparecem com isDirty=false', () => {
    render(<TestForm onPersist={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /descartar/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /salvar alterações/i })).toBeNull()
  })

  it('dialog de confirmação NÃO está aberto no estado inicial', () => {
    render(<TestForm onPersist={vi.fn()} />)
    expect(screen.queryByRole('alertdialog')).toBeNull()
  })
})

// ── Submit inválido ────────────────────────────────────────────────────────────

describe('ConfigSectionForm — submit inválido (campo obrigatório vazio)', () => {
  it('dialog NÃO abre e onPersist NÃO é chamado quando form é inválido', async () => {
    const user = userEvent.setup()
    const onPersist = vi.fn()
    // defaultValues com valor não-vazio para que limpar o campo deixe isDirty=true
    // mas o valor seja inválido pelo schema (min(1))
    render(<TestForm onPersist={onPersist} defaultValues={{ nome: 'valor-inicial' }} />)

    // Limpa o campo — isDirty=true mas valor vazio (falha validação Zod min(1))
    const input = screen.getByLabelText('Nome')
    await user.clear(input)

    // Barra deve aparecer (isDirty=true)
    expect(screen.getByText(/você tem alterações não salvas/i)).toBeDefined()

    // Clica em "Salvar alterações" com campo vazio (não passa na validação Zod)
    await user.click(screen.getByRole('button', { name: /salvar alterações/i }))

    // Dialog NÃO deve abrir
    expect(screen.queryByRole('alertdialog')).toBeNull()
    // onPersist NÃO deve ter sido chamado
    expect(onPersist).not.toHaveBeenCalled()
  })
})

// ── Submit válido ──────────────────────────────────────────────────────────────

describe('ConfigSectionForm — submit válido', () => {
  it('dialog de confirmação abre após submit válido', async () => {
    const user = userEvent.setup()
    const onPersist = vi.fn(() => new Promise<void>(() => {})) // pendente para não fechar o dialog
    render(<TestForm onPersist={onPersist} />)

    await user.type(screen.getByLabelText('Nome'), 'Fulano')
    await user.click(screen.getByRole('button', { name: /salvar alterações/i }))

    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeDefined()
    })
  })

  it('onPersist NÃO é chamado antes de confirmar no dialog', async () => {
    const user = userEvent.setup()
    const onPersist = vi.fn(() => new Promise<void>(() => {}))
    render(<TestForm onPersist={onPersist} />)

    await user.type(screen.getByLabelText('Nome'), 'Fulano')
    await user.click(screen.getByRole('button', { name: /salvar alterações/i }))

    // Dialog abre, mas onPersist ainda não foi chamado
    await waitFor(() => screen.getByRole('alertdialog'))
    expect(onPersist).not.toHaveBeenCalled()
  })

  it('título do dialog mostra o título da seção', async () => {
    const user = userEvent.setup()
    const onPersist = vi.fn(() => new Promise<void>(() => {}))
    render(<TestForm onPersist={onPersist} />)

    await user.type(screen.getByLabelText('Nome'), 'Fulano')
    await user.click(screen.getByRole('button', { name: /salvar alterações/i }))

    await waitFor(() => screen.getByRole('alertdialog'))
    expect(screen.getByText(/salvar "teste"/i)).toBeDefined()
  })
})

// ── Dialog "Confirmar e salvar" ────────────────────────────────────────────────

describe('ConfigSectionForm — dialog: "Confirmar e salvar"', () => {
  it('onPersist é chamado UMA vez com os dados corretos ao confirmar', async () => {
    const user = userEvent.setup()
    const onPersist = vi.fn().mockResolvedValue(undefined)
    render(<TestForm onPersist={onPersist} />)

    await user.type(screen.getByLabelText('Nome'), 'Fulano')
    await user.click(screen.getByRole('button', { name: /salvar alterações/i }))

    await waitFor(() => screen.getByRole('alertdialog'))

    const dialog = screen.getByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: /confirmar e salvar/i }))

    await waitFor(() => {
      expect(onPersist).toHaveBeenCalledTimes(1)
      expect(onPersist).toHaveBeenCalledWith({ nome: 'Fulano' })
    })
  })

  it('dialog fecha após confirmação com sucesso', async () => {
    const user = userEvent.setup()
    const onPersist = vi.fn().mockResolvedValue(undefined)
    render(<TestForm onPersist={onPersist} />)

    await user.type(screen.getByLabelText('Nome'), 'Fulano')
    await user.click(screen.getByRole('button', { name: /salvar alterações/i }))

    await waitFor(() => screen.getByRole('alertdialog'))

    const dialog = screen.getByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: /confirmar e salvar/i }))

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).toBeNull()
    })
  })

  it('barra de alterações some após confirmação com sucesso (form.reset chamado)', async () => {
    const user = userEvent.setup()
    const onPersist = vi.fn().mockResolvedValue(undefined)
    render(<TestForm onPersist={onPersist} />)

    await user.type(screen.getByLabelText('Nome'), 'Fulano')
    await user.click(screen.getByRole('button', { name: /salvar alterações/i }))

    await waitFor(() => screen.getByRole('alertdialog'))

    const dialog = screen.getByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: /confirmar e salvar/i }))

    await waitFor(() => {
      expect(screen.queryByText(/você tem alterações não salvas/i)).toBeNull()
    })
  })
})

// ── Dialog "Cancelar" ──────────────────────────────────────────────────────────

describe('ConfigSectionForm — dialog: "Cancelar"', () => {
  it('onPersist NÃO é chamado ao cancelar', async () => {
    const user = userEvent.setup()
    const onPersist = vi.fn()
    render(<TestForm onPersist={onPersist} />)

    await user.type(screen.getByLabelText('Nome'), 'Fulano')
    await user.click(screen.getByRole('button', { name: /salvar alterações/i }))

    await waitFor(() => screen.getByRole('alertdialog'))

    const dialog = screen.getByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: /cancelar/i }))

    expect(onPersist).not.toHaveBeenCalled()
  })

  it('dialog fecha ao clicar em "Cancelar"', async () => {
    const user = userEvent.setup()
    render(<TestForm onPersist={vi.fn()} />)

    await user.type(screen.getByLabelText('Nome'), 'Fulano')
    await user.click(screen.getByRole('button', { name: /salvar alterações/i }))

    await waitFor(() => screen.getByRole('alertdialog'))

    const dialog = screen.getByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: /cancelar/i }))

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).toBeNull()
    })
  })

  it('barra "Você tem alterações não salvas" permanece após cancelar (form não foi resetado)', async () => {
    const user = userEvent.setup()
    render(<TestForm onPersist={vi.fn()} />)

    await user.type(screen.getByLabelText('Nome'), 'Fulano')
    await user.click(screen.getByRole('button', { name: /salvar alterações/i }))

    await waitFor(() => screen.getByRole('alertdialog'))

    const dialog = screen.getByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: /cancelar/i }))

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).toBeNull()
    })

    // Campo ainda tem valor digitado, form continua dirty
    expect(screen.getByText(/você tem alterações não salvas/i)).toBeDefined()
  })
})

// ── Barra "Você tem alterações não salvas" ─────────────────────────────────────

describe('ConfigSectionForm — barra de alterações não salvas', () => {
  it('aparece quando o campo é preenchido (isDirty=true)', async () => {
    const user = userEvent.setup()
    render(<TestForm onPersist={vi.fn()} />)

    await user.type(screen.getByLabelText('Nome'), 'x')

    expect(screen.getByText(/você tem alterações não salvas/i)).toBeDefined()
  })

  it('botão "Descartar" reseta o form — campo volta a vazio e barra some', async () => {
    const user = userEvent.setup()
    render(<TestForm onPersist={vi.fn()} />)

    const input = screen.getByLabelText('Nome')
    await user.type(input, 'algum valor')

    // Barra apareceu
    expect(screen.getByText(/você tem alterações não salvas/i)).toBeDefined()

    await user.click(screen.getByRole('button', { name: /descartar/i }))

    // Barra some e campo volta ao valor default (vazio)
    await waitFor(() => {
      expect(screen.queryByText(/você tem alterações não salvas/i)).toBeNull()
    })
    expect((input as HTMLInputElement).value).toBe('')
  })
})
