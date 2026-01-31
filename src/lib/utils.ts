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
  return `${num.toFixed(2).replace('.', ',')}m²`
}

export function formatId(id: number): string {
  return `#${id.toString().padStart(5, '0')}`
}
