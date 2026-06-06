import { type components, SaleStatus } from '@cacenot/construct-pro-api-client'
import { ChevronDown, FileSignature, Handshake, Pencil, Wallet } from 'lucide-react'
import { navigate } from 'vike/client/router'
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
import type { ContractDetailResponse } from '@/hooks/use-contract-detail'
import { getDealStage } from '@/lib/deal-state'

type Sale = components['schemas']['SaleResponse']

interface DealActionsProps {
  sale: Sale
  contractDetail?: ContractDetailResponse
  onApprove: () => void
  onSign: () => void
  onPayEntry: () => void
}

/** Atalho de teclado visível na ação primária (só desktop). Discoverability + Flexibility. */
function ShortcutKbd({ k }: { k: string }) {
  return (
    <kbd className="ml-2 hidden rounded border border-current/25 px-1 font-mono text-[0.625rem] uppercase opacity-70 lg:inline-block">
      {k}
    </kbd>
  )
}

/** Item futuro, desabilitado, com etiqueta "Em breve". A estrutura já existe; só liga o handler quando o backend entrar. */
function SoonItem({ label }: { label: string }) {
  return (
    <DropdownMenuItem disabled className="justify-between">
      {label}
      <span className="text-xs text-muted-foreground">Em breve</span>
    </DropdownMenuItem>
  )
}

export function DealActions({
  sale,
  contractDetail,
  onApprove,
  onSign,
  onPayEntry,
}: DealActionsProps) {
  const stage = getDealStage(sale)
  const hasContract = !!sale.contract
  const documentUrl = sale.contract?.document_url
  const contractStatus = contractDetail?.status ?? sale.contract?.status
  const inDefault = contractStatus === 'in_default'

  const canEdit = sale.status === SaleStatus.proposal
  const canApprove = sale.status === SaleStatus.proposal
  const canSign = sale.status === SaleStatus.pending_signature && hasContract
  const canPayEntry =
    (sale.status === SaleStatus.pending_signature || sale.status === SaleStatus.pending_payment) &&
    hasContract

  // Renegociar só faz sentido em contrato ativo ou em atraso (no atraso vira ação primária).
  // Quitado / encerrado / cancelado não renegociam.
  const renegociarInOverflow = stage === 'closed' && contractStatus === 'active'

  const hasOverflow = !!documentUrl || renegociarInOverflow

  return (
    <div className="space-y-2">
      {/* Ação primária — o próximo passo do estado */}
      {canApprove && (
        <Button className="w-full justify-center gap-1.5 lg:justify-between" onClick={onApprove}>
          <span className="flex items-center gap-1.5">
            <FileSignature className="size-4" />
            Aprovar proposta
          </span>
          <ShortcutKbd k="A" />
        </Button>
      )}
      {canSign && (
        <Button className="w-full justify-center gap-1.5 lg:justify-between" onClick={onSign}>
          <span className="flex items-center gap-1.5">
            <FileSignature className="size-4" />
            Assinar contrato
          </span>
          <ShortcutKbd k="S" />
        </Button>
      )}
      {sale.status === SaleStatus.pending_payment && canPayEntry && (
        <Button className="w-full justify-center gap-1.5 lg:justify-between" onClick={onPayEntry}>
          <span className="flex items-center gap-1.5">
            <Wallet className="size-4" />
            Receber sinal/entrada
          </span>
          <ShortcutKbd k="E" />
        </Button>
      )}
      {inDefault && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="block w-full">
              <Button disabled className="w-full gap-1.5">
                <Handshake className="size-4" />
                Renegociar
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>Em breve</TooltipContent>
        </Tooltip>
      )}

      {/* Ações secundárias */}
      {canEdit && (
        <Button
          variant="outline"
          className="w-full gap-1.5"
          onClick={() => navigate(`/vendas/${sale.id}/editar`)}
        >
          <Pencil className="size-4" />
          Editar proposta
        </Button>
      )}
      {canSign && canPayEntry && (
        <Button variant="outline" className="w-full gap-1.5" onClick={onPayEntry}>
          <Wallet className="size-4" />
          Receber sinal/entrada
        </Button>
      )}

      {/* Mais ações — superfície que cresce (renegociar, aditivo, rescisão…) */}
      {hasOverflow && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between gap-1.5">
              Mais ações
              <ChevronDown className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-56"
          >
            {documentUrl && (
              <>
                <DropdownMenuLabel>Documentos</DropdownMenuLabel>
                <DropdownMenuItem
                  onSelect={() => window.open(documentUrl, '_blank', 'noopener,noreferrer')}
                >
                  Ver contrato
                </DropdownMenuItem>
              </>
            )}
            {renegociarInOverflow && (
              <>
                {documentUrl && <DropdownMenuSeparator />}
                <DropdownMenuLabel>Negociação</DropdownMenuLabel>
                <SoonItem label="Renegociar" />
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
