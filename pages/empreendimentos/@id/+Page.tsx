import { Building2, DollarSign, LayoutDashboard, TrendingUp } from 'lucide-react'
import { navigate } from 'vike/client/router'
import { usePageContext } from 'vike-react/usePageContext'
import { AppLayout } from '@/components/app-layout'
import { ProjectCommercialTab } from '@/components/empreendimentos/project-commercial-tab'
import { ProjectFinancialTab } from '@/components/empreendimentos/project-financial-tab'
import { ProjectHeroHeader } from '@/components/empreendimentos/project-hero-header'
import { ProjectOverviewTab } from '@/components/empreendimentos/project-overview-tab'
import { ProjectUnitsTab } from '@/components/empreendimentos/project-units-tab'
import { ProjectVitalsStrip } from '@/components/empreendimentos/project-vitals-strip'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useProjectDetail } from '@/hooks/useProjects'

// Revelar o conteúdo ao trocar de aba: fade + slide-up sutil (4px), 200ms.
// Suaviza o swap instantâneo entre vistas densas. Neutralizado em reduced-motion.
const TAB_CONTENT_MOTION = 'mt-6 animate-in fade-in-0 slide-in-from-bottom-1 duration-200 ease-out'

function ProjectDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />

      <div className="flex flex-col gap-5 lg:flex-row lg:justify-between">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-5 w-80" />
          <Skeleton className="h-5 w-56" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border lg:grid-cols-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-none" />
        ))}
      </div>

      <Skeleton className="h-10 w-full max-w-md" />

      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    </div>
  )
}

export default function ProjectDetailPage() {
  const pageContext = usePageContext()
  const projectId = Number(pageContext.routeParams?.id)

  const { data: project, isLoading, error } = useProjectDetail(projectId)

  if (isLoading) {
    return (
      <AppLayout>
        <ProjectDetailSkeleton />
      </AppLayout>
    )
  }

  if (error || !project) {
    return (
      <AppLayout>
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
          <p className="text-lg text-muted-foreground">Empreendimento não encontrado</p>
          <Button variant="link" onClick={() => navigate('/empreendimentos')}>
            Voltar para lista
          </Button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <ProjectHeroHeader project={project} />

        <ProjectVitalsStrip
          unitSummary={project.unit_summary}
          financialSummary={project.financial_summary}
        />

        <Tabs defaultValue="visao-geral">
          <TabsList variant="line">
            <TabsTrigger value="visao-geral">
              <LayoutDashboard className="size-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="unidades">
              <Building2 className="size-4" />
              Unidades
            </TabsTrigger>
            <TabsTrigger value="comercial">
              <TrendingUp className="size-4" />
              Comercial
            </TabsTrigger>
            <TabsTrigger value="financeiro">
              <DollarSign className="size-4" />
              Financeiro
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visao-geral" className={TAB_CONTENT_MOTION}>
            <ProjectOverviewTab project={project} />
          </TabsContent>

          <TabsContent value="unidades" className={TAB_CONTENT_MOTION}>
            <ProjectUnitsTab project={project} />
          </TabsContent>

          <TabsContent value="comercial" className={TAB_CONTENT_MOTION}>
            <ProjectCommercialTab project={project} />
          </TabsContent>

          <TabsContent value="financeiro" className={TAB_CONTENT_MOTION}>
            <ProjectFinancialTab project={project} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
