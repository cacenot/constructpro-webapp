import type { components } from '@cacenot/construct-pro-api-client'
import { FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ContractStatusBadge } from '@/components/vendas/contract-status-badge'
import { DataRow } from '@/components/vendas/data-row'
import { formatDate } from '@/lib/format-date'
import { formatCurrency } from '@/lib/utils'

type Sale = components['schemas']['SaleResponse']

interface DealContractPanelProps {
  sale: Sale
}

export function DealContractPanel({ sale }: DealContractPanelProps) {
  const contract = sale.contract

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Contrato</CardTitle>
      </CardHeader>
      <CardContent>
        {!contract ? (
          <p className="text-sm text-muted-foreground">
            Nenhum contrato ainda. Ele é gerado quando a proposta é aprovada.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-sm text-muted-foreground">Situação</span>
              {contract.status && <ContractStatusBadge status={contract.status} />}
            </div>
            <Separator />
            <DataRow
              label="Valor principal"
              value={formatCurrency(contract.principal_amount.cents / 100)}
            />
            {sale.index_type_code && (
              <DataRow label="Índice de correção" mono value={sale.index_type_code} />
            )}
            <DataRow label="Assinado em" value={formatDate(contract.signed_at)} />
            {contract.document_url && (
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-sm text-muted-foreground">Documento</span>
                <a
                  href={contract.document_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-sm text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <FileText className="size-3.5" />
                  Ver contrato
                </a>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
