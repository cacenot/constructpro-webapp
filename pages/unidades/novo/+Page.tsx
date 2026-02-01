import { useApiClient } from '@cacenot/construct-pro-api-client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { navigate } from 'vike/client/router'
import { AppLayout } from '@/components/app-layout'
import { UnitForm } from '@/components/unidades/unit-form'
import type { UnitFormData } from '@/schemas/unit.schema'

export default function UnitNewPage() {
  const { client } = useApiClient()
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: async (data: UnitFormData) => {
      const { data: result, error } = await client.POST('/api/v1/units', {
        body: {
          name: data.name,
          category: data.category,
          project_id: data.project_id,
          area: data.area,
          price_cents: data.price_cents,
          description: data.description ?? undefined,
          apartment_type: data.apartment_type ?? undefined,
          bedrooms: data.bedrooms ?? undefined,
          bathrooms: data.bathrooms ?? undefined,
          garages: data.garages ?? undefined,
          floor: data.floor ?? undefined,
          features: data.features ?? undefined,
        },
      })

      if (error) {
        throw new Error('Falha ao cadastrar unidade')
      }

      return result
    },
    onSuccess: () => {
      // Invalidate units query to refetch list
      queryClient.invalidateQueries({ queryKey: ['units'] })
    },
  })

  const handleBack = () => {
    navigate('/unidades')
  }

  const handleSubmit = async (data: UnitFormData) => {
    try {
      await createMutation.mutateAsync(data)
      toast.success('Unidade cadastrada com sucesso!')
      navigate('/unidades')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao cadastrar unidade'
      toast.error(message)
      throw error
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl">
        <UnitForm
          onSubmit={handleSubmit}
          onBack={handleBack}
          isSubmitting={createMutation.isPending}
        />
      </div>
    </AppLayout>
  )
}
