import { useApiClient } from '@cacenot/construct-pro-api-client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { AppLayout } from '@/components/app-layout'
import { AppearanceToggle } from '@/components/configuracoes/appearance-toggle'
import { PasswordForm } from '@/components/configuracoes/password-form'
import { ProfileForm } from '@/components/configuracoes/profile-form'
import { SettingsLayout, type SettingsNavItem } from '@/components/configuracoes/settings-layout'
import { SettingsSection } from '@/components/configuracoes/settings-section'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useProfile } from '@/hooks/use-profile'
import { handleApiError } from '@/lib/api-error'
import type { ProfileUpdateFormData } from '@/schemas/settings.schema'

const SECTIONS: SettingsNavItem[] = [
  { id: 'perfil', label: 'Perfil' },
  { id: 'seguranca', label: 'Segurança' },
  { id: 'aparencia', label: 'Aparência' },
]

/**
 * Minha conta — configurações pessoais do usuário (perfil, segurança, aparência).
 * A administração da organização vive em /organizacao (admin).
 */
export default function MinhaContaPage() {
  const { client } = useApiClient()
  const queryClient = useQueryClient()
  const { data: profile, isLoading, error, refetch } = useProfile()

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileUpdateFormData) => {
      const response = await client.PATCH('/api/v1/users/me', {
        body: {
          full_name: data.full_name,
          display_name: data.display_name ?? null,
          cpf: data.cpf,
          phone_number: data.phone_number ?? null,
          photo_url: data.photo_url ?? null,
        },
      })
      if (!response.data) {
        throw new Error('Erro ao atualizar perfil')
      }
      return response.data
    },
    onSuccess: () => {
      toast.success('Perfil atualizado com sucesso')
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] })
    },
    onError: (error: Error) => handleApiError(error, 'Erro ao atualizar perfil'),
  })

  if (isLoading) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-4xl pb-12">
          <div className="mb-8 space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="space-y-px">
            {['perfil', 'seguranca', 'aparencia'].map((key) => (
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
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 py-16 text-center">
          <div className="space-y-1">
            <p className="text-sm font-medium">Não foi possível carregar sua conta</p>
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

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl pb-12">
        <header className="mb-8 space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Minha conta</h1>
          <p className="text-muted-foreground">Gerencie seu perfil, segurança e preferências</p>
        </header>

        <SettingsLayout sections={SECTIONS}>
          <SettingsSection
            id="perfil"
            title="Perfil"
            description="Atualize seus dados pessoais e foto de perfil"
          >
            <ProfileForm
              initialData={profile}
              onSubmit={async (data) => {
                await updateProfileMutation.mutateAsync(data)
              }}
              isSubmitting={updateProfileMutation.isPending}
            />
          </SettingsSection>

          <SettingsSection
            id="seguranca"
            title="Segurança"
            description="Altere sua senha de acesso"
          >
            <PasswordForm />
          </SettingsSection>

          <SettingsSection
            id="aparencia"
            title="Aparência"
            description="Escolha como o Costara aparece para você"
          >
            <AppearanceToggle />
          </SettingsSection>
        </SettingsLayout>
      </div>
    </AppLayout>
  )
}
