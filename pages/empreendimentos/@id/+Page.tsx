import { Building2, DollarSign, LayoutDashboard, TrendingUp } from 'lucide-react'
import { navigate } from 'vike/client/router'
import { usePageContext } from 'vike-react/usePageContext'
import { AppLayout } from '@/components/app-layout'
import { ProjectCommercialTab } from '@/components/empreendimentos/project-commercial-tab'
import { ProjectFinancialTab } from '@/components/empreendimentos/project-financial-tab'
import { ProjectHeroHeader } from '@/components/empreendimentos/project-hero-header'
import { ProjectOverviewTab } from '@/components/empreendimentos/project-overview-tab'
import { ProjectUnitsTab } from '@/components/empreendimentos/project-units-tab'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useProjectDetail } from '@/hooks/useProjects'

export default function ProjectDetailPage() {
  const pageContext = usePageContext()
  const projectId = Number(pageContext.routeParams?.id)

  const { data: project, isLoading, error } = useProjectDetail(projectId)

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-32" />
          <div className="flex flex-col gap-6 lg:flex-row lg:justify-between">
            <div className="space-y-3 flex-1">
              <Skeleton className="h-10 w-96" />
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-5 w-48" />
            </div>
            <Skeleton className="h-24 w-80" />
          </div>
          <Skeleton className="h-10 w-full max-w-md" />
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="col-span-2 h-24 lg:col-span-1" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-72" />
            <Skeleton className="h-72" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </AppLayout>
    )
  }

  if (error || !project) {
    return (
      <AppLayout>
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
          <p className="text-lg text-muted-foreground">Empreendimento nao encontrado</p>
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

        <Tabs defaultValue="visao-geral">
          <TabsList variant="line">
            <TabsTrigger value="visao-geral">
              <LayoutDashboard className="size-4" />
              Visao Geral
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

          <TabsContent value="visao-geral" className="mt-6">
            <ProjectOverviewTab project={project} />
          </TabsContent>

          <TabsContent value="unidades" className="mt-6">
            <ProjectUnitsTab project={project} />
          </TabsContent>

          <TabsContent value="comercial" className="mt-6">
            <ProjectCommercialTab project={project} />
          </TabsContent>

          <TabsContent value="financeiro" className="mt-6">
            <ProjectFinancialTab project={project} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
