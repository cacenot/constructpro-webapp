import type { ReactNode } from 'react'
import { TopNavbar } from '@/components/top-navbar'
import { TooltipProvider } from '@/components/ui/tooltip'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <TopNavbar />
        <main className="mx-auto max-w-[1400px] px-6 py-6">{children}</main>
      </div>
    </TooltipProvider>
  )
}
