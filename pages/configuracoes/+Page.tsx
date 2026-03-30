import { type components, useApiClient } from '@cacenot/construct-pro-api-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { AppLayout } from '@/components/app-layout'
import { MembersSection } from '@/components/configuracoes/members/members-section'
import { PasswordForm } from '@/components/configuracoes/password-form'
import { ProfileForm } from '@/components/configuracoes/profile-form'
import { TenantConfigSection } from '@/components/configuracoes/tenant-config-section'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useIsAdmin } from '@/hooks/use-is-admin'
import { handleApiError } from '@/lib/api-error'
import { cn } from '@/lib/utils'
import type { ProfileUpdateFormData } from '@/schemas/settings.schema'

/**
 * Página de configurações — Minha Conta e Organização (admin/superadmin apenas)
 */
export default function SettingsPage() {
  const { client } = useApiClient()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('conta')

  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: async (): Promise<components['schemas']['UserProfileResponse']> => {
      const response = await client.GET('/api/v1/users/me')
      if (!response.data) {
        throw new Error('Erro ao carregar perfil')
      }
      return response.data as components['schemas']['UserProfileResponse']
    },
  })

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

  const isAdmin = useIsAdmin(profile)

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-3xl">
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
      <div className={cn('mx-auto pb-12', activeTab === 'membros' ? 'max-w-5xl' : 'max-w-3xl')}>
        {/* Header */}
        <div className="space-y-1 mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie suas informações pessoais e preferências de conta
          </p>
        </div>

        <Tabs defaultValue="conta" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="conta">Minha Conta</TabsTrigger>
            {isAdmin && <TabsTrigger value="membros">Membros</TabsTrigger>}
            {isAdmin && <TabsTrigger value="organizacao">Organização</TabsTrigger>}
          </TabsList>

          {/* ── Minha Conta ─────────────────────────────────────────── */}
          <TabsContent value="conta" className="space-y-8">
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardContent className="pt-6">
                <div className="space-y-1 mb-6">
                  <h2 className="text-lg font-semibold">Informações Pessoais</h2>
                  <p className="text-sm text-muted-foreground">
                    Atualize seus dados pessoais e foto de perfil
                  </p>
                </div>
                <ProfileForm
                  initialData={profile}
                  onSubmit={async (data) => {
                    await updateProfileMutation.mutateAsync(data)
                  }}
                  isSubmitting={updateProfileMutation.isPending}
                />
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardContent className="pt-6">
                <div className="space-y-1 mb-6">
                  <h2 className="text-lg font-semibold">Segurança</h2>
                  <p className="text-sm text-muted-foreground">Altere sua senha de acesso</p>
                </div>
                <PasswordForm />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Membros ─────────────────────────────────────────────── */}
          {isAdmin && (
            <TabsContent value="membros">
              <MembersSection />
            </TabsContent>
          )}

          {/* ── Organização ─────────────────────────────────────────── */}
          {isAdmin && (
            <TabsContent value="organizacao">
              <TenantConfigSection />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AppLayout>
  )
}
