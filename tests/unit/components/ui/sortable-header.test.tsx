import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SortableHeader } from '@/components/ui/sortable-header'

describe('SortableHeader', () => {
  it('renderiza o label', () => {
    render(<SortableHeader label="Valor" field="amount" onSort={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Valor/ })).toBeInTheDocument()
  })

  it('emite asc quando inativo', () => {
    const onSort = vi.fn()
    render(<SortableHeader label="Valor" field="amount" onSort={onSort} />)
    fireEvent.click(screen.getByRole('button', { name: /Valor/ }))
    expect(onSort).toHaveBeenCalledWith('amount:asc')
  })

  it('alterna para desc quando já está asc no mesmo campo', () => {
    const onSort = vi.fn()
    render(<SortableHeader label="Valor" field="amount" currentSort="amount:asc" onSort={onSort} />)
    fireEvent.click(screen.getByRole('button', { name: /Valor/ }))
    expect(onSort).toHaveBeenCalledWith('amount:desc')
  })

  it('volta para asc quando está desc', () => {
    const onSort = vi.fn()
    render(<SortableHeader label="Valor" field="amount" currentSort="amount:desc" onSort={onSort} />)
    fireEvent.click(screen.getByRole('button', { name: /Valor/ }))
    expect(onSort).toHaveBeenCalledWith('amount:asc')
  })
})
