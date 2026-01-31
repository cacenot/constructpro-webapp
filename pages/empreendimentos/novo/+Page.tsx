import { useCreateProject } from '@cacenot/construct-pro-api-client'
import { toast } from 'sonner'
import { navigate } from 'vike/client/router'
import { AppLayout } from '@/components/app-layout'
import { ProjectForm } from '@/components/projects/project-form'
import type { ProjectCreateFormData } from '@/schemas/project.schema'

export default function ProjectNewPage() {
  const createMutation = useCreateProject()

  const handleBack = () => {
    navigate('/empreendimentos')
  }

  const handleSubmit = async (data: ProjectCreateFormData) => {
    try {
      await createMutation.mutateAsync(data)
      toast.success('Empreendimento cadastrado com sucesso!')
      navigate('/empreendimentos')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao cadastrar empreendimento'
      toast.error(message)
      throw error
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
