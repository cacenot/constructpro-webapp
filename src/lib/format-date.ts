// Fuso de negócio do produto (America/Sao_Paulo, UTC-3). As datas vêm do backend
// como datetime aware (ISO); formatamos sempre neste fuso para não depender do
// relógio do browser — o card da listagem e o detalhe precisam concordar na
// virada de mês. Alinhado com a issue #127 do backend, que padroniza "hoje" no
// fuso de negócio nos reads financeiros.
const BUSINESS_TZ = 'America/Sao_Paulo'

/** Formata uma data ISO para `dd/MM/yyyy` no fuso de negócio. `—` para valores vazios. */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return dateStr
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: BUSINESS_TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

/** Formata uma data ISO para `mmm/aa` (ex: `jun/26`) no fuso de negócio. `—` para valores vazios. */
export function formatMonthYear(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return dateStr
  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: BUSINESS_TZ,
    month: 'short',
    year: '2-digit',
  }).formatToParts(date)
  const month = parts.find((p) => p.type === 'month')?.value.replace('.', '') ?? ''
  const year = parts.find((p) => p.type === 'year')?.value ?? ''
  return `${month}/${year}`
}
