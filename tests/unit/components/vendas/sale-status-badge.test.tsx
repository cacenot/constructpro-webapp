import { SaleStatus, translateSaleStatus } from '@cacenot/construct-pro-api-client'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SaleStatusBadge } from '@/components/vendas/sale-status-badge'

type SaleStatusValue = (typeof SaleStatus)[keyof typeof SaleStatus]

describe('SaleStatusBadge', () => {
  const allStatuses = Object.values(SaleStatus) as SaleStatusValue[]

  it.each(allStatuses)('renderiza badge para status "%s" com texto em PT-BR', (status) => {
    render(<SaleStatusBadge status={status} />)
    const expected = translateSaleStatus(status, 'pt-BR')
    expect(screen.getByText(expected)).toBeDefined()
  })

  it('exibe "Proposta" para status proposal', () => {
    render(<SaleStatusBadge status="proposal" />)
    expect(screen.getByText('Proposta')).toBeDefined()
  })

  it('exibe "Aguardando Assinatura" para status pending_signature', () => {
    render(<SaleStatusBadge status="pending_signature" />)
    expect(screen.getByText('Aguardando Assinatura')).toBeDefined()
  })

  it('exibe "Aguardando Pagamento" para status pending_payment', () => {
    render(<SaleStatusBadge status="pending_payment" />)
    expect(screen.getByText('Aguardando Pagamento')).toBeDefined()
  })

  it('exibe "Fechado" para status closed', () => {
    render(<SaleStatusBadge status="closed" />)
    expect(screen.getByText('Fechado')).toBeDefined()
  })

  it('exibe "Perdido" para status lost', () => {
    render(<SaleStatusBadge status="lost" />)
    expect(screen.getByText('Perdido')).toBeDefined()
  })
})
