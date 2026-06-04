import {
  Banknote,
  Building2,
  FileText,
  Landmark,
  Layers,
  LayoutDashboard,
  ReceiptText,
  Settings,
  ShoppingCart,
  UserCheck,
  Users,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'

const navMain = [{ title: 'Início', href: '/dashboard', icon: LayoutDashboard }]

const navOperacoes = [
  { title: 'Clientes', href: '/clientes', icon: Users },
  { title: 'Empreendimentos', href: '/empreendimentos', icon: Building2 },
  { title: 'Unidades', href: '/unidades', icon: Layers },
]

const navComercial = [
  { title: 'Vendas', href: '/vendas', icon: ShoppingCart },
  { title: 'Contratos', href: '/contratos', icon: FileText },
  { title: 'Corretores', href: '/corretores', icon: UserCheck },
  { title: 'Imobiliárias', href: '/imobiliarias', icon: Landmark },
  { title: 'Comissões', href: '/comissoes', icon: ReceiptText },
]

const navFinanceiro = [{ title: 'Financeiro', href: '/financeiro', icon: Banknote }]

function isActive(href: string): boolean {
  if (typeof window === 'undefined') return false
  const path = window.location.pathname
  return path === href || path.startsWith(`${href}/`)
}

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-3">
        <a href="/dashboard" className="flex h-9 items-center px-1.5">
          <span className="truncate text-lg font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
            Costara
          </span>
          <span className="hidden text-lg font-semibold tracking-tight group-data-[collapsible=icon]:block">
            C
          </span>
        </a>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {/* Principal */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navMain.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={item.title}
                    size="default"
                  >
                    <a href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Operações */}
        <SidebarGroup>
          <SidebarGroupLabel>Operações</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navOperacoes.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={item.title}
                    size="default"
                  >
                    <a href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Comercial */}
        <SidebarGroup>
          <SidebarGroupLabel>Comercial</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navComercial.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={item.title}
                    size="default"
                  >
                    <a href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Financeiro */}
        <SidebarGroup>
          <SidebarGroupLabel>Financeiro</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navFinanceiro.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={item.title}
                    size="default"
                  >
                    <a href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive('/configuracoes')}
                  tooltip="Configurações"
                  size="default"
                >
                  <a href="/configuracoes">
                    <Settings />
                    <span>Configurações</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
