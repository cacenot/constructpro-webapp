import type { components } from '@cacenot/construct-pro-api-client'
import { zodResolver } from '@hookform/resolvers/zod'
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage'
import { Camera, Loader2, Save } from 'lucide-react'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
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
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAuth } from '@/contexts/auth-context'
import { storage } from '@/lib/firebase'
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

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
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
        // Reset file input so the same file can be selected again
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    )
  }

  const photoUrl = form.watch('photo_url')
  const fullName = form.watch('full_name')

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {/* Avatar + Upload */}
        <div className="flex items-center gap-6 rounded-xl bg-muted/30 p-4 transition-colors hover:bg-muted/40">
          <div className="relative shrink-0">
            <Avatar className="h-20 w-20 border-2 border-border/50 shadow-sm">
              <AvatarImage src={photoUrl || undefined} alt={fullName || 'Usuário'} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                {isUploading ? <Loader2 className="size-5 animate-spin" /> : getInitials(fullName)}
              </AvatarFallback>
            </Avatar>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  <Camera className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Alterar foto</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            <h3 className="font-medium">Foto do Perfil</h3>
            {isUploading ? (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Enviando... {uploadProgress}%</p>
                <Progress value={uploadProgress} className="h-1.5" />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Clique no ícone para enviar uma nova foto
              </p>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
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
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isSubmitting || isUploading} className="min-w-40">
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
