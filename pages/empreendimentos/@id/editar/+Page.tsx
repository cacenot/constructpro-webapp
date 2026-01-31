import { useProject, useUpdateProject } from '@cacenot/construct-pro-api-client'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { navigate } from 'vike/client/router'
import { usePageContext } from 'vike-react/usePageContext'
import { AppLayout } from '@/components/app-layout'
import { ProjectForm } from '@/components/projects/project-form'
import { Button } from '@/components/ui/button'
import type { ProjectCreateFormData } from '@/schemas/project.schema'

export default function ProjectEditPage() {
  const pageContext = usePageContext()
  const projectId = Number(pageContext.routeParams?.id)

  const { data: project, isLoading, error } = useProject(projectId)
  const updateMutation = useUpdateProject(projectId)

  const handleBack = () => {
    navigate('/empreendimentos')
  }

  const handleSubmit = async (data: ProjectCreateFormData) => {
    try {
      await updateMutation.mutateAsync(data)
      toast.success('Empreendimento atualizado com sucesso!')
      navigate('/empreendimentos')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar empreendimento'
      toast.error(message)
      throw error
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    )
  }

  if (error || !project) {
    return (
      <AppLayout>
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
          <p className="text-lg text-muted-foreground">Empreendimento não encontrado</p>
          <Button variant="link" onClick={handleBack}>
            Voltar para lista
          </Button>
        </div>
      </AppLayout>
    )
  }

  // Map project data to form initial data
  const initialData: Partial<ProjectCreateFormData> = {
    name: project.name,
    status: project.status,
    description: project.description,
    address: project.address,
    number: project.number,
    district: project.district,
    city: project.city,
    state: project.state,
    postal_code: project.postal_code,
    floors: project.floors,
    delivery_date: project.delivery_date,
    features: project.features || [],
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl">
        <ProjectForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onBack={handleBack}
          isEdit
          isSubmitting={updateMutation.isPending}
        />
      </div>
    </AppLayout>
  )
}
