import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { BirthDateInput } from '@/components/ui/birth-date-input'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { UFSelect } from '@/components/ui/uf-select'
import { capitalizeNameBR, formatISOToBirthDate, parseBirthDateToISO } from '@/lib/text-formatters'
import {
  type CustomerPFCreateFormData,
  customerPFCreateSchema,
  TEXT_LIMITS,
} from '@/schemas/customer.schema'
import { AddressFormFields } from './address-form-fields'

interface CustomerPFFormProps {
  /** Initial data for edit mode */
  initialData?: Partial<CustomerPFCreateFormData & { cpf_cnpj?: string }>
  /** Called when form is submitted successfully */
  onSubmit: (data: CustomerPFCreateFormData) => Promise<void>
  /** Called when back button is clicked */
  onBack: () => void
  /** Whether the form is in edit mode */
  isEdit?: boolean
  /** Whether the form is submitting */
  isSubmitting?: boolean
}

const genderOptions = [
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Feminino' },
]

const maritalStatusOptions = [
  { value: 'single', label: 'Solteiro(a)' },
  { value: 'married', label: 'Casado(a)' },
  { value: 'divorced', label: 'Divorciado(a)' },
  { value: 'widowed', label: 'Viúvo(a)' },
  { value: 'stable union', label: 'União Estável' },
]

/**
 * Customer form for Pessoa Física (Individual)
 */
export function CustomerPFForm({
  initialData,
  onSubmit,
  onBack,
  isEdit = false,
  isSubmitting = false,
}: CustomerPFFormProps) {
  const form = useForm<CustomerPFCreateFormData>({
    resolver: zodResolver(customerPFCreateSchema),
    defaultValues: {
      type: 'individual',
      full_name: initialData?.full_name || '',
      cpf_cnpj: initialData?.cpf_cnpj || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      birthday: initialData?.birthday ? formatISOToBirthDate(initialData.birthday) : '',
      gender: initialData?.gender || null,
      marital_status: initialData?.marital_status || null,
      rg: initialData?.rg || '',
      rg_issuer: initialData?.rg_issuer || '',
      rg_issue_state: initialData?.rg_issue_state || '',
      address: initialData?.address || '',
      address_number: initialData?.address_number || '',
      neighborhood: initialData?.neighborhood || '',
      city: initialData?.city || '',
      state: initialData?.state || '',
      postal_code: initialData?.postal_code || '',
      complement: initialData?.complement || '',
      country: initialData?.country || 'BR',
    },
  })

  const handleSubmit = async (data: CustomerPFCreateFormData) => {
    // Convert birthday to ISO format before submitting
    const submitData = {
      ...data,
      birthday: data.birthday ? parseBirthDateToISO(data.birthday) : null,
      // Clean empty strings to null
      email: data.email?.trim() || null,
      rg: data.rg?.trim() || null,
      rg_issuer: data.rg_issuer?.trim() || null,
      rg_issue_state: data.rg_issue_state?.trim() || null,
    }
    await onSubmit(submitData as CustomerPFCreateFormData)
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
              {isEdit ? 'Editar Cliente' : 'Novo Cliente'} - Pessoa Física
            </h2>
            <p className="mt-1 text-muted-foreground">
              {isEdit
                ? 'Atualize os dados do cliente'
                : 'Preencha os dados para cadastrar um novo cliente'}
            </p>
          </div>
        </div>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Dados Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Line 1: CPF */}
            <div className="grid gap-4 sm:grid-cols-12">
              <FormField
                control={form.control}
                name="cpf_cnpj"
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

            {/* Line 2: Full Name */}
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      maxLength={TEXT_LIMITS.FULL_NAME}
                      placeholder="Nome completo do cliente"
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

            {/* Line 3: Phone and Email */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone *</FormLabel>
                    <FormControl>
                      <PhoneInput
                        value={field.value || ''}
                        onChange={field.onChange}
                        defaultCountry="BR"
                        international
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
                        maxLength={TEXT_LIMITS.EMAIL}
                        placeholder="email@exemplo.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Line 4: Birthday, Gender, Marital Status */}
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="birthday"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Nascimento</FormLabel>
                    <FormControl>
                      <BirthDateInput value={field.value || ''} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sexo</FormLabel>
                    <Select
                      value={field.value || ''}
                      onValueChange={(value) => field.onChange(value || null)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {genderOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="marital_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado Civil</FormLabel>
                    <Select
                      value={field.value || ''}
                      onValueChange={(value) => field.onChange(value || null)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {maritalStatusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Documentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Line 1: RG, Órgão Emissor, UF */}
            <div className="grid gap-4 sm:grid-cols-12">
              {/* RG */}
              <FormField
                control={form.control}
                name="rg"
                render={({ field }) => (
                  <FormItem className="sm:col-span-5">
                    <FormLabel>RG</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ''}
                        maxLength={TEXT_LIMITS.RG}
                        placeholder="Número do RG"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* RG Issuer */}
              <FormField
                control={form.control}
                name="rg_issuer"
                render={({ field }) => (
                  <FormItem className="sm:col-span-5">
                    <FormLabel>Órgão Emissor</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ''}
                        maxLength={TEXT_LIMITS.RG_ISSUER}
                        placeholder="Ex: SSP"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* RG Issue State */}
              <FormField
                control={form.control}
                name="rg_issue_state"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>UF do RG</FormLabel>
                    <FormControl>
                      <UFSelect
                        value={field.value || ''}
                        onValueChange={field.onChange}
                        placeholder="UF"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle>Endereço</CardTitle>
          </CardHeader>
          <CardContent>
            <AddressFormFields />
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
