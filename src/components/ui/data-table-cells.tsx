import { format, parseISO } from 'date-fns'
import { MoreVertical } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn, formatCurrency } from '@/lib/utils'

/**
 * Biblioteca de receitas de célula da tabela base — a linguagem de rows do app,
 * extraída do financeiro (`installments-columns.tsx`) e formalizada como sistema.
 *
 * As receitas preenchem **apenas o conteúdo** da célula. Padding, alinhamento e
 * altura vêm do `DataTable` base (`px-2 py-3.5 sm:px-4`, `meta.align`). Densidade
 * e voz de console seguem o DESIGN.md: marfim sobre grafite, `tabular-nums` em todo
 * número (The Tabular Truth Rule), hierarquia por peso, nunca por cor decorativa.
 */

/**
 * Célula de identidade: a coluna-âncora de cada tabela. Linha primária com o nome
 * (o identificador humano) e um sub-label muted abaixo (documento, id, categoria).
 * Ambas truncam dentro de um `min-w-0` — em telas estreitas a célula encolhe sem
 * empurrar Valor e Status para fora da viewport.
 */
export function PrimaryCell({ title, subtitle }: { title: ReactNode; subtitle?: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="truncate text-sm font-medium">{title}</span>
      {subtitle != null && subtitle !== '' && (
        <span className="truncate text-xs text-muted-foreground tabular-nums">{subtitle}</span>
      )}
    </div>
  )
}

/**
 * Valor monetário. `value` em reais (number) — formatado por `formatCurrency`. O
 * peso (`font-medium`) e o `tabular-nums` dão a leitura à prova de erro que a
 * carteira exige. A coluna deve declarar `meta.align: 'right'`; o alinhamento não
 * mora aqui. `caption` opcional vira uma linha muted abaixo (periodicidade, plano).
 */
export function MoneyCell({ value, caption }: { value: number; caption?: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm font-medium tabular-nums">{formatCurrency(value)}</span>
      {caption != null && caption !== '' && (
        <span className="text-xs text-muted-foreground">{caption}</span>
      )}
    </div>
  )
}

/**
 * Data `dd/MM/yyyy` + legenda opcional. `date` é uma string ISO. Em estado de
 * atraso (`tone='danger'`) a legenda fica coral (`text-destructive`) e em peso
 * medium — o sinal de inadimplência salta no scan sem depender só de cor.
 */
export function DateCell({
  date,
  tone = 'default',
  caption,
}: {
  date: string
  tone?: 'default' | 'danger'
  caption?: ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-sm tabular-nums">{format(parseISO(date), 'dd/MM/yyyy')}</span>
      {caption != null && caption !== '' && (
        <span
          className={cn(
            'text-xs',
            tone === 'danger' ? 'font-medium text-destructive' : 'text-muted-foreground'
          )}
        >
          {caption}
        </span>
      )}
    </div>
  )
}

/**
 * Fallback muted para campos secundários (CRECI, e-mail, telefone). Renderiza um
 * `—` muted quando o conteúdo é nulo/indefinido/vazio, mantendo o ritmo da coluna
 * sem deixar a célula em branco.
 */
export function MutedCell({ children }: { children?: ReactNode }) {
  const isEmpty = children == null || children === ''
  return (
    <span className="text-sm text-muted-foreground">{isEmpty ? '—' : children}</span>
  )
}

/**
 * Casca do dropdown de ações da linha (a coluna `...`). Trigger ghost icon-sm com
 * tooltip "Ações"; `stopPropagation` impede que o clique dispare o `onRowClick` da
 * linha. O conteúdo abre alinhado à direita com o `DropdownMenuLabel "Ações"` no
 * topo. `children` são os `<DropdownMenuItem>` (sem ícones; item destrutivo em
 * `text-destructive` — ver CLAUDE.md).
 */
export function RowActionsMenu({ children }: { children: ReactNode }) {
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="shrink-0"
              aria-label="Ações"
              onClick={(event) => event.stopPropagation()}
            >
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Ações</p>
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
        <DropdownMenuLabel>Ações</DropdownMenuLabel>
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
