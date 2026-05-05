import { Bell, Check, LogOut, Moon, Settings } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useAuth } from '@/contexts/auth-context'
import { useTheme } from '@/hooks/use-theme'
import { useTenantStore } from '@/stores/tenant-store'

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function TopNavbar() {
  const { user, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const tenantId = useTenantStore((s) => s.tenantId)
  const tenants = useTenantStore((s) => s.tenants)
  const setTenantId = useTenantStore((s) => s.setTenantId)

  const activeTenant = tenants.find((t) => t.id === tenantId)

  const handleTenantSwitch = (id: string) => {
    if (id === tenantId) return
    setTenantId(id)
    window.location.reload()
  }

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-5" />

      <div className="flex flex-1 items-center justify-end gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full relative">
                <Bell className="size-4.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Notificações</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full ml-1">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.photoURL || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {getInitials(user?.displayName)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-60">
            <div className="px-3 py-2">
              <p className="text-sm font-medium">{user?.displayName || 'Usuário'}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />

            {/* Organização */}
            <DropdownMenuLabel className="text-xs text-muted-foreground font-medium">
              Organização
            </DropdownMenuLabel>
            {tenants.map((tenant) => (
              <DropdownMenuItem
                key={tenant.id}
                onClick={() => handleTenantSwitch(tenant.id)}
                className="flex items-center justify-between gap-2"
              >
                <span className="truncate">{tenant.name}</span>
                {tenant.id === tenantId && <Check className="size-4 shrink-0 text-primary" />}
              </DropdownMenuItem>
            ))}
            {!activeTenant && (
              <div className="px-2 py-1.5">
                <p className="text-xs text-muted-foreground">Nenhuma organização selecionada</p>
              </div>
            )}

            {/* Aparência */}
            <DropdownMenuLabel className="text-xs text-muted-foreground font-medium">
              Aparência
            </DropdownMenuLabel>
            <div className="flex items-center justify-between px-2 py-2 mx-1">
              <Label
                htmlFor="dark-mode"
                className="text-sm font-normal cursor-pointer flex items-center gap-2"
              >
                <Moon className="size-4" />
                Modo escuro
              </Label>
              <Switch
                id="dark-mode"
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              />
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/configuracoes">
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
