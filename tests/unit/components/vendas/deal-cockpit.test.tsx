import type { components } from '@cacenot/construct-pro-api-client'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DealCockpit } from '@/components/vendas/deal-cockpit'
import type { ContractDetailResponse } from '@/hooks/use-contract-detail'

type Sale = components['schemas']['SaleResponse']

function makeSale(overrides: Partial<Sale> = {}): Sale {
  return {
    id: 1,
    status: 'proposal',
    amount: { cents: 50000000 },
    unit_price: { cents: 55000000 },
    metrics: {
      entry_amount: { cents: 10000000 },
      entry_percentage: '20',
      financed_amount: { cents: 40000000 },
    },
    installment_summary: { total_count: 36 },
    unit: { name: 'Apt 101', project: { name: 'Ed. Aurora' } },
    customer: { full_name: 'Maria Silva', cpf_cnpj: '12345678901' },
    user: { display_name: 'João Vendedor' },
    ...overrides,
  } as unknown as Sale
}

const actions = <div data-testid="actions">ações</div>

describe('DealCockpit', () => {
  it('estágio proposta: headline "Valor da proposta" + identidade e ações', () => {
    render(<DealCockpit sale={makeSale()} actions={actions} />)
    expect(screen.getByText('Valor da proposta')).toBeInTheDocument()
    expect(screen.getByText('Maria Silva')).toBeInTheDocument()
    expect(screen.getByTestId('actions')).toBeInTheDocument()
  })

  it('venda fechada com saúde financeira: headline troca para "Saldo devedor"', () => {
    const contractDetail = {
      status: 'active',
      financial_summary: {
        outstanding_balance: { cents: 30000000 },
        total_paid: { cents: 20000000 },
        payment_progress_percentage: '40',
      },
      installment_summary: {
        paid_count: 4,
        total_count: 36,
        overdue_count: 0,
        next_due_date: '2026-07-10T12:00:00',
        next_due_amount: { cents: 500000 },
      },
    } as unknown as ContractDetailResponse
    render(
      <DealCockpit
        sale={makeSale({ status: 'closed' })}
        contractDetail={contractDetail}
        actions={actions}
      />
    )
    expect(screen.getByText('Saldo devedor')).toBeInTheDocument()
    expect(screen.queryByText('Valor da proposta')).toBeNull()
  })

  // Fix #2 — falha na saúde financeira não pode regredir para os vitais da proposta.
  it('venda fechada com erro: mostra placeholder, não "Valor da proposta" nem "Saldo devedor"', () => {
    render(<DealCockpit sale={makeSale({ status: 'closed' })} isContractError actions={actions} />)
    expect(screen.getByText('Dados ao vivo indisponíveis no momento.')).toBeInTheDocument()
    expect(screen.queryByText('Valor da proposta')).toBeNull()
    expect(screen.queryByText('Saldo devedor')).toBeNull()
  })
})
