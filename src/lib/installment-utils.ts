import type { SaleFormData } from '@/schemas/sale.schema'

/**
 * Compute the default start date based on recurrence_day/month.
 * Returns the next occurrence of that day/month.
 */
export function computeDefaultStartDate(
  kind: 'monthly' | 'yearly',
  recurrenceDay: number | null | undefined,
  recurrenceMonth: number | null | undefined
): string {
  if (!recurrenceDay) return ''

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const currentDay = now.getDate()

  if (kind === 'monthly') {
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

  if (kind === 'yearly' && recurrenceMonth) {
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
 * For monthly: only the given day of every month for the next 30 years.
 * For yearly: only the given day/month for the next 30 years.
 * Returns an array of YYYY-MM-DD strings.
 */
export function computeAllowedDates(
  kind: 'monthly' | 'yearly',
  recurrenceDay: number | null | undefined,
  recurrenceMonth: number | null | undefined
): string[] {
  if (!recurrenceDay) return []
  const dates: string[] = []
  const now = new Date()
  const startYear = now.getFullYear()
  const endYear = startYear + 30

  if (kind === 'monthly') {
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

    if (schedule.kind === 'monthly' && schedule.start_date && schedule.recurrence_day) {
      const start = new Date(schedule.start_date)
      const months = (schedule.quantity ?? 1) - 1
      const end = new Date(start)
      end.setMonth(end.getMonth() + months)
      if (!latestDate || end > latestDate) latestDate = end
      if (months + 1 > totalMonths) totalMonths = months + 1
    }

    if (schedule.kind === 'yearly' && schedule.start_date && schedule.recurrence_day) {
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
