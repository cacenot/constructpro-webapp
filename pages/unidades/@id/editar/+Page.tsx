import { useApiClient } from '@cacenot/construct-pro-api-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { navigate } from 'vike/client/router'
import { usePageContext } from 'vike-react/usePageContext'
import { AppLayout } from '@/components/app-layout'
import { Button } from '@/components/ui/button'
import { UnitForm } from '@/components/unidades/unit-form'
import type { UnitFormData } from '@/schemas/unit.schema'

type ApiClient = ReturnType<typeof useApiClient>['client']

async function fetchUnit(client: ApiClient, id: number) {
  const { data, error } = await client.GET('/api/v1/units/{id}', {
    params: {
      path: { id },
    },
  })

  if (error) {
    throw new Error('Falha ao carregar unidade')
  }

  return data
}

async function fetchProject(client: ApiClient, id: number) {
  const { data, error } = await client.GET('/api/v1/projects/{id}', {
    params: {
      path: { id },
    },
  })

  if (error) {
    throw new Error('Falha ao carregar empreendimento')
  }

  return data
}

/**
 * Parse floors string from project to number
 */
function parseFloors(floors: string | null | undefined): number | null {
  if (!floors) return null
  const parsed = Number.parseInt(floors, 10)
  return Number.isNaN(parsed) ? null : parsed
}

export default function UnitEditPage() {
  const pageContext = usePageContext()
  const unitId = Number(pageContext.routeParams?.id)
  const { client } = useApiClient()
  const queryClient = useQueryClient()

  // Fetch unit data
  const unitQuery = useQuery({
    queryKey: ['unit', unitId],
    queryFn: () => fetchUnit(client, unitId),
    enabled: !Number.isNaN(unitId),
  })

  // Fetch project data when unit is loaded
  const projectId = unitQuery.data?.project_id
  const projectQuery = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProject(client, projectId as number),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 min cache
  })

  const updateMutation = useMutation({
    mutationFn: async (data: UnitFormData) => {
      const { data: result, error } = await client.PATCH('/api/v1/units/{id}', {
        params: {
          path: { id: unitId },
        },
        body: {
          name: data.name,
          category: data.category,
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
        throw new Error('Falha ao atualizar unidade')
      }

      return result
    },
    onSuccess: () => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ['units'] })
      queryClient.invalidateQueries({ queryKey: ['unit', unitId] })
    },
  })

  const handleBack = () => {
    navigate('/unidades')
  }

  const handleSubmit = async (data: UnitFormData) => {
    try {
      await updateMutation.mutateAsync(data)
      toast.success('Unidade atualizada com sucesso!')
      navigate('/unidades')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar unidade'
      toast.error(message)
      throw error
    }
  }

  const isLoading = unitQuery.isLoading || projectQuery.isLoading
  const error = unitQuery.error || projectQuery.error
  const unit = unitQuery.data
  const project = projectQuery.data

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    )
  }

  if (error || !unit) {
    return (
      <AppLayout>
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
          <p className="text-lg text-muted-foreground">Unidade não encontrada</p>
          <Button variant="link" onClick={handleBack}>
            Voltar para lista
          </Button>
        </div>
      </AppLayout>
    )
  }

  // Map unit data to form initial data
  const initialData = {
    name: unit.name,
    category: unit.category,
    project_id: unit.project_id,
    area: typeof unit.area === 'string' ? Number.parseFloat(unit.area) : unit.area,
    price_cents: unit.price_cents,
    description: unit.description,
    apartment_type: unit.apartment_type,
    bedrooms: unit.bedrooms,
    bathrooms: unit.bathrooms,
    garages: unit.garages,
    floor: unit.floor,
    features: unit.features || [],
    // Project info for FloorSelect
    project: project
      ? {
          id: project.id,
          name: project.name,
          floors: parseFloors(project.floors),
        }
      : undefined,
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl">
        <UnitForm
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
