import type { components } from '@cacenot/construct-pro-api-client'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { HardHat } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

type ProgressUpdate = components['schemas']['ProgressUpdate']

interface ConstructionProgressSectionProps {
  updates: ProgressUpdate[]
}

const INITIAL_VISIBLE = 4

function formatDate(dateStr: string): string {
  try {
    return format(new Date(dateStr), "dd 'de' MMM, yyyy", { locale: ptBR })
  } catch {
    return dateStr
  }
}

export function ConstructionProgressSection({ updates }: ConstructionProgressSectionProps) {
  const [expanded, setExpanded] = useState(false)

  const sorted = [...updates].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const latestPercentage = sorted.length > 0 ? (sorted[0]?.percentage ?? 0) : 0
  const visibleEntries = expanded ? sorted : sorted.slice(0, INITIAL_VISIBLE)
  const hasMore = sorted.length > INITIAL_VISIBLE

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <HardHat className="size-4" />
            Progresso da Obra
          </CardTitle>
          <span className="tabular-nums text-2xl font-bold">{latestPercentage}%</span>
        </div>
        <Progress value={latestPercentage} className="mt-2 h-2" />
      </CardHeader>
      <CardContent>
        <div className="relative ml-3">
          {/* Vertical line */}
          <div className="absolute top-0 bottom-0 left-[5px] w-px bg-border" />

          <div className="space-y-4">
            {visibleEntries.map((entry, index) => {
              const isLatest = index === 0
              const isCompleted = entry.percentage <= latestPercentage && !isLatest

              return (
                <div key={`${entry.created_at}-${entry.percentage}`} className="relative pl-6">
                  {/* Dot */}
                  <div
                    className={cn(
                      'absolute left-0 top-1 size-[11px] rounded-full border-2',
                      isLatest
                        ? 'border-primary bg-primary'
                        : isCompleted
                          ? 'border-emerald-500 bg-emerald-500'
                          : 'border-border bg-background'
                    )}
                  />

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{formatDate(entry.created_at)}</span>
                      <span className="tabular-nums rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium">
                        {entry.percentage}%
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{entry.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 w-full text-muted-foreground"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Ver menos' : `Ver todos (${sorted.length})`}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
