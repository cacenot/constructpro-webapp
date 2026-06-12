import { Handshake } from 'lucide-react'
import { useMemo, useState } from 'react'
import { navigate } from 'vike/client/router'
import { PayInstallmentDialog } from '@/components/financeiro/pay-installment-dialog'
import { Button } from '@/components/ui/button'
import { DataTableInfinite } from '@/components/ui/data-table-infinite'
import type { SaleSummaryResponse } from '@/hooks/use-sales-summary'
import { ApproveSaleDialog } from './approve-sale-dialog'
import { createSalesColumns } from './sales-columns'
import { SignContractDialog } from './sign-contract-dialog'

// Estáveis no escopo de módulo: o DataTableRow é memoizado e exige onRowClick/getRowId
// com referência estável para não re-renderizar a lista inteira ao selecionar.
const handleSaleRowClick = (sale: SaleSummaryResponse) => navigate(`/vendas/${sale.id}`)
const getSaleRowId = (sale: SaleSummaryResponse) => String(sale.id)

interface SalesTableProps {
  data: SaleSummaryResponse[]
  isLoading: boolean
  isError?: boolean
  onRetry?: () => void
  hasActiveFilters: boolean
  onClearFilters: () => void
  total: number
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  onReachEnd?: () => void
}

export function SalesTable({
  data,
  isLoading,
  isError,
  onRetry,
  hasActiveFilters,
  onClearFilters,
  total,
  hasNextPage,
  isFetchingNextPage,
  onReachEnd,
}: SalesTableProps) {
  // O estado dos três dialogs de ação vive aqui (centralizado): as colunas só recebem
  // os handlers via a factory e disparam estes setters a partir do menu de ações.
  const [signSaleId, setSignSaleId] = useState<number | null>(null)
  const [payEntrySaleId, setPayEntrySaleId] = useState<number | null>(null)
  const [approveSaleId, setApproveSaleId] = useState<number | null>(null)

  const columns = useMemo(
    () =>
      createSalesColumns({
        onSignContract: (sale) => setSignSaleId(sale.id),
        onPayEntry: (sale) => setPayEntrySaleId(sale.id),
        onApproveSale: (sale) => setApproveSaleId(sale.id),
      }),
    []
  )

  return (
    <>
      <DataTableInfinite
        aria-label="Vendas"
        columns={columns}
        data={data}
        isLoading={isLoading}
        isError={isError}
        onRetry={onRetry}
        onRowClick={handleSaleRowClick}
        getRowId={getSaleRowId}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onReachEnd={onReachEnd}
        endLabel={
          total > 0 ? `Fim da lista · ${total} ${total === 1 ? 'venda' : 'vendas'}` : undefined
        }
        empty={
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Handshake className="size-10 opacity-40" />
            <p className="text-sm">
              {hasActiveFilters ? 'Nenhuma venda encontrada.' : 'Nenhuma venda registrada.'}
            </p>
            {hasActiveFilters ? (
              <Button variant="ghost" size="sm" onClick={onClearFilters}>
                Limpar filtros
              </Button>
            ) : (
              <Button size="sm" onClick={() => navigate('/vendas/novo')}>
                Nova venda
              </Button>
            )}
          </div>
        }
      />

      {signSaleId !== null && (
        <SignContractDialog
          open={true}
          onOpenChange={(open) => !open && setSignSaleId(null)}
          saleId={signSaleId}
        />
      )}

      {payEntrySaleId !== null && (
        <PayInstallmentDialog
          open={true}
          onOpenChange={(open: boolean) => !open && setPayEntrySaleId(null)}
          saleId={payEntrySaleId}
        />
      )}

      {approveSaleId !== null && (
        <ApproveSaleDialog
          open={true}
          onOpenChange={(open) => !open && setApproveSaleId(null)}
          saleId={approveSaleId}
        />
      )}
    </>
  )
}
