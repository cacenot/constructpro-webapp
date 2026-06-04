import { Bell } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'
import { AccountMenu, getInitials } from '@/components/account-menu'
import { CostaraMark } from '@/components/costara-mark'
import {
  IcClientes,
  IcComissoes,
  IcContratos,
  IcCorretores,
  IcEmpreendimentos,
  IcFinanceiro,
  IcImobiliarias,
  IcInicio,
  IcUnidades,
  IcVendas,
} from '@/components/icons/nav-icons'
import { NotificationsMenu } from '@/components/notifications-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
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
  useSidebar,
} from '@/components/ui/sidebar'
import { useAuth } from '@/contexts/auth-context'
import { useTenantStore } from '@/stores/tenant-store'

type NavIcon = ComponentType<SVGProps<SVGSVGElement>>
type NavItem = { title: string; href: string; icon: NavIcon }

// Ícone 20px (duotone tem mais detalhe que linha), volta a 16px na rail colapsada;
// estado ativo on-brand (wash lima + ícone lima; lima reservada à "seleção atual").
const navButtonClass =
  '[&>svg]:size-5 group-data-[collapsible=icon]:[&>svg]:size-4 data-[active=true]:bg-primary/10 data-[active=true]:[&>svg]:text-primary'

const navMain: NavItem[] = [{ title: 'Início', href: '/dashboard', icon: IcInicio }]

const navOperacoes: NavItem[] = [
  { title: 'Clientes', href: '/clientes', icon: IcClientes },
  { title: 'Empreendimentos', href: '/empreendimentos', icon: IcEmpreendimentos },
  { title: 'Unidades', href: '/unidades', icon: IcUnidades },
]

const navComercial: NavItem[] = [
  { title: 'Vendas', href: '/vendas', icon: IcVendas },
  { title: 'Contratos', href: '/contratos', icon: IcContratos },
  { title: 'Corretores', href: '/corretores', icon: IcCorretores },
  { title: 'Imobiliárias', href: '/imobiliarias', icon: IcImobiliarias },
  { title: 'Comissões', href: '/comissoes', icon: IcComissoes },
]

const navFinanceiro: NavItem[] = [{ title: 'Financeiro', href: '/financeiro', icon: IcFinanceiro }]

function isActive(href: string): boolean {
  if (typeof window === 'undefined') return false
  const path = window.location.pathname
  return path === href || path.startsWith(`${href}/`)
}

function WorkspaceHeader() {
  const tenantId = useTenantStore((s) => s.tenantId)
  const tenants = useTenantStore((s) => s.tenants)
  const company = tenants.find((t) => t.id === tenantId)?.name?.trim()

  return (
    <a
      href="/dashboard"
      aria-label={company ? `Costara, ${company}` : 'Costara'}
      className="flex min-h-9 items-center gap-2 rounded-md px-1.5 outline-hidden ring-sidebar-ring transition-colors hover:bg-sidebar-accent focus-visible:ring-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0"
    >
      <CostaraMark className="h-6 w-auto shrink-0 text-primary" />
      <span className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
        <span className="text-sm font-bold leading-tight tracking-tight">Costara</span>
        {company ? (
          <span className="text-sidebar-foreground/55 truncate text-xs leading-tight">
            {company}
          </span>
        ) : null}
      </span>
    </a>
  )
}

function NavGroup({ label, items }: { label?: string; items: NavItem[] }) {
  return (
    <SidebarGroup>
      {label ? <SidebarGroupLabel>{label}</SidebarGroupLabel> : null}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const active = isActive(item.href)
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  tooltip={item.title}
                  size="default"
                  className={navButtonClass}
                >
                  <a href={item.href} aria-current={active ? 'page' : undefined}>
                    <item.icon />
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

function FooterMenu() {
  const { user } = useAuth()
  const { state } = useSidebar()
  const collapsed = state === 'collapsed'

  return (
    <div className="flex items-center gap-1 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-1">
      <AccountMenu side="right" align="end" tooltip={collapsed ? 'Conta' : undefined}>
        <SidebarMenuButton size="lg" className="flex-1 group-data-[collapsible=icon]:flex-none">
          <Avatar className="size-8 rounded-md">
            <AvatarImage src={user?.photoURL || undefined} />
            <AvatarFallback className="rounded-md bg-primary/10 text-xs font-semibold text-primary">
              {getInitials(user?.displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col text-left leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-medium">{user?.displayName || 'Usuário'}</span>
            <span className="text-sidebar-foreground/55 truncate text-xs">{user?.email}</span>
          </div>
        </SidebarMenuButton>
      </AccountMenu>

      <NotificationsMenu side="right" align="end" tooltip="Notificações">
        <Button
          variant="ghost"
          size="icon"
          className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground size-9 shrink-0 [&_svg]:size-5"
        >
          <Bell />
          <span className="sr-only">Notificações</span>
        </Button>
      </NotificationsMenu>
    </div>
  )
}

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-3">
        <WorkspaceHeader />
      </SidebarHeader>

      <SidebarContent>
        <NavGroup items={navMain} />
        <NavGroup label="Operações" items={navOperacoes} />
        <NavGroup label="Comercial" items={navComercial} />
        <NavGroup label="Financeiro" items={navFinanceiro} />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <FooterMenu />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
