import type { components } from '@cacenot/construct-pro-api-client'
import { Building2, DollarSign, Home, ShoppingCart, Tag, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn, formatCurrency } from '@/lib/utils'

type ProjectUnitSummary = components['schemas']['ProjectUnitSummary']

interface UnitSummaryCardsProps {
  data: ProjectUnitSummary
}

export function UnitSummaryCards({ data }: UnitSummaryCardsProps) {
  return (
    <div className="space-y-4">
      {/* Cards de contagem */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Home className="size-4" />
              Unidades Totais
            </div>
            <p className="tabular-nums mt-1 text-2xl font-bold">{data.total_units}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
              <Building2 className="size-4" />
              Disponíveis
            </div>
            <p className="tabular-nums mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {data.available_count}
            </p>
            <p className="tabular-nums text-xs text-muted-foreground">
              {Number(data.availability_percentage).toFixed(1)}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
              <ShoppingCart className="size-4" />
              Vendidas
            </div>
            <p className="tabular-nums mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {data.sold_count}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
              <Tag className="size-4" />
              Reservadas
            </div>
            <p className="tabular-nums mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
              {data.reserved_count}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cards monetários */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="size-4" />
              VGV Total
            </div>
            <p className="tabular-nums mt-1 text-2xl font-bold">
              {formatCurrency(data.total_vgv_cents / 100)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div
              className={cn(
                'flex items-center gap-2 text-sm',
                data.sold_vgv_cents > 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-muted-foreground'
              )}
            >
              <TrendingUp className="size-4" />
              VGV Vendido
            </div>
            <p
              className={cn(
                'tabular-nums mt-1 text-2xl font-bold',
                data.sold_vgv_cents > 0 && 'text-emerald-600 dark:text-emerald-400'
              )}
            >
              {formatCurrency(data.sold_vgv_cents / 100)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="size-4" />
              Preço Médio
            </div>
            <p className="tabular-nums mt-1 text-2xl font-bold">
              {formatCurrency(data.avg_unit_price_cents / 100)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
