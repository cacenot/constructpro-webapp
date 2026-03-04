import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Eye, EyeOff, Loader2, X } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAuth } from '@/contexts/auth-context'
import { type PasswordChangeFormData, passwordChangeSchema } from '@/schemas/settings.schema'

/**
 * Calcula a força da senha (0-100)
 */
function calculatePasswordStrength(password: string): number {
  let strength = 0
  if (!password) return 0

  // Comprimento
  if (password.length >= 6) strength += 25
  if (password.length >= 10) strength += 15
  if (password.length >= 14) strength += 10

  // Complexidade
  if (/[a-z]/.test(password)) strength += 10 // minúsculas
  if (/[A-Z]/.test(password)) strength += 15 // maiúsculas
  if (/[0-9]/.test(password)) strength += 15 // números
  if (/[^a-zA-Z0-9]/.test(password)) strength += 10 // caracteres especiais

  return Math.min(strength, 100)
}

/**
 * Retorna cor baseada na força da senha
 */
function getStrengthColor(strength: number): string {
  if (strength < 40) return 'bg-destructive'
  if (strength < 70) return 'bg-yellow-500'
  return 'bg-green-500'
}

/**
 * Retorna texto baseado na força da senha
 */
function getStrengthText(strength: number): string {
  if (strength === 0) return ''
  if (strength < 40) return 'Fraca'
  if (strength < 70) return 'Média'
  return 'Forte'
}

/**
 * Formulário de troca de senha
 */
export function PasswordForm() {
  const { changePassword } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const form = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const newPassword = form.watch('newPassword')
  const passwordStrength = calculatePasswordStrength(newPassword)

  // Requisitos da senha
  const requirements = [
    {
      label: 'Mínimo 6 caracteres',
      met: newPassword.length >= 6,
    },
    {
      label: 'Letra maiúscula',
      met: /[A-Z]/.test(newPassword),
    },
    {
      label: 'Número',
      met: /[0-9]/.test(newPassword),
    },
  ]

  const handleSubmit = async (data: PasswordChangeFormData) => {
    setIsSubmitting(true)
    try {
      await changePassword(data.currentPassword, data.newPassword)
      toast.success('Senha atualizada com sucesso')
      form.reset()
    } catch (error) {
      // Tratar erros específicos do Firebase
      const errorCode = (error as { code?: string })?.code
      if (errorCode === 'auth/wrong-password') {
        toast.error('Senha atual incorreta')
        form.setError('currentPassword', { message: 'Senha incorreta' })
      } else if (errorCode === 'auth/too-many-requests') {
        toast.error('Muitas tentativas. Tente novamente mais tarde')
      } else {
        toast.error('Erro ao atualizar senha')
        console.error('Password change error:', error)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Alert className="border-primary/20 bg-primary/5">
          <AlertDescription className="text-sm">
            Ao alterar sua senha, você permanecerá conectado neste dispositivo. Use a nova senha em
            seus próximos acessos.
          </AlertDescription>
        </Alert>

        {/* Senha Atual */}
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha Atual *</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    {...field}
                    type={showCurrentPassword ? 'text' : 'password'}
                    placeholder="Digite sua senha atual"
                    className="pr-10"
                  />
                </FormControl>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="size-4 text-muted-foreground" />
                      ) : (
                        <Eye className="size-4 text-muted-foreground" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{showCurrentPassword ? 'Ocultar senha' : 'Mostrar senha'}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Nova Senha */}
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nova Senha *</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    {...field}
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Digite sua nova senha"
                    className="pr-10"
                  />
                </FormControl>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="size-4 text-muted-foreground" />
                      ) : (
                        <Eye className="size-4 text-muted-foreground" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{showNewPassword ? 'Ocultar senha' : 'Mostrar senha'}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              {newPassword && (
                <div className="mt-3 space-y-2 rounded-lg bg-muted/30 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Força da senha:</span>
                    <span className="font-semibold">{getStrengthText(passwordStrength)}</span>
                  </div>
                  <Progress
                    value={passwordStrength}
                    className={getStrengthColor(passwordStrength)}
                  />
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Requisitos da Senha */}
        {newPassword && (
          <div className="rounded-xl border border-border/50 bg-muted/30 p-4 space-y-2">
            <p className="text-sm font-medium mb-2">Requisitos da senha:</p>
            <div className="space-y-2">
              {requirements.map((req) => (
                <div
                  key={req.label}
                  className="flex items-center gap-2.5 text-sm transition-colors"
                >
                  {req.met ? (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
                      <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  ) : (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted">
                      <X className="size-3.5 text-muted-foreground" />
                    </div>
                  )}
                  <span
                    className={
                      req.met
                        ? 'font-medium text-emerald-700 dark:text-emerald-400'
                        : 'text-muted-foreground'
                    }
                  >
                    {req.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Confirmar Senha */}
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar Nova Senha *</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    {...field}
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Digite novamente a nova senha"
                    className="pr-10"
                  />
                </FormControl>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="size-4 text-muted-foreground" />
                      ) : (
                        <Eye className="size-4 text-muted-foreground" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isSubmitting} className="min-w-[160px]">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Atualizando...
              </>
            ) : (
              'Atualizar Senha'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
