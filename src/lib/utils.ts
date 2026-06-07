import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Valor monetário compacto para eixos e rótulos de gráfico: `R$1.2M`, `R$12k`,
 * `R$340`. Aproximação para densidade visual — use `formatCurrency` quando o
 * valor exato importa. `kDecimals` controla as casas na faixa dos milhares
 * (0 → `R$12k` para saldos grandes; 1 → `R$1.5k` para correções pequenas).
 */
export function formatCompactCurrency(value: number, kDecimals = 0): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `R$${(value / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `R$${(value / 1_000).toFixed(kDecimals)}k`
  return `R$${value.toFixed(0)}`
}

/**
 * Converte centavos (inteiro) na string decimal em reais que os endpoints de
 * entrada esperam (`WireMoney` no backend): 50000000 → "500000.00". A string é
 * montada a partir de inteiros para não introduzir erro de ponto flutuante.
 */
export function centsToReaisString(cents: number): string {
  const sign = cents < 0 ? '-' : ''
  const abs = Math.abs(Math.trunc(cents))
  return `${sign}${Math.trunc(abs / 100)}.${String(abs % 100).padStart(2, '0')}`
}

/**
 * Converte uma taxa em percentual na string que o `WireRate` do backend espera:
 * percentual decimal com no máximo 4 casas (5.5 → "5.5000"). Acima de 4 casas o
 * backend rejeita (não arredonda), então fixamos em 4 — protege contra lixo de
 * ponto flutuante. Um número cru seria lido como PPM (10.000× maior); daí a string.
 */
export function rateToWireString(percent: number): string {
  return percent.toFixed(4)
}

/**
 * Percentual no formato pt-BR (vírgula decimal). Por padrão sem casas falsas
 * (62 → "62", 62,5 → "62,5"); passe `fixed` para casas fixas (ex.: desconto "10,50").
 */
export function formatPercent(value: number, maxDecimals = 1, fixed = false): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: fixed ? maxDecimals : 0,
    maximumFractionDigits: maxDecimals,
  })
}

export function formatArea(area: string | number | null): string {
  if (!area) return '—'
  const num = typeof area === 'string' ? Number.parseFloat(area) : area
  if (Number.isNaN(num)) return '—'
  // Sem casas falsas (100 m², não 100,00 m²) e espaço inquebrável antes da unidade.
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num)
  return `${formatted} m²`
}

export function formatId(id: number): string {
  return `#${id.toString().padStart(5, '0')}`
}

/** Iniciais (até 2) de um nome, para fallback de avatar. Ex: "Maria Silva" → "MS". */
export function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
