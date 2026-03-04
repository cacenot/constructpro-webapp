import { useApiClient } from '@cacenot/construct-pro-api-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { AppLayout } from '@/components/app-layout'
import { AccountInfo } from '@/components/configuracoes/account-info'
import { PasswordForm } from '@/components/configuracoes/password-form'
import { ProfileForm } from '@/components/configuracoes/profile-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { ProfileUpdateFormData } from '@/schemas/settings.schema'

/**
 * Página de configurações do usuário
 */
export default function SettingsPage() {
  const { client } = useApiClient()
  const queryClient = useQueryClient()

  // Fetch current user profile
  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      const response = await client.GET('/api/v1/users/me')
      if (!response.data) {
        throw new Error('Erro ao carregar perfil')
      }
      return response.data
    },
  })

  // Mutation for profile update
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
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar perfil')
      console.error('Profile update error:', error)
    },
  })

  const handleProfileSubmit = async (data: ProfileUpdateFormData) => {
    await updateProfileMutation.mutateAsync(data)
  }

  // Loading state
  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    )
  }

  // Error state
  if (error) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Erro ao carregar configurações. Tente novamente.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-8 pb-12">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie suas informações pessoais e preferências de conta
          </p>
        </div>

        {/* Card 1: Informações Pessoais */}
        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg font-semibold">Informações Pessoais</CardTitle>
            <CardDescription>Atualize seus dados pessoais e foto de perfil</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ProfileForm
              initialData={profile}
              onSubmit={handleProfileSubmit}
              isSubmitting={updateProfileMutation.isPending}
            />
          </CardContent>
        </Card>

        {/* Card 2: Segurança */}
        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg font-semibold">Segurança</CardTitle>
            <CardDescription>Altere sua senha de acesso</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <PasswordForm />
          </CardContent>
        </Card>

        {/* Card 3: Informações da Conta (readonly) */}
        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg font-semibold">Informações da Conta</CardTitle>
            <CardDescription>Detalhes da sua conta e permissões</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <AccountInfo profile={profile} />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
