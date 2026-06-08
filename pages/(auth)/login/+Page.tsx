import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
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
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/auth-context'
import { getAuthErrorMessage } from '@/lib/firebase-auth-errors'
import { type LoginFormData, loginSchema } from '@/schemas/auth.schema'

export default function LoginPage() {
  const { signIn } = useAuth()
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (data: LoginFormData) => {
    setFormError(null)
    try {
      await signIn(data.email, data.password)
      // Em caso de sucesso, o AuthGuard redireciona e o ConsoleBoot assume.
    } catch (error) {
      setFormError(getAuthErrorMessage(error, 'Não foi possível entrar. Tente novamente.'))
    }
  }

  return (
    <AuthShell>
      <AuthCard>
        <AuthHeading title="Entrar" />

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

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="relative">
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <PasswordField
                      autoComplete="current-password"
                      placeholder="••••••••"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  {/* Depois do input no DOM (Tab: e-mail → senha → … → este link),
                      mas posicionado sobre a linha do label para o visual top-right. */}
                  <a
                    href="/recuperar-senha"
                    className="absolute top-0 right-0 flex h-3.5 items-center text-muted-foreground text-xs leading-none underline-offset-4 outline-none transition-colors hover:text-primary focus-visible:text-primary focus-visible:underline"
                  >
                    Esqueceu a senha?
                  </a>
                </FormItem>
              )}
            />

            {formError ? <AuthAlert>{formError}</AuthAlert> : null}

            <Button type="submit" className="h-11 w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
              {form.formState.isSubmitting ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>
        </Form>
      </AuthCard>
    </AuthShell>
  )
}
