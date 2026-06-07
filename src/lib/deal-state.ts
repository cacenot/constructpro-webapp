import { type components, SaleStatus } from '@cacenot/construct-pro-api-client'

type Sale = components['schemas']['SaleResponse']

/**
 * Estágio do negócio, derivado do status comercial da venda. Dita qual dossiê
 * o usuário vê e qual é a próxima ação. Mais grosso que `SaleStatus` de
 * propósito: a UI pensa em "fases" (propor → fechar → financiar), não em cada
 * transição.
 */
export type DealStage = 'proposal' | 'awaiting_close' | 'closed' | 'lost'

export function getDealStage(sale: Pick<Sale, 'status'>): DealStage {
  switch (sale.status) {
    case SaleStatus.proposal:
      return 'proposal'
    case SaleStatus.pending_signature:
    case SaleStatus.pending_payment:
      return 'awaiting_close'
    case SaleStatus.closed:
      return 'closed'
    case SaleStatus.lost:
      return 'lost'
    default:
      return 'proposal'
  }
}

/** ID do contrato a buscar para a saúde financeira ao vivo (só quando vale a pena). */
export function getLiveContractId(sale: Sale): number | undefined {
  if (getDealStage(sale) !== 'closed') return undefined
  return sale.contract?.id ?? undefined
}

export type PrimaryActionKind = 'approve' | 'sign' | 'payEntry'

export interface PrimaryAction {
  kind: PrimaryActionKind
  label: string
  /** Tecla de atalho (minúscula). Fonte única para o handler e o hint visível. */
  key: string
}

/** A próxima ação de maior peso, ditada pelo estado. Dirige o atalho de teclado e o kbd hint. */
export function getPrimaryAction(sale: Sale): PrimaryAction | null {
  const hasContract = !!sale.contract
  switch (sale.status) {
    case SaleStatus.proposal:
      return { kind: 'approve', label: 'Aprovar proposta', key: 'a' }
    case SaleStatus.pending_signature:
      return hasContract ? { kind: 'sign', label: 'Assinar contrato', key: 's' } : null
    case SaleStatus.pending_payment:
      return hasContract ? { kind: 'payEntry', label: 'Receber sinal/entrada', key: 'e' } : null
    default:
      return null
  }
}
