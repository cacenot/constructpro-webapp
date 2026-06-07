import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/** Formata uma data ISO para `dd/MM/yyyy` (pt-BR). Retorna `—` para valores vazios. */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR })
  } catch {
    return dateStr
  }
}

/** Formata uma data ISO para `mmm/aa` (ex: `jun/26`). Retorna `—` para valores vazios. */
export function formatMonthYear(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    return format(new Date(dateStr), 'MMM/yy', { locale: ptBR })
  } catch {
    return dateStr
  }
}
