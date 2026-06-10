import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DatePicker } from '@/components/ui/date-picker'

describe('DatePicker — exibição do gatilho', () => {
  it('mostra a data formatada (pt-BR) quando há value', () => {
    render(<DatePicker value="2026-03-15" onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /15\/03\/2026/ })).toBeDefined()
  })

  it('mostra o placeholder quando não há value', () => {
    render(<DatePicker value={null} onChange={vi.fn()} placeholder="Escolha a data" />)
    expect(screen.getByRole('button', { name: /Escolha a data/ })).toBeDefined()
  })
})

describe('DatePicker — monthYearNav', () => {
  it('com monthYearNav, o calendário expõe dropdowns de mês/ano (comboboxes)', async () => {
    const user = userEvent.setup()
    render(<DatePicker value="2026-03-15" onChange={vi.fn()} monthYearNav />)
    await user.click(screen.getByRole('button', { name: /15\/03\/2026/ }))
    // captionLayout="dropdown" → selects de mês e ano.
    expect(screen.getAllByRole('combobox').length).toBeGreaterThanOrEqual(2)
  })

  it('sem monthYearNav, o calendário não usa dropdowns de mês/ano', async () => {
    const user = userEvent.setup()
    render(<DatePicker value="2026-03-15" onChange={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /15\/03\/2026/ }))
    expect(screen.queryByRole('combobox')).toBeNull()
  })
})
