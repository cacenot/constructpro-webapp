import { Calendar as CalendarIcon } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface DatePickerProps {
  value: string | null | undefined
  onChange: (date: string | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  disabledDates?: string[]
  minDate?: string
  maxDate?: string
}

function formatDateISO(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseISO(dateString: string): Date {
  const parts = dateString.split('-').map(Number)
  const year = parts[0] ?? 2000
  const month = (parts[1] ?? 1) - 1
  const day = parts[2] ?? 1
  return new Date(year, month, day)
}

function formatDisplayDate(dateString: string | null | undefined): string {
  if (!dateString) return ''
  const date = parseISO(dateString)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Date picker component using Popover + Calendar
 * Value is stored as YYYY-MM-DD format
 */
export const DatePicker = React.forwardRef<HTMLButtonElement, DatePickerProps>(
  (
    {
      value,
      onChange,
      placeholder = 'Selecionar data',
      disabled = false,
      className,
      disabledDates = [],
      minDate,
      maxDate,
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false)

    const selectedDate = value ? parseISO(value) : undefined
    const displayValue = formatDisplayDate(value)

    const disabledMatcher = (date: Date) => {
      const iso = formatDateISO(date)
      if (disabledDates.includes(iso)) return true
      if (minDate && iso < minDate) return true
      if (maxDate && iso > maxDate) return true
      return false
    }

    const handleSelect = (date: Date | undefined) => {
      if (date) {
        onChange(formatDateISO(date))
      }
      setOpen(false)
    }

    const handleClear = () => {
      onChange(null)
      setOpen(false)
    }

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              'w-full justify-start text-left font-normal',
              !value && 'text-muted-foreground',
              className
            )}
          >
            <CalendarIcon className="mr-2 size-4" />
            {displayValue || placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            disabled={disabledMatcher}
            initialFocus
          />
          {value && (
            <div className="border-t p-2">
              <Button variant="ghost" size="sm" className="w-full text-xs" onClick={handleClear}>
                Limpar data
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    )
  }
)

DatePicker.displayName = 'DatePicker'
