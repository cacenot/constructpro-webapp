import { Package } from 'lucide-react'
import type * as React from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ASSET_TYPE_LABELS, type AssetType } from '@/schemas/sale.schema'
import { getDefaultAssetMetadata } from './constants'
import { REVEAL } from './section'

interface AssetProposalFieldsProps {
  // biome-ignore lint/suspicious/noExplicitAny: suporta SaleFormData e SaleEditFormData
  form: UseFormReturn<any>
  index: number
  assetType: AssetType | undefined
  disabled?: boolean
}

/**
 * Sub-formulário do bem dado em entrada (veículo, imóvel, terreno, barco).
 * Vive num poço recuado abaixo da linha de entrada quando a forma é "Bem".
 */
export function AssetProposalFields({
  form,
  index,
  assetType,
  disabled,
}: AssetProposalFieldsProps) {
  const base = `installment_schedules.${index}.asset_proposal` as const

  return (
    <div className={`space-y-4 rounded-md border border-border bg-muted/40 p-4 ${REVEAL}`}>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Package className="size-3.5" />
        <span className="text-[0.6875rem] font-medium uppercase tracking-[0.08em]">
          Dados do bem
        </span>
      </div>

      <div className="grid items-start gap-4 sm:grid-cols-12">
        <FormField
          control={form.control}
          name={base}
          render={() => (
            <FormItem className="sm:col-span-4">
              <FormLabel>Tipo de bem *</FormLabel>
              <Select
                value={assetType ?? ''}
                onValueChange={(val) => {
                  const type = val as AssetType
                  form.setValue(
                    base,
                    { type, asset_metadata: getDefaultAssetMetadata(type) },
                    { shouldValidate: true }
                  )
                }}
                disabled={disabled}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(ASSET_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {assetType === 'vehicle' && (
        <div className="grid items-start gap-4 sm:grid-cols-12">
          <TextField
            form={form}
            name={`${base}.asset_metadata.plate`}
            label="Placa"
            placeholder="ABC-1234"
            span={4}
            disabled={disabled}
          />
          <TextField
            form={form}
            name={`${base}.asset_metadata.renavam`}
            label="RENAVAM"
            placeholder="12345678901"
            span={4}
            disabled={disabled}
          />
          <TextField
            form={form}
            name={`${base}.asset_metadata.brand`}
            label="Marca"
            placeholder="Toyota"
            span={4}
            disabled={disabled}
          />
          <TextField
            form={form}
            name={`${base}.asset_metadata.model`}
            label="Modelo"
            placeholder="Corolla"
            span={8}
            disabled={disabled}
          />
          <NumberField
            form={form}
            name={`${base}.asset_metadata.year`}
            label="Ano"
            placeholder="2024"
            min={1900}
            max={2030}
            span={4}
            disabled={disabled}
          />
        </div>
      )}

      {assetType === 'real_estate' && (
        <div className="grid items-start gap-4 sm:grid-cols-12">
          <TextField
            form={form}
            name={`${base}.asset_metadata.address`}
            label="Endereço"
            placeholder="Rua, número, bairro"
            span={8}
            disabled={disabled}
          />
          <TextField
            form={form}
            name={`${base}.asset_metadata.property_type`}
            label="Tipo de imóvel"
            placeholder="Apartamento"
            span={4}
            disabled={disabled}
          />
          <NumberField
            form={form}
            name={`${base}.asset_metadata.area_sqm`}
            label="Área (m²)"
            placeholder="0"
            min={0}
            span={6}
            disabled={disabled}
          />
          <TextField
            form={form}
            name={`${base}.asset_metadata.registration_number`}
            label="Nº de registro"
            placeholder="000.000"
            span={6}
            disabled={disabled}
          />
        </div>
      )}

      {assetType === 'land' && (
        <div className="grid items-start gap-4 sm:grid-cols-12">
          <TextField
            form={form}
            name={`${base}.asset_metadata.address`}
            label="Endereço"
            placeholder="Localização do terreno"
            span={8}
            disabled={disabled}
          />
          <NumberField
            form={form}
            name={`${base}.asset_metadata.area_sqm`}
            label="Área (m²)"
            placeholder="0"
            min={0}
            span={4}
            disabled={disabled}
          />
          <TextField
            form={form}
            name={`${base}.asset_metadata.registration_number`}
            label="Nº de registro"
            placeholder="000.000"
            span={12}
            disabled={disabled}
          />
        </div>
      )}

      {assetType === 'boat' && (
        <div className="grid items-start gap-4 sm:grid-cols-12">
          <TextField
            form={form}
            name={`${base}.asset_metadata.registration`}
            label="Registro"
            placeholder="TM-XXXXXX"
            span={4}
            disabled={disabled}
          />
          <NumberField
            form={form}
            name={`${base}.asset_metadata.length_meters`}
            label="Comprimento (m)"
            placeholder="0"
            min={0}
            span={4}
            disabled={disabled}
          />
          <TextField
            form={form}
            name={`${base}.asset_metadata.brand`}
            label="Marca"
            placeholder="Yamaha"
            span={4}
            disabled={disabled}
          />
          <TextField
            form={form}
            name={`${base}.asset_metadata.model`}
            label="Modelo"
            placeholder="242X"
            span={8}
            disabled={disabled}
          />
          <NumberField
            form={form}
            name={`${base}.asset_metadata.year`}
            label="Ano"
            placeholder="2024"
            min={1900}
            max={2030}
            span={4}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  )
}

const SPAN: Record<number, string> = {
  4: 'sm:col-span-4',
  6: 'sm:col-span-6',
  8: 'sm:col-span-8',
  12: 'sm:col-span-12',
}

interface FieldProps {
  // biome-ignore lint/suspicious/noExplicitAny: form genérico
  form: UseFormReturn<any>
  name: string
  label: string
  placeholder?: string
  span: number
  disabled?: boolean
}

function TextField({ form, name, label, placeholder, span, disabled }: FieldProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={SPAN[span]}>
          <FormLabel>{label} *</FormLabel>
          <FormControl>
            <Input
              placeholder={placeholder}
              {...field}
              value={field.value ?? ''}
              disabled={disabled}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function NumberField({
  form,
  name,
  label,
  placeholder,
  span,
  disabled,
  min,
  max,
}: FieldProps & { min?: number; max?: number }) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={SPAN[span]}>
          <FormLabel>{label} *</FormLabel>
          <FormControl>
            <Input
              type="number"
              inputMode="numeric"
              placeholder={placeholder}
              min={min}
              max={max}
              className="tabular-nums"
              value={field.value ?? ''}
              disabled={disabled}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                field.onChange(e.target.value ? Number(e.target.value) : '')
              }
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
