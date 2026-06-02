import { z } from 'zod'

export const installmentKindValues = [
  'entry',
  'regular',
  'balloon',
  'key_delivery',
  'extra',
] as const
export const paymentMethodValues = ['boleto', 'pix', 'cash', 'transfer', 'card', 'asset'] as const
export const recurrenceTypeValues = [
  'monthly',
  'bimonthly',
  'quarterly',
  'semestral',
  'yearly',
] as const

export type InstallmentKind = (typeof installmentKindValues)[number]
export type InstallmentPeriodicity =
  | 'one_shot'
  | 'monthly'
  | 'bimonthly'
  | 'quarterly'
  | 'semestral'
  | 'yearly'
export type AssetType = 'vehicle' | 'real_estate' | 'land' | 'boat'

export const INSTALLMENT_KIND_LABELS: Record<InstallmentKind, string> = {
  entry: 'Entrada',
  regular: 'Regular',
  balloon: 'Balão',
  key_delivery: 'Entrega das Chaves',
  extra: 'Extra',
}

export const INSTALLMENT_PERIODICITY_LABELS: Record<InstallmentPeriodicity, string> = {
  one_shot: 'Parcela única',
  monthly: 'Mensal',
  bimonthly: 'Bimestral',
  quarterly: 'Trimestral',
  semestral: 'Semestral',
  yearly: 'Anual',
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  boleto: 'Boleto',
  pix: 'Pix',
  cash: 'Dinheiro',
  transfer: 'Transferência',
  card: 'Cartão',
  asset: 'Bem',
}

export const ASSET_TYPE_LABELS: Record<string, string> = {
  vehicle: 'Veículo',
  real_estate: 'Imóvel',
  land: 'Terreno',
  boat: 'Barco',
}

const assetMetadataSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('vehicle'),
    plate: z.string().min(1, 'Placa é obrigatória'),
    renavam: z.string().min(1, 'RENAVAM é obrigatório'),
    brand: z.string().min(1, 'Marca é obrigatória'),
    model: z.string().min(1, 'Modelo é obrigatório'),
    year: z
      .number({ error: 'Ano inválido' })
      .int()
      .min(1900, 'Ano mínimo é 1900')
      .max(2030, 'Ano máximo é 2030'),
  }),
  z.object({
    type: z.literal('real_estate'),
    address: z.string().min(1, 'Endereço é obrigatório'),
    property_type: z.string().min(1, 'Tipo de imóvel é obrigatório'),
    area_sqm: z.number({ error: 'Área inválida' }).positive('Área deve ser maior que zero'),
    registration_number: z.string().min(1, 'Nº de registro é obrigatório'),
  }),
  z.object({
    type: z.literal('land'),
    address: z.string().min(1, 'Endereço é obrigatório'),
    area_sqm: z.number({ error: 'Área inválida' }).positive('Área deve ser maior que zero'),
    registration_number: z.string().min(1, 'Nº de registro é obrigatório'),
  }),
  z.object({
    type: z.literal('boat'),
    registration: z.string().min(1, 'Registro é obrigatório'),
    length_meters: z
      .number({ error: 'Comprimento inválido' })
      .positive('Comprimento deve ser maior que zero'),
    brand: z.string().min(1, 'Marca é obrigatória'),
    model: z.string().min(1, 'Modelo é obrigatório'),
    year: z
      .number({ error: 'Ano inválido' })
      .int()
      .min(1900, 'Ano mínimo é 1900')
      .max(2030, 'Ano máximo é 2030'),
  }),
])

const installmentScheduleSchema = z
  .object({
    kind: z.enum(installmentKindValues, {
      message: 'Tipo é obrigatório',
    }),
    payment_method: z.enum(paymentMethodValues, {
      message: 'Forma de pagamento é obrigatória',
    }),
    quantity: z.number().min(1, 'Quantidade deve ser pelo menos 1'),
    amount: z.number().min(1, 'Valor deve ser maior que zero'),
    index_type_code: z.string().min(1).nullable().optional(),
    specific_date: z.string().nullable().optional(),
    recurrence_type: z.enum(recurrenceTypeValues).nullable().optional(),
    recurrence_day: z.number().min(1).max(31).nullable().optional(),
    recurrence_month: z.number().min(1).max(12).nullable().optional(),
    start_date: z.string().nullable().optional(),
    asset_proposal: z
      .object({
        type: z.enum(['vehicle', 'real_estate', 'land', 'boat'] as const),
        asset_metadata: assetMetadataSchema,
      })
      .nullable()
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.kind === 'entry') {
      if (!data.specific_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Data de pagamento é obrigatória para entrada',
          path: ['specific_date'],
        })
      }
    }

    if (data.kind === 'regular' || data.kind === 'balloon' || data.kind === 'extra') {
      if (!data.recurrence_day) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Dia de vencimento é obrigatório',
          path: ['recurrence_day'],
        })
      }
      if (!data.start_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Data de início é obrigatória',
          path: ['start_date'],
        })
      }
    }

    if (data.kind === 'key_delivery') {
      if (!data.specific_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Data de entrega é obrigatória para Entrega das Chaves',
          path: ['specific_date'],
        })
      }
    }

    if (data.recurrence_type === 'yearly' && !data.recurrence_month) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Mês de vencimento é obrigatório para parcelas anuais',
        path: ['recurrence_month'],
      })
    }

    if (data.payment_method === 'asset') {
      if (!data.asset_proposal) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Dados do bem são obrigatórios',
          path: ['asset_proposal'],
        })
      }
    } else if (data.asset_proposal != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Bem não permitido para esta forma de pagamento',
        path: ['asset_proposal'],
      })
    }
  })

