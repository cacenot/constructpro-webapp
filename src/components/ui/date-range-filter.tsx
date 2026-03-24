import { addDays, endOfMonth, format, startOfMonth, subMonths } from 'date-fns'
import { CalendarIcon, X } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export interface DateRangeValue {
  preset: string
  min: string
  max: string
}

export interface DateRangeFilterProps {
  value: DateRangeValue | null
  onChange: (value: DateRangeValue | null) => void
  placeholder?: string
  className?: string
}

function toISO(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

interface PresetOption {
  id: string
  label: string
  compute?: () => { min: string; max: string }
}

const PRESETS: PresetOption[] = [
  {
    id: 'today',
    label: 'Hoje',
    compute: () => {
      const d = toISO(new Date())
      return { min: d, max: d }
    },
  },
  {
    id: 'yesterday',
    label: 'Ontem',
    compute: () => {
      const d = toISO(addDays(new Date(), -1))
      return { min: d, max: d }
    },
  },
  {
    id: 'tomorrow',
    label: 'Amanhã',
    compute: () => {
      const d = toISO(addDays(new Date(), 1))
      return { min: d, max: d }
    },
  },
  {
    id: 'next7',
    label: 'Próximos 7 dias',
    compute: () => ({
      min: toISO(new Date()),
      max: toISO(addDays(new Date(), 6)),
    }),
  },
  {
    id: 'next30',
    label: 'Próximos 30 dias',
    compute: () => ({
      min: toISO(new Date()),
      max: toISO(addDays(new Date(), 29)),
    }),
  },
  {
    id: 'thisMonth',
    label: 'Este mês',
    compute: () => ({
      min: toISO(startOfMonth(new Date())),
      max: toISO(endOfMonth(new Date())),
    }),
  },
  {
    id: 'lastMonth',
    label: 'Mês passado',
    compute: () => {
      const last = subMonths(new Date(), 1)
      return { min: toISO(startOfMonth(last)), max: toISO(endOfMonth(last)) }
    },
  },
  {
    id: 'custom',
    label: 'Personalizado',
  },
]

function formatLabel(value: DateRangeValue): string {
  const preset = PRESETS.find((p) => p.id === value.preset)
  if (preset && preset.id !== 'custom') return preset.label

  const parts: string[] = []
  if (value.min) {
    const [y, m, d] = value.min.split('-')
    parts.push(`${d}/${m}/${y}`)
  }
  if (value.max && value.max !== value.min) {
    const [y, m, d] = value.max.split('-')
    parts.push(`${d}/${m}/${y}`)
    return `${parts[0]} – ${parts[1]}`
  }
  return parts[0] ?? 'Personalizado'
}

/** Compute a DateRangeValue for a given preset id */
export function computeDateRangePreset(presetId: string): DateRangeValue | null {
  const preset = PRESETS.find((p) => p.id === presetId)
  if (!preset?.compute) return null
  return { preset: presetId, ...preset.compute() }
}

export function DateRangeFilter({
  value,
  onChange,
  placeholder = 'Vencimento',
  className,
}: DateRangeFilterProps) {
  const [open, setOpen] = React.useState(false)
  const [customMin, setCustomMin] = React.useState('')
  const [customMax, setCustomMax] = React.useState('')

  // Sync local custom state when external value changes
  React.useEffect(() => {
    if (value?.preset === 'custom') {
      setCustomMin(value.min)
      setCustomMax(value.max)
    } else if (!value) {
      setCustomMin('')
      setCustomMax('')
    }
  }, [value])

  const isCustomActive = value?.preset === 'custom'

  const handlePreset = (preset: PresetOption) => {
    if (preset.id === 'custom') {
      // Switch to custom mode — keep popover open for date input
      onChange({ preset: 'custom', min: customMin, max: customMax })
      return
    }
    if (!preset.compute) return
    onChange({ preset: preset.id, ...preset.compute() })
    setOpen(false)
  }

  const handleCustomApply = () => {
    onChange({ preset: 'custom', min: customMin, max: customMax })
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onChange(null)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            'justify-start text-left font-normal gap-2 min-w-44',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="size-4 shrink-0" />
          <span className="flex-1 truncate">{value ? formatLabel(value) : placeholder}</span>
          {value && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleClear}
                  type="button"
                  className="inline-flex items-center justify-center shrink-0"
                >
                  <X className="size-3.5 opacity-60 hover:opacity-100" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Limpar filtro</p>
              </TooltipContent>
            </Tooltip>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          {/* Preset list */}
          <div className="flex flex-col py-1 min-w-44">
            <button
              type="button"
              onClick={() => {
                onChange(null)
                setOpen(false)
              }}
              className={cn(
                'px-3 py-1.5 text-sm text-left transition-colors hover:bg-accent hover:text-accent-foreground',
                !value && 'bg-accent text-accent-foreground font-medium'
              )}
            >
              Limpar filtro
            </button>
            <Separator className="my-1" />
            {PRESETS.map((preset, i) => {
              const addSeparatorBefore = i === 3 || i === PRESETS.length - 1
              return (
                <React.Fragment key={preset.id}>
                  {addSeparatorBefore && <Separator className="my-1" />}
                  <button
                    type="button"
                    onClick={() => handlePreset(preset)}
                    className={cn(
                      'px-3 py-1.5 text-sm text-left transition-colors hover:bg-accent hover:text-accent-foreground',
                      value?.preset === preset.id && 'bg-accent text-accent-foreground font-medium'
                    )}
                  >
                    {preset.label}
                  </button>
                </React.Fragment>
              )
            })}
          </div>

          {/* Custom date pickers — shown when "Personalizado" is active */}
          {isCustomActive && (
            <>
              <Separator orientation="vertical" />
              <div className="p-3 flex flex-col gap-3 w-56">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">De</span>
                  <DatePicker
                    value={customMin || null}
                    onChange={(d) => setCustomMin(d ?? '')}
                    placeholder="Data inicial"
                    maxDate={customMax || undefined}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Até</span>
                  <DatePicker
                    value={customMax || null}
                    onChange={(d) => setCustomMax(d ?? '')}
                    placeholder="Data final"
                    minDate={customMin || undefined}
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={!customMin && !customMax}
                  onClick={handleCustomApply}
                >
                  Aplicar
                </Button>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
