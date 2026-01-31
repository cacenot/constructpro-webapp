import { Bell, LogOut, Moon, Search, Settings } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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

type NavItem =
  | { title: string; href: string; children?: never }
  | {
      title: string
      href?: never
      children: { title: string; description: string; href: string }[]
    }

const navigation: NavItem[] = [
  { title: 'Início', href: '/dashboard' },
  { title: 'Clientes', href: '/customers' },
  {
    title: 'Comercial',
    children: [
      { title: 'Vendas', description: 'Gerencie suas vendas e oportunidades', href: '/sales' },
      {
        title: 'Contratos',
        description: 'Controle seus contratos e documentos',
        href: '/contracts',
      },
      {
        title: 'Parcelas',
        description: 'Acompanhe pagamentos e recebimentos',
        href: '/installments',
      },
    ],
  },
  {
    title: 'Empreendimentos',
    children: [
      {
        title: 'Empreendimentos',
        description: 'Cadastre e gerencie seus empreendimentos',
        href: '/projects',
      },
      { title: 'Unidades', description: 'Controle unidades e disponibilidade', href: '/units' },
    ],
  },
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
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/'

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm pt-4 pb-2">
      <nav className="mx-auto flex h-16 max-w-7xl items-center gap-4 rounded-xl bg-card px-6 shadow-sm border border-border">
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
                const isActive = item.children.some((child) => currentPath === child.href)

                return (
                  <NavigationMenuItem key={item.title}>
                    <NavigationMenuTrigger
                      className={cn(
                        'px-3.5 py-2 text-sm font-medium !rounded-full transition-colors whitespace-nowrap h-auto bg-accent/50',
                        isActive
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90 data-[state=open]:bg-primary/90'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent data-[state=open]:bg-accent'
                      )}
                    >
                      {item.title}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="w-[400px] p-2">
                        <ul className="space-y-1">
                          {item.children.map((child) => (
                            <ListItem
                              key={child.href}
                              title={child.title}
                              href={child.href}
                              description={child.description}
                              isActive={currentPath === child.href}
                            />
                          ))}
                        </ul>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                )
              }

              const isActive = currentPath === item.href
              return (
                <NavigationMenuItem key={item.href}>
                  <NavigationMenuLink asChild>
                    <a
                      href={item.href}
                      className={cn(
                        'px-3.5 py-2 text-sm font-medium !rounded-full transition-colors whitespace-nowrap inline-flex items-center bg-accent/50',
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
                  <Search className="size-[18px]" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Buscar</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Settings className="size-[18px]" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Configurações</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full relative">
                  <Bell className="size-[18px]" />
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
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {getInitials(user?.displayName)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-56">
              <div className="px-3 py-2">
                <p className="text-sm font-medium">{user?.displayName || 'Usuário'}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
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
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Configurações
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
