import { type components, SaleStatus } from '@cacenot/construct-pro-api-client'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DealActions } from '@/components/vendas/deal-actions'
import type { ContractDetailResponse } from '@/hooks/use-contract-detail'

vi.mock('vike/client/router', () => ({ navigate: vi.fn() }))

type Sale = components['schemas']['SaleResponse']
type Contract = NonNullable<Sale['contract']>

function makeSale(status: Sale['status'], contract: Partial<Contract> | null = null): Sale {
  return {
    id: 1,
    status,
    contract: contract === null ? undefined : ({ id: 10, status: 'pending', ...contract } as Contract),
  } as unknown as Sale
}

const handlers = { onApprove: () => {}, onSign: () => {}, onPayEntry: () => {} }

describe('DealActions', () => {
  it('proposta: oferece aprovar (primária) e editar (secundária)', () => {
    render(<DealActions sale={makeSale(SaleStatus.proposal)} {...handlers} />)
    expect(screen.getByRole('button', { name: /Aprovar proposta/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Editar proposta/ })).toBeInTheDocument()
  })

  it('dispara onApprove ao clicar na ação primária', () => {
    const onApprove = vi.fn()
    render(<DealActions sale={makeSale(SaleStatus.proposal)} {...handlers} onApprove={onApprove} />)
    fireEvent.click(screen.getByRole('button', { name: /Aprovar proposta/ }))
    expect(onApprove).toHaveBeenCalledTimes(1)
  })

  it('aguardando assinatura COM contrato: mostra "Assinar contrato"', () => {
    render(<DealActions sale={makeSale(SaleStatus.pending_signature, { id: 10 })} {...handlers} />)
    expect(screen.getByRole('button', { name: /Assinar contrato/ })).toBeInTheDocument()
  })

  // Fix #3 — sem contrato materializado, não há botões; um texto explica o porquê.
  it('aguardando assinatura SEM contrato: empty state de contrato indisponível', () => {
    render(<DealActions sale={makeSale(SaleStatus.pending_signature, null)} {...handlers} />)
    expect(screen.getByText(/Contrato ainda não disponível/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Assinar contrato/ })).toBeNull()
  })

  it('aguardando pagamento SEM contrato: empty state de contrato indisponível', () => {
    render(<DealActions sale={makeSale(SaleStatus.pending_payment, null)} {...handlers} />)
    expect(screen.getByText(/Contrato ainda não disponível/)).toBeInTheDocument()
  })

  it('estágio terminal (perdido): empty state genérico, sem nenhum botão', () => {
    render(<DealActions sale={makeSale(SaleStatus.lost)} {...handlers} />)
    expect(screen.getByText('Nenhuma ação disponível neste estágio.')).toBeInTheDocument()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('contrato em atraso: oferece Renegociar desabilitado ("Em breve")', () => {
    const sale = makeSale(SaleStatus.closed, { id: 10, status: 'in_default' })
    const contractDetail = { status: 'in_default' } as unknown as ContractDetailResponse
    render(<DealActions sale={sale} contractDetail={contractDetail} {...handlers} />)
    expect(screen.getByRole('button', { name: /Renegociar/ })).toBeDisabled()
  })
})
