import { Bell, Check, LogOut, Moon, Search, Settings } from 'lucide-react'
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
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useAuth } from '@/contexts/auth-context'
import { useTheme } from '@/hooks/use-theme'
import { cn } from '@/lib/utils'
import { useTenantStore } from '@/stores/tenant-store'

type NavItem =
  | { title: string; href: string; children?: never }
  | {
      title: string
      href?: never
      children: { title: string; description: string; href: string }[]
    }

const navigation: NavItem[] = [
  { title: 'Início', href: '/dashboard' },
  { title: 'Clientes', href: '/clientes' },
  {
    title: 'Empreendimentos',
    children: [
      {
        title: 'Empreendimentos',
        description: 'Cadastre e gerencie seus empreendimentos',
        href: '/empreendimentos',
      },
      { title: 'Unidades', description: 'Controle unidades e disponibilidade', href: '/unidades' },
    ],
  },
  {
    title: 'Comercial',
    children: [
      { title: 'Vendas', description: 'Gerencie suas vendas e oportunidades', href: '/vendas' },
      {
        title: 'Contratos',
        description: 'Controle seus contratos e documentos',
        href: '/contratos',
      },
    ],
  },
  { title: 'Financeiro', href: '/financeiro' },
]

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const ListItem = ({
  title,
  href,
  description,
  isActive,
}: {
  title: string
  href: string
  description: string
  isActive: boolean
}) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          href={href}
          className={cn(
            'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
            isActive && 'bg-accent'
          )}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">{description}</p>
        </a>
      </NavigationMenuLink>
    </li>
  )
}

export function TopNavbar() {
  const { user, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const tenantId = useTenantStore((s) => s.tenantId)
  const tenants = useTenantStore((s) => s.tenants)
  const setTenantId = useTenantStore((s) => s.setTenantId)
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/'
  const isPathActive = (href: string) => currentPath === href || currentPath.startsWith(`${href}/`)

  const activeTenant = tenants.find((t) => t.id === tenantId)

  const handleTenantSwitch = (id: string) => {
    if (id === tenantId) return
    setTenantId(id)
    window.location.reload()
  }

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm pt-4 pb-2">
      <nav className="mx-auto flex h-16 max-w-350 items-center gap-4 rounded-xl bg-card px-6 shadow-sm border border-border">
        {/* Logo */}
        <a href="/dashboard" className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-sm">
            CP
          </div>
          <span className="text-base font-semibold tracking-tight hidden lg:block">
            ConstructPro
          </span>
        </a>

        {/* Navigation Tabs */}
        <NavigationMenu className="mx-auto">
          <NavigationMenuList className="gap-1">
            {navigation.map((item) => {
              if (item.children) {
                const isActive = item.children.some((child) => isPathActive(child.href))

                return (
                  <NavigationMenuItem key={item.title}>
                    <NavigationMenuTrigger
                      className={cn(
                        'px-3.5 py-2 text-sm font-medium rounded-full! transition-colors whitespace-nowrap h-auto bg-accent/50',
                        isActive
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90 data-[state=open]:bg-primary/90'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent data-[state=open]:bg-accent'
                      )}
                    >
                      {item.title}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="w-100 p-2">
                        <ul className="space-y-1">
                          {item.children.map((child) => (
                            <ListItem
                              key={child.href}
                              title={child.title}
                              href={child.href}
                              description={child.description}
                              isActive={isPathActive(child.href)}
                            />
                          ))}
                        </ul>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                )
              }

              const isActive = isPathActive(item.href)
              return (
                <NavigationMenuItem key={item.href}>
                  <NavigationMenuLink asChild>
                    <a
                      href={item.href}
                      className={cn(
                        'px-3.5 py-2 text-sm font-medium rounded-full! transition-colors whitespace-nowrap inline-flex items-center bg-accent/50',
                        isActive
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      )}
                    >
                      {item.title}
                    </a>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              )
            })}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Search className="size-4.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Buscar</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full" asChild>
                  <a href="/configuracoes">
                    <Settings className="size-4.5" />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Configurações</p>
              </TooltipContent>
            </Tooltip>
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
      </nav>
    </header>
  )
}
