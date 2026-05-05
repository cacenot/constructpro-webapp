import type { ReactNode } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { TopNavbar } from '@/components/top-navbar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <TopNavbar />
        <main className="px-6 py-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
