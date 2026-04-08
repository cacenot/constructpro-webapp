import type { components } from '@cacenot/construct-pro-api-client'

type SaleResponse = components['schemas']['SaleResponse']

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MoreVertical } from 'lucide-react'
import { navigate } from 'vike/client/router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { ContractResponse } from '@/hooks/useContracts'
import { formatCurrency, formatId } from '@/lib/utils'
import { ContractStatusBadge } from './contract-status-badge'

interface ContractRowProps {
  contract: ContractResponse
  sale?: SaleResponse | null
}

export function ContractRow({ contract, sale }: ContractRowProps) {
  const customerName = sale?.customer?.full_name || 'Cliente não informado'
  const projectName = sale?.unit?.project?.name || 'Empreendimento não informado'
  const unitName = sale?.unit?.name || 'Unidade não informada'

  return (
    <div className="flex items-center gap-4 px-6 py-3">
      {/* ID Badge */}
      <Badge variant="secondary" className="shrink-0 tabular-nums font-mono text-xs">
        {formatId(contract.id)}
      </Badge>

      {/* Cliente + Venda Info (2 lines) */}
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <span className="truncate text-sm font-medium">{customerName}</span>
        <span className="text-xs text-muted-foreground truncate">
          Venda {formatId(contract.sale_id)} · {projectName} - {unitName}
        </span>
      </div>

      {/* Valor Principal (hidden lg:block) */}
      <div className="hidden lg:block w-40 shrink-0">
        <span className="text-sm font-medium tabular-nums">
          {formatCurrency(contract.principal_amount_cents / 100)}
        </span>
      </div>

      {/* Índice de Correção (hidden lg:block) */}
      <div className="hidden lg:block w-20 shrink-0">
        <span className="text-sm text-muted-foreground uppercase">{contract.index_type_code}</span>
      </div>

      {/* Status */}
      <div className="w-32 shrink-0">
        <ContractStatusBadge status={contract.status || 'pending'} />
      </div>

      {/* Data de Assinatura (hidden xl:block) */}
      <div className="hidden xl:block w-32 shrink-0">
        {contract.signed_at ? (
          <span className="text-xs text-muted-foreground">
            {format(new Date(contract.signed_at), 'dd/MM/yyyy', { locale: ptBR })}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground italic">Aguardando</span>
        )}
      </div>

      {/* Actions Menu */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="shrink-0">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Ações</p>
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => navigate(`/contratos/${contract.id}`)}>
            Ver detalhes
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate(`/contratos/${contract.id}/editar`)}>
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate(`/vendas/${contract.sale_id}`)}>
            Ver venda relacionada
          </DropdownMenuItem>
          {contract.status === 'pending' && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate(`/contratos/${contract.id}/assinar`)}>
                Registrar assinatura
              </DropdownMenuItem>
            </>
          )}
          {contract.document_url && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.open(contract.document_url ?? '', '_blank')}>
                Baixar documento
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
