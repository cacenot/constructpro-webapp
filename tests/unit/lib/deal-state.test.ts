import { type components, SaleStatus } from '@cacenot/construct-pro-api-client'
import { describe, expect, it } from 'vitest'
import { getDealStage, getLiveContractId, getPrimaryAction } from '@/lib/deal-state'

type Sale = components['schemas']['SaleResponse']

// As três funções só leem `status` e `contract`; o resto do Sale é irrelevante.
function makeSale(status: Sale['status'], contract: { id?: number } | null = null): Sale {
  return { id: 1, status, contract: contract ?? undefined } as unknown as Sale
}

describe('getDealStage', () => {
  it.each([
    [SaleStatus.proposal, 'proposal'],
    [SaleStatus.pending_signature, 'awaiting_close'],
    [SaleStatus.pending_payment, 'awaiting_close'],
    [SaleStatus.closed, 'closed'],
    [SaleStatus.lost, 'lost'],
  ] as const)('mapeia o status "%s" para o estágio "%s"', (status, stage) => {
    expect(getDealStage(makeSale(status))).toBe(stage)
  })

  it('cai em "proposal" para um status desconhecido', () => {
    expect(getDealStage(makeSale('???' as Sale['status']))).toBe('proposal')
  })
})

describe('getLiveContractId', () => {
  it('retorna o id do contrato quando a venda está fechada', () => {
    expect(getLiveContractId(makeSale(SaleStatus.closed, { id: 42 }))).toBe(42)
  })

  it('retorna undefined quando fechada mas sem contrato', () => {
    expect(getLiveContractId(makeSale(SaleStatus.closed, null))).toBeUndefined()
  })

  it.each([
    SaleStatus.proposal,
    SaleStatus.pending_signature,
    SaleStatus.pending_payment,
    SaleStatus.lost,
  ] as const)('não busca contrato fora do estágio fechado (status "%s")', (status) => {
    // Mesmo havendo contrato, só faz sentido buscar a saúde financeira em vendas fechadas.
    expect(getLiveContractId(makeSale(status, { id: 42 }))).toBeUndefined()
  })
})

describe('getPrimaryAction', () => {
  it('proposta → aprovar (tecla "a")', () => {
    expect(getPrimaryAction(makeSale(SaleStatus.proposal))).toEqual({
      kind: 'approve',
      label: 'Aprovar proposta',
      key: 'a',
    })
  })

  it('aguardando assinatura COM contrato → assinar (tecla "s")', () => {
    expect(getPrimaryAction(makeSale(SaleStatus.pending_signature, { id: 1 }))).toEqual({
      kind: 'sign',
      label: 'Assinar contrato',
      key: 's',
    })
  })

  it('aguardando pagamento COM contrato → receber entrada (tecla "e")', () => {
    expect(getPrimaryAction(makeSale(SaleStatus.pending_payment, { id: 1 }))).toEqual({
      kind: 'payEntry',
      label: 'Receber sinal/entrada',
      key: 'e',
    })
  })

  it.each([SaleStatus.pending_signature, SaleStatus.pending_payment] as const)(
    'sem contrato não há ação primária (status "%s")',
    (status) => {
      expect(getPrimaryAction(makeSale(status, null))).toBeNull()
    }
  )

  it.each([SaleStatus.closed, SaleStatus.lost] as const)(
    'estágios terminais não têm ação primária (status "%s")',
    (status) => {
      expect(getPrimaryAction(makeSale(status, { id: 1 }))).toBeNull()
    }
  )
})
