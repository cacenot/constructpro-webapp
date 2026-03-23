import { ArrowLeft, Building2, Mail, MapPin, Pencil, Phone, ShoppingCart, User } from 'lucide-react'
import { navigate } from 'vike/client/router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { CustomerDetailResponse } from '@/hooks/useCustomerDetail'
import { formatDocument, formatPhone, whatsappLink } from '@/lib/text-formatters'
import { cn, formatCurrency } from '@/lib/utils'

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-label="WhatsApp">
      <title>WhatsApp</title>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}

interface CustomerHeroHeaderProps {
  customer: CustomerDetailResponse
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

function formatLocation(customer: CustomerDetailResponse): string | null {
  const parts = [customer.city, customer.state].filter(Boolean)
  return parts.length > 0 ? parts.join('/') : null
}

export function CustomerHeroHeader({ customer }: CustomerHeroHeaderProps) {
  const isCompany = customer.type === 'company'
  const financial = customer.financial_summary
  const progressValue = financial ? Number(financial.payment_progress_percentage) : 0
  const location = formatLocation(customer)

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 gap-1.5 text-muted-foreground"
        onClick={() => navigate('/clientes')}
      >
        <ArrowLeft className="size-4" />
        Voltar para Clientes
      </Button>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        {/* Left: Customer info */}
        <div className="flex min-w-0 flex-1 gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-medium text-muted-foreground">
            {isCompany ? <Building2 className="size-6" /> : getInitials(customer.full_name)}
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{customer.full_name}</h1>
              <Badge
                variant="outline"
                className={cn(
                  isCompany
                    ? 'border-purple-500/30 bg-purple-500/10 text-purple-700 dark:border-purple-400/30 dark:text-purple-300'
                    : 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:border-blue-400/30 dark:text-blue-300'
                )}
              >
                {isCompany ? 'Pessoa Jurídica' : 'Pessoa Física'}
              </Badge>
              {customer.is_draft && (
                <Badge variant="outline" className="text-muted-foreground">
                  Rascunho
                </Badge>
              )}
            </div>

            {customer.legal_name && (
              <p className="text-sm text-muted-foreground">{customer.legal_name}</p>
            )}

            <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <User className="size-4 shrink-0" />
                {formatDocument(customer.cpf_cnpj)}
              </div>
              {customer.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="size-4 shrink-0" />
                  {formatPhone(customer.phone)}
                  <a
                    href={whatsappLink(customer.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                  >
                    <WhatsAppIcon className="size-4" />
                  </a>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="size-4 shrink-0" />
                  {customer.email}
                </div>
              )}
              {location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="size-4 shrink-0" />
                  {location}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => navigate(`/clientes/${customer.id}/editar`)}
                  >
                    <Pencil className="size-4" />
                    Editar
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Editar dados do cliente</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => navigate(`/vendas/novo?cliente=${customer.id}`)}
                  >
                    <ShoppingCart className="size-4" />
                    Nova Venda
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Criar nova venda para este cliente</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Right: Financial vitals mini-card */}
        {financial && (
          <Card className="shrink-0 border-primary/10 lg:w-80">
            <CardContent className="space-y-4 py-5">
              <div>
                <p className="text-xs text-muted-foreground">Saldo Devedor Total</p>
                <p className="tabular-nums mt-1 text-2xl font-bold">
                  {formatCurrency(financial.outstanding_balance_cents / 100)}
                </p>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progresso de pagamento</span>
                  <span className="tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                    {progressValue.toFixed(1)}%
                  </span>
                </div>
                <Progress value={progressValue} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
