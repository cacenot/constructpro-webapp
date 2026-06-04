import { Building2, Check, LogOut, Settings } from 'lucide-react'
import type { ReactNode } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/contexts/auth-context'
import { useTenantStore } from '@/stores/tenant-store'

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

type Side = 'top' | 'bottom' | 'left' | 'right'
type Align = 'start' | 'center' | 'end'

// Menu da conta: identidade, troca de organização (só com 2+ tenants) e sair.
// Tema mora em Configurações. Trigger via children (linha da sidebar / avatar no mobile).
export function AccountMenu({
  children,
  side = 'top',
  align = 'start',
}: {
  children: ReactNode
  side?: Side
  align?: Align
}) {
  const { user, signOut } = useAuth()
  const tenantId = useTenantStore((s) => s.tenantId)
  const tenants = useTenantStore((s) => s.tenants)
  const setTenantId = useTenantStore((s) => s.setTenantId)
  const hasMultipleTenants = tenants.length > 1

  const handleTenantSwitch = (id: string) => {
    if (id === tenantId) return
    setTenantId(id)
    window.location.reload()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent side={side} align={align} sideOffset={8} className="w-60">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <Avatar className="size-8 rounded-md">
            <AvatarImage src={user?.photoURL || undefined} />
            <AvatarFallback className="rounded-md bg-primary/10 text-xs font-semibold text-primary">
              {getInitials(user?.displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-medium">{user?.displayName || 'Usuário'}</span>
            <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
          </div>
        </div>
        <DropdownMenuSeparator />

        {hasMultipleTenants && (
          <>
            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
              Organização
            </DropdownMenuLabel>
            {tenants.map((tenant) => (
              <DropdownMenuItem key={tenant.id} onClick={() => handleTenantSwitch(tenant.id)}>
                <Building2 />
                <span className="flex-1 truncate">{tenant.name}</span>
                {tenant.id === tenantId && <Check className="text-primary" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem asChild>
          <a href="/configuracoes">
            <Settings />
            Configurações
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => signOut()}>
          <LogOut />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
