import type { ReactNode } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type Side = 'top' | 'bottom' | 'left' | 'right'
type Align = 'start' | 'center' | 'end'

// Notificações: trigger via children, conteúdo compartilhado (empty state por ora).
// `tooltip` envolve o gatilho — convenção do projeto: todo icon button tem rótulo.
export function NotificationsMenu({
  children,
  side = 'top',
  align = 'start',
  tooltip,
}: {
  children: ReactNode
  side?: Side
  align?: Align
  tooltip?: string
}) {
  const trigger = <PopoverTrigger asChild>{children}</PopoverTrigger>

  return (
    <Popover>
      {tooltip ? (
        <Tooltip>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          <TooltipContent side={side}>{tooltip}</TooltipContent>
        </Tooltip>
      ) : (
        trigger
      )}
      <PopoverContent side={side} align={align} sideOffset={8} className="w-72">
        <p className="text-sm font-medium">Notificações</p>
        <p className="mt-1 text-sm text-muted-foreground">Você não tem notificações novas.</p>
      </PopoverContent>
    </Popover>
  )
}
