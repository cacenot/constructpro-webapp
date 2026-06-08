import { type components, useApiClient } from '@cacenot/construct-pro-api-client'
import { useQuery } from '@tanstack/react-query'

type InstallmentResponse = components['schemas']['InstallmentResponse']
type InstallmentDetailResponse = components['schemas']['InstallmentDetailResponse']
type InstallmentSummaryItemResponse = components['schemas']['InstallmentSummaryItemResponse']
type PaginatedInstallmentsResponse = components['schemas']['PaginatedResponse_InstallmentResponse_']
type InstallmentListSummary = components['schemas']['InstallmentListSummary']
type PortfolioCashflowResponse = components['schemas']['PortfolioCashflowResponse']
type CashflowMonth = components['schemas']['CashflowMonth']
type InstallmentsByProjectResponse = components['schemas']['InstallmentsByProjectResponse']
type InstallmentProjectBreakdown = components['schemas']['InstallmentProjectBreakdown']
type ProjectFinancialSummary = components['schemas']['ProjectFinancialSummary']

interface InstallmentsQuery {
  page?: number | null
  page_size?: number | null
  contract_id?: number | null
  kind?: components['schemas']['InstallmentKind'][] | null
  status?: components['schemas']['InstallmentStatus'][] | null
  payment_method?: components['schemas']['PaymentMethod'][] | null
  'due_date[min]'?: string | null
  'due_date[max]'?: string | null
  'paid_at[min]'?: string | null
  'paid_at[max]'?: string | null
  customer_id?: number | null
  project_id?: number | null
  sort_by?: string[]
}

interface CashflowQuery {
  from: string
  to: string
  project_id?: number | null
  customer_id?: number | null
}

interface FinancialSummaryQuery {
  project_id?: number | null
  customer_id?: number | null
}

export const installmentKeys = {
  all: ['installments'] as const,
  lists: () => ['installments', 'list'] as const,
  list: (filters: InstallmentsQuery) => ['installments', 'list', filters] as const,
  summaries: () => ['installments', 'summary'] as const,
  summary: (filters: InstallmentsQuery) => ['installments', 'summary', filters] as const,
  cashflows: () => ['installments', 'cashflow'] as const,
  cashflow: (params: CashflowQuery) => ['installments', 'cashflow', params] as const,
  byProjects: () => ['installments', 'by-project'] as const,
  byProject: (filters: InstallmentsQuery) => ['installments', 'by-project', filters] as const,
  financialSummaries: () => ['installments', 'financial-summary'] as const,
  financialSummary: (params: FinancialSummaryQuery) =>
    ['installments', 'financial-summary', params] as const,
  details: () => ['installments', 'detail'] as const,
  detail: (id: string) => ['installments', 'detail', id] as const,
}

export function useInstallments(params?: InstallmentsQuery) {
  const { client } = useApiClient()

  return useQuery({
    queryKey: installmentKeys.list(params ?? {}),
    queryFn: async () => {
      const { data, error } = await client.GET('/api/v1/installments', {
        params: { query: params },
      })

      if (error) {
        throw new Error('Falha ao carregar parcelas')
      }

      return data
    },
  })
}

export function useInstallment(installmentId: string) {
  const { client } = useApiClient()

  return useQuery({
    queryKey: installmentKeys.detail(installmentId),
    queryFn: async () => {
      const { data, error } = await client.GET('/api/v1/installments/{installment_id}', {
        params: { path: { installment_id: installmentId } },
      })

      if (error) {
        throw new Error('Falha ao carregar parcela')
      }

      return data
    },
    enabled: !!installmentId,
  })
}

export function useInstallmentsSummary(params?: InstallmentsQuery) {
  const { client } = useApiClient()

  return useQuery({
    queryKey: installmentKeys.summary(params ?? {}),
    queryFn: async () => {
      const { data, error } = await client.GET('/api/v1/installments/summary', {
        params: { query: params },
      })

      if (error) {
        throw new Error('Falha ao carregar resumo de parcelas')
      }

      return data
    },
  })
}

export function useInstallmentsCashflow(params: CashflowQuery) {
  const { client } = useApiClient()

  return useQuery({
    queryKey: installmentKeys.cashflow(params),
    queryFn: async () => {
      const { data, error } = await client.GET('/api/v1/installments/cashflow', {
        params: { query: params },
      })

      if (error) {
        throw new Error('Falha ao carregar fluxo de caixa')
      }

      return data
    },
  })
}

export function useInstallmentsByProject(params: InstallmentsQuery) {
  const { client } = useApiClient()

  return useQuery({
    queryKey: installmentKeys.byProject(params),
    queryFn: async () => {
      const { data, error } = await client.GET('/api/v1/installments/by-project', {
        params: { query: params },
      })

      if (error) {
        throw new Error('Falha ao carregar carteira por empreendimento')
      }

      return data
    },
  })
}

export function useInstallmentsFinancialSummary(params: FinancialSummaryQuery) {
  const { client } = useApiClient()

  return useQuery({
    queryKey: installmentKeys.financialSummary(params),
    queryFn: async () => {
      const { data, error } = await client.GET('/api/v1/installments/financial-summary', {
        params: { query: params },
      })

      if (error) {
        throw new Error('Falha ao carregar resumo financeiro')
      }

      return data
    },
  })
}

export type {
  InstallmentsQuery,
  CashflowQuery,
  FinancialSummaryQuery,
  InstallmentResponse,
  InstallmentDetailResponse,
  InstallmentSummaryItemResponse,
  PaginatedInstallmentsResponse,
  InstallmentListSummary,
  PortfolioCashflowResponse,
  CashflowMonth,
  InstallmentsByProjectResponse,
  InstallmentProjectBreakdown,
  ProjectFinancialSummary,
}
