import { computeContractEndDate, computeInstallmentsPerMonth } from '@/lib/installment-utils'
import {
  type InstallmentKind,
  installmentKindValues,
  type SaleFormData,
} from '@/schemas/sale.schema'

type Schedules = SaleFormData['installment_schedules']

export interface GroupSubtotal {
  kind: InstallmentKind
  /** Soma das quantidades do grupo (nº de parcelas). */
  count: number
  /** Soma de quantity × amount, em centavos. */
  subtotal: number
}

export interface ProposalVitals {
  /** Total da proposta (Σ quantity × amount), em centavos. */
  total: number
  /** Nº de parcelas (Σ quantity) em toda a proposta. */
  count: number
  /** Soma das entradas, em centavos. */
  entryTotal: number
  /** Entrada como % do total da proposta. */
  entryPercent: number
  /** Valor financiado (total − entradas), em centavos. */
  financed: number
  /** Preço de tabela da unidade, em centavos. */
  unitPriceCents: number
  /** total − preço de tabela, em centavos (negativo = desconto). */
  diff: number
  /** Diferença sobre o preço de tabela, em %. */
  diffPercent: number
  /** Previsão de término do contrato. */
  contractEnd: { endDate: Date | null; totalMonths: number }
  /** Subtotais por grupo, apenas grupos com parcelas, na ordem canônica. */
  groups: GroupSubtotal[]
  /** Meses que excedem o limite de parcelas configurado pelo tenant. */
  perMonthViolations: { month: string; count: number }[]
  /** Comissão de mediação (corretor + imobiliária). Presente quando há corretor. */
  commission: CommissionVitals | null
}

export interface CommissionVitals {
  /** Soma corretor + imobiliária, em %. */
  totalPercent: number
  /** Valor da comissão sobre o total da proposta, em centavos. */
  amountCents: number
  /** Teto do tenant (max_commission_rate), em %. 0 = sem teto. */
  capPercent: number
  /** A soma excede o teto configurado? */
  exceedsCap: boolean
}

/**
 * Calcula todos os números do painel de instrumentos a partir do cronograma.
 * Fonte única para o ledger, o painel de vitais e os avisos de limite.
 */
export function computeProposalVitals(
  schedules: Schedules | undefined,
  unitPriceCents: number,
  maxInstallmentsPerMonth?: number,
  commissionInput?: {
    brokerId?: number | null
    brokerRate?: number | null
    agencyRate?: number | null
    capPercent?: number
  }
): ProposalVitals {
  const list = schedules ?? []

  let total = 0
  let count = 0
  let entryTotal = 0

  const groupMap = new Map<InstallmentKind, GroupSubtotal>()
  for (const kind of installmentKindValues) groupMap.set(kind, { kind, count: 0, subtotal: 0 })

  for (const s of list) {
    const qty = s.quantity ?? 0
    const lineTotal = qty * (s.amount ?? 0)
    total += lineTotal
    count += qty
    if (s.kind === 'entry') entryTotal += lineTotal
    const group = groupMap.get(s.kind)
    if (group) {
      group.count += qty
      group.subtotal += lineTotal
    }
  }

  const financed = total - entryTotal
  const entryPercent = total > 0 ? (entryTotal / total) * 100 : 0
  const diff = total - unitPriceCents
  const diffPercent = unitPriceCents > 0 ? (diff / unitPriceCents) * 100 : 0

  const groups = installmentKindValues
    .map((kind) => groupMap.get(kind))
    .filter((g): g is GroupSubtotal => !!g && g.count > 0)

  const contractEnd = computeContractEndDate(list)

  const perMonthViolations: { month: string; count: number }[] = []
  if (maxInstallmentsPerMonth && maxInstallmentsPerMonth > 0) {
    for (const [month, monthCount] of computeInstallmentsPerMonth(list)) {
      if (monthCount > maxInstallmentsPerMonth)
        perMonthViolations.push({ month, count: monthCount })
    }
    perMonthViolations.sort((a, b) => a.month.localeCompare(b.month))
  }

  let commission: CommissionVitals | null = null
  if (commissionInput?.brokerId) {
    const totalPercent = (commissionInput.brokerRate ?? 0) + (commissionInput.agencyRate ?? 0)
    const capPercent = commissionInput.capPercent ?? 0
    commission = {
      totalPercent,
      amountCents: Math.round((total * totalPercent) / 100),
      capPercent,
      exceedsCap: capPercent > 0 && totalPercent > capPercent + 1e-9,
    }
  }

  return {
    total,
    count,
    entryTotal,
    entryPercent,
    financed,
    unitPriceCents,
    diff,
    diffPercent,
    contractEnd,
    groups,
    perMonthViolations,
    commission,
  }
}
