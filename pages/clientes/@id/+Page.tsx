import { CreditCard, FileText, LayoutDashboard, ScanBarcode } from 'lucide-react'
import { navigate } from 'vike/client/router'
import { usePageContext } from 'vike-react/usePageContext'
import { AppLayout } from '@/components/app-layout'
import { CustomerBoletosTab } from '@/components/clientes/detail/customer-boletos-tab'
import { CustomerContractsTab } from '@/components/clientes/detail/customer-contracts-tab'
import { CustomerHeroHeader } from '@/components/clientes/detail/customer-hero-header'
import { CustomerOverviewTab } from '@/components/clientes/detail/customer-overview-tab'
import { CustomerPaymentsTab } from '@/components/clientes/detail/customer-payments-tab'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCustomerDetail } from '@/hooks/useCustomerDetail'

export default function CustomerDetailPage() {
  const pageContext = usePageContext()
  const customerId = Number(pageContext.routeParams?.id)

  const { data: customer, isLoading, error } = useCustomerDetail(customerId)

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-32" />
          <div className="flex flex-col gap-6 lg:flex-row lg:justify-between">
            <div className="flex gap-4 flex-1">
              <Skeleton className="size-14 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-52" />
              </div>
            </div>
            <Skeleton className="h-28 w-72" />
          </div>
          <Skeleton className="h-10 w-full max-w-md" />
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-32" />
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-72" />
            <Skeleton className="h-72" />
          </div>
        </div>
      </AppLayout>
    )
  }

  if (error || !customer) {
    return (
      <AppLayout>
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
          <p className="text-lg text-muted-foreground">Cliente não encontrado</p>
          <Button variant="link" onClick={() => navigate('/clientes')}>
            Voltar para lista
          </Button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <CustomerHeroHeader customer={customer} />

        <Tabs defaultValue="visao-geral">
          <TabsList variant="line">
            <TabsTrigger value="visao-geral">
              <LayoutDashboard className="size-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="contratos">
              <FileText className="size-4" />
              Contratos
            </TabsTrigger>
            <TabsTrigger value="pagamentos">
              <CreditCard className="size-4" />
              Pagamentos
            </TabsTrigger>
            <TabsTrigger value="boletos">
              <ScanBarcode className="size-4" />
              Boletos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visao-geral" className="mt-6">
            <CustomerOverviewTab customer={customer} />
          </TabsContent>

          <TabsContent value="contratos" className="mt-6">
            <CustomerContractsTab customer={customer} />
          </TabsContent>

          <TabsContent value="pagamentos" className="mt-6">
            <CustomerPaymentsTab customer={customer} />
          </TabsContent>

          <TabsContent value="boletos" className="mt-6">
            <CustomerBoletosTab customer={customer} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
