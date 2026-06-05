import { Bell } from 'lucide-react'
import { AccountMenu } from '@/components/account-menu'
import { NotificationsMenu } from '@/components/notifications-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useAuth } from '@/contexts/auth-context'
import { getInitials } from '@/lib/utils'

// Barra fina só no mobile: lá a sidebar vira sheet, então conta e
// notificações precisam de um ponto de acesso persistente.
export function MobileTopbar() {
  const { user } = useAuth()

  return (
    <header className="bg-background sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b px-4 md:hidden">
      <SidebarTrigger className="-ml-1" />

      <div className="flex flex-1 items-center justify-end gap-1">
        <NotificationsMenu side="bottom" align="end" tooltip="Notificações">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Bell className="size-[1.125rem]" />
            <span className="sr-only">Notificações</span>
          </Button>
        </NotificationsMenu>

        <AccountMenu side="bottom" align="end" tooltip="Conta">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Avatar className="size-8">
              <AvatarImage src={user?.photoURL || undefined} />
              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                {getInitials(user?.displayName)}
              </AvatarFallback>
            </Avatar>
            <span className="sr-only">Conta</span>
          </Button>
        </AccountMenu>
      </div>
    </header>
  )
}
