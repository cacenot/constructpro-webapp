import { toast } from 'sonner'

/**
 * Standard backend error response structure.
 *
 * Example:
 * {
 *   "error_code": 6012,
 *   "error_category": "business_logic",
 *   "message": "Pagamento parcial não permitido para esta parcela",
 *   "details": { "installment_kind": "monthly", "rule": "partial_payments_not_allowed" },
 *   "path": "/api/v1/installments/.../pay"
 * }
 */
interface ApiErrorBody {
  error_code?: number
  error_category?: string
  message?: string
  detail?: string | Array<{ msg: string; loc?: string[] }>
  details?: Record<string, unknown>
  path?: string
}

/**
 * Extract a human-readable message from an API error response object,
 * a standard Error, or an unknown value.
 *
 * Resolution order:
 *  1. Backend custom errors → `error.message`
 *  2. FastAPI default errors → `error.detail` (string) or first item in array
 *  3. Standard Error instances → `error.message`
 *  4. Fallback string
 */
export function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object') {
    const body = error as ApiErrorBody

    if (typeof body.message === 'string' && body.message) {
      return body.message
    }

    if (typeof body.detail === 'string' && body.detail) {
      return body.detail
    }

    if (Array.isArray(body.detail) && body.detail.length > 0) {
      return body.detail.map((d) => d.msg).join('; ')
    }
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

/**
 * Throw an Error with a message extracted from the OpenAPI client error body.
 *
 * Use inside `mutationFn` when the API returns `{ error }`:
 * ```ts
 * const { data, error } = await client.POST(...)
 * if (error) throwApiError(error, 'Texto de fallback')
 * ```
 */
export function throwApiError(error: unknown, fallback: string): never {
  throw new Error(extractApiErrorMessage(error, fallback))
}

/**
 * Handle a mutation error: show a toast.error and return the message.
 *
 * Use in `onError` callbacks or `catch` blocks:
 * ```ts
 * onError: (error) => handleApiError(error, 'Erro ao salvar')
 * ```
 */
export function handleApiError(error: unknown, fallback: string): string {
  const message = extractApiErrorMessage(error, fallback)
  toast.error(message)
  return message
}
