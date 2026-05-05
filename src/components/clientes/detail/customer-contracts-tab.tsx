import type { components } from '@cacenot/construct-pro-api-client'
import { ArrowRight, FileText } from 'lucide-react'
import { navigate } from 'vike/client/router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { CustomerDetailResponse } from '@/hooks/useCustomerDetail'
import { cn, formatCurrency, formatId } from '@/lib/utils'

type CustomerContractSummary = components['schemas']['CustomerContractSummary']
type ContractStatus = components['schemas']['ContractStatus']

interface CustomerContractsTabProps {
  customer: CustomerDetailResponse
}

const STATUS_CONFIG: Record<ContractStatus, { label: string; className: string }> = {
  active: {
    label: 'Ativo',
    className: 'border-success/30 bg-success/10 text-success',
  },
  settled: {
    label: 'Quitado',
    className: 'border-info/30 bg-info/10 text-info',
  },
  in_default: {
    label: 'Inadimplente',
    className: 'border-destructive/30 bg-destructive/10 text-destructive',
  },
  pending: {
    label: 'Pendente',
    className: 'border-warning/30 bg-warning/10 text-warning',
  },
  canceled: {
    label: 'Cancelado',
    className: 'text-muted-foreground',
  },
  terminated: {
    label: 'Encerrado',
    className: 'text-muted-foreground',
  },
}

function ContractCard({ contract }: { contract: CustomerContractSummary }) {
  const statusConfig = STATUS_CONFIG[contract.status] ?? { label: contract.status, className: '' }

  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="tabular-nums font-semibold">{formatId(contract.contract_id)}</span>
            <Badge variant="outline" className={cn(statusConfig.className)}>
              {statusConfig.label}
            </Badge>
          </div>
          {contract.signed_at && (
            <span className="text-xs text-muted-foreground">
              Assinado em{' '}
              {new Date(contract.signed_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </span>
          )}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Principal</p>
            <p className="tabular-nums mt-0.5 font-semibold">
              {formatCurrency(contract.principal_amount_cents / 100)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Saldo Devedor</p>
            <p className="tabular-nums mt-0.5 font-semibold">
              {formatCurrency(contract.outstanding_balance_cents / 100)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Índice</p>
            <p className="mt-0.5 font-semibold">{contract.index_type_code}</p>
          </div>
        </div>

        <div className="mt-4 border-t pt-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
                onClick={() => navigate(`/contratos/${contract.contract_id}`)}
              >
                Ver contrato
                <ArrowRight className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Abrir detalhes do contrato</TooltipContent>
          </Tooltip>
        </div>
      </CardContent>
    </Card>
  )
}

export function CustomerContractsTab({ customer }: CustomerContractsTabProps) {
  const contracts = customer.contracts ?? []

  if (contracts.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed">
        <FileText className="size-8 text-muted-foreground/50" />
        <p className="text-muted-foreground">Nenhum contrato registrado.</p>
        <p className="text-sm text-muted-foreground">
          Os contratos aparecerão quando houver vendas finalizadas.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {contracts.map((contract) => (
          <ContractCard key={contract.contract_id} contract={contract} />
        ))}
      </div>
    </div>
  )
}
