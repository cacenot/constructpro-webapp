import { ChevronsLeft, ChevronsRight } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'
import { AccountMenu } from '@/components/account-menu'
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
  IcNotificacoes,
  IcOrganizacao,
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
  useSidebar,
} from '@/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAuth } from '@/contexts/auth-context'
import { useIsAdmin } from '@/hooks/use-is-admin'
import { useProfile } from '@/hooks/use-profile'
import { getInitials } from '@/lib/utils'
import { useTenantStore } from '@/stores/tenant-store'

type NavIcon = ComponentType<SVGProps<SVGSVGElement>>
type NavItem = { title: string; href: string; icon: NavIcon }

// Ícone 20px (duotone tem mais detalhe que linha), volta a 16px na rail colapsada;
// estado ativo on-brand (wash lima + ícone lima; lima reservada à "seleção atual").
const navButtonClass =
  '[&>svg]:size-5 group-data-[collapsible=icon]:[&>svg]:size-4 data-[active=true]:bg-primary/10 data-[active=true]:[&>svg]:text-primary'

const navMain: NavItem[] = [{ title: 'Início', href: '/dashboard', icon: IcInicio }]

const navDiretorio: NavItem[] = [
  { title: 'Clientes', href: '/clientes', icon: IcClientes },
  { title: 'Empreendimentos', href: '/empreendimentos', icon: IcEmpreendimentos },
  { title: 'Unidades', href: '/unidades', icon: IcUnidades },
  { title: 'Corretores', href: '/corretores', icon: IcCorretores },
  { title: 'Imobiliárias', href: '/imobiliarias', icon: IcImobiliarias },
]

const navComercial: NavItem[] = [
  { title: 'Vendas', href: '/vendas', icon: IcVendas },
  { title: 'Contratos', href: '/contratos', icon: IcContratos },
  { title: 'Comissões', href: '/comissoes', icon: IcComissoes },
]

const navFinanceiro: NavItem[] = [{ title: 'Financeiro', href: '/financeiro', icon: IcFinanceiro }]

// Só admin (a página /organizacao é restrita); gateado em AppSidebar.
const navAdministracao: NavItem[] = [
  { title: 'Organização', href: '/organizacao', icon: IcOrganizacao },
]

function isActive(href: string): boolean {
  if (typeof window === 'undefined') return false
  const path = window.location.pathname
  return path === href || path.startsWith(`${href}/`)
}

function WorkspaceHeader() {
  const tenantId = useTenantStore((s) => s.tenantId)
  const tenants = useTenantStore((s) => s.tenants)
  const company = tenants.find((t) => t.id === tenantId)?.name?.trim()
  const { state } = useSidebar()

  // Colapsada: só a marca, centralizada, ainda como link para o dashboard.
  // O recolher/expandir fica a cargo do botão flutuante na borda.
  if (state === 'collapsed') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <a
            href="/dashboard"
            aria-label={company ? `Costara, ${company}` : 'Costara'}
            className="ring-sidebar-ring hover:bg-sidebar-accent flex h-9 w-full items-center justify-center rounded-md outline-hidden transition-colors focus-visible:ring-2"
          >
            <CostaraMark className="h-7 w-auto text-primary" />
          </a>
        </TooltipTrigger>
        <TooltipContent side="right">{company ? `Costara · ${company}` : 'Costara'}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <a
      href="/dashboard"
      aria-label={company ? `Costara, ${company}` : 'Costara'}
      className="ring-sidebar-ring hover:bg-sidebar-accent flex min-h-9 items-center gap-3 rounded-md px-1.5 outline-hidden transition-colors focus-visible:ring-2"
    >
      <CostaraMark className="h-8 w-auto shrink-0 text-primary" />
      <span className="flex min-w-0 flex-col">
        <span className="text-base font-bold leading-tight tracking-tight">Costara</span>
        {company ? (
          <span className="text-sidebar-foreground/55 truncate text-sm leading-tight">
            {company}
          </span>
        ) : null}
      </span>
    </a>
  )
}

// Chip circular que flutua sobre a divisa sidebar↔conteúdo, alinhado ao header.
// Único gatilho visível de recolher/expandir (substitui a rail invisível).
function SidebarEdgeToggle() {
  const { state, toggleSidebar } = useSidebar()
  const collapsed = state === 'collapsed'
  const Icon = collapsed ? ChevronsRight : ChevronsLeft
  const label = collapsed ? 'Expandir menu' : 'Recolher menu'

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={label}
          className="bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground hover:border-sidebar-foreground/25 border-sidebar-border ring-sidebar-ring absolute top-16 right-0 z-20 hidden size-6 translate-x-1/2 items-center justify-center rounded-full border shadow-sm transition duration-150 ease-out after:absolute after:-inset-2 hover:scale-125 focus-visible:ring-2 focus-visible:outline-hidden motion-reduce:transition-none motion-reduce:hover:scale-100 md:flex"
        >
          <Icon className="size-3.5" />
          <span className="sr-only">{label}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
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
          <IcNotificacoes />
          <span className="sr-only">Notificações</span>
        </Button>
      </NotificationsMenu>
    </div>
  )
}

export function AppSidebar() {
  const { data: profile } = useProfile()
  const isAdmin = useIsAdmin(profile)

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="relative px-3 pt-6 pb-3">
        <WorkspaceHeader />
        <SidebarEdgeToggle />
      </SidebarHeader>

      <SidebarContent className="pt-3">
        <NavGroup items={navMain} />
        <NavGroup label="Diretório" items={navDiretorio} />
        <NavGroup label="Comercial" items={navComercial} />
        <NavGroup label="Financeiro" items={navFinanceiro} />
        {isAdmin && <NavGroup label="Administração" items={navAdministracao} />}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <FooterMenu />
      </SidebarFooter>
    </Sidebar>
  )
}
