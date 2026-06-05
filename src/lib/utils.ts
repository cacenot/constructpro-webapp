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
