import {
  Bell,
  Building2,
  ChevronDown,
  FileText,
  Home,
  LogOut,
  Receipt,
  Search,
  Settings,
  TrendingUp,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/contexts/auth-context'
import { cn } from '@/lib/utils'

type NavItem =
  | { title: string; href: string; children?: never }
  | {
      title: string
      href?: never
      children: { title: string; icon: React.ComponentType<{ className?: string }>; href: string }[]
    }

const navigation: NavItem[] = [
  { title: 'Início', href: '/dashboard' },
  { title: 'Clientes', href: '/customers' },
  {
    title: 'Comercial',
    children: [
      { title: 'Vendas', icon: TrendingUp, href: '/sales' },
      { title: 'Contratos', icon: FileText, href: '/contracts' },
      { title: 'Parcelas', icon: Receipt, href: '/installments' },
    ],
  },
  {
    title: 'Empreendimentos',
    children: [
      { title: 'Empreendimentos', icon: Building2, href: '/projects' },
      { title: 'Unidades', icon: Home, href: '/units' },
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

function NavDropdown({
  item,
  currentPath,
}: {
  item: Extract<NavItem, { children: unknown[] }>
  currentPath: string
}) {
  const isActive = item.children.some((child) => currentPath === child.href)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-full transition-colors whitespace-nowrap',
            isActive
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          )}
        >
          {item.title}
          <ChevronDown className="size-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={8}>
        {item.children.map((child) => (
          <DropdownMenuItem key={child.href} asChild>
            <a href={child.href} className={cn(currentPath === child.href && 'font-semibold')}>
              <child.icon className="mr-2 size-4" />
              {child.title}
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function TopNavbar() {
  const { user, signOut } = useAuth()
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/'

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm pt-4 pb-2">
      <nav className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 rounded-2xl bg-card px-6 shadow-sm border border-border/50">
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
        <div className="flex items-center gap-1 mx-auto">
          {navigation.map((item) => {
            if (item.children) {
              return <NavDropdown key={item.title} item={item} currentPath={currentPath} />
            }

            const isActive = currentPath === item.href
            return (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  'px-3.5 py-2 text-sm font-medium rounded-full transition-colors whitespace-nowrap',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                {item.title}
              </a>
            )
          })}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Search className="size-[18px]" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Settings className="size-[18px]" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full relative">
            <Bell className="size-[18px]" />
          </Button>

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
