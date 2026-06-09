import type {
  InstallmentKind,
  InstallmentScheduleFormData,
  SaleFormData,
} from '@/schemas/sale.schema'

type RecurrenceType = 'monthly' | 'bimonthly' | 'quarterly' | 'semestral' | 'yearly'

// Hoisted to top so all helpers that reference it can use it freely.
const intervalMap: Record<string, number> = {
  monthly: 1,
  bimonthly: 2,
  quarterly: 3,
  semestral: 6,
}

// Adds N months to start date, clamping the day if the target month has fewer days.
// Fixes JS overflow: new Date(2026, 0, 31).setMonth(1) → Mar 3, not Feb 28.
export function addMonthsClamped(start: Date, monthsToAdd: number, dayOfMonth: number): Date {
  const baseYear = start.getFullYear()
  const baseMonth = start.getMonth()
  const targetMonthTotal = baseMonth + monthsToAdd
  const targetYear = baseYear + Math.floor(targetMonthTotal / 12)
  const targetMonthIndex = ((targetMonthTotal % 12) + 12) % 12
  const daysInTarget = new Date(targetYear, targetMonthIndex + 1, 0).getDate()
  const targetDay = Math.min(dayOfMonth, daysInTarget)
  return new Date(targetYear, targetMonthIndex, targetDay)
}

