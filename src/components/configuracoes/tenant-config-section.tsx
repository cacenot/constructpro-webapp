import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useTenantConfig } from '@/hooks/use-tenant-config'
import { useActiveSection } from './settings-layout'
import { CONFIG_IDS } from './tenant-config/helpers'
import {
  AutomacaoSection,
  BoletosSection,
  CorrecaoSection,
  IndicesSection,
  PagamentosSection,
  ParcelasSection,
} from './tenant-config/sections'

function LoadingSkeleton() {
  return (
    <div className="max-w-3xl space-y-4">
      <Skeleton className="h-5 w-44" />
      <Skeleton className="h-4 w-72" />
      <Skeleton className="h-32 w-full" />
    </div>
  )
}

/**
 * Seções de configuração da organização. Cada seção é um formulário
 * independente (salva via PATCH parcial); este componente apenas carrega a
 * config e distribui para as seções. Skeleton/erro só aparecem quando uma seção
 * de config está ativa (no master-detail, com "Membros" ativo o config fica
 * oculto).
 */
export function TenantConfigSection() {
  const { data: config, isLoading, error, refetch } = useTenantConfig()
  const isConfigActive = CONFIG_IDS.includes(useActiveSection())

  if (isLoading) {
    return isConfigActive ? <LoadingSkeleton /> : null
  }

  if (error || !config) {
    if (!isConfigActive) return null
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="space-y-1">
          <p className="text-sm font-medium">
            Não foi possível carregar as configurações da organização
          </p>
          <p className="text-sm text-muted-foreground">Verifique sua conexão e tente novamente.</p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 size-4" />
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <>
      <IndicesSection config={config} />
      <BoletosSection config={config} />
      <PagamentosSection config={config} />
      <ParcelasSection config={config} />
      <AutomacaoSection config={config} />
      <CorrecaoSection config={config} />
    </>
  )
}
