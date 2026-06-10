import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SegmentedControl } from '@/components/configuracoes/segmented-control'

const OPTIONS = [
  { value: 'a', label: 'Opção A' },
  { value: 'b', label: 'Opção B' },
  { value: 'c', label: 'Opção C' },
]

/** Acesso type-safe a um radio por posição (evita o `T | undefined` da indexação). */
function radioAt(index: number): HTMLElement {
  const el = screen.getAllByRole('radio')[index]
  if (!el) throw new Error(`radio no índice ${index} não encontrado`)
  return el
}

describe('SegmentedControl', () => {
  // ── Estrutura / renderização ──────────────────────────────────────────────

  it('container tem role="radiogroup"', () => {
    render(<SegmentedControl options={OPTIONS} value="a" onChange={vi.fn()} />)
    expect(screen.getByRole('radiogroup')).toBeDefined()
  })

  it('aria-label passado via prop é aplicado no container', () => {
    render(
      <SegmentedControl
        options={OPTIONS}
        value="a"
        onChange={vi.fn()}
        aria-label="Modo de visualização"
      />,
    )
    expect(screen.getByRole('radiogroup', { name: 'Modo de visualização' })).toBeDefined()
  })

  it('renderiza exatamente N botões com role="radio"', () => {
    render(<SegmentedControl options={OPTIONS} value="a" onChange={vi.fn()} />)
    expect(screen.getAllByRole('radio')).toHaveLength(OPTIONS.length)
  })

  it('opção com value === value tem aria-checked="true"', () => {
    render(<SegmentedControl options={OPTIONS} value="b" onChange={vi.fn()} />)
    expect(radioAt(1).getAttribute('aria-checked')).toBe('true')
  })

  it('outras opções têm aria-checked="false"', () => {
    render(<SegmentedControl options={OPTIONS} value="b" onChange={vi.fn()} />)
    expect(radioAt(0).getAttribute('aria-checked')).toBe('false')
    expect(radioAt(2).getAttribute('aria-checked')).toBe('false')
  })

  it('opção ativa tem tabIndex=0, inativas têm tabIndex=-1', () => {
    render(<SegmentedControl options={OPTIONS} value="b" onChange={vi.fn()} />)
    expect(radioAt(0).getAttribute('tabindex')).toBe('-1')
    expect(radioAt(1).getAttribute('tabindex')).toBe('0')
    expect(radioAt(2).getAttribute('tabindex')).toBe('-1')
  })

  it('sem seleção válida: primeiro item tem tabIndex=0', () => {
    render(<SegmentedControl options={OPTIONS} value="nenhum" onChange={vi.fn()} />)
    expect(radioAt(0).getAttribute('tabindex')).toBe('0')
    expect(radioAt(1).getAttribute('tabindex')).toBe('-1')
    expect(radioAt(2).getAttribute('tabindex')).toBe('-1')
  })

  // ── Click ─────────────────────────────────────────────────────────────────

  it('click em opção inativa chama onChange com o value correto', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SegmentedControl options={OPTIONS} value="a" onChange={onChange} />)
    await user.click(radioAt(1))
    expect(onChange).toHaveBeenCalledWith('b')
  })

  it('click em opção inativa de value numérico chama onChange com número', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const numericOptions = [
      { value: 1, label: 'Um' },
      { value: 2, label: 'Dois' },
    ]
    render(<SegmentedControl options={numericOptions} value={1} onChange={onChange} />)
    await user.click(radioAt(1))
    expect(onChange).toHaveBeenCalledWith(2)
  })

  // ── Teclado ───────────────────────────────────────────────────────────────

  it('ArrowRight no índice 0 → chama onChange com value do índice 1', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SegmentedControl options={OPTIONS} value="a" onChange={onChange} />)
    radioAt(0).focus()
    await user.keyboard('{ArrowRight}')
    expect(onChange).toHaveBeenCalledWith('b')
  })

  it('ArrowRight no último índice → wraparound para o primeiro (chama onChange com "a")', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SegmentedControl options={OPTIONS} value="c" onChange={onChange} />)
    radioAt(2).focus()
    await user.keyboard('{ArrowRight}')
    expect(onChange).toHaveBeenCalledWith('a')
  })

  it('ArrowLeft no índice 1 → chama onChange com value do índice 0', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SegmentedControl options={OPTIONS} value="b" onChange={onChange} />)
    radioAt(1).focus()
    await user.keyboard('{ArrowLeft}')
    expect(onChange).toHaveBeenCalledWith('a')
  })

  it('ArrowLeft no primeiro índice → wraparound para o último (chama onChange com "c")', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SegmentedControl options={OPTIONS} value="a" onChange={onChange} />)
    radioAt(0).focus()
    await user.keyboard('{ArrowLeft}')
    expect(onChange).toHaveBeenCalledWith('c')
  })

  it('Home a partir de qualquer posição → chama onChange com value do índice 0', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SegmentedControl options={OPTIONS} value="c" onChange={onChange} />)
    radioAt(2).focus()
    await user.keyboard('{Home}')
    expect(onChange).toHaveBeenCalledWith('a')
  })

  it('End a partir de qualquer posição → chama onChange com value do último índice', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SegmentedControl options={OPTIONS} value="a" onChange={onChange} />)
    radioAt(0).focus()
    await user.keyboard('{End}')
    expect(onChange).toHaveBeenCalledWith('c')
  })

  it('ArrowDown se comporta igual a ArrowRight', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SegmentedControl options={OPTIONS} value="a" onChange={onChange} />)
    radioAt(0).focus()
    await user.keyboard('{ArrowDown}')
    expect(onChange).toHaveBeenCalledWith('b')
  })

  it('ArrowUp se comporta igual a ArrowLeft', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SegmentedControl options={OPTIONS} value="b" onChange={onChange} />)
    radioAt(1).focus()
    await user.keyboard('{ArrowUp}')
    expect(onChange).toHaveBeenCalledWith('a')
  })

  // ── Tamanho (size) ──────────────────────────────────────────────────────────

  it('size="sm" aplica a tipografia compacta (text-xs)', () => {
    render(<SegmentedControl options={OPTIONS} value="a" onChange={vi.fn()} size="sm" />)
    expect(radioAt(0).className).toContain('text-xs')
    expect(radioAt(0).className).not.toContain('text-sm')
  })

  it('size padrão usa a tipografia default (text-sm)', () => {
    render(<SegmentedControl options={OPTIONS} value="a" onChange={vi.fn()} />)
    expect(radioAt(0).className).toContain('text-sm')
    expect(radioAt(0).className).not.toContain('text-xs')
  })
})
