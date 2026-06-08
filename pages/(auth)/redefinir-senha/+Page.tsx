import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Loader2, ShieldAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { AuthAlert, AuthCard, AuthHeading, AuthShell } from '@/components/auth/auth-shell'
import { PasswordField } from '@/components/auth/password-field'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useAuth } from '@/contexts/auth-context'
import { getAuthErrorMessage } from '@/lib/firebase-auth-errors'
import { type NewPasswordFormData, newPasswordSchema } from '@/schemas/auth.schema'

type Status = 'verifying' | 'form' | 'invalid' | 'success'

export default function RedefinirSenhaPage() {
  const { verifyResetCode, confirmReset } = useAuth()
  const [status, setStatus] = useState<Status>('verifying')
  const [email, setEmail] = useState<string | null>(null)
  const [oobCode, setOobCode] = useState<string | null>(null)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<NewPasswordFormData>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  // biome-ignore lint/correctness/useExhaustiveDependencies: validação roda só na montagem
  useEffect(() => {
    let active = true
    const params = new URLSearchParams(window.location.search)
    const mode = params.get('mode')
    const code = params.get('oobCode')

    if (!code) {
      setVerifyError('O link de redefinição está incompleto ou ausente.')
      setStatus('invalid')
      return
    }
    if (mode && mode !== 'resetPassword') {
      setVerifyError('Este link não é de redefinição de senha.')
      setStatus('invalid')
      return
    }

    setOobCode(code)
    verifyResetCode(code)
      .then((mail) => {
        if (!active) return
        setEmail(mail)
        setStatus('form')
      })
      .catch((error) => {
        if (!active) return
        setVerifyError(getAuthErrorMessage(error, 'Este link é inválido ou expirou.'))
        setStatus('invalid')
      })

    return () => {
      active = false
    }
  }, [])

  const onSubmit = async (data: NewPasswordFormData) => {
    if (!oobCode) return
    setFormError(null)
    try {
      await confirmReset(oobCode, data.password)
      setStatus('success')
    } catch (error) {
      setFormError(
        getAuthErrorMessage(error, 'Não foi possível redefinir a senha. Tente novamente.')
      )
    }
  }

  if (status === 'verifying') {
    return (
      <AuthShell>
        <AuthCard>
          <output aria-live="polite" className="flex flex-col items-center gap-3 py-6 text-center">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Validando o link de redefinição…</p>
          </output>
        </AuthCard>
      </AuthShell>
    )
  }

  if (status === 'invalid') {
    return (
      <AuthShell>
        <AuthCard>
          <div className="flex flex-col items-center text-center">
            <div className="mb-5 flex size-12 items-center justify-center rounded-full bg-destructive/12 text-destructive">
              <ShieldAlert className="size-6" aria-hidden />
            </div>
            <h1 className="text-balance font-semibold text-3xl leading-tight tracking-tight">
              Link inválido ou expirado
            </h1>
            <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
              {verifyError ?? 'Este link de redefinição não é mais válido.'}
            </p>
            <Button asChild className="mt-7 h-11 w-full">
              <a href="/recuperar-senha">Solicitar novo link</a>
            </Button>
          </div>
        </AuthCard>
      </AuthShell>
    )
  }

  if (status === 'success') {
    return (
      <AuthShell>
        <AuthCard>
          <div className="flex flex-col items-center text-center">
            <div className="mb-5 flex size-12 items-center justify-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="size-6" aria-hidden />
            </div>
            <h1 className="text-balance font-semibold text-3xl leading-tight tracking-tight">
              Senha redefinida
            </h1>
            <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
              Sua senha foi atualizada. Use a nova senha para entrar.
            </p>
            <Button asChild className="mt-7 h-11 w-full">
              <a href="/login">Ir para o login</a>
            </Button>
          </div>
        </AuthCard>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <AuthCard>
        <AuthHeading
          overline="Redefinição de senha"
          title="Definir nova senha"
          description={
            email ? (
              <>
                Definindo uma nova senha para{' '}
                <span className="break-words font-medium text-foreground">{email}</span>.
              </>
            ) : (
              'Escolha uma nova senha para a sua conta.'
            )
          }
        />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nova senha</FormLabel>
                  <FormControl>
                    <PasswordField
                      autoComplete="new-password"
                      placeholder="••••••••"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Mínimo 6 caracteres, com ao menos uma letra maiúscula e um número.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar nova senha</FormLabel>
                  <FormControl>
                    <PasswordField autoComplete="new-password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {formError ? <AuthAlert>{formError}</AuthAlert> : null}

            <Button type="submit" className="h-11 w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
              {form.formState.isSubmitting ? 'Redefinindo…' : 'Definir nova senha'}
            </Button>
          </form>
        </Form>
      </AuthCard>
    </AuthShell>
  )
}
