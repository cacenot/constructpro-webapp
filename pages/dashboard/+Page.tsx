import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AppLayout } from '@/components/app-layout'
import { AgingCard } from '@/components/dashboard/aging-card'
import { CashflowCard } from '@/components/dashboard/cashflow-card'
import { DashboardVitals } from '@/components/dashboard/dashboard-vitals'
import { InventoryCard } from '@/components/dashboard/inventory-card'
import { SalesCard } from '@/components/dashboard/sales-card'
import { SectionHeader } from '@/components/dashboard/section-header'
import { useAuth } from '@/contexts/auth-context'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function getFirstName(name: string | null | undefined): string {
  if (!name) return ''
  return name.split(' ')[0] ?? ''
}

export default function DashboardPage() {
  const { user } = useAuth()
  const firstName = getFirstName(user?.displayName)
  const today = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })

  return (
    <AppLayout>
      <div className="space-y-8">
        <header className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            {getGreeting()}
            {firstName ? `, ${firstName}` : ''}
          </h1>
          <span className="text-sm text-muted-foreground first-letter:capitalize">{today}</span>
        </header>

        <DashboardVitals />

        <section className="space-y-3">
          <SectionHeader title="Financeiro" href="/financeiro" linkLabel="Ver financeiro" />
          <div className="grid items-start gap-4 lg:grid-cols-2">
            <AgingCard />
            <CashflowCard />
          </div>
        </section>

        <div className="grid items-start gap-x-4 gap-y-8 lg:grid-cols-2">
          <section className="space-y-3">
            <SectionHeader title="Vendas" href="/vendas" linkLabel="Ver vendas" />
            <SalesCard />
          </section>
          <section className="space-y-3">
            <SectionHeader
              title="Operacional"
              href="/empreendimentos"
              linkLabel="Ver empreendimentos"
            />
            <InventoryCard />
          </section>
        </div>
      </div>
    </AppLayout>
  )
}
