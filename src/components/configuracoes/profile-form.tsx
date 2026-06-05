import type { components } from '@cacenot/construct-pro-api-client'
import { zodResolver } from '@hookform/resolvers/zod'
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage'
import { Camera, Loader2, Save } from 'lucide-react'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CPFInput } from '@/components/ui/document-input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/phone-input'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAuth } from '@/contexts/auth-context'
import { storage } from '@/lib/firebase'
import { capitalizeNameBR } from '@/lib/text-formatters'
import { getInitials } from '@/lib/utils'
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

function formatMemberSince(date: string | null | undefined): string | null {
  if (!date) return null
  return new Date(date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

export function ProfileForm({ initialData, onSubmit, isSubmitting = false }: ProfileFormProps) {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

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
    const submitData = {
      ...data,
      display_name: data.display_name?.trim() || null,
      phone_number: data.phone_number?.trim() || null,
      photo_url: data.photo_url?.trim() || null,
    }
    await onSubmit(submitData)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5 MB.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const ext = file.name.split('.').pop()
    const storageRef = ref(storage, `users/${user.uid}/profile-photo.${ext}`)
    const uploadTask = uploadBytesResumable(storageRef, file)

    setIsUploading(true)
    setUploadProgress(0)

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
        setUploadProgress(progress)
      },
      (error) => {
        setIsUploading(false)
        toast.error('Erro ao enviar foto. Tente novamente.')
        console.error('Upload error:', error)
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref)
        form.setValue('photo_url', url, { shouldDirty: true })
        setIsUploading(false)
        setUploadProgress(0)
        toast.success('Foto enviada com sucesso')
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    )
  }

  const photoUrl = form.watch('photo_url')
  const fullName = form.watch('full_name')
  const memberSince = formatMemberSince(initialData?.created_at)
  const roles = initialData?.roles ?? []

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {/* Identidade — avatar + nome/email/papéis, sem caixa */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <Avatar className="size-16 border border-border/60">
                <AvatarImage src={photoUrl || undefined} alt={fullName || 'Usuário'} />
                <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                  {isUploading ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    getInitials(fullName)
                  )}
                </AvatarFallback>
              </Avatar>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="absolute -right-1 -bottom-1 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50"
                  >
                    <Camera className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Alterar foto</p>
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="min-w-0 space-y-1.5">
              <p className="truncate font-semibold leading-tight">{fullName || 'Usuário'}</p>
              <p className="truncate text-sm text-muted-foreground">{initialData?.email}</p>
              {roles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {roles.map((role) => (
                    <Badge key={role.id} variant="secondary" className="text-xs font-medium">
                      {role.display_name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {memberSince && (
            <div className="shrink-0 sm:text-right">
              <p className="text-[0.6875rem] font-medium uppercase tracking-wider text-muted-foreground">
                Membro desde
              </p>
              <p className="text-sm capitalize">{memberSince}</p>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Progresso de upload */}
        {isUploading && (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Enviando foto... {uploadProgress}%</p>
            <Progress value={uploadProgress} className="h-1.5" />
          </div>
        )}

        {/* Campos — grid alinhado, sem helpers que criam buracos na grade */}
        <div className="space-y-5">
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome completo *</FormLabel>
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

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="display_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome de exibição</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ''}
                      placeholder="Como aparece no menu"
                    />
                  </FormControl>
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
                  <span className="block">
                    <Input
                      value={initialData?.email || ''}
                      disabled
                      readOnly
                      className="w-full cursor-not-allowed bg-muted/50"
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Email de autenticação, não pode ser alterado</p>
                </TooltipContent>
              </Tooltip>
            </FormItem>
          </div>
        </div>

        {/* Ações */}
        <div className="flex justify-end border-t border-border/60 pt-5">
          <Button type="submit" disabled={isSubmitting || isUploading} className="min-w-40">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 size-4" />
                Salvar alterações
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
