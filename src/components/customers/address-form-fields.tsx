import * as React from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { type BrasilApiCepResponse, CEPInput, PostalCodeInput } from '@/components/ui/cep-input'
import { CountrySelect } from '@/components/ui/country-select'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { capitalizeNameBR } from '@/lib/text-formatters'
import { TEXT_LIMITS } from '@/schemas/customer.schema'

interface AddressFormFieldsProps {
  /** Field name prefix, e.g., '' for root level or 'address.' for nested */
  prefix?: string
}

/**
 * Shared address form fields for customer forms.
 * Handles CEP auto-fill for Brazil and read-only state/city when country is BR.
 */
export function AddressFormFields({ prefix = '' }: AddressFormFieldsProps) {
  const form = useFormContext()

  const country = useWatch({
    control: form.control,
    name: `${prefix}country`,
    defaultValue: 'BR',
  })

  const isBrazil = country === 'BR'

  const handleCepFetched = React.useCallback(
    (data: BrasilApiCepResponse) => {
      // Update city and state from CEP data
      form.setValue(`${prefix}city`, capitalizeNameBR(data.city), { shouldValidate: true })
      form.setValue(`${prefix}state`, data.state, { shouldValidate: true })

      // Optionally fill street and neighborhood if empty
      const currentAddress = form.getValues(`${prefix}address`)
      const currentNeighborhood = form.getValues(`${prefix}neighborhood`)

      if (!currentAddress && data.street) {
        form.setValue(`${prefix}address`, capitalizeNameBR(data.street), { shouldValidate: true })
      }
      if (!currentNeighborhood && data.neighborhood) {
        form.setValue(`${prefix}neighborhood`, capitalizeNameBR(data.neighborhood), {
          shouldValidate: true,
        })
      }
    },
    [form, prefix]
  )

  // Clear city and state when country changes from BR
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === `${prefix}country`) {
        const newCountry = value[`${prefix}country`.replace('.', '')]
        if (newCountry !== 'BR') {
          // Clear CEP-related fields when changing away from Brazil
          form.setValue(`${prefix}postal_code`, '', { shouldValidate: false })
        }
      }
    })
    return () => subscription.unsubscribe()
  }, [form, prefix])

  return (
    <div className="space-y-4">
      {/* Line 1: Country, CEP, City, UF */}
      <div className="grid gap-4 sm:grid-cols-12">
        {/* Country (col-span-3) */}
        <FormField
          control={form.control}
          name={`${prefix}country`}
          render={({ field }) => (
            <FormItem className="sm:col-span-3">
              <FormLabel>País</FormLabel>
              <FormControl>
                <CountrySelect value={field.value || 'BR'} onValueChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Postal Code (col-span-3) */}
        <FormField
          control={form.control}
          name={`${prefix}postal_code`}
          render={({ field }) => (
            <FormItem className="sm:col-span-3">
              <FormLabel>{isBrazil ? 'CEP' : 'Código Postal'}</FormLabel>
              <FormControl>
                {isBrazil ? (
                  <CEPInput
                    value={field.value || ''}
                    onChange={field.onChange}
                    onCepFetched={handleCepFetched}
                    country={country}
                  />
                ) : (
                  <PostalCodeInput value={field.value || ''} onChange={field.onChange} />
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* City (col-span-4) */}
        <FormField
          control={form.control}
          name={`${prefix}city`}
          render={({ field }) => (
            <FormItem className="sm:col-span-4">
              <FormLabel>Cidade</FormLabel>
              <FormControl>
                {isBrazil ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Input
                        {...field}
                        value={field.value || ''}
                        readOnly
                        className="bg-muted cursor-not-allowed"
                        maxLength={TEXT_LIMITS.CITY}
                        placeholder="Preenchido pelo CEP"
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Digite o CEP para preencher automaticamente</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Input
                    {...field}
                    value={field.value || ''}
                    maxLength={TEXT_LIMITS.CITY}
                    placeholder="Cidade"
                    onBlur={(e) => {
                      const formatted = capitalizeNameBR(e.target.value)
                      if (formatted !== e.target.value) {
                        field.onChange(formatted)
                      }
                    }}
                  />
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* State/UF (col-span-2) */}
        <FormField
          control={form.control}
          name={`${prefix}state`}
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>UF</FormLabel>
              <FormControl>
                {isBrazil ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Input
                        {...field}
                        value={field.value || ''}
                        readOnly
                        className="bg-muted cursor-not-allowed"
                        maxLength={TEXT_LIMITS.STATE}
                        placeholder="Preenchido pelo CEP"
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Digite o CEP para preencher automaticamente</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Input
                    {...field}
                    value={field.value || ''}
                    maxLength={TEXT_LIMITS.STATE}
                    placeholder="Estado ou província"
                    onBlur={(e) => {
                      const formatted = capitalizeNameBR(e.target.value)
                      if (formatted !== e.target.value) {
                        field.onChange(formatted)
                      }
                    }}
                  />
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Line 2: Street Address and Number */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Street Address (col-span-2) */}
        <FormField
          control={form.control}
          name={`${prefix}address`}
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Logradouro</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value || ''}
                  maxLength={TEXT_LIMITS.ADDRESS}
                  placeholder="Rua, Avenida, etc."
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

        {/* Number (col-span-1) */}
        <FormField
          control={form.control}
          name={`${prefix}address_number`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value || ''}
                  maxLength={TEXT_LIMITS.ADDRESS_NUMBER}
                  placeholder="Nº"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Line 3: Neighborhood and Complement */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Neighborhood */}
        <FormField
          control={form.control}
          name={`${prefix}neighborhood`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bairro</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value || ''}
                  maxLength={TEXT_LIMITS.NEIGHBORHOOD}
                  placeholder="Bairro"
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

        {/* Complement */}
        <FormField
          control={form.control}
          name={`${prefix}complement`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Complemento</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value || ''}
                  maxLength={TEXT_LIMITS.COMPLEMENT}
                  placeholder="Apartamento, bloco, sala, etc."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
