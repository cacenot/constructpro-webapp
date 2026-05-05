import { InstallmentStatus, translateInstallmentStatus } from '@cacenot/construct-pro-api-client'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { InstallmentStatusBadge } from '@/components/financeiro/installment-status-badge'

type InstallmentStatusValue = (typeof InstallmentStatus)[keyof typeof InstallmentStatus]

describe('InstallmentStatusBadge', () => {
  const allStatuses = Object.values(InstallmentStatus) as InstallmentStatusValue[]

  it.each(allStatuses)('renderiza badge para status "%s" com texto em PT-BR', (status) => {
    render(<InstallmentStatusBadge status={status} />)
    const expected = translateInstallmentStatus(status, 'pt-BR')
    expect(screen.getByText(expected)).toBeDefined()
  })

  it('exibe "Pendente" para status scheduled', () => {
    render(<InstallmentStatusBadge status="scheduled" />)
    expect(screen.getByText('Pendente')).toBeDefined()
  })

  it('exibe "Faturado" para status invoiced', () => {
    render(<InstallmentStatusBadge status="invoiced" />)
    expect(screen.getByText('Faturado')).toBeDefined()
  })

  it('exibe "Pagamento Parcial" para status partial', () => {
    render(<InstallmentStatusBadge status="partial" />)
    expect(screen.getByText('Pagamento Parcial')).toBeDefined()
  })

  it('exibe "Pago" para status paid', () => {
    render(<InstallmentStatusBadge status="paid" />)
    expect(screen.getByText('Pago')).toBeDefined()
  })

  it('exibe "Cancelado" para status canceled', () => {
    render(<InstallmentStatusBadge status="canceled" />)
    expect(screen.getByText('Cancelado')).toBeDefined()
  })

  it('exibe "Vencido" para status overdue', () => {
    render(<InstallmentStatusBadge status="overdue" />)
    expect(screen.getByText('Vencido')).toBeDefined()
  })
})
