import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Loader2, MailCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { AuthAlert, AuthCard, AuthHeading, AuthShell } from '@/components/auth/auth-shell'
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
import { useAuth } from '@/contexts/auth-context'
import { getAuthErrorMessage } from '@/lib/firebase-auth-errors'
import { type ResetPasswordFormData, resetPasswordSchema } from '@/schemas/auth.schema'

function BackToLogin() {
  return (
    <a
      href="/login"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 outline-none transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:underline"
    >
      <ArrowLeft className="size-4" aria-hidden />
      Voltar para o login
    </a>
  )
}

export default function RecuperarSenhaPage() {
  const { resetPassword } = useAuth()
  const [formError, setFormError] = useState<string | null>(null)
  const [sentEmail, setSentEmail] = useState<string | null>(null)
  const [resending, setResending] = useState(false)

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (data: ResetPasswordFormData) => {
    setFormError(null)
    try {
      await resetPassword(data.email)
      setSentEmail(data.email)
    } catch (error) {
      setFormError(getAuthErrorMessage(error, 'Não foi possível enviar o link. Tente novamente.'))
    }
  }

  const handleResend = async () => {
    if (!sentEmail) return
    setResending(true)
    try {
      await resetPassword(sentEmail)
      toast.success('Enviamos o e-mail novamente.')
    } catch (error) {
      toast.error(getAuthErrorMessage(error, 'Não foi possível reenviar. Tente novamente.'))
    } finally {
      setResending(false)
    }
  }

  if (sentEmail) {
    return (
      <AuthShell>
        <AuthCard>
          <div className="flex flex-col items-center text-center">
            <div className="mb-5 flex size-12 items-center justify-center rounded-full bg-success/15 text-success">
              <MailCheck className="size-6" aria-hidden />
            </div>
            <h1 className="text-balance font-semibold text-3xl leading-tight tracking-tight">
              Link enviado
            </h1>
            <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
              Enviamos um link de redefinição para{' '}
              <span className="break-words font-medium text-foreground">{sentEmail}</span>.
              Verifique sua caixa de entrada e a pasta de spam.
            </p>

            <div className="mt-7 flex w-full flex-col items-center gap-4">
              <Button
                variant="outline"
                className="h-11 w-full"
                onClick={handleResend}
                disabled={resending}
              >
                {resending ? <Loader2 className="size-4 animate-spin" /> : null}
                {resending ? 'Reenviando…' : 'Reenviar e-mail'}
              </Button>
              <BackToLogin />
            </div>
          </div>
        </AuthCard>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <AuthCard>
        <AuthHeading
          overline="Recuperação de acesso"
          title="Esqueceu a senha?"
          description="Informe seu e-mail e enviaremos um link para redefinir a sua senha."
        />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="email"
                      autoComplete="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      placeholder="voce@incorporadora.com.br"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {formError ? <AuthAlert>{formError}</AuthAlert> : null}

            <Button type="submit" className="h-11 w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
              {form.formState.isSubmitting ? 'Enviando…' : 'Enviar link de redefinição'}
            </Button>
          </form>

          <div className="mt-6 flex justify-center">
            <BackToLogin />
          </div>
        </Form>
      </AuthCard>
    </AuthShell>
  )
}
