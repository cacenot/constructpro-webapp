import { UnitCategory } from '@cacenot/construct-pro-api-client'
import { z } from 'zod'

/**
 * Text input max lengths for unit fields
 */
export const UNIT_TEXT_LIMITS = {
  NAME: 200,
  DESCRIPTION: 2000,
  APARTMENT_TYPE: 100,
  FEATURE: 100,
} as const

/**
 * Default suggested features for real estate units
 * Can be overridden via environment variable VITE_UNIT_FEATURES_SUGGESTIONS
 */
export const DEFAULT_UNIT_FEATURES = [
  'Varanda',
  'Suíte',
  'Closet',
  'Ar Condicionado',
  'Vista Mar',
  'Sol da Manhã',
  'Armários Embutidos',
  'Piso Porcelanato',
  'Box Blindex',
  'Despensa',
  'Sacada Gourmet',
  'Área de Serviço',
  'Home Office',
  'Churrasqueira',
  'Lareira',
  'Banheira',
  'Piscina Privativa',
  'Jardim Privativo',
  'Mezanino',
  'Pé Direito Duplo',
]

/**
 * Get unit features suggestions from env or defaults
 */
export function getUnitFeaturesSuggestions(): string[] {
  const envSuggestions = import.meta.env.VITE_UNIT_FEATURES_SUGGESTIONS
  if (envSuggestions && typeof envSuggestions === 'string') {
    return envSuggestions
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return DEFAULT_UNIT_FEATURES
}

/**
 * Unit category values from API client enum
 */
const unitCategoryValues = Object.values(UnitCategory) as [string, ...string[]]

/**
 * Schema for unit form (create and edit)
 * Note: status is not included as it's calculated by the application
 */
export const unitFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(UNIT_TEXT_LIMITS.NAME, `Máximo ${UNIT_TEXT_LIMITS.NAME} caracteres`),

  category: z.enum(unitCategoryValues, {
    required_error: 'Categoria é obrigatória',
  }),

  project_id: z
    .number({
      required_error: 'Empreendimento é obrigatório',
    })
    .min(1, 'Empreendimento é obrigatório'),

  area: z
    .number({
      required_error: 'Área é obrigatória',
    })
    .min(0.01, 'Área deve ser maior que zero'),

  price_cents: z
    .number({
      required_error: 'Preço é obrigatório',
    })
    .min(1, 'Preço deve ser maior que zero'),

  description: z
    .string()
    .max(UNIT_TEXT_LIMITS.DESCRIPTION, `Máximo ${UNIT_TEXT_LIMITS.DESCRIPTION} caracteres`)
    .optional()
    .nullable(),

  apartment_type: z
    .string()
    .max(UNIT_TEXT_LIMITS.APARTMENT_TYPE, `Máximo ${UNIT_TEXT_LIMITS.APARTMENT_TYPE} caracteres`)
    .optional()
    .nullable(),

  bedrooms: z.number().min(0, 'Deve ser 0 ou mais').optional().nullable(),

  bathrooms: z.number().min(0, 'Deve ser 0 ou mais').optional().nullable(),

  garages: z.number().min(0, 'Deve ser 0 ou mais').optional().nullable(),

  floor: z.number().min(0, 'Deve ser 0 ou mais').optional().nullable(),

  features: z.array(z.string().max(UNIT_TEXT_LIMITS.FEATURE)).optional().nullable(),
})

/**
 * Type for unit form data
 */
export type UnitFormData = z.infer<typeof unitFormSchema>