export const saleFormSchema = z
  .object({
    unit_id: z.number({ error: 'Unidade é obrigatória' }).min(1, 'Unidade é obrigatória'),
    customer_id: z.number({ error: 'Cliente é obrigatório' }).min(1, 'Cliente é obrigatório'),
    same_index_for_all: z.boolean(),
    index_type_code: z.string().nullable().optional(),
    installment_schedules: z
      .array(installmentScheduleSchema)
      .min(1, 'Pelo menos uma parcela é obrigatória'),
    broker_id: z.number().optional().nullable(),
    commission_broker_rate: z.number().optional().nullable(),
    agency_id: z.number().optional().nullable(),
    commission_agency_rate: z.number().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.same_index_for_all) {
      if (!data.index_type_code || data.index_type_code.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Índice de correção é obrigatório',
          path: ['index_type_code'],
        })
      }
    } else {
      data.installment_schedules.forEach((s, i) => {
        if (s.kind !== 'entry' && (!s.index_type_code || s.index_type_code.length === 0)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Índice de correção é obrigatório',
            path: ['installment_schedules', i, 'index_type_code'],
          })
        }
      })
    }
    if (data.broker_id) {
      if (data.commission_broker_rate == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Taxa de comissão do corretor é obrigatória quando corretor selecionado.',
          path: ['commission_broker_rate'],
        })
      } else if (data.commission_broker_rate <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Taxa deve ser maior que zero.',
          path: ['commission_broker_rate'],
        })
      }
    }
    if (data.agency_id) {
      if (!data.broker_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Selecione um corretor antes de escolher imobiliária.',
          path: ['agency_id'],
        })
      }
      if (data.commission_agency_rate == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Taxa de comissão da imobiliária é obrigatória quando imobiliária selecionada.',
          path: ['commission_agency_rate'],
        })
      } else if (data.commission_agency_rate <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Taxa deve ser maior que zero.',
          path: ['commission_agency_rate'],
        })
      }
    }
  })

export type SaleFormData = z.infer<typeof saleFormSchema>
export type InstallmentScheduleFormData = z.infer<typeof installmentScheduleSchema>

export const saleEditFormSchema = z
  .object({
    same_index_for_all: z.boolean(),
    index_type_code: z.string().nullable().optional(),
    installment_schedules: z
      .array(installmentScheduleSchema)
      .min(1, 'Pelo menos uma parcela é obrigatória'),
    broker_id: z.number().optional().nullable(),
    commission_broker_rate: z.number().optional().nullable(),
    agency_id: z.number().optional().nullable(),
    commission_agency_rate: z.number().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.same_index_for_all) {
      if (!data.index_type_code || data.index_type_code.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Índice de correção é obrigatório',
          path: ['index_type_code'],
        })
      }
    } else {
      data.installment_schedules.forEach((s, i) => {
        if (s.kind !== 'entry' && (!s.index_type_code || s.index_type_code.length === 0)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Índice de correção é obrigatório',
            path: ['installment_schedules', i, 'index_type_code'],
          })
        }
      })
    }
    if (data.broker_id) {
      if (data.commission_broker_rate == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Taxa de comissão do corretor é obrigatória quando corretor selecionado.',
          path: ['commission_broker_rate'],
        })
      } else if (data.commission_broker_rate <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Taxa deve ser maior que zero.',
          path: ['commission_broker_rate'],
        })
      }
    }
    if (data.agency_id) {
      if (!data.broker_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Selecione um corretor antes de escolher imobiliária.',
          path: ['agency_id'],
        })
      }
      if (data.commission_agency_rate == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Taxa de comissão da imobiliária é obrigatória quando imobiliária selecionada.',
          path: ['commission_agency_rate'],
        })
      } else if (data.commission_agency_rate <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Taxa deve ser maior que zero.',
          path: ['commission_agency_rate'],
        })
      }
    }
  })

export type SaleEditFormData = z.infer<typeof saleEditFormSchema>
