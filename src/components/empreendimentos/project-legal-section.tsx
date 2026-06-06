import { Landmark } from 'lucide-react'
import { Fragment } from 'react'
import { DetailPanel } from '@/components/empreendimentos/detail-panel'
import type { ProjectDetailResponse } from '@/hooks/useProjects'
import { formatDocument } from '@/lib/text-formatters'
import { cn } from '@/lib/utils'

interface ProjectLegalSectionProps {
  project: ProjectDetailResponse
}

interface Row {
  label: string
  value: string
  mono?: boolean
}

/**
 * Lista de definição rótulo → valor. O valor fica logo ao lado do rótulo (não
 * empurrado à direita), para ler bem tanto em meia largura quanto em largura
 * cheia, sem o vão que o alinhamento à direita criaria.
 */
function RowGroup({ title, rows }: { title: string; rows: Row[] }) {
  if (rows.length === 0) return null
  return (
    <div className="space-y-2.5">
      <p className="text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {title}
      </p>
      <dl className="grid grid-cols-[max-content_1fr] gap-x-8 gap-y-2 text-sm">
        {rows.map((row) => (
          <Fragment key={row.label}>
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className={cn('tabular-nums text-foreground', row.mono && 'font-mono')}>
              {row.value}
            </dd>
          </Fragment>
        ))}
      </dl>
    </div>
  )
}

/**
 * Identidade legal do empreendimento: a SPE e os registros de obra/imóvel.
 * Quando o empreendimento não declara PJ própria, ensina o porquê em vez de
 * mostrar campos vazios.
 */
export function ProjectLegalSection({ project }: ProjectLegalSectionProps) {
  const pj: Row[] = [
    project.legal_name && { label: 'Razão social', value: project.legal_name },
    project.trade_name && { label: 'Nome fantasia', value: project.trade_name },
    project.cnpj && { label: 'CNPJ', value: formatDocument(project.cnpj), mono: true },
    project.state_registration && {
      label: 'Inscrição estadual',
      value: project.state_registration,
      mono: true,
    },
    project.municipal_registration && {
      label: 'Inscrição municipal',
      value: project.municipal_registration,
      mono: true,
    },
  ].filter(Boolean) as Row[]

  const registry: Row[] = [
    project.incorporation_registry_number && {
      label: 'Registro de incorporação (R.I.)',
      value: project.incorporation_registry_number,
      mono: true,
    },
    project.mother_property_registration && {
      label: 'Matrícula mãe',
      value: project.mother_property_registration,
      mono: true,
    },
    project.cno && { label: 'CNO', value: project.cno, mono: true },
    project.construction_permit_number && {
      label: 'Alvará de construção',
      value: project.construction_permit_number,
      mono: true,
    },
    project.occupancy_permit_number && {
      label: 'Habite-se',
      value: project.occupancy_permit_number,
      mono: true,
    },
  ].filter(Boolean) as Row[]

  const empty = pj.length === 0 && registry.length === 0

  return (
    <DetailPanel title="Pessoa jurídica · Registros" icon={Landmark}>
      {empty ? (
        <p className="text-sm text-muted-foreground">
          Este empreendimento opera sob o CNPJ da incorporadora, sem SPE própria. Registros de obra
          e imóvel aparecem aqui quando informados.
        </p>
      ) : (
        <div className="grid gap-x-12 gap-y-6 sm:grid-cols-2">
          <RowGroup title="Pessoa jurídica (SPE)" rows={pj} />
          <RowGroup title="Registros de obra e imóvel" rows={registry} />
        </div>
      )}
    </DetailPanel>
  )
}
