import { useProject, useUpdateProject } from '@cacenot/construct-pro-api-client'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { navigate } from 'vike/client/router'
import { usePageContext } from 'vike-react/usePageContext'
import { AppLayout } from '@/components/app-layout'
import { ProjectForm } from '@/components/projects/project-form'
import { Button } from '@/components/ui/button'
import { handleApiError } from '@/lib/api-error'
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
      await updateMutation.mutateAsync({
        ...data,
        total_area: data.total_area || null,
        cnpj: data.cnpj ? data.cnpj.replace(/\D/g, '') || null : null,
        legal_name: data.legal_name || null,
        trade_name: data.trade_name || null,
        state_registration: data.state_registration || null,
        municipal_registration: data.municipal_registration || null,
        incorporation_registry_number: data.incorporation_registry_number || null,
        mother_property_registration: data.mother_property_registration || null,
        cno: data.cno || null,
        construction_permit_number: data.construction_permit_number || null,
        occupancy_permit_number: data.occupancy_permit_number || null,
      })
      toast.success('Empreendimento atualizado com sucesso!')
      navigate('/empreendimentos')
    } catch (error) {
      handleApiError(error, 'Erro ao atualizar empreendimento')
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
    total_area: project.total_area,
    cnpj: project.cnpj,
    legal_name: project.legal_name,
    trade_name: project.trade_name,
    state_registration: project.state_registration,
    municipal_registration: project.municipal_registration,
    incorporation_registry_number: project.incorporation_registry_number,
    mother_property_registration: project.mother_property_registration,
    cno: project.cno,
    construction_permit_number: project.construction_permit_number,
    occupancy_permit_number: project.occupancy_permit_number,
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl">
        <ProjectForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onBack={handleBack}
          backHref={`/empreendimentos/${projectId}`}
          isEdit
          isSubmitting={updateMutation.isPending}
        />
      </div>
    </AppLayout>
  )
}
