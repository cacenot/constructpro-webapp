import { formatCPF, useApiClient } from '@cacenot/construct-pro-api-client'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Edit, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { navigate } from 'vike/client/router'
import { usePageContext } from 'vike-react/usePageContext'
import { AppLayout } from '@/components/app-layout'
import { BrokerDeleteDialog } from '@/components/corretores/broker-delete-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatPhone } from '@/lib/text-formatters'

export default function BrokerDetailPage() {
  const pageContext = usePageContext()
  const brokerId = Number(pageContext.routeParams?.id)
  const { client } = useApiClient()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const {
    data: broker,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['brokers', brokerId],
    queryFn: async () => {
      const { data, error } = await client.GET('/api/v1/brokers/{broker_id}', {
        params: { path: { broker_id: brokerId } },
      })
      if (error) throw new Error('Falha ao carregar corretor')
      return data
    },
    enabled: !!brokerId,
  })

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6 mx-auto max-w-3xl">
          <div className="flex items-center gap-4">
            <Skeleton className="size-9 rounded-md" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    )
  }

  if (error || !broker) {
    return (
      <AppLayout>
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
          <p className="text-lg text-muted-foreground">Corretor não encontrado</p>
          <Button variant="link" onClick={() => navigate('/corretores')}>
            Voltar para lista
          </Button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6 mx-auto max-w-3xl">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/corretores')}
                >
                  <ArrowLeft className="size-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Voltar</p>
              </TooltipContent>
            </Tooltip>
            <h1 className="text-3xl font-semibold tracking-tight">{broker.full_name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigate(`/corretores/${brokerId}/editar`)}
                >
                  <Edit className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Editar</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="destructive" size="icon" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Excluir</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Card de dados */}
        <Card>
          <CardHeader>
            <CardTitle>Dados do Corretor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nome completo</p>
                <p className="mt-1">{broker.full_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">CPF</p>
                <p className="mt-1 tabular-nums">{formatCPF(broker.cpf)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">CRECI</p>
                <p className="mt-1">{broker.creci}</p>
              </div>
              {broker.email && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">E-mail</p>
                  <p className="mt-1">{broker.email}</p>
                </div>
              )}
              {broker.phone && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                  <p className="mt-1 tabular-nums">{formatPhone(broker.phone)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <BrokerDeleteDialog
        brokerId={brokerId}
        brokerName={broker.full_name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onSuccess={() => navigate('/corretores')}
      />
    </AppLayout>
  )
}
