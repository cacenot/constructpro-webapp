import { ArrowDownRight, ArrowUpRight, ChevronDown, Download } from 'lucide-react'
import { AppLayout } from '@/components/app-layout'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'

// -- Mock data representing a real tenant's state --

const kpis = [
  { label: 'Unidades disponíveis', value: '47', change: '+3 este mês', trend: 'up' as const },
  { label: 'Vendas em andamento', value: '12', change: '+2 esta semana', trend: 'up' as const },
  { label: 'Contratos ativos', value: '89', change: '3 inadimplentes', trend: 'down' as const },
  {
    label: 'Recebimentos do mês',
    value: 'R$ 342.580',
    change: '+12% vs. anterior',
    trend: 'up' as const,
  },
]

const recentSales = [
  {
    id: 1,
    customer: 'Maria Silva',
    code: 'AP-302',
    unit: 'Residencial Aurora',
    status: 'offer' as const,
    amount: 'R$ 485.000',
  },
  {
    id: 2,
    customer: 'João Oliveira',
    code: 'AP-105',
    unit: 'Edifício Solar',
    status: 'reserved' as const,
    amount: 'R$ 320.000',
  },
  {
    id: 3,
    customer: 'Ana Costa',
    code: 'CA-12',
    unit: 'Cond. Verde Vale',
    status: 'closed' as const,
    amount: 'R$ 670.000',
  },
  {
    id: 4,
    customer: 'Carlos Mendes',
    code: 'AP-801',
    unit: 'Torre Premium',
    status: 'offer' as const,
    amount: 'R$ 890.000',
  },
  {
    id: 5,
    customer: 'Fernanda Lima',
    code: 'ST-04',
    unit: 'Connect Hub',
    status: 'lost' as const,
    amount: 'R$ 215.000',
  },
]

const projects = [
  {
    name: 'Residencial Aurora',
    progress: 72,
    units: 48,
    sold: 31,
    status: 'construction' as const,
  },
  { name: 'Edifício Solar', progress: 45, units: 24, sold: 18, status: 'construction' as const },
  { name: 'Cond. Verde Vale', progress: 100, units: 32, sold: 32, status: 'finished' as const },
  { name: 'Torre Premium', progress: 28, units: 60, sold: 8, status: 'construction' as const },
]

const overdueInstallments = [
  { customer: 'Roberto Santos', contract: 'CT-2024-0042', amount: 'R$ 4.166,67', daysOverdue: 15 },
  { customer: 'Patricia Alves', contract: 'CT-2024-0078', amount: 'R$ 2.500,00', daysOverdue: 8 },
  { customer: 'Marcos Ferreira', contract: 'CT-2025-0003', amount: 'R$ 6.833,33', daysOverdue: 3 },
]

const saleStatus = {
  offer: { label: 'Proposta', cls: 'badge--proposta' },
  reserved: { label: 'Reservado', cls: 'badge--reservado' },
  closed: { label: 'Fechado', cls: 'badge--fechado' },
  lost: { label: 'Perdido', cls: 'badge--perdido' },
} as const

const projectFill = {
  construction: 'bg-info',
  finished: 'bg-success',
} as const

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

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
              <span className="inline-block size-1.5 rounded-full bg-primary shadow-[0_0_8px] shadow-primary/70" />
              Painel operacional
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              {getGreeting()}
              {firstName ? `, ${firstName}` : ''}
            </h1>
            <p className="text-sm text-muted-foreground">
              Funil, empreendimentos e financeiro em um só lugar.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              Último mês
              <ChevronDown className="size-4" />
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="size-4" />
              Exportar
            </Button>
          </div>
        </header>

        {/* KPI strip — painel de instrumentos, hairlines no lugar de cards */}
        <section className="overflow-hidden rounded-lg border border-border bg-border shadow-sm">
          <div className="grid grid-cols-2 gap-px lg:grid-cols-4">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="bg-card px-5 py-4 lg:px-6 lg:py-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  {kpi.label}
                </p>
                <p className="mt-2.5 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                  {kpi.value}
                </p>
                <p
                  className={`mt-1.5 flex items-center gap-1 text-xs tabular-nums ${
                    kpi.trend === 'up' ? 'text-success' : 'text-destructive'
                  }`}
                >
                  {kpi.trend === 'up' ? (
                    <ArrowUpRight className="size-3.5" />
                  ) : (
                    <ArrowDownRight className="size-3.5" />
                  )}
                  {kpi.change}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Funil + obras */}
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Vendas recentes */}
          <section className="rounded-lg border border-border bg-card shadow-sm lg:col-span-3">
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="text-sm font-semibold text-foreground">Vendas recentes</h2>
              <a
                href="/vendas"
                className="text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                Ver todas
              </a>
            </div>
            <div className="border-t border-border">
              {recentSales.map((sale) => {
                const cfg = saleStatus[sale.status]
                return (
                  <a
                    key={sale.id}
                    href={`/vendas/${sale.id}`}
                    className="flex items-center justify-between gap-3 border-b border-border/50 px-5 py-3 transition-colors last:border-b-0 hover:bg-elevated"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {sale.customer}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        <span className="font-mono text-[11px] tracking-tight text-muted-foreground/80">
                          {sale.code}
                        </span>
                        <span className="mx-1.5 text-muted-foreground/40">·</span>
                        {sale.unit}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
                      <span className="w-24 text-right text-sm font-medium tabular-nums text-foreground">
                        {sale.amount}
                      </span>
                    </div>
                  </a>
                )
              })}
            </div>
          </section>

          {/* Empreendimentos */}
          <section className="rounded-lg border border-border bg-card shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="text-sm font-semibold text-foreground">Empreendimentos</h2>
              <a
                href="/empreendimentos"
                className="text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                Ver todos
              </a>
            </div>
            <div className="space-y-5 border-t border-border px-5 py-5">
              {projects.map((project) => (
                <div key={project.name} className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-foreground">
                      {project.name}
                    </span>
                    <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                      {project.sold}/{project.units}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sunken">
                      <div
                        className={`h-full rounded-full ${projectFill[project.status]}`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <span className="w-9 shrink-0 text-right text-xs font-medium tabular-nums text-muted-foreground">
                      {project.progress}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Alerta — parcelas em atraso (borda completa, sem side-stripe) */}
        {overdueInstallments.length > 0 && (
          <section className="overflow-hidden rounded-lg border border-destructive/30 bg-destructive/[0.05] shadow-sm">
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="flex items-center gap-2.5 text-sm font-semibold text-destructive">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive/60" />
                  <span className="relative inline-flex size-2 rounded-full bg-destructive" />
                </span>
                Parcelas em atraso
              </h2>
              <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-semibold tabular-nums text-destructive">
                {overdueInstallments.length}
              </span>
            </div>
            <div className="border-t border-destructive/20">
              {overdueInstallments.map((item) => (
                <div
                  key={item.contract}
                  className="flex items-center justify-between gap-3 border-b border-destructive/10 px-5 py-3 last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{item.customer}</p>
                    <p className="font-mono text-xs text-muted-foreground">{item.contract}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <span className="text-xs font-medium tabular-nums text-destructive">
                      {item.daysOverdue}d em atraso
                    </span>
                    <span className="w-24 text-right text-sm font-medium tabular-nums text-foreground">
                      {item.amount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  )
}
