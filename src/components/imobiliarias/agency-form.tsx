import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CNPJInput } from '@/components/ui/document-input'
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { type AgencyCreateFormData, agencyCreateSchema } from '@/schemas/agency.schema'

interface AgencyFormProps {
  initialData?: Partial<AgencyCreateFormData>
  onSubmit: (data: AgencyCreateFormData) => Promise<void>
  onBack: () => void
  isEdit?: boolean
  isSubmitting?: boolean
}

export function AgencyForm({
  initialData,
  onSubmit,
  onBack,
  isEdit = false,
  isSubmitting = false,
}: AgencyFormProps) {
  const form = useForm<AgencyCreateFormData>({
    resolver: zodResolver(agencyCreateSchema),
    defaultValues: {
      cnpj: initialData?.cnpj || '',
      legal_name: initialData?.legal_name || '',
      trade_name: initialData?.trade_name || '',
      creci_j: initialData?.creci_j || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
    },
  })

  const handleSubmit = async (data: AgencyCreateFormData) => {
    const submitData = {
      ...data,
      trade_name: data.trade_name?.trim() || null,
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
    }
    await onSubmit(submitData as AgencyCreateFormData)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Voltar</p>
            </TooltipContent>
          </Tooltip>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {isEdit ? 'Editar Imobiliária' : 'Nova Imobiliária'}
            </h2>
            <p className="mt-1 text-muted-foreground">
              {isEdit
                ? 'Atualize os dados da imobiliária'
                : 'Preencha os dados para cadastrar uma nova imobiliária'}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dados da Imobiliária</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* CNPJ */}
            <div className="grid gap-4 sm:grid-cols-12">
              <FormField
                control={form.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem className="sm:col-span-4">
                    <FormLabel>CNPJ *</FormLabel>
                    <FormControl>
                      <CNPJInput value={field.value} onChange={field.onChange} disabled={isEdit} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Razão Social */}
            <FormField
              control={form.control}
              name="legal_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Razão Social *</FormLabel>
                  <FormControl>
                    <Input {...field} maxLength={160} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nome Fantasia */}
            <FormField
              control={form.control}
              name="trade_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Fantasia</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ''}
                      maxLength={120}
                      placeholder="Nome fantasia (opcional)"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* CRECI-J */}
            <FormField
              control={form.control}
              name="creci_j"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CRECI-J *</FormLabel>
                  <FormControl>
                    <Input {...field} maxLength={20} placeholder="Ex: CRECI-SP 12345-J" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Telefone e E-mail */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <PhoneInput
                        value={field.value || ''}
                        onChange={field.onChange}
                        defaultCountry="BR"
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
                      <Input
                        {...field}
                        type="email"
                        value={field.value || ''}
                        maxLength={255}
                        placeholder="email@exemplo.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onBack}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 size-4" />
                {isEdit ? 'Atualizar' : 'Cadastrar'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
