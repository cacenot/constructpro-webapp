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
