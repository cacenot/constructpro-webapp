import { useCreateProject } from '@cacenot/construct-pro-api-client'
import { toast } from 'sonner'
import { navigate } from 'vike/client/router'
import { AppLayout } from '@/components/app-layout'
import { ProjectForm } from '@/components/projects/project-form'
import { handleApiError } from '@/lib/api-error'
import type { ProjectCreateFormData } from '@/schemas/project.schema'

export default function ProjectNewPage() {
  const createMutation = useCreateProject()

  const handleBack = () => {
    navigate('/empreendimentos')
  }

  const handleSubmit = async (data: ProjectCreateFormData) => {
    try {
      await createMutation.mutateAsync({
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
      toast.success('Empreendimento cadastrado com sucesso!')
      navigate('/empreendimentos')
    } catch (error) {
      handleApiError(error, 'Erro ao cadastrar empreendimento')
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl">
        <ProjectForm
          onSubmit={handleSubmit}
          onBack={handleBack}
          isSubmitting={createMutation.isPending}
        />
      </div>
    </AppLayout>
  )
}
