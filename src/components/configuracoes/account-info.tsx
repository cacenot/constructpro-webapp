import { type components, formatDateTime } from '@cacenot/construct-pro-api-client'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

type UserProfileResponse = components['schemas']['UserProfileResponse']

interface AccountInfoProps {
  profile?: UserProfileResponse
}

/**
 * Componente de informações da conta (somente leitura)
 */
export function AccountInfo({ profile }: AccountInfoProps) {
  if (!profile) {
    return <div className="text-sm text-muted-foreground">Carregando informações da conta...</div>
  }

  // Formatar data de criação como "Membro desde"
  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric',
      })
    : 'N/A'

  return (
    <dl className="space-y-5">
      {/* ID do Usuário */}
      <div className="space-y-1.5">
        <dt className="text-sm font-medium text-muted-foreground">ID do Usuário</dt>
        <dd className="rounded-lg bg-muted/30 px-3 py-2 font-mono text-xs">{profile.id}</dd>
      </div>

      <Separator className="opacity-50" />

      {/* Membro desde */}
      <div className="space-y-1.5">
        <dt className="text-sm font-medium text-muted-foreground">Membro desde</dt>
        <dd className="text-sm capitalize font-medium">{memberSince}</dd>
      </div>

      {/* Última atualização */}
      {profile.updated_at && (
        <>
          <Separator className="opacity-50" />
          <div className="space-y-1.5">
            <dt className="text-sm font-medium text-muted-foreground">Última atualização</dt>
            <dd className="text-sm">{formatDateTime(profile.updated_at)}</dd>
          </div>
        </>
      )}

      {/* Roles/Permissões */}
      {profile.roles && profile.roles.length > 0 && (
        <>
          <Separator className="opacity-50" />
          <div className="space-y-2.5">
            <dt className="text-sm font-medium text-muted-foreground">Permissões</dt>
            <dd className="flex flex-wrap gap-2">
              {profile.roles.map((role) => (
                <Badge
                  key={role.id}
                  variant="secondary"
                  className="rounded-full border border-border/50 bg-muted/50 font-medium"
                >
                  {role.display_name}
                </Badge>
              ))}
            </dd>
          </div>
        </>
      )}

      {/* Tenants */}
      {profile.tenants && profile.tenants.length > 0 && (
        <>
          <Separator className="opacity-50" />
          <div className="space-y-2.5">
            <dt className="text-sm font-medium text-muted-foreground">Empresas</dt>
            <dd className="space-y-2">
              {profile.tenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="rounded-xl border border-border/50 bg-muted/20 p-4 transition-colors hover:bg-muted/30"
                >
                  <div className="space-y-1.5">
                    <p className="font-medium">{tenant.name}</p>
                    <div className="flex flex-col gap-1">
                      {tenant.cnpj && (
                        <p className="text-xs text-muted-foreground font-mono">
                          CNPJ: {tenant.cnpj}
                        </p>
                      )}
                      {tenant.phone && (
                        <p className="text-xs text-muted-foreground">Tel: {tenant.phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </dd>
          </div>
        </>
      )}
    </dl>
  )
}
