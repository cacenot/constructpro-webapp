import type { components } from '@cacenot/construct-pro-api-client'
import { Check, Copy, ExternalLink, ScanBarcode } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { CustomerDetailResponse } from '@/hooks/useCustomerDetail'
import { cn, formatCurrency, formatId } from '@/lib/utils'

type CustomerBoletoEntry = components['schemas']['CustomerBoletoEntry']
type BoletoStatus = components['schemas']['BoletoStatus']

interface CustomerBoletosTabProps {
  customer: CustomerDetailResponse
}

const STATUS_CONFIG: Record<BoletoStatus, { label: string; className: string }> = {
  saved: {
    label: 'Salvo',
    className:
      'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:border-amber-400/30 dark:text-amber-300',
  },
  registered: {
    label: 'Registrado',
    className:
      'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:border-blue-400/30 dark:text-blue-300',
  },
  settled: {
    label: 'Liquidado',
    className:
      'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:text-emerald-300',
  },
  written_off: {
    label: 'Baixado',
    className: 'text-muted-foreground',
  },
  rejected: {
    label: 'Rejeitado',
    className:
      'border-red-500/30 bg-red-500/10 text-red-700 dark:border-red-400/30 dark:text-red-300',
  },
  protested: {
    label: 'Protestado',
    className:
      'border-red-500/30 bg-red-500/10 text-red-700 dark:border-red-400/30 dark:text-red-300',
  },
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('Linha digitável copiada!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Falha ao copiar')
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" className="size-7 shrink-0" onClick={handleCopy}>
          {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{copied ? 'Copiado!' : 'Copiar linha digitável'}</TooltipContent>
    </Tooltip>
  )
}

function BoletoCard({ boleto }: { boleto: CustomerBoletoEntry }) {
  const statusConfig = STATUS_CONFIG[boleto.status] ?? { label: boleto.status, className: '' }

  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Vencimento:{' '}
              <span className="font-medium text-foreground">
                {new Date(boleto.due_date).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </span>
            </span>
            <Badge variant="outline" className={cn(statusConfig.className)}>
              {statusConfig.label}
            </Badge>
          </div>
          <p className="tabular-nums text-lg font-bold">
            {formatCurrency(boleto.amount_cents / 100)}
          </p>
        </div>

        <p className="mt-1 text-xs text-muted-foreground">
          Contrato {formatId(boleto.contract_id)}
        </p>

        {boleto.digitable_line && (
          <div className="mt-4 flex items-center gap-2 rounded-md bg-muted/50 p-3">
            <p className="min-w-0 flex-1 break-all font-mono text-xs tabular-nums text-muted-foreground">
              {boleto.digitable_line}
            </p>
            <CopyButton text={boleto.digitable_line} />
          </div>
        )}

        {boleto.boleto_url && (
          <div className="mt-3">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" asChild>
              <a href={boleto.boleto_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" />
                Abrir Boleto
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function CustomerBoletosTab({ customer }: CustomerBoletosTabProps) {
  const boletos = customer.upcoming_boletos ?? []

  if (boletos.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed">
        <ScanBarcode className="size-8 text-muted-foreground/50" />
        <p className="text-muted-foreground">Nenhum boleto pendente.</p>
        <p className="text-sm text-muted-foreground">
          Boletos futuros aparecerão aqui quando forem gerados.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant="outline">
          {boletos.length} boleto{boletos.length > 1 ? 's' : ''}
        </Badge>
      </div>
      <div className="grid gap-4">
        {boletos.map((boleto) => (
          <BoletoCard key={boleto.boleto_id} boleto={boleto} />
        ))}
      </div>
    </div>
  )
}
