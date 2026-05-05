import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { vi } from 'vitest'

/**
 * Cria um QueryClient isolado para cada teste (sem cache compartilhado).
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

/**
 * Wrapper com QueryClientProvider fresco para uso em renderizações de teste.
 */
export function TestWrapper({ children }: { children: ReactNode }) {
  const queryClient = createTestQueryClient()
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

/**
 * Mock padronizado do AuthContext para testes.
 */
export const mockAuthContext = {
  user: null,
  loading: false,
  signIn: vi.fn(),
  signOut: vi.fn(),
  resetPassword: vi.fn(),
  changePassword: vi.fn(),
}
