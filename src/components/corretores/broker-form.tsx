import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { capitalizeNameBR } from '@/lib/text-formatters'
import { type BrokerCreateFormData, brokerCreateSchema } from '@/schemas/broker.schema'

interface BrokerFormProps {
  initialData?: Partial<BrokerCreateFormData>
  onSubmit: (data: BrokerCreateFormData) => Promise<void>
  onBack: () => void
  isEdit?: boolean
  isSubmitting?: boolean
}

export function BrokerForm({
  initialData,
  onSubmit,
  onBack,
  isEdit = false,
  isSubmitting = false,
}: BrokerFormProps) {
  const form = useForm<BrokerCreateFormData>({
    resolver: zodResolver(brokerCreateSchema),
    defaultValues: {
      cpf: initialData?.cpf || '',
      full_name: initialData?.full_name || '',
      creci: initialData?.creci || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
    },
  })

  const handleSubmit = async (data: BrokerCreateFormData) => {
    const submitData = {
      ...data,
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
    }
    await onSubmit(submitData as BrokerCreateFormData)
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
              {isEdit ? 'Editar Corretor' : 'Novo Corretor'}
            </h2>
            <p className="mt-1 text-muted-foreground">
              {isEdit
                ? 'Atualize os dados do corretor'
                : 'Preencha os dados para cadastrar um novo corretor'}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dados do Corretor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* CPF */}
            <div className="grid gap-4 sm:grid-cols-12">
              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem className="sm:col-span-3">
                    <FormLabel>CPF *</FormLabel>
                    <FormControl>
                      <CPFInput value={field.value} onChange={field.onChange} disabled={isEdit} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Nome completo */}
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      maxLength={120}
                      placeholder="Nome completo do corretor"
                      onBlur={(e) => {
                        const formatted = capitalizeNameBR(e.target.value)
                        if (formatted !== e.target.value) {
                          field.onChange(formatted)
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* CRECI */}
            <FormField
              control={form.control}
              name="creci"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CRECI *</FormLabel>
                  <FormControl>
                    <Input {...field} maxLength={20} placeholder="Ex: CRECI-SP 12345" />
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
