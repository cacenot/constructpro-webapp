import { Lock, RefreshCw } from 'lucide-react'
import { AppLayout } from '@/components/app-layout'
import { MembersSection } from '@/components/configuracoes/members/members-section'
import { SettingsLayout, type SettingsNavItem } from '@/components/configuracoes/settings-layout'
import { SettingsSection } from '@/components/configuracoes/settings-section'
import { TenantConfigSection } from '@/components/configuracoes/tenant-config-section'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useIsAdmin } from '@/hooks/use-is-admin'
import { useProfile } from '@/hooks/use-profile'

const SECTIONS: SettingsNavItem[] = [
  { id: 'membros', label: 'Membros' },
  { id: 'indices', label: 'Índices Econômicos' },
  { id: 'boletos', label: 'Emissão de Boletos' },
  { id: 'pagamentos', label: 'Pagamentos' },
  { id: 'parcelas', label: 'Parcelas por Mês' },
  { id: 'automacao', label: 'Automação Comercial' },
  { id: 'correcao', label: 'Correção Monetária' },
]

/**
 * Organização — administração do tenant (membros e regras de financiamento,
 * cobrança e correção). Restrito a admin/superadmin.
 */
export default function OrganizacaoPage() {
  const { data: profile, isLoading, error, refetch } = useProfile()
  const isAdmin = useIsAdmin(profile)

  if (isLoading) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-7xl pb-12">
          <div className="mb-8 space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-80" />
          </div>
          <div className="space-y-px">
            {['membros', 'indices', 'boletos', 'pagamentos'].map((key) => (
              <div key={key} className="space-y-4 border-t border-border/60 py-8">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-24 w-full" />
              </div>
            ))}
          </div>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 py-16 text-center">
          <div className="space-y-1">
            <p className="text-sm font-medium">Não foi possível carregar a organização</p>
            <p className="text-sm text-muted-foreground">
              Verifique sua conexão e tente novamente.
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 size-4" />
            Tentar novamente
          </Button>
        </div>
      </AppLayout>
    )
  }

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 py-16 text-center">
          <Lock className="size-8 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Acesso restrito</p>
            <p className="text-sm text-muted-foreground">
              Esta área é exclusiva de administradores da organização.
            </p>
          </div>
          <Button variant="outline" asChild>
            <a href="/configuracoes">Ir para Minha conta</a>
          </Button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl pb-12">
        <header className="mb-8 space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Organização</h1>
          <p className="text-muted-foreground">
            Membros e regras de financiamento, cobrança e correção
          </p>
        </header>

        <SettingsLayout sections={SECTIONS}>
          <SettingsSection
            id="membros"
            title="Membros"
            description="Gerencie quem tem acesso à organização e suas permissões"
          >
            <MembersSection />
          </SettingsSection>

          <TenantConfigSection />
        </SettingsLayout>
      </div>
    </AppLayout>
  )
}
