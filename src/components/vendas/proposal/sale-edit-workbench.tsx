import { type components, SaleStatus, translateSaleStatus } from '@cacenot/construct-pro-api-client'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useProposalData } from '@/hooks/use-proposal-data'
import {
  type InstallmentScheduleFormData,
  type SaleEditFormData,
  saleEditFormSchema,
} from '@/schemas/sale.schema'
import { SaleStatusBadge } from '../sale-status-badge'
import { createEntrySchedule } from './constants'
import { ProposalPartiesReadonly } from './proposal-parties'
import { ProposalWorkbench } from './proposal-workbench'

type SaleResponse = components['schemas']['SaleResponse']

interface SaleEditWorkbenchProps {
  sale: SaleResponse
  onSubmit: (data: SaleEditFormData) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
}

/** Container de edição: monta o form com os valores da venda e delega ao workbench. */
export function SaleEditWorkbench({
  sale,
  onSubmit,
  onCancel,
  isSubmitting,
}: SaleEditWorkbenchProps) {
  const data = useProposalData()
  const isEditable = sale.status === SaleStatus.proposal

  const hasPerGroupIndex = sale.installment_schedules?.some(
    (s) => s.index_type_code != null && s.index_type_code !== ''
  )

  const form = useForm<SaleEditFormData>({
    resolver: zodResolver(saleEditFormSchema),
    defaultValues: {
      same_index_for_all: !hasPerGroupIndex,
      index_type_code: hasPerGroupIndex ? '' : (sale.index_type_code ?? ''),
      installment_schedules:
        sale.installment_schedules && sale.installment_schedules.length > 0
          ? sale.installment_schedules.map((s) => ({
              kind: s.kind,
              payment_method: s.payment_method,
              quantity: s.quantity,
              amount: s.amount,
              index_type_code: s.index_type_code ?? null,
              specific_date: s.specific_date ?? null,
              recurrence_type: s.recurrence_type ?? null,
              recurrence_day: s.start_date ? new Date(`${s.start_date}T12:00:00`).getDate() : null,
              recurrence_month:
                s.recurrence_type === 'yearly' && s.start_date
                  ? new Date(`${s.start_date}T12:00:00`).getMonth() + 1
                  : null,
              start_date: s.start_date ?? null,
              asset_proposal: (s.asset_proposal ??
                null) as InstallmentScheduleFormData['asset_proposal'],
            }))
          : [createEntrySchedule()],
      broker_id: sale.broker?.id ?? null,
      commission_broker_rate: sale.commission_broker_rate?.ppm
        ? sale.commission_broker_rate.ppm / 10000
        : null,
      agency_id: sale.agency?.id ?? null,
      commission_agency_rate: sale.commission_agency_rate?.ppm
        ? sale.commission_agency_rate.ppm / 10000
        : null,
    },
  })

  const planSum = (sale.installment_schedules ?? []).reduce(
    (s, x) => s + (x.quantity ?? 0) * (x.amount ?? 0),
    0
  )

  // biome-ignore lint/suspicious/noExplicitAny: project vem aninhado em UnitWithProjectResponse
  const projectName = (sale.unit as any)?.project?.name as string | undefined

  return (
    <ProposalWorkbench
      form={form}
      mode="edit"
      initialValorPropostaCents={planSum}
      eyebrow="Vendas"
      title="Editar proposta"
      unitPriceCents={sale.unit_price?.cents ?? 0}
      submitLabel="Salvar alterações"
      isSubmitting={isSubmitting}
      disabled={!isEditable}
      onSubmit={onSubmit}
      onCancel={onCancel}
      partiesSummary={`${sale.unit?.name ?? '—'} · ${sale.customer?.full_name ?? '—'}`}
      statusBadge={sale.status ? <SaleStatusBadge status={sale.status} /> : undefined}
      notice={
        !isEditable && sale.status ? (
          <Alert>
            <AlertTriangle className="size-4" />
            <AlertTitle>Edição não disponível</AlertTitle>
            <AlertDescription>
              Esta proposta está em <strong>{translateSaleStatus(sale.status, 'pt-BR')}</strong> e
              não pode mais ser alterada. Índice e parcelas só podem ser editados enquanto a venda
              está em <strong>Proposta</strong>.
            </AlertDescription>
          </Alert>
        ) : undefined
      }
      parties={
        <ProposalPartiesReadonly
          unitName={sale.unit?.name ?? '—'}
          projectName={projectName}
          customerName={sale.customer?.full_name ?? '—'}
          unitPriceCents={sale.unit_price?.cents ?? 0}
        />
      }
      {...data}
    />
  )
}
