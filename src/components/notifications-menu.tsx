import type { ReactNode } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

type Side = 'top' | 'bottom' | 'left' | 'right'
type Align = 'start' | 'center' | 'end'

// Notificações: trigger via children, conteúdo compartilhado (empty state por ora).
export function NotificationsMenu({
  children,
  side = 'top',
  align = 'start',
}: {
  children: ReactNode
  side?: Side
  align?: Align
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent side={side} align={align} sideOffset={8} className="w-72">
        <p className="text-sm font-medium">Notificações</p>
        <p className="mt-1 text-sm text-muted-foreground">Você não tem notificações novas.</p>
      </PopoverContent>
    </Popover>
  )
}
