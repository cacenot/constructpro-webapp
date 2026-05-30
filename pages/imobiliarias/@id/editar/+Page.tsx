import { formatCNPJ, useApiClient } from '@cacenot/construct-pro-api-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { navigate } from 'vike/client/router'
import { usePageContext } from 'vike-react/usePageContext'
import { AppLayout } from '@/components/app-layout'
import { AgencyForm } from '@/components/imobiliarias/agency-form'
import { Button } from '@/components/ui/button'
import { handleApiError, throwApiError } from '@/lib/api-error'
import type { AgencyCreateFormData, AgencyUpdateFormData } from '@/schemas/agency.schema'

export default function AgencyEditPage() {
  const pageContext = usePageContext()
  const agencyId = Number(pageContext.routeParams?.id)
  const queryClient = useQueryClient()
  const { client } = useApiClient()

  const {
    data: agency,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['agencies', agencyId],
    queryFn: async () => {
      const { data, error } = await client.GET('/api/v1/agencies/{agency_id}', {
        params: { path: { agency_id: agencyId } },
      })
      if (error) throw new Error('Falha ao carregar imobiliária')
      return data
    },
    enabled: !!agencyId,
  })

  const updateMutation = useMutation({
    mutationFn: async (data: AgencyUpdateFormData) => {
      const { data: response, error } = await client.PATCH('/api/v1/agencies/{agency_id}', {
        params: { path: { agency_id: agencyId } },
        body: {
          ...data,
          trade_name: data.trade_name?.trim() || undefined,
          email: data.email?.trim() || undefined,
          phone: data.phone?.trim() || undefined,
        },
      })
      if (error) throwApiError(error, 'Falha ao atualizar imobiliária')
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencies'] })
      queryClient.invalidateQueries({ queryKey: ['agencies', agencyId] })
      toast.success('Imobiliária atualizada com sucesso!')
      navigate(`/imobiliarias/${agencyId}`)
    },
    onError: (error) => handleApiError(error, 'Falha ao atualizar imobiliária'),
  })

  const handleSubmit = async (data: AgencyCreateFormData) => {
    const { cnpj: _cnpj, ...updateData } = data
    await updateMutation.mutateAsync(updateData)
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

  if (error || !agency) {
    return (
      <AppLayout>
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
          <p className="text-lg text-muted-foreground">Imobiliária não encontrada</p>
          <Button variant="link" onClick={() => navigate('/imobiliarias')}>
            Voltar para lista
          </Button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl">
        <AgencyForm
          initialData={{
            cnpj: formatCNPJ(agency.cnpj),
            legal_name: agency.legal_name,
            trade_name: agency.trade_name ?? '',
            creci_j: agency.creci_j,
            email: agency.email ?? '',
            phone: agency.phone ?? '',
          }}
          onSubmit={handleSubmit}
          onBack={() => navigate(`/imobiliarias/${agencyId}`)}
          isEdit
          isSubmitting={updateMutation.isPending}
        />
      </div>
    </AppLayout>
  )
}
