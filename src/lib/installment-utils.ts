import type { SaleFormData } from '@/schemas/sale.schema'

type RecurrenceType = 'monthly' | 'bimonthly' | 'quarterly' | 'semestral' | 'yearly'

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

export function formatDateISO(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
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

    const intervalMap: Partial<Record<string, number>> = {
      monthly: 1,
      bimonthly: 2,
      quarterly: 3,
      semestral: 6,
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

const intervalMap: Record<string, number> = {
  monthly: 1,
  bimonthly: 2,
  quarterly: 3,
  semestral: 6,
}

/**
 * Returns a map of YYYY-MM → count of individual installments due in that month,
 * expanding recurrent schedules using addMonthsClamped.
 */
export function computeInstallmentsPerMonth(
  schedules: SaleFormData['installment_schedules']
): Map<string, number> {
  const map = new Map<string, number>()

  const add = (dateStr: string, qty: number) => {
    if (!dateStr) return
    const key = dateStr.slice(0, 7)
    map.set(key, (map.get(key) ?? 0) + qty)
  }

  for (const s of schedules) {
    if (s.kind === 'entry' || s.recurrence_type === null) {
      if (s.specific_date) add(s.specific_date, s.quantity ?? 1)
    } else if (s.recurrence_type === 'yearly') {
      if (!s.start_date || !s.recurrence_day) continue
      const start = new Date(s.start_date)
      for (let i = 0; i < (s.quantity ?? 1); i++) {
        const d = new Date(start)
        d.setFullYear(d.getFullYear() + i)
        add(formatDateISO(d.getFullYear(), d.getMonth() + 1, d.getDate()), 1)
      }
    } else {
      const interval = (s.recurrence_type ? intervalMap[s.recurrence_type] : undefined) ?? 1
      if (!s.start_date || !s.recurrence_day) continue
      const start = new Date(s.start_date)
      for (let i = 0; i < (s.quantity ?? 1); i++) {
        const d = addMonthsClamped(start, i * interval, s.recurrence_day)
        add(formatDateISO(d.getFullYear(), d.getMonth() + 1, d.getDate()), 1)
      }
    }
  }

  return map
}
