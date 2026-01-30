import {
  Building2,
  ChevronUp,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  Receipt,
  Settings,
  TrendingUp,
  Users,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { useAuth } from '@/contexts/auth-context'

const navigation = [
  {
    label: 'Geral',
    items: [{ title: 'Painel', icon: LayoutDashboard, href: '/dashboard' }],
  },
  {
    label: 'Comercial',
    items: [
      { title: 'Empreendimentos', icon: Building2, href: '/projects' },
      { title: 'Unidades', icon: Home, href: '/units' },
      { title: 'Clientes', icon: Users, href: '/customers' },
      { title: 'Vendas', icon: TrendingUp, href: '/sales' },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      { title: 'Contratos', icon: FileText, href: '/contracts' },
      { title: 'Parcelas', icon: Receipt, href: '/installments' },
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

export function AppSidebar() {
  const { user, signOut } = useAuth()
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/'

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-3.5">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-sm font-bold tracking-tight shadow-sm">
            CP
          </div>
          <div className="flex flex-col gap-0.5 overflow-hidden">
            <span className="truncate text-sm font-semibold tracking-tight text-sidebar-foreground">
              ConstructPro
            </span>
            <span className="truncate text-[11px] text-sidebar-foreground/50 font-medium">
              Gerenciamento
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="pt-1">
        {navigation.map((group, index) => (
          <div key={group.label}>
            {index > 0 && <SidebarSeparator className="my-1 mx-3 opacity-30" />}
            <SidebarGroup>
              <SidebarGroupLabel className="text-[11px] uppercase tracking-widest text-sidebar-foreground/50 font-semibold px-3 mb-0.5">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={currentPath === item.href}
                        tooltip={item.title}
                        className="h-9 px-3 gap-3 font-medium text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent/80 data-[active=true]:bg-sidebar-primary/15 data-[active=true]:text-sidebar-primary data-[active=true]:font-semibold"
                      >
                        <a href={item.href}>
                          <item.icon className="!size-[18px]" />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </div>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent h-14 px-3 gap-3"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-sidebar-primary/20 text-sidebar-primary text-xs font-semibold">
                      {getInitials(user?.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5 overflow-hidden text-left">
                    <span className="truncate text-sm font-medium text-sidebar-foreground">
                      {user?.displayName || 'Usuário'}
                    </span>
                    <span className="truncate text-[11px] text-sidebar-foreground/45">
                      {user?.email}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto h-4 w-4 shrink-0 text-sidebar-foreground/40" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" side="top" align="start" sideOffset={8}>
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
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
