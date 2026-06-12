import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import {
  DateCell,
  MoneyCell,
  MutedCell,
  PrimaryCell,
  RowActionsMenu,
} from '@/components/ui/data-table-cells'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'

describe('PrimaryCell', () => {
  it('renderiza título e subtítulo', () => {
    render(<PrimaryCell title="Maria Silva" subtitle="123.456.789-00" />)
    expect(screen.getByText('Maria Silva')).toBeInTheDocument()
    expect(screen.getByText('123.456.789-00')).toBeInTheDocument()
  })

  it('renderiza só o título quando não há subtítulo', () => {
    render(<PrimaryCell title="Maria Silva" />)
    expect(screen.getByText('Maria Silva')).toBeInTheDocument()
  })
})

describe('MoneyCell', () => {
  it('formata o valor em BRL com elemento tabular', () => {
    const { container } = render(<MoneyCell value={1234.5} />)
    const value = screen.getByText(/R\$\s?1\.234,50/)
    expect(value).toBeInTheDocument()
    expect(container.querySelector('.tabular-nums')).not.toBeNull()
  })

  it('renderiza a legenda quando informada', () => {
    render(<MoneyCell value={500} caption="Mensal" />)
    expect(screen.getByText('Mensal')).toBeInTheDocument()
  })
})

describe('DateCell', () => {
  it('formata a data em dd/MM/yyyy', () => {
    render(<DateCell date="2026-03-14" />)
    expect(screen.getByText('14/03/2026')).toBeInTheDocument()
  })

  it('aplica text-destructive na legenda quando tone=danger', () => {
    render(<DateCell date="2026-03-14" tone="danger" caption="há 3 dias" />)
    const caption = screen.getByText('há 3 dias')
    expect(caption.className).toContain('text-destructive')
  })

  it('legenda padrão é muted (sem text-destructive)', () => {
    render(<DateCell date="2026-03-14" caption="em 3 dias" />)
    const caption = screen.getByText('em 3 dias')
    expect(caption.className).not.toContain('text-destructive')
    expect(caption.className).toContain('text-muted-foreground')
  })
})

describe('MutedCell', () => {
  it('renderiza — quando não há children', () => {
    render(<MutedCell />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('renderiza — quando children é string vazia', () => {
    render(<MutedCell>{''}</MutedCell>)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('renderiza os children quando presentes', () => {
    render(<MutedCell>CRECI 12345</MutedCell>)
    expect(screen.getByText('CRECI 12345')).toBeInTheDocument()
  })

  it('deixa o valor 0 passar (não vira —)', () => {
    render(<MutedCell>{0}</MutedCell>)
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.queryByText('—')).toBeNull()
  })
})

describe('RowActionsMenu', () => {
  it('renderiza o trigger de ações', () => {
    render(
      <RowActionsMenu>
        <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
      </RowActionsMenu>
    )
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('abre o menu mostrando o label "Ações" e os itens', async () => {
    const user = userEvent.setup()
    render(
      <RowActionsMenu>
        <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
        <DropdownMenuItem>Editar</DropdownMenuItem>
      </RowActionsMenu>
    )
    await user.click(screen.getByRole('button', { name: 'Ações' }))
    // Há dois "Ações": o aria-label do trigger e o DropdownMenuLabel no conteúdo.
    expect(await screen.findByText('Ver detalhes')).toBeInTheDocument()
    expect(screen.getByText('Editar')).toBeInTheDocument()
    expect(screen.getAllByText('Ações').length).toBeGreaterThan(0)
  })

  it('não dispara o onClick da linha ancestral ao clicar no trigger', async () => {
    const user = userEvent.setup()
    const onRowClick = vi.fn()
    render(
      // biome-ignore lint/a11y/useKeyWithClickEvents: linha de tabela simulada no teste
      <div onClick={onRowClick}>
        <RowActionsMenu>
          <DropdownMenuItem>Editar</DropdownMenuItem>
        </RowActionsMenu>
      </div>
    )
    await user.click(screen.getByRole('button', { name: 'Ações' }))
    expect(onRowClick).not.toHaveBeenCalled()
  })
})
