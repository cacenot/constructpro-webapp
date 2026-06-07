import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // "Refresh ao ver a tela": com staleTime curto, voltar à aba ou re-montar a
      // rota busca dados frescos automaticamente (refetchOnMount é true por padrão).
      // 30s evita thrash em navegação rápida; o React Query exibe o cache enquanto
      // refetcha em background, então não há flicker.
      staleTime: 1000 * 30, // 30 segundos
      gcTime: 1000 * 60 * 30, // 30 minutos (antigo cacheTime)
      retry: (failureCount, error) => {
        // Não tenta novamente em erros de autenticação
        if (error instanceof Error && error.message.includes('401')) {
          return false
        }
        return failureCount < 3
      },
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
    },
  },
})
