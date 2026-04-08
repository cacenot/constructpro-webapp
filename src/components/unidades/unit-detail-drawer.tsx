import type { components } from '@cacenot/construct-pro-api-client'
import { translateUnitCategory, useApiClient } from '@cacenot/construct-pro-api-client'

type UnitResponse = components['schemas']['UnitResponse']

import { useQuery } from '@tanstack/react-query'
import {
  Bath,
  BedDouble,
  Building2,
  Car,
  ExternalLink,
  Layers,
  Pencil,
  SquareDashedBottom,
  X,
} from 'lucide-react'
import { navigate } from 'vike/client/router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils'
import { UnitStatusBadge } from './unit-status-badge'

interface UnitDetailDrawerProps {
  unitId: number | null
  open: boolean
  onClose: () => void
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}

function DrawerSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-px w-full" />
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
          <div key={i} className="flex flex-col gap-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}

function UnitDetailContent({ unit }: { unit: UnitResponse }) {
  const hasDetails =
    unit.bedrooms != null ||
    unit.bathrooms != null ||
    unit.garages != null ||
    unit.floor != null ||
    unit.apartment_type
  const hasFeatures = unit.features && unit.features.length > 0

  return (
    <div className="flex flex-col gap-0 overflow-y-auto flex-1">
      {/* Empreendimento */}
      <div className="px-4 py-3">
        <button
          type="button"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => navigate(`/empreendimentos/${unit.project_id}`)}
        >
          <Building2 className="size-3.5 shrink-0" />
          <span className="truncate">Ver empreendimento</span>
          <ExternalLink className="size-3 shrink-0" />
        </button>
      </div>

      <Separator />

      {/* Dados básicos */}
      <div className="px-4 py-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Dados básicos
        </p>
        <div className="grid grid-cols-2 gap-4">
          <DetailItem label="Categoria" value={translateUnitCategory(unit.category, 'pt-BR')} />
          <DetailItem label="Área" value={<span className="tabular-nums">{unit.area} m²</span>} />
          <DetailItem
            label="Preço"
            value={
              <span className="tabular-nums text-foreground">
                {formatCurrency(Number(unit.price))}
              </span>
            }
          />
          <DetailItem
            label="Preço/m²"
            value={
              <span className="tabular-nums text-muted-foreground">
                {formatCurrency(Number(unit.price_per_sqm))}
              </span>
            }
          />
        </div>
      </div>

      {/* Detalhes */}
      {hasDetails && (
        <>
          <Separator />
          <div className="px-4 py-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Detalhes
            </p>
            <div className="grid grid-cols-2 gap-3">
              {unit.bedrooms != null && (
                <div className="flex items-center gap-2 text-sm">
                  <BedDouble className="size-4 text-muted-foreground shrink-0" />
                  <span>
                    {unit.bedrooms} quarto{unit.bedrooms !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              {unit.bathrooms != null && (
                <div className="flex items-center gap-2 text-sm">
                  <Bath className="size-4 text-muted-foreground shrink-0" />
                  <span>
                    {unit.bathrooms} banheiro{unit.bathrooms !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              {unit.garages != null && (
                <div className="flex items-center gap-2 text-sm">
                  <Car className="size-4 text-muted-foreground shrink-0" />
                  <span>
                    {unit.garages} vaga{unit.garages !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              {unit.floor != null && (
                <div className="flex items-center gap-2 text-sm">
                  <Layers className="size-4 text-muted-foreground shrink-0" />
                  <span>{unit.floor === 0 ? 'Térreo' : `${unit.floor}º andar`}</span>
                </div>
              )}
              {unit.apartment_type && (
                <div className="flex items-center gap-2 text-sm col-span-2">
                  <SquareDashedBottom className="size-4 text-muted-foreground shrink-0" />
                  <span>{unit.apartment_type}</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Características */}
      {hasFeatures && (
        <>
          <Separator />
          <div className="px-4 py-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Características
            </p>
            <div className="flex flex-wrap gap-1.5">
              {unit.features?.map((feature: string) => (
                <Badge key={feature} variant="secondary" className="text-xs font-normal">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Descrição */}
      {unit.description && (
        <>
          <Separator />
          <div className="px-4 py-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Descrição
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">{unit.description}</p>
          </div>
        </>
      )}
    </div>
  )
}

export function UnitDetailDrawer({ unitId, open, onClose }: UnitDetailDrawerProps) {
  const { client } = useApiClient()

  const { data: unit, isLoading } = useQuery({
    queryKey: ['unit-detail', unitId],
    queryFn: async () => {
      if (unitId == null) throw new Error('ID da unidade não informado')
      const { data, error } = await client.GET('/api/v1/units/{unit_id}', {
        params: { path: { unit_id: unitId } },
      })
      if (error) throw new Error('Falha ao carregar unidade')
      return data as UnitResponse
    },
    enabled: open && unitId != null,
  })

  return (
    <Drawer open={open} onOpenChange={(value) => !value && onClose()} direction="right">
      <DrawerContent className="sm:max-w-md flex flex-col">
        <DrawerHeader className="border-b pb-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1.5 min-w-0">
              {isLoading ? (
                <>
                  <Skeleton className="h-6 w-36" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </>
              ) : unit ? (
                <>
                  <DrawerTitle className="text-lg leading-tight">{unit.name}</DrawerTitle>
                  {unit.status && <UnitStatusBadge status={unit.status} />}
                </>
              ) : null}
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon-sm" className="shrink-0 mt-0.5">
                <X className="size-4" />
                <span className="sr-only">Fechar</span>
              </Button>
            </DrawerClose>
          </div>
          {!isLoading && unit && (
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() =>
                  navigate(`/empreendimentos/${unit.project_id}/unidades/${unitId}/editar`)
                }
              >
                <Pencil className="size-3.5 mr-1.5" />
                Editar
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => navigate(`/vendas/novo?unidade=${unitId}`)}
              >
                Nova venda
              </Button>
            </div>
          )}
        </DrawerHeader>

        {isLoading ? <DrawerSkeleton /> : unit ? <UnitDetailContent unit={unit} /> : null}
      </DrawerContent>
    </Drawer>
  )
}
