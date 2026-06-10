import type { ReactNode } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { MobileTopbar } from '@/components/mobile-topbar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

interface AppLayoutProps {
  children: ReactNode
  /**
   * Modo console: a página ocupa exatamente a altura da viewport e não rola — só
   * as regiões internas (tabela, painel) rolam. Fixa altura definida na raiz para
   * o flex distribuir, e transforma o `<main>` numa coluna `overflow-hidden`.
   * Páginas em modo fill-height devem ter um filho `flex h-full min-h-0 flex-col`.
   */
  fillHeight?: boolean
}

export function AppLayout({ children, fillHeight = false }: AppLayoutProps) {
  return (
    <SidebarProvider className={cn(fillHeight && 'h-svh')}>
      <AppSidebar />
      <SidebarInset className={cn(fillHeight && 'min-h-0 overflow-hidden')}>
        <MobileTopbar />
        <main
          className={cn(
            fillHeight ? 'flex min-h-0 flex-1 flex-col overflow-hidden px-6 py-6' : 'px-6 py-6'
          )}
        >
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
