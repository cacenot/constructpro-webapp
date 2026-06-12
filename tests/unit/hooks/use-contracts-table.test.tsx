import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TestWrapper } from '../helpers/wrapper'

vi.mock('@cacenot/construct-pro-api-client', async (importOriginal) => {
  const original = await importOriginal<typeof import('@cacenot/construct-pro-api-client')>()
  return {
    ...original,
    useApiClient: vi.fn(() => ({ client: { GET: mockGet } })),
  }
})

import { useContractsTable } from '@/hooks/use-contracts-table'

// biome-ignore lint/suspicious/noExplicitAny: stub de client para o teste
const mockGet = vi.fn<(path: string, opts?: any) => Promise<any>>()

const makeContract = (id: number, saleId: number) => ({
  id,
  sale_id: saleId,
  principal_amount: { cents: 1_000_000, decimal: '10000.00', brl: 'R$ 10.000,00' },
  status: 'active',
  signed_at: '2026-03-15T00:00:00Z',
  document_url: null,
  is_overdue: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
})

const makeSale = (id: number, customerName: string) => ({
  id,
  unit_id: 1,
  customer_id: 1,
  user_id: 'u1',
  amount: { cents: 1_000_000, decimal: '10000.00', brl: 'R$ 10.000,00' },
  unit_price: { cents: 1_000_000, decimal: '10000.00', brl: 'R$ 10.000,00' },
  status: 'closed',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: null,
  customer: { full_name: customerName },
  unit: { name: 'Apto 101', project: { name: 'Residencial Aurora' } },
})

function setupClient() {
  mockGet.mockImplementation((path: string, opts?: { params?: { path?: { sale_id: number } } }) => {
    if (path === '/api/v1/contracts') {
      return Promise.resolve({
        data: { items: [makeContract(1, 900), makeContract(2, 901)], total: 2 },
        error: null,
      })
    }
    if (path === '/api/v1/sales/{sale_id}') {
      const saleId = opts?.params?.path?.sale_id as number
      return Promise.resolve({ data: makeSale(saleId, `Cliente ${saleId}`), error: null })
    }
    return Promise.resolve({ data: null, error: null })
  })
}

describe('useContractsTable — enrichment de vendas', () => {
  beforeEach(() => {
    setupClient()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('busca cada venda pelo sale_id exato (não por janela fixa) e casa a âncora', async () => {
    const { result } = renderHook(() => useContractsTable(), { wrapper: TestWrapper })

    await waitFor(() => expect(result.current.data).toHaveLength(2))

    // Cada contrato é enriquecido com a venda do seu sale_id — sem janela de 100.
    expect(result.current.data[0].sale?.customer?.full_name).toBe('Cliente 900')
    expect(result.current.data[1].sale?.customer?.full_name).toBe('Cliente 901')

    // Buscou cada venda individualmente pelo id, nunca a lista paginada de vendas.
    const salePaths = mockGet.mock.calls.filter(([path]) => path === '/api/v1/sales/{sale_id}')
    expect(salePaths).toHaveLength(2)
    expect(mockGet).not.toHaveBeenCalledWith('/api/v1/sales', expect.anything())
  })

  it('não refaz fetch de uma venda já cacheada', async () => {
    // Duas linhas apontando para o MESMO sale_id → uma única chamada de venda.
    mockGet.mockImplementation((path: string, opts?: { params?: { path?: { sale_id: number } } }) => {
      if (path === '/api/v1/contracts') {
        return Promise.resolve({
          data: { items: [makeContract(1, 900), makeContract(2, 900)], total: 2 },
          error: null,
        })
      }
      if (path === '/api/v1/sales/{sale_id}') {
        const saleId = opts?.params?.path?.sale_id as number
        return Promise.resolve({ data: makeSale(saleId, `Cliente ${saleId}`), error: null })
      }
      return Promise.resolve({ data: null, error: null })
    })

    const { result } = renderHook(() => useContractsTable(), { wrapper: TestWrapper })

    await waitFor(() => expect(result.current.data).toHaveLength(2))

    const saleCalls = mockGet.mock.calls.filter(([path]) => path === '/api/v1/sales/{sale_id}')
    expect(saleCalls).toHaveLength(1)
    expect(result.current.data[0].sale?.customer?.full_name).toBe('Cliente 900')
    expect(result.current.data[1].sale?.customer?.full_name).toBe('Cliente 900')
  })
})
