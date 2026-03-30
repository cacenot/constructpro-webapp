import { useApiClient } from '@cacenot/construct-pro-api-client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Copy, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { handleApiError, throwApiError } from '@/lib/api-error'
import { formatNameOnBlur } from '@/lib/text-formatters'
import {
  AVAILABLE_ROLES,
  type CreateMemberFormData,
  createMemberSchema,
} from '@/schemas/member.schema'

interface CreateMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateMemberDialog({ open, onOpenChange }: CreateMemberDialogProps) {
  const { client } = useApiClient()
  const queryClient = useQueryClient()
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const form = useForm<CreateMemberFormData>({
    resolver: zodResolver(createMemberSchema),
    defaultValues: {
      email: '',
      full_name: '',
      cpf: '',
      phone_number: '',
      role_name: '',
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: CreateMemberFormData) => {
      const { data: response, error } = await client.POST('/api/v1/users', {
        body: {
          email: data.email,
          full_name: data.full_name,
          cpf: data.cpf.replace(/\D/g, ''),
          phone_number: data.phone_number || null,
          role_name: data.role_name,
        },
      })
      if (error) throwApiError(error, 'Erro ao criar membro')
      return response
    },
    onSuccess: (data) => {
      toast.success('Membro adicionado com sucesso')
      queryClient.invalidateQueries({ queryKey: ['members'] })
      setTemporaryPassword(data?.temporary_password ?? null)
      form.reset()
    },
    onError: (error) => handleApiError(error, 'Erro ao criar membro'),
  })

  function handleClose() {
    if (!mutation.isPending) {
      onOpenChange(false)
      setTemporaryPassword(null)
      setCopied(false)
      form.reset()
    }
  }

  async function handleCopyPassword() {
    if (!temporaryPassword) return
    await navigator.clipboard.writeText(temporaryPassword)
    setCopied(true)
    toast.success('Senha copiada para a área de transferência')
    setTimeout(() => setCopied(false), 2000)
  }

  if (temporaryPassword) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Membro adicionado</DialogTitle>
            <DialogDescription>
              Uma senha temporária foi gerada. Envie ao novo membro por um canal seguro. Ele poderá
              alterá-la no primeiro acesso.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
            <code className="flex-1 font-mono text-sm select-all">{temporaryPassword}</code>
            <Button variant="ghost" size="icon" onClick={handleCopyPassword}>
              {copied ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={handleClose}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar Membro</DialogTitle>
          <DialogDescription>Preencha os dados do novo membro da organização</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome completo</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nome completo do membro"
                      {...field}
                      onBlur={(e) => formatNameOnBlur(e, field.onChange)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@exemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                      <CPFInput placeholder="000.000.000-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <PhoneInput
                        placeholder="(00) 00000-0000"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="role_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Permissão</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a permissão" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {AVAILABLE_ROLES.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Adicionar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
