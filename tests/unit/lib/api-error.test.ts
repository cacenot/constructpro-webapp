import { describe, expect, it, vi } from 'vitest'
import { extractApiErrorMessage, handleApiError, throwApiError } from '@/lib/api-error'

// Mock do sonner para não precisar de DOM completo
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

describe('extractApiErrorMessage()', () => {
  it('extrai body.message (erro customizado do backend)', () => {
    const error = {
      error_code: 6012,
      message: 'Pagamento parcial não permitido',
    }
    expect(extractApiErrorMessage(error, 'fallback')).toBe('Pagamento parcial não permitido')
  })

  it('extrai body.detail (string — erro padrão FastAPI)', () => {
    const error = { detail: 'Not found' }
    expect(extractApiErrorMessage(error, 'fallback')).toBe('Not found')
  })

  it('extrai body.detail como array (erros de validação FastAPI)', () => {
    const error = {
      detail: [
        { msg: 'field required', loc: ['body', 'name'] },
        { msg: 'value is not valid', loc: ['body', 'cpf'] },
      ],
    }
    expect(extractApiErrorMessage(error, 'fallback')).toBe('field required; value is not valid')
  })

  it('extrai Error.message nativo', () => {
    const error = new Error('Conexão recusada')
    expect(extractApiErrorMessage(error, 'fallback')).toBe('Conexão recusada')
  })

  it('retorna fallback para null', () => {
    expect(extractApiErrorMessage(null, 'Erro desconhecido')).toBe('Erro desconhecido')
  })

  it('retorna fallback para undefined', () => {
    expect(extractApiErrorMessage(undefined, 'Erro desconhecido')).toBe('Erro desconhecido')
  })

  it('retorna fallback para objeto sem message nem detail', () => {
    expect(extractApiErrorMessage({ error_code: 500 }, 'Erro')).toBe('Erro')
  })

  it('prefere body.message sobre body.detail', () => {
    const error = { message: 'mensagem customizada', detail: 'detalhe fastapi' }
    expect(extractApiErrorMessage(error, 'fallback')).toBe('mensagem customizada')
  })
})

describe('throwApiError()', () => {
  it('lança Error com a mensagem extraída', () => {
    expect(() => throwApiError({ message: 'erro de negócio' }, 'fallback')).toThrow(
      'erro de negócio'
    )
  })

  it('lança Error com fallback quando não há mensagem', () => {
    expect(() => throwApiError({}, 'Fallback message')).toThrow('Fallback message')
  })
})

describe('handleApiError()', () => {
  it('retorna a mensagem extraída', async () => {
    const { toast } = await import('sonner')
    const message = handleApiError({ message: 'Erro ao salvar' }, 'fallback')
    expect(message).toBe('Erro ao salvar')
    expect(toast.error).toHaveBeenCalledWith('Erro ao salvar')
  })

  it('chama toast.error com fallback quando sem mensagem', async () => {
    const { toast } = await import('sonner')
    vi.mocked(toast.error).mockClear()
    handleApiError(null, 'Erro genérico')
    expect(toast.error).toHaveBeenCalledWith('Erro genérico')
  })
})
