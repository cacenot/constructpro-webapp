import type { KeyboardEvent } from 'react'
import type { SettingsNavItem } from '../settings-layout'

/**
 * Seções de navegação da página /organizacao. Fonte única compartilhada pela
 * página e por TenantConfigSection — CONFIG_IDS é derivado daqui, então nunca
 * fica dessincronizado com a sub-navegação real.
 */
export const ORGANIZACAO_SECTIONS: SettingsNavItem[] = [
  { id: 'membros', label: 'Membros' },
  { id: 'indices', label: 'Índices Econômicos' },
  { id: 'boletos', label: 'Emissão de Boletos' },
  { id: 'pagamentos', label: 'Pagamentos' },
  { id: 'parcelas', label: 'Parcelas por Mês' },
  { id: 'automacao', label: 'Automação Comercial' },
  { id: 'correcao', label: 'Correção Monetária' },
]

/** Ids das seções de config (exclui "membros", que não tem formulário de config). */
export const CONFIG_IDS = ORGANIZACAO_SECTIONS.filter((s) => s.id !== 'membros').map((s) => s.id)

/** Opções dos controles em PT (os helpers da API retornam rótulos em inglês). */
export const INVOICE_TIMING_OPTIONS = [
  { value: 'immediate', label: 'Imediato' },
  { value: 'days_before_due', label: 'Dias antes do vencimento' },
]
export const SALE_LOST_OPTIONS = [
  { value: 'disabled', label: 'Desativado' },
  { value: 'days_in_pending_signature', label: 'Dias aguardando assinatura' },
]

/** Hairline que separa linhas de switch dentro de uma seção, sem caixa. */
export const SWITCH_GROUP = 'divide-y divide-border/60 border-y border-border/60'
export const SWITCH_ROW = 'flex flex-row items-center justify-between gap-4 py-4'

/** Converte basis points → percentual (ex: 500 → 5.00). */
export function bpsToPercent(bps: number | null | undefined, fallback: number): number {
  return (bps ?? fallback) / 100
}

/** Converte percentual → basis points (ex: 5.00 → 500). */
export function percentToBps(pct: number): number {
  return Math.round(pct * 100)
}

/** Inteiro de dias entre 1 e `max`; clampa entrada inválida (negativos, 0, acima do máximo). */
export function clampDays(raw: string, max: number): number | null {
  if (raw === '') return null
  const n = Math.floor(Number(raw))
  if (Number.isNaN(n)) return null
  return Math.min(Math.max(n, 1), max)
}

/** Bloqueia teclas que produziriam dias não-inteiros/negativos (-, +, ., e). */
export function blockNonIntegerKeys(e: KeyboardEvent<HTMLInputElement>) {
  if (['e', 'E', '+', '-', '.', ','].includes(e.key)) e.preventDefault()
}
