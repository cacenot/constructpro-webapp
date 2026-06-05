import { UnitStatus, translateUnitStatus } from '@cacenot/construct-pro-api-client'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { UnitStatusBadge } from '@/components/unidades/unit-status-badge'

type UnitStatusValue = (typeof UnitStatus)[keyof typeof UnitStatus]

describe('UnitStatusBadge', () => {
  const allStatuses = Object.values(UnitStatus) as UnitStatusValue[]

  it.each(allStatuses)('renderiza texto traduzido para status "%s"', (status) => {
    render(<UnitStatusBadge status={status} />)
    expect(screen.getByText(translateUnitStatus(status, 'pt-BR'))).toBeDefined()
  })

  it('exibe "Disponível" para available', () => {
    render(<UnitStatusBadge status="available" />)
    expect(screen.getByText('Disponível')).toBeDefined()
  })

  it('exibe "Reservado" para reserved', () => {
    render(<UnitStatusBadge status="reserved" />)
    expect(screen.getByText('Reservado')).toBeDefined()
  })

  it('exibe "Vendido" para sold', () => {
    render(<UnitStatusBadge status="sold" />)
    expect(screen.getByText('Vendido')).toBeDefined()
  })

  it('exibe "Indisponível" para unavailable', () => {
    render(<UnitStatusBadge status="unavailable" />)
    expect(screen.getByText('Indisponível')).toBeDefined()
  })

  it('aplica token CSS unit-available para available', () => {
    const { container } = render(<UnitStatusBadge status="available" />)
    const badge = container.firstChild as HTMLElement
    expect(badge.className).toContain('bg-unit-available')
    expect(badge.className).toContain('text-unit-available-fg')
  })

  it('aplica token CSS unit-reserved para reserved', () => {
    const { container } = render(<UnitStatusBadge status="reserved" />)
    const badge = container.firstChild as HTMLElement
    expect(badge.className).toContain('bg-unit-reserved')
    expect(badge.className).toContain('text-unit-reserved-fg')
  })

  it('aplica token CSS unit-sold para sold', () => {
    const { container } = render(<UnitStatusBadge status="sold" />)
    const badge = container.firstChild as HTMLElement
    expect(badge.className).toContain('bg-unit-sold')
    expect(badge.className).toContain('text-unit-sold-fg')
  })

  it('aplica token CSS unit-unavailable para unavailable', () => {
    const { container } = render(<UnitStatusBadge status="unavailable" />)
    const badge = container.firstChild as HTMLElement
    expect(badge.className).toContain('bg-unit-unavailable')
    expect(badge.className).toContain('text-unit-unavailable-fg')
  })
})
