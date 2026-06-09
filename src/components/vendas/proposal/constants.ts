import {
  type AssetType,
  type InstallmentKind,
  type InstallmentScheduleFormData,
  PAYMENT_METHOD_LABELS,
} from '@/schemas/sale.schema'

/** Rótulos de grupo no plano de pagamento (cabeçalhos de seção do ledger). */
export const GROUP_LABELS: Record<InstallmentKind, string> = {
  entry: 'Entradas',
  regular: 'Parcelas',
  balloon: 'Balões e reforços',
  key_delivery: 'Entrega das chaves',
  extra: 'Extras',
}

/**
 * Cor de dado por tipo de parcela — fonte única para o mapa mensal (célula sólida)
 * e os badges do ledger (dot sólido + tint), para correspondência visual direta.
 * Não é a Voz lima de ação (botões): aqui o lima-400 é cor de dado do calendário,
 * deliberadamente fora do orçamento da ação.
 */
export const KIND_DOT: Record<InstallmentKind, string> = {
  entry: 'bg-sky-400',
  regular: 'bg-lime-400',
  balloon: 'bg-amber-400',
  key_delivery: 'bg-violet-400',
  extra: 'bg-muted-foreground',
}

/** Pílula tintada (tint translúcido + texto saturado) na mesma família do mapa. */
export const KIND_BADGE: Record<InstallmentKind, string> = {
  entry: 'bg-sky-400/15 text-sky-300',
  regular: 'bg-lime-400/15 text-lime-300',
  balloon: 'bg-amber-400/15 text-amber-300',
  key_delivery: 'bg-violet-400/15 text-violet-300',
  extra: 'bg-muted text-muted-foreground',
}

/** Ordem canônica de exibição dos grupos não-entrada. */
export const NON_ENTRY_KINDS = ['regular', 'balloon', 'key_delivery', 'extra'] as const

/** Opções de forma de pagamento (ordem estável para os selects). */
export const PAYMENT_METHOD_OPTIONS = Object.entries(PAYMENT_METHOD_LABELS) as [string, string][]

type Recurrence = 'monthly' | 'bimonthly' | 'quarterly' | 'semestral' | 'yearly'

/**
 * Sazonalidade de um reforço/balão (tudo que não é mensal), editável no card.
 * Convenção de front: mensal ⇒ Parcela (regular); não-mensal ⇒ Reforço (balloon).
 * Ver memória [installment-kind-periodicity]. Default: anual.
 */
export const BALLOON_PERIODICITY_OPTIONS: { value: Recurrence; label: string }[] = [
  { value: 'bimonthly', label: 'Bimestral' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'yearly', label: 'Anual' },
]

/** Valores-padrão de uma nova entrada (sinal). Quantidade sempre 1 (multi-entrada = N linhas). */
export function createEntrySchedule(): InstallmentScheduleFormData {
  return {
    kind: 'entry',
    payment_method: 'pix',
    quantity: 1,
    amount: 0,
    specific_date: null,
    recurrence_type: null,
    recurrence_day: null,
    recurrence_month: null,
    start_date: null,
    asset_proposal: null,
  }
}

/** Valores-padrão de bens, por tipo, com campos vazios prontos para edição. */
export function getDefaultAssetMetadata(type: AssetType) {
  switch (type) {
    case 'vehicle':
      return { type, plate: '', renavam: '', brand: '', model: '', year: '' as unknown as number }
    case 'real_estate':
      return {
        type,
        address: '',
        property_type: '',
        area_sqm: '' as unknown as number,
        registration_number: '',
      }
    case 'land':
      return { type, address: '', area_sqm: '' as unknown as number, registration_number: '' }
    case 'boat':
      return {
        type,
        registration: '',
        length_meters: '' as unknown as number,
        brand: '',
        model: '',
        year: '' as unknown as number,
      }
  }
}
