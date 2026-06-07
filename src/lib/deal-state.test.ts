import { SaleStatus } from '@cacenot/construct-pro-api-client'
import { describe, expect, it } from 'vitest'
import { getDealStage, getLiveContractId, getPrimaryAction } from './deal-state'

// getLiveContractId/getPrimaryAction só leem `status` e `contract`; um objeto
// parcial cobre os ramos sem montar uma SaleResponse inteira.
type Sale = Parameters<typeof getLiveContractId>[0]

function makeSale(overrides: Partial<Sale> = {}): Sale {
  return { status: SaleStatus.proposal, ...overrides } as Sale
}

describe('getDealStage', () => {
  it('mapeia proposal → proposal', () => {
    expect(getDealStage({ status: SaleStatus.proposal })).toBe('proposal')
  })

  it('agrupa pending_signature e pending_payment em awaiting_close', () => {
    expect(getDealStage({ status: SaleStatus.pending_signature })).toBe('awaiting_close')
    expect(getDealStage({ status: SaleStatus.pending_payment })).toBe('awaiting_close')
  })

  it('mapeia closed → closed e lost → lost', () => {
    expect(getDealStage({ status: SaleStatus.closed })).toBe('closed')
    expect(getDealStage({ status: SaleStatus.lost })).toBe('lost')
  })

  it('faz fallback para proposal em status desconhecido', () => {
    expect(getDealStage({ status: 'algo_inesperado' as Sale['status'] })).toBe('proposal')
  })
})

describe('getLiveContractId', () => {
  it('retorna o id do contrato quando o negócio está fechado', () => {
    const sale = makeSale({ status: SaleStatus.closed, contract: { id: 42 } as Sale['contract'] })
    expect(getLiveContractId(sale)).toBe(42)
  })

  it('não busca contrato fora do estágio fechado, mesmo se o contrato existir', () => {
    const sale = makeSale({
      status: SaleStatus.pending_payment,
      contract: { id: 42 } as Sale['contract'],
    })
    expect(getLiveContractId(sale)).toBeUndefined()
  })

  it('retorna undefined quando fechado sem contrato materializado', () => {
    expect(getLiveContractId(makeSale({ status: SaleStatus.closed }))).toBeUndefined()
  })

  it('retorna undefined quando o contrato existe mas não tem id', () => {
    const sale = makeSale({
      status: SaleStatus.closed,
      contract: { id: null } as unknown as Sale['contract'],
    })
    expect(getLiveContractId(sale)).toBeUndefined()
  })
})

describe('getPrimaryAction', () => {
  it('proposta → aprovar (atalho A)', () => {
    expect(getPrimaryAction(makeSale({ status: SaleStatus.proposal }))).toEqual({
      kind: 'approve',
      label: 'Aprovar proposta',
      key: 'a',
    })
  })

  it('aguardando assinatura com contrato → assinar (atalho S)', () => {
    const sale = makeSale({
      status: SaleStatus.pending_signature,
      contract: { id: 1 } as Sale['contract'],
    })
    expect(getPrimaryAction(sale)?.kind).toBe('sign')
    expect(getPrimaryAction(sale)?.key).toBe('s')
  })

  it('aguardando pagamento com contrato → receber sinal/entrada (atalho E)', () => {
    const sale = makeSale({
      status: SaleStatus.pending_payment,
      contract: { id: 1 } as Sale['contract'],
    })
    expect(getPrimaryAction(sale)?.kind).toBe('payEntry')
    expect(getPrimaryAction(sale)?.key).toBe('e')
  })

  it('não oferece ação primária aguardando assinatura/pagamento sem contrato', () => {
    expect(getPrimaryAction(makeSale({ status: SaleStatus.pending_signature }))).toBeNull()
    expect(getPrimaryAction(makeSale({ status: SaleStatus.pending_payment }))).toBeNull()
  })

  it('não oferece ação primária em estágios terminais (fechado, perdido)', () => {
    expect(getPrimaryAction(makeSale({ status: SaleStatus.closed }))).toBeNull()
    expect(getPrimaryAction(makeSale({ status: SaleStatus.lost }))).toBeNull()
  })

  it('a tecla de atalho é sempre minúscula (fonte única do handler e do hint)', () => {
    const action = getPrimaryAction(makeSale({ status: SaleStatus.proposal }))
    expect(action?.key).toBe(action?.key.toLowerCase())
  })
})
