import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ColumnDef } from '@tanstack/react-table'
import { describe, expect, it, vi } from 'vitest'
import { DataTable } from '@/components/ui/data-table'

interface Row {
  id: number
  name: string
}

const columns: ColumnDef<Row>[] = [
  {
    id: 'name',
    header: 'Nome',
    cell: ({ row }) => <span>{row.original.name}</span>,
  },
]

const rows: Row[] = [
  { id: 1, name: 'Alpha' },
  { id: 2, name: 'Beta' },
]

describe('DataTable — linha clicável', () => {
  it('dispara onRowClick ao clicar na linha', async () => {
    const onRowClick = vi.fn()
    render(<DataTable columns={columns} data={rows} onRowClick={onRowClick} />)
    await userEvent.click(screen.getByText('Alpha'))
    expect(onRowClick).toHaveBeenCalledWith(rows[0])
  })

  it('dispara onRowClick ao pressionar Enter na linha (tabIndex=0)', async () => {
    const onRowClick = vi.fn()
    render(<DataTable columns={columns} data={rows} onRowClick={onRowClick} />)
    const cell = screen.getByText('Alpha')
    const tr = cell.closest('tr') as HTMLElement
    tr.focus()
    await userEvent.keyboard('{Enter}')
    expect(onRowClick).toHaveBeenCalledWith(rows[0])
  })

  it('dispara onRowClick ao pressionar Space na linha', async () => {
    const onRowClick = vi.fn()
    render(<DataTable columns={columns} data={rows} onRowClick={onRowClick} />)
    const cell = screen.getByText('Alpha')
    const tr = cell.closest('tr') as HTMLElement
    tr.focus()
    await userEvent.keyboard(' ')
    expect(onRowClick).toHaveBeenCalledWith(rows[0])
  })

  it('linha tem tabIndex=0 quando onRowClick está definido', () => {
    render(<DataTable columns={columns} data={rows} onRowClick={vi.fn()} />)
    const tr = screen.getByText('Alpha').closest('tr') as HTMLElement
    expect(tr.getAttribute('tabIndex')).toBe('0')
  })

  it('linha não tem tabIndex quando onRowClick não está definido', () => {
    render(<DataTable columns={columns} data={rows} />)
    const tr = screen.getByText('Alpha').closest('tr') as HTMLElement
    expect(tr.getAttribute('tabIndex')).toBeNull()
  })

  it('não dispara onRowClick em outras teclas (ex.: Tab)', async () => {
    const onRowClick = vi.fn()
    render(<DataTable columns={columns} data={rows} onRowClick={onRowClick} />)
    const cell = screen.getByText('Alpha')
    const tr = cell.closest('tr') as HTMLElement
    tr.focus()
    await userEvent.keyboard('{Tab}')
    expect(onRowClick).not.toHaveBeenCalled()
  })
})

const skeletonColumns: ColumnDef<Row>[] = [
  {
    id: 'name',
    header: 'Nome',
    cell: ({ row }) => <span>{row.original.name}</span>,
    meta: { skeleton: { lines: 2 } },
  },
  {
    id: 'status',
    header: 'Status',
    cell: () => <span>badge</span>,
    meta: { skeleton: { variant: 'badge' } },
  },
  {
    id: 'hidden_col',
    header: 'Oculta',
    cell: () => <span>x</span>,
    meta: { className: 'hidden md:table-cell', headClassName: 'hidden md:table-cell' },
  },
  {
    id: 'actions',
    header: '',
    cell: () => <span>...</span>,
    meta: { align: 'right', skeleton: { variant: 'actions' } },
  },
]

describe('DataTable — skeleton de carregamento', () => {
  it('mostra exatamente skeletonRows linhas quando isLoading e sem dados', () => {
    const { container } = render(
      <DataTable columns={skeletonColumns} data={[]} isLoading skeletonRows={5} />
    )
    expect(container.querySelectorAll('tbody tr')).toHaveLength(5)
  })

  it('não mostra skeleton quando há dados, mesmo com isLoading', () => {
    const { container } = render(<DataTable columns={skeletonColumns} data={rows} isLoading />)
    // 2 linhas de dados, nenhuma de skeleton
    expect(container.querySelectorAll('tbody tr')).toHaveLength(2)
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(0)
  })

  it('anexa loadingMoreRows skeleton rows fiéis após as linhas reais', () => {
    const { container } = render(
      <DataTable columns={skeletonColumns} data={rows} loadingMoreRows={3} />
    )
    // 2 linhas de dados + 3 de "carregando mais"
    expect(container.querySelectorAll('tbody tr')).toHaveLength(5)
    const allRows = container.querySelectorAll('tbody tr')
    const lastRow = allRows[allRows.length - 1]
    // a row extra tem o shape de skeleton (âncora com 2 barras na 1ª coluna)
    expect(lastRow.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
  })

  it('não anexa loading rows quando loadingMoreRows é 0', () => {
    const { container } = render(
      <DataTable columns={skeletonColumns} data={rows} loadingMoreRows={0} />
    )
    expect(container.querySelectorAll('tbody tr')).toHaveLength(2)
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(0)
  })

  it('respeita o shape de cada coluna: âncora 2 barras, badge 1, ações 1', () => {
    const { container } = render(
      <DataTable columns={skeletonColumns} data={[]} isLoading skeletonRows={1} />
    )
    const cells = container.querySelectorAll('tbody tr td')
    // 4 colunas declaradas
    expect(cells).toHaveLength(4)
    // coluna 'name' (lines: 2) → 2 barras de skeleton
    expect(cells[0].querySelectorAll('[data-slot="skeleton"]')).toHaveLength(2)
    // coluna 'status' (badge) → 1 pill
    const badge = cells[1].querySelector('[data-slot="skeleton"]')
    expect(badge).not.toBeNull()
    expect(badge?.className).toContain('rounded-full')
    // coluna 'hidden_col' (default, 1 linha) → 1 barra, e mantém a classe de breakpoint
    expect(cells[2].querySelectorAll('[data-slot="skeleton"]')).toHaveLength(1)
    expect(cells[2].className).toContain('hidden md:table-cell')
    // coluna 'actions' → 1 box quadrado
    const box = cells[3].querySelector('[data-slot="skeleton"]')
    expect(box?.className).toContain('size-8')
  })
})

describe('DataTable — seleção (data-state)', () => {
  it('aplica data-state=selected quando isRowSelected retorna true', () => {
    render(
      <DataTable
        columns={columns}
        data={rows}
        isRowSelected={(row) => row.id === 1}
        onRowClick={vi.fn()}
      />
    )
    const tr = screen.getByText('Alpha').closest('tr') as HTMLElement
    expect(tr.dataset.state).toBe('selected')
  })

  it('não aplica data-state quando isRowSelected retorna false', () => {
    render(
      <DataTable
        columns={columns}
        data={rows}
        isRowSelected={(row) => row.id === 999}
        onRowClick={vi.fn()}
      />
    )
    const tr = screen.getByText('Alpha').closest('tr') as HTMLElement
    expect(tr.dataset.state).toBeUndefined()
  })

  it('não aplica data-state sem isRowSelected', () => {
    render(<DataTable columns={columns} data={rows} onRowClick={vi.fn()} />)
    const tr = screen.getByText('Alpha').closest('tr') as HTMLElement
    expect(tr.dataset.state).toBeUndefined()
  })
})
