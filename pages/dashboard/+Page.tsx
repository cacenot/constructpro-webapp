import {
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  ChevronDown,
  DollarSign,
  Download,
  FileText,
  Home,
  TrendingUp,
  Users,
} from 'lucide-react'
import { AppLayout } from '@/components/app-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/contexts/auth-context'

// -- Mock data representing a real tenant's state --

const metrics = [
  {
    title: 'Unidades Disponíveis',
    value: '47',
    change: '+3 este mês',
    trend: 'up' as const,
    icon: Home,
  },
  {
    title: 'Vendas em Andamento',
    value: '12',
    change: '+2 esta semana',
    trend: 'up' as const,
    icon: TrendingUp,
  },
  {
    title: 'Contratos Ativos',
    value: '89',
    change: '3 inadimplentes',
    trend: 'down' as const,
    icon: FileText,
  },
  {
    title: 'Recebimentos do Mês',
    value: 'R$ 342.580',
    change: '+12% vs mês anterior',
    trend: 'up' as const,
    icon: DollarSign,
  },
]

const recentSales = [
  {
    id: 1,
    customer: 'Maria Silva',
    unit: 'Apt 302 - Residencial Aurora',
    status: 'offer' as const,
    amount: 'R$ 485.000',
    date: '27/01/2026',
  },
  {
    id: 2,
    customer: 'João Oliveira',
    unit: 'Apt 105 - Edifício Solar',
    status: 'reserved' as const,
    amount: 'R$ 320.000',
    date: '25/01/2026',
  },
  {
    id: 3,
    customer: 'Ana Costa',
    unit: 'Casa 12 - Cond. Verde Vale',
    status: 'closed' as const,
    amount: 'R$ 670.000',
    date: '22/01/2026',
  },
  {
    id: 4,
    customer: 'Carlos Mendes',
    unit: 'Apt 801 - Torre Premium',
    status: 'offer' as const,
    amount: 'R$ 890.000',
    date: '20/01/2026',
  },
  {
    id: 5,
    customer: 'Fernanda Lima',
    unit: 'Studio 04 - Connect Hub',
    status: 'lost' as const,
    amount: 'R$ 215.000',
    date: '18/01/2026',
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

const saleStatusConfig = {
  offer: {
    label: 'Proposta',
    className:
      'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300',
  },
  reserved: {
    label: 'Reservado',
    className:
      'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-300',
  },
  closed: {
    label: 'Fechado',
    className:
      'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300',
  },
  lost: {
    label: 'Perdido',
    className:
      'border-red-500/30 bg-red-500/10 text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300',
  },
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

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page header with greeting */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {getGreeting()}, {getFirstName(user?.displayName)}!
            </h1>
            <p className="mt-1 text-muted-foreground">
              Seus empreendimentos, vendas e financeiro — tudo em um só lugar.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              Último mês
              <ChevronDown className="size-4" />
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="size-4" />
              Exportar relatório
            </Button>
          </div>
        </div>

        {/* Metric cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <Card key={metric.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
                <metric.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight">{metric.value}</div>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  {metric.trend === 'up' ? (
                    <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />
                  )}
                  {metric.change}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Recent sales — takes 3 cols */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Vendas Recentes</CardTitle>
                <a href="/sales" className="text-xs font-medium text-primary hover:underline">
                  Ver todas
                </a>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {recentSales.map((sale) => {
                  const statusCfg = saleStatusConfig[sale.status]
                  return (
                    <div key={sale.id} className="flex items-center justify-between px-6 py-3">
                      <div className="flex flex-col gap-0.5 overflow-hidden">
                        <span className="truncate text-sm font-medium">{sale.customer}</span>
                        <span className="truncate text-xs text-muted-foreground">{sale.unit}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge variant="secondary" className={statusCfg.className}>
                          {statusCfg.label}
                        </Badge>
                        <span className="text-sm font-medium tabular-nums w-24 text-right">
                          {sale.amount}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Projects progress — takes 2 cols */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Empreendimentos</CardTitle>
                <a href="/projects" className="text-xs font-medium text-primary hover:underline">
                  Ver todos
                </a>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {projects.map((project) => (
                <div key={project.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{project.name}</span>
                    </div>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {project.sold}/{project.units} vendidas
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={project.progress} className="h-1.5 flex-1" />
                    <span className="text-xs tabular-nums font-medium w-9 text-right">
                      {project.progress}%
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Overdue installments alert */}
        {overdueInstallments.length > 0 && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-destructive">
                  <Users className="h-4 w-4" />
                  Parcelas em Atraso
                </CardTitle>
                <Badge variant="destructive" className="text-xs">
                  {overdueInstallments.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-destructive/20">
                {overdueInstallments.map((item) => (
                  <div key={item.contract} className="flex items-center justify-between px-6 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{item.customer}</span>
                      <span className="text-xs text-muted-foreground">{item.contract}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-destructive font-medium">
                        {item.daysOverdue}d atraso
                      </span>
                      <span className="text-sm font-medium tabular-nums w-24 text-right">
                        {item.amount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
