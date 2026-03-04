import type { components } from '@cacenot/construct-pro-api-client'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { CPFInput } from '@/components/ui/document-input'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/phone-input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { capitalizeNameBR } from '@/lib/text-formatters'
import { type ProfileUpdateFormData, profileUpdateSchema } from '@/schemas/settings.schema'

type UserProfileResponse = components['schemas']['UserProfileResponse']

interface ProfileFormProps {
  /** Initial data from user profile */
  initialData?: UserProfileResponse
  /** Called when form is submitted successfully */
  onSubmit: (data: ProfileUpdateFormData) => Promise<void>
  /** Whether the form is submitting */
  isSubmitting?: boolean
}

/**
 * Obtém as iniciais do nome para o avatar fallback
 */
function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/**
 * Formulário de atualização de perfil do usuário
 */
export function ProfileForm({ initialData, onSubmit, isSubmitting = false }: ProfileFormProps) {
  const form = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      full_name: initialData?.full_name || '',
      display_name: initialData?.display_name || '',
      cpf: initialData?.cpf || '',
      phone_number: initialData?.phone_number || '',
      photo_url: initialData?.photo_url || '',
    },
  })

  const handleSubmit = async (data: ProfileUpdateFormData) => {
    // Limpar strings vazias para null
    const submitData = {
      ...data,
      display_name: data.display_name?.trim() || null,
      phone_number: data.phone_number?.trim() || null,
      photo_url: data.photo_url?.trim() || null,
    }
    await onSubmit(submitData)
  }

  // Watch photo_url e full_name para preview do avatar
  const photoUrl = form.watch('photo_url')
  const fullName = form.watch('full_name')

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {/* Avatar Preview */}
        <div className="flex items-center gap-6 rounded-xl bg-muted/30 p-4 transition-colors hover:bg-muted/40">
          <Avatar className="h-20 w-20 border-2 border-border/50 shadow-sm">
            <AvatarImage src={photoUrl || undefined} alt={fullName || 'Usuário'} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
              {getInitials(fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-0.5">
            <h3 className="font-medium">Foto do Perfil</h3>
            <p className="text-sm text-muted-foreground">
              Adicione uma URL de imagem para sua foto de perfil
            </p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-5">
          {/* Nome Completo */}
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Seu nome completo"
                    onBlur={(e) => {
                      field.onChange(capitalizeNameBR(e.target.value))
                      field.onBlur()
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Grid: Display Name | CPF */}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="display_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome de Exibição</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ''}
                      placeholder="Como você gostaria de ser chamado?"
                    />
                  </FormControl>
                  <FormDescription>Nome mostrado no menu superior</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF *</FormLabel>
                  <FormControl>
                    <CPFInput {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Grid: Telefone | Email (readonly) */}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <PhoneInput {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Email</FormLabel>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Input
                    value={initialData?.email || ''}
                    disabled
                    className="bg-muted/50 cursor-not-allowed"
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Email não pode ser alterado</p>
                </TooltipContent>
              </Tooltip>
              <FormDescription>Email de autenticação (não pode ser alterado)</FormDescription>
            </FormItem>
          </div>

          {/* URL da Foto */}
          <FormField
            control={form.control}
            name="photo_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL da Foto de Perfil</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ''}
                    type="url"
                    placeholder="https://exemplo.com/foto.jpg"
                  />
                </FormControl>
                <FormDescription>
                  Link para sua foto de perfil (deixe vazio para usar iniciais)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isSubmitting} className="min-w-[160px]">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 size-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