export function formatDateISO(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// ─── Task 1: Date helpers ─────────────────────────────────────────────────────

/** Índice de mês absoluto (ano*12 + mês0) a partir de uma data ISO. */
export function monthIndexFromISO(iso: string): number {
  const parts = iso.split('-').map(Number)
  const y = parts[0] as number
  const m = parts[1] as number
  return y * 12 + (m - 1)
}

/** ISO `YYYY-MM-DD` a partir do índice de mês absoluto, clampando o dia ao mês. */
export function isoFromMonthIndex(idx: number, day: number): string {
  const y = Math.floor(idx / 12)
  const m = (idx % 12) + 1
  const daysInMonth = new Date(y, m, 0).getDate()
  return formatDateISO(y, m, Math.min(day, daysInMonth))
}

/** Deriva recurrence_day/month a partir da data de início (fonte da verdade). */
export function deriveRecurrenceFields(
  startISO: string,
  recurrenceType: RecurrenceType
): { recurrence_day: number; recurrence_month: number | null } {
  const d = new Date(`${startISO}T12:00:00`)
  return {
    recurrence_day: d.getDate(),
    recurrence_month: recurrenceType === 'yearly' ? d.getMonth() + 1 : null,
  }
}

/** Data da última parcela de um cronograma (ou specific_date para entrada/chaves). */
export function computeScheduleEnd(schedule: InstallmentScheduleFormData): Date | null {
  if (schedule.kind === 'entry' || schedule.kind === 'key_delivery') {
    return schedule.specific_date ? new Date(`${schedule.specific_date}T12:00:00`) : null
  }
  if (!schedule.start_date || !schedule.recurrence_type) return null
  const start = new Date(`${schedule.start_date}T12:00:00`)
  const qty = schedule.quantity ?? 1
  if (schedule.recurrence_type === 'yearly') {
    const end = new Date(start)
    end.setFullYear(end.getFullYear() + (qty - 1))
    return end
  }
  const interval = intervalMap[schedule.recurrence_type] ?? 1
  return addMonthsClamped(start, (qty - 1) * interval, start.getDate())
}

// ─── Task 2: Monthly span ─────────────────────────────────────────────────────

/** Período (menor início → maior fim) coberto pelas parcelas mensais regulares. */
export function computeMonthlySpan(
  schedules: InstallmentScheduleFormData[]
): { startIdx: number; endIdx: number } | null {
  const monthly = schedules.filter(
    (s) => s.kind === 'regular' && s.recurrence_type === 'monthly' && s.start_date
  )
  if (!monthly.length) return null
  let startIdx = Number.POSITIVE_INFINITY
  let endIdx = Number.NEGATIVE_INFINITY
  for (const s of monthly) {
    const sIdx = monthIndexFromISO(s.start_date as string)
    const end = computeScheduleEnd(s)
    const eIdx = end ? end.getFullYear() * 12 + end.getMonth() : sIdx
    if (sIdx < startIdx) startIdx = sIdx
    if (eIdx > endIdx) endIdx = eIdx
  }
  return { startIdx, endIdx }
}

/** Quantidade e início de um grupo recorrente derivados do span das mensais. */
export function deriveRecurringFromSpan(
  span: { startIdx: number; endIdx: number },
  periodMonths: number,
  day: number
): { quantity: number; startISO: string } {
  const quantity = Math.max(1, Math.floor((span.endIdx - span.startIdx) / periodMonths))
  const startISO = isoFromMonthIndex(span.startIdx + periodMonths, day)
  return { quantity, startISO }
}

// ─── Task 3: Balance group amount ─────────────────────────────────────────────

/**
 * Novo valor por parcela de um grupo para absorver o saldo (modelo C).
 * Grupos têm valor uniforme: distribui em centavos inteiros; resíduo (< quantidade
 * centavos) permanece como saldo. Nunca negativo.
 */
export function balanceGroupAmount(
  currentAmountCents: number,
  quantity: number,
  saldoCents: number
): number {
  if (quantity <= 0) return currentAmountCents
  return Math.max(0, currentAmountCents + Math.round(saldoCents / quantity))
}

// ─── Task 4: Chained start ────────────────────────────────────────────────────

/** Próximo início (ISO) logo após o fim do grupo mensal anterior — sem sobreposição. */
export function computeChainedStart(
  prevSchedule: InstallmentScheduleFormData,
  day: number
): string | null {
  const end = computeScheduleEnd(prevSchedule)
  if (!end) return null
  const next = addMonthsClamped(end, 1, day)
  return formatDateISO(next.getFullYear(), next.getMonth() + 1, next.getDate())
}

// ─── Task 5: Monthly breakdown ────────────────────────────────────────────────

export interface MonthlyCell {
  kind: InstallmentKind
  amount: number
}

/** Mapa YYYY-MM → parcelas daquele mês (tipo + valor por parcela). */
export function computeMonthlyBreakdown(
  schedules: SaleFormData['installment_schedules']
): Map<string, MonthlyCell[]> {
  const map = new Map<string, MonthlyCell[]>()
  const push = (dateStr: string, kind: InstallmentKind, amount: number) => {
    if (!dateStr) return
    const key = dateStr.slice(0, 7)
    const arr = map.get(key) ?? []
    arr.push({ kind, amount })
    map.set(key, arr)
  }
  for (const s of schedules) {
    const amount = s.amount ?? 0
    if (s.kind === 'entry' || s.kind === 'key_delivery' || s.recurrence_type == null) {
      if (s.specific_date) push(s.specific_date, s.kind, amount)
    } else if (s.recurrence_type === 'yearly') {
      if (!s.start_date) continue
      const start = new Date(`${s.start_date}T12:00:00`)
      for (let i = 0; i < (s.quantity ?? 1); i++) {
        const d = new Date(start)
        d.setFullYear(d.getFullYear() + i)
        push(formatDateISO(d.getFullYear(), d.getMonth() + 1, d.getDate()), s.kind, amount)
      }
    } else {
      const interval = intervalMap[s.recurrence_type] ?? 1
      if (!s.start_date) continue
      const start = new Date(`${s.start_date}T12:00:00`)
      for (let i = 0; i < (s.quantity ?? 1); i++) {
        const d = addMonthsClamped(start, i * interval, start.getDate())
        push(formatDateISO(d.getFullYear(), d.getMonth() + 1, d.getDate()), s.kind, amount)
      }
    }
  }
  return map
}

// ─── Existing helpers (kept / refactored) ─────────────────────────────────────

/**
 * Compute the default start date based on recurrence_day/month.
 * Returns the next occurrence of that day/month.
 */
export function computeDefaultStartDate(
  recurrenceType: RecurrenceType,
  recurrenceDay: number | null | undefined,
  recurrenceMonth: number | null | undefined
): string {
  if (!recurrenceDay) return ''

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const currentDay = now.getDate()

  if (
    recurrenceType === 'monthly' ||
    recurrenceType === 'bimonthly' ||
    recurrenceType === 'quarterly' ||
    recurrenceType === 'semestral'
  ) {
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const dayToUse = Math.min(recurrenceDay, daysInCurrentMonth)

    if (dayToUse >= currentDay) {
      return formatDateISO(currentYear, currentMonth + 1, dayToUse)
    }

    const nextMonth = currentMonth + 1
    const daysInNextMonth = new Date(currentYear, nextMonth + 1, 0).getDate()
    const dayInNextMonth = Math.min(recurrenceDay, daysInNextMonth)

    if (nextMonth === 11) {
      return formatDateISO(currentYear + 1, 1, dayInNextMonth)
    }
    return formatDateISO(currentYear, nextMonth + 1, dayInNextMonth)
  }

  if (recurrenceType === 'yearly' && recurrenceMonth) {
    const month = recurrenceMonth - 1
    const daysInMonth = new Date(currentYear, month + 1, 0).getDate()
    const dayToUse = Math.min(recurrenceDay, daysInMonth)

    if (month > currentMonth || (month === currentMonth && dayToUse >= currentDay)) {
      return formatDateISO(currentYear, recurrenceMonth, dayToUse)
    }

    const daysInNextYear = new Date(currentYear + 1, month + 1, 0).getDate()
    const dayInNextYear = Math.min(recurrenceDay, daysInNextYear)
    return formatDateISO(currentYear + 1, recurrenceMonth, dayInNextYear)
  }

  return ''
}

/**
 * Compute the allowed dates for a date input based on recurrence_day and optionally recurrence_month.
 * For monthly/bimonthly/quarterly/semestral: all occurrences of the given day in any month for 30 years.
 * For yearly: only the given day/month for 30 years.
 * Returns an array of YYYY-MM-DD strings.
 */
export function computeAllowedDates(
  kind: RecurrenceType,
  recurrenceDay: number | null | undefined,
  recurrenceMonth: number | null | undefined
): string[] {
  if (!recurrenceDay) return []
  const dates: string[] = []
  const now = new Date()
  const startYear = now.getFullYear()
  const endYear = startYear + 30

  if (kind === 'monthly' || kind === 'bimonthly' || kind === 'quarterly' || kind === 'semestral') {
    for (let year = startYear; year <= endYear; year++) {
      for (let month = 0; month < 12; month++) {
        const daysInMonth = new Date(year, month + 1, 0).getDate()
        const day = Math.min(recurrenceDay, daysInMonth)
        const d = new Date(year, month, day)
        if (
          d >= now ||
          (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear())
        ) {
          dates.push(formatDateISO(year, month + 1, day))
        }
      }
    }
  } else if (kind === 'yearly' && recurrenceMonth) {
    for (let year = startYear; year <= endYear; year++) {
      const month = recurrenceMonth - 1
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      const day = Math.min(recurrenceDay, daysInMonth)
      const d = new Date(year, month, day)
      if (d >= now || d.getFullYear() === now.getFullYear()) {
        dates.push(formatDateISO(year, recurrenceMonth, day))
      }
    }
  }

  return dates
}

/**
 * Compute the end date of the contract based on all schedules.
 */
export function computeContractEndDate(schedules: SaleFormData['installment_schedules']): {
  endDate: Date | null
  totalMonths: number
} {
  let latestDate: Date | null = null
  let totalMonths = 0

  for (const schedule of schedules) {
    if (schedule.kind === 'entry' && schedule.specific_date) {
      const d = new Date(schedule.specific_date)
      if (!latestDate || d > latestDate) latestDate = d
    }

    const intervalMonths = schedule.recurrence_type
      ? intervalMap[schedule.recurrence_type]
      : undefined

    if (intervalMonths !== undefined && schedule.start_date && schedule.recurrence_day) {
      const start = new Date(schedule.start_date)
      const intervals = (schedule.quantity ?? 1) - 1
      const end = addMonthsClamped(start, intervals * intervalMonths, schedule.recurrence_day)
      if (!latestDate || end > latestDate) latestDate = end
      const months = intervals * intervalMonths + 1
      if (months > totalMonths) totalMonths = months
    }

    if (schedule.recurrence_type === 'yearly' && schedule.start_date && schedule.recurrence_day) {
      const start = new Date(schedule.start_date)
      const years = (schedule.quantity ?? 1) - 1
      const end = new Date(start)
      end.setFullYear(end.getFullYear() + years)
      if (!latestDate || end > latestDate) latestDate = end
    }
  }

  return { endDate: latestDate, totalMonths }
}

export function formatBRDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Returns a map of YYYY-MM → count of individual installments due in that month.
 * Derived from computeMonthlyBreakdown (DRY).
 */
export function computeInstallmentsPerMonth(
  schedules: SaleFormData['installment_schedules']
): Map<string, number> {
  const out = new Map<string, number>()
  for (const [key, cells] of computeMonthlyBreakdown(schedules)) out.set(key, cells.length)
  return out
}
