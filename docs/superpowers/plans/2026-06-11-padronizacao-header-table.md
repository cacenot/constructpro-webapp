# Padronização de Headers e Tabelas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unificar todo o app sob um único `<PageHeader>` e um único padrão de tabela (`DataTableInfinite` + `useInfiniteTable` + biblioteca de receitas de célula), eliminando as duas gerações de tabela e a divergência de cabeçalhos.

**Architecture:** Não há base nova a construir para tabelas — `DataTable`/`DataTableInfinite`/`useInfiniteTable` já existem (financeiro é a referência). O trabalho é: (1) criar `<PageHeader>`; (2) extrair `SortableHeader` + criar `data-table-cells.tsx` (linguagem de rows, via impeccable); (3) migrar cada domínio de tabela para a base, convertendo a página para layout fill-height; (4) limpar artefatos antigos. Cada `+Page.tsx` de lista é migrado por um único dono (header + tabela juntos) para evitar conflito no mesmo arquivo.

**Tech Stack:** React 19, TypeScript 5.9, Vite 7, Tailwind 4, TanStack Table v5, TanStack Query v5, nuqs, Vitest + @testing-library/react, Vike (SPA), shadcn/ui.

**Spec:** `docs/superpowers/specs/2026-06-11-padronizacao-header-table-design.md`

---

## Convenções de execução

- **Working dir:** worktree `.claude/worktrees/feat+padroniza-header-table` (branch `worktree-feat+padroniza-header-table`). Use **caminhos relativos** ou o caminho da worktree — nunca o caminho do repo principal.
- **Gates por task:** ao fim de cada task com código, rode `pnpm typecheck` + `pnpm lint` + os testes tocados. Pre-commit (Husky + lint-staged + Biome) roda no commit.
- **Testes:** ficam em `tests/unit/components/<domain>/<name>.test.tsx`. Padrão: `import { render, screen } from '@testing-library/react'` + `import { describe, expect, it } from 'vitest'`. `@testing-library/jest-dom` já está no setup. `Tooltip` auto-provê `TooltipProvider` (não precisa wrapper). `ResizeObserver` já mockado no setup.
- **Convenções de projeto (CLAUDE.md):** Biome (aspas simples, sem `;`, 2 espaços, 100 col), texto em pt-BR, `tabular-nums` em valores monetários, ícones com `<Tooltip>`, dropdown de tabela com `DropdownMenuLabel "Ações"` + sem ícones nos itens + `DropdownMenuSeparator`. Links navegacionais = `<a href>`; `navigate()` só em handlers.
- **Fases:** A e B são independentes (paralelizáveis). **C depende de A e B.** D fecha.

---

## File Structure

**Criados:**
- `src/components/ui/page-header.tsx` — cabeçalho único de página (Fase A).
- `tests/unit/components/ui/page-header.test.tsx` — testes do PageHeader (Fase A).
- `src/components/ui/sortable-header.tsx` — `SortableHeader` extraído do financeiro (Fase B).
- `src/components/ui/data-table-cells.tsx` — receitas de célula reutilizáveis (Fase B, impeccable).
- `docs/superpowers/specs/2026-06-11-row-language-column-maps.md` — artefato de design da impeccable: mapa de colunas por domínio (Fase B).

**Modificados (resumo — detalhe nas tasks):**
- Páginas e componentes de header desacoplado: `pages/*/novo/+Page.tsx`, `pages/*/editar/+Page.tsx`, `pages/configuracoes/+Page.tsx`, `pages/organizacao/+Page.tsx`, `pages/financeiro/+Page.tsx`, `src/components/clientes/detail/customer-hero-header.tsx`, `src/components/empreendimentos/project-hero-header.tsx`.
- Por domínio de lista (Fase C): `pages/<domain>/+Page.tsx`, `src/hooks/use-<domain>-table.ts`, `src/components/<domain>/<domain>-table.tsx`, `src/components/<domain>/<domain>-columns.tsx`.
- `src/components/financeiro/installments-columns.tsx` — passa a importar `SortableHeader` de `ui/` (Fase B).

**Deletados (Fase D):** `src/components/<domain>/<domain>-pagination.tsx` (corretores, clientes, vendas, comissões, imobiliárias, unidades), `src/components/contratos/contract-row.tsx`, `src/components/contratos/contract-row-skeleton.tsx`.

**Exceção (não tocar a estrutura):** `pages/empreendimentos/+Page.tsx` (grid de cards) — só troca o header por `<PageHeader>`; o grid permanece.

---

# FASE A — PageHeader

### Task A1: Componente `<PageHeader>` (TDD)

**Files:**
- Create: `src/components/ui/page-header.tsx`
- Test: `tests/unit/components/ui/page-header.test.tsx`

- [ ] **Step 1: Escrever o teste que falha**

```tsx
// tests/unit/components/ui/page-header.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'

describe('PageHeader', () => {
  it('renderiza o título como h1', () => {
    render(<PageHeader title="Corretores" />)
    const h1 = screen.getByRole('heading', { level: 1, name: 'Corretores' })
    expect(h1).toBeInTheDocument()
  })

  it('usa o token display (text-3xl semibold) por padrão', () => {
    render(<PageHeader title="Corretores" />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1.className).toContain('text-3xl')
    expect(h1.className).toContain('font-semibold')
  })

  it('aplica a variante compact (text-xl)', () => {
    render(<PageHeader title="Financeiro" size="compact" />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1.className).toContain('text-xl')
    expect(h1.className).not.toContain('text-3xl')
  })

  it('renderiza a descrição quando fornecida', () => {
    render(<PageHeader title="Corretores" description="Gerencie os corretores parceiros." />)
    expect(screen.getByText('Gerencie os corretores parceiros.')).toBeInTheDocument()
  })

  it('não renderiza descrição quando ausente', () => {
    const { container } = render(<PageHeader title="Corretores" />)
    expect(container.querySelector('p')).toBeNull()
  })

  it('renderiza back-button como link "Voltar" quando há backHref', () => {
    render(<PageHeader title="Novo Cliente" backHref="/clientes" />)
    const link = screen.getByRole('link', { name: 'Voltar' })
    expect(link).toHaveAttribute('href', '/clientes')
  })

  it('não renderiza back-button sem backHref', () => {
    render(<PageHeader title="Corretores" />)
    expect(screen.queryByRole('link', { name: 'Voltar' })).toBeNull()
  })

  it('renderiza o slot de ação', () => {
    render(<PageHeader title="Corretores" action={<Button>Novo Corretor</Button>} />)
    expect(screen.getByRole('button', { name: 'Novo Corretor' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Rodar o teste e ver falhar**

Run: `pnpm vitest run tests/unit/components/ui/page-header.test.tsx`
Expected: FAIL — `Failed to resolve import '@/components/ui/page-header'`.

- [ ] **Step 3: Implementar o componente**

```tsx
// src/components/ui/page-header.tsx
import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  /** Renderiza um back-button (link) com tooltip "Voltar" antes do título. */
  backHref?: string
  /** Ações à direita (botão único ou grupo). */
  action?: ReactNode
  /** `default` = text-3xl (token display); `compact` = text-xl (fill-height). */
  size?: 'default' | 'compact'
  className?: string
}

/**
 * Cabeçalho único de página: título no token `display` do DESIGN.md
 * (text-3xl/semibold), descrição opcional, back-button opcional e slot de ação.
 * Cobre listas, criação/edição e settings. Hero/detalhe usam componentes próprios.
 */
export function PageHeader({
  title,
  description,
  backHref,
  action,
  size = 'default',
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {backHref && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild variant="ghost" size="icon" className="mt-0.5 shrink-0">
                <a href={backHref} aria-label="Voltar">
                  <ArrowLeft className="size-5" />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Voltar</TooltipContent>
          </Tooltip>
        )}
        <div className="min-w-0">
          <h1
            className={cn(
              'font-semibold tracking-tight',
              size === 'compact' ? 'text-xl' : 'text-3xl'
            )}
          >
            {title}
          </h1>
          {description && <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  )
}
```

- [ ] **Step 4: Rodar o teste e ver passar**

Run: `pnpm vitest run tests/unit/components/ui/page-header.test.tsx`
Expected: PASS (8 testes).

- [ ] **Step 5: typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: sem erros.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/page-header.tsx tests/unit/components/ui/page-header.test.tsx
git commit -m "feat(ui): PageHeader — cabeçalho único de página (token display)"
```

---

### Task A2: Migrar headers de criação/edição (`*/novo`, `*/editar`)

**Files (Modify):** os `+Page.tsx` (ou o componente de form que renderiza o header) de cada rota de criação/edição que tenha um `<h1>` de página:
- `pages/clientes/novo/+Page.tsx`, `pages/clientes/@id/editar/+Page.tsx`
- `pages/corretores/novo/+Page.tsx`, `pages/corretores/@id/editar/+Page.tsx`
- `pages/imobiliarias/novo/+Page.tsx`, `pages/imobiliarias/@id/editar/+Page.tsx`
- `pages/empreendimentos/novo/+Page.tsx`, `pages/empreendimentos/@id/editar/+Page.tsx`
- `pages/unidades/novo/+Page.tsx`, `pages/unidades/@id/editar/+Page.tsx`
- `pages/vendas/novo/+Page.tsx`, `pages/vendas/@id/editar/+Page.tsx`

> Alguns desses renderizam o header dentro de um componente de form (ex.: `BrokerForm`). O header pode estar lá — migre onde ele estiver.

- [ ] **Step 1: Localizar cada header de criação/edição**

Run: `grep -rn "text-3xl\|text-2xl\|ArrowLeft\|<h1" pages/*/novo pages/*/@id/editar src/components/*/*-form.tsx`
Anote, por arquivo, o JSX atual do header (back-button + h1 + descrição).

- [ ] **Step 2: Substituir pelo `<PageHeader>` com `backHref`**

Padrão canônico (exemplo — `pages/clientes/novo/+Page.tsx`, hoje back-button + `<h1 class="text-3xl font-bold">` + descrição):

```tsx
import { PageHeader } from '@/components/ui/page-header'
// ...
<PageHeader
  title="Novo Cliente"
  description="Cadastre um novo cliente na sua base."
  backHref="/clientes"
/>
```

Regras de mapeamento:
- `backHref` = a rota da lista do domínio (`/clientes`, `/corretores`, …) para "novo";
  para "editar", a rota de detalhe (`/clientes/${id}`) quando existir, senão a lista.
- Remover o back-button manual, o `<h1>` e o `<p>` de descrição antigos; o `<PageHeader>` os substitui.
- Manter o restante do conteúdo da página (o form) intacto.

- [ ] **Step 3: typecheck + lint + smoke**

Run: `pnpm typecheck && pnpm lint`
Expected: sem erros. Confira visualmente (ou via e2e existente) que back-button e título aparecem.

- [ ] **Step 4: Commit**

```bash
git add pages src/components
git commit -m "refactor(ui): PageHeader nas páginas de criação/edição"
```

---

### Task A3: Migrar headers de settings + financeiro + alinhar hero headers

**Files (Modify):**
- `pages/configuracoes/+Page.tsx` — header `text-3xl semibold` → `<PageHeader>`.
- `pages/organizacao/+Page.tsx` — idem.
- `pages/financeiro/+Page.tsx` — `<h1 class="shrink-0 text-xl …">` → `<PageHeader size="compact" className="shrink-0" />`.
- `src/components/clientes/detail/customer-hero-header.tsx` — `<h1>` `font-bold` → `font-semibold` (mantém text-3xl).
- `src/components/empreendimentos/project-hero-header.tsx` — confirmar `<h1>` em `text-3xl font-semibold` (ajustar se divergir).

- [ ] **Step 1: configuracoes / organizacao**

Substituir o `<header className="mb-8 space-y-1">…</header>` por:

```tsx
import { PageHeader } from '@/components/ui/page-header'
// configuracoes:
<PageHeader
  title="Minha conta"
  description="Gerencie seu perfil, segurança e preferências"
  className="mb-8"
/>
// organizacao:
<PageHeader
  title="Organização"
  description="Membros e regras de financiamento, cobrança e correção"
  className="mb-8"
/>
```

- [ ] **Step 2: financeiro (variante compact)**

Em `pages/financeiro/+Page.tsx`, trocar:

```tsx
<h1 className="shrink-0 text-xl font-semibold tracking-tight">Financeiro</h1>
```

por:

```tsx
import { PageHeader } from '@/components/ui/page-header'
// ...
<PageHeader title="Financeiro" size="compact" className="shrink-0" />
```

- [ ] **Step 3: alinhar hero headers ao token**

Em `customer-hero-header.tsx`, garantir `<h1 className="text-3xl font-semibold tracking-tight">` (trocar `font-bold` → `font-semibold`). Em `project-hero-header.tsx`, confirmar que já é `font-semibold` (sem mudança se já estiver).

- [ ] **Step 4: typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add pages/configuracoes pages/organizacao pages/financeiro src/components/clientes src/components/empreendimentos
git commit -m "refactor(ui): PageHeader em settings/financeiro + alinha hero headers ao token display"
```

---

# FASE B — Linguagem de rows (impeccable)

### Task B1: Extrair `SortableHeader` para `ui/` (TDD)

**Files:**
- Create: `src/components/ui/sortable-header.tsx`
- Test: `tests/unit/components/ui/sortable-header.test.tsx`
- Modify: `src/components/financeiro/installments-columns.tsx` (importar de `ui/`, remover a definição local)

- [ ] **Step 1: Teste que falha**

```tsx
// tests/unit/components/ui/sortable-header.test.tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SortableHeader } from '@/components/ui/sortable-header'

describe('SortableHeader', () => {
  it('renderiza o label', () => {
    render(<SortableHeader label="Valor" field="amount" onSort={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Valor/ })).toBeInTheDocument()
  })

  it('emite asc quando inativo', () => {
    const onSort = vi.fn()
    render(<SortableHeader label="Valor" field="amount" onSort={onSort} />)
    fireEvent.click(screen.getByRole('button', { name: /Valor/ }))
    expect(onSort).toHaveBeenCalledWith('amount:asc')
  })

  it('alterna para desc quando já está asc no mesmo campo', () => {
    const onSort = vi.fn()
    render(<SortableHeader label="Valor" field="amount" currentSort="amount:asc" onSort={onSort} />)
    fireEvent.click(screen.getByRole('button', { name: /Valor/ }))
    expect(onSort).toHaveBeenCalledWith('amount:desc')
  })

  it('volta para asc quando está desc', () => {
    const onSort = vi.fn()
    render(<SortableHeader label="Valor" field="amount" currentSort="amount:desc" onSort={onSort} />)
    fireEvent.click(screen.getByRole('button', { name: /Valor/ }))
    expect(onSort).toHaveBeenCalledWith('amount:asc')
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm vitest run tests/unit/components/ui/sortable-header.test.tsx`
Expected: FAIL — import não resolvido.

- [ ] **Step 3: Criar `sortable-header.tsx` (mover o código do financeiro, verbatim)**

```tsx
// src/components/ui/sortable-header.tsx
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SortableHeader({
  label,
  field,
  currentSort,
  onSort,
}: {
  label: string
  field: string
  currentSort?: string
  onSort: (field: string) => void
}) {
  const parts = currentSort?.split(':') ?? ['', 'asc']
  const [currentField, currentDir] = parts
  const isActive = currentField === field

  const handleClick = () => {
    if (isActive && currentDir === 'asc') {
      onSort(`${field}:desc`)
    } else {
      onSort(`${field}:asc`)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 gap-1 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-muted-foreground hover:text-foreground"
      onClick={handleClick}
    >
      {label}
      {isActive ? (
        currentDir === 'asc' ? (
          <ArrowUp className="size-3.5" />
        ) : (
          <ArrowDown className="size-3.5" />
        )
      ) : (
        <ArrowUpDown className="size-3.5 opacity-40" />
      )}
    </Button>
  )
}
```

- [ ] **Step 4: Atualizar o financeiro para reusar**

Em `src/components/financeiro/installments-columns.tsx`: remover a função `SortableHeader` local e os imports de ícones que só ela usava (`ArrowDown`, `ArrowUp`, `ArrowUpDown`), e adicionar `import { SortableHeader } from '@/components/ui/sortable-header'`.

- [ ] **Step 5: Rodar testes (novo + suíte do financeiro)**

Run: `pnpm vitest run tests/unit/components/ui/sortable-header.test.tsx && pnpm typecheck`
Expected: PASS + typecheck limpo. Rodar `pnpm test` para garantir que nada do financeiro quebrou.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/sortable-header.tsx tests/unit/components/ui/sortable-header.test.tsx src/components/financeiro/installments-columns.tsx
git commit -m "refactor(ui): extrai SortableHeader para ui/ e reusa no financeiro"
```

---

### Task B2: Biblioteca de receitas de célula + mapa de colunas (impeccable)

> **Esta task é dirigida pela skill `impeccable`.** Invoque-a para desenhar e implementar a linguagem de rows. O contrato de API abaixo é o **mínimo** que deve ser entregue (Fase C depende destes tipos); a impeccable refina o visual interno e pode **adicionar** variantes, mas não pode renomear/remover os exports nem suas props.

**Files:**
- Create: `src/components/ui/data-table-cells.tsx`
- Create: `tests/unit/components/ui/data-table-cells.test.tsx`
- Create: `docs/superpowers/specs/2026-06-11-row-language-column-maps.md`

- [ ] **Step 1: Invocar a impeccable com o contrato**

Contrato de API obrigatório de `data-table-cells.tsx` (assinaturas estáveis):

```tsx
import type { ReactNode } from 'react'

/** Célula de identidade: linha primária + sub-label muted tabular. */
export function PrimaryCell(props: { title: ReactNode; subtitle?: ReactNode }): ReactNode

/** Valor monetário (use com meta.align: 'right'). `value` em reais. */
export function MoneyCell(props: { value: number; caption?: ReactNode }): ReactNode

/** Data formatada dd/MM/yyyy + legenda opcional (vermelha quando tone='danger'). */
export function DateCell(props: { date: string; tone?: 'default' | 'danger'; caption?: ReactNode }): ReactNode

/** Fallback muted; renderiza '—' quando children vazio. */
export function MutedCell(props: { children?: ReactNode }): ReactNode

/** Casca do dropdown de ações: trigger (ghost icon-sm) + Tooltip "Ações" +
 *  DropdownMenuContent com DropdownMenuLabel "Ações". `children` = <DropdownMenuItem>s. */
export function RowActionsMenu(props: { children: ReactNode }): ReactNode
```

Requisitos visuais (do spec, seção "Linguagem de rows"):
- `PrimaryCell`: título `text-sm font-medium` (truncate, `min-w-0`); subtitle `text-xs text-muted-foreground tabular-nums`.
- `MoneyCell`: `text-sm font-medium tabular-nums`; caption `text-xs text-muted-foreground`.
- `DateCell`: data `text-sm tabular-nums`; caption `text-xs`, `text-destructive font-medium` quando `tone='danger'`.
- `RowActionsMenu`: segue CLAUDE.md (DropdownMenuLabel "Ações", sem ícones nos itens, item destrutivo `text-destructive`, trigger em `<Tooltip>`).
- Reusar `formatCurrency` de `@/lib/utils`, `formatDocument` de `@/lib/text-formatters`, `date-fns` (`format`, `parseISO`).

- [ ] **Step 2: Testes das receitas**

Cobrir: `PrimaryCell` renderiza title+subtitle; `MoneyCell` formata em BRL com `tabular-nums`; `DateCell` aplica `text-destructive` com `tone='danger'`; `MutedCell` renderiza `—` quando vazio; `RowActionsMenu` renderiza o label "Ações". (impeccable escreve os testes concretos seguindo a convenção de `tests/unit/components/ui/`.)

- [ ] **Step 3: Mapa de colunas por domínio (artefato de design)**

Criar `docs/superpowers/specs/2026-06-11-row-language-column-maps.md`. Para **cada** domínio de lista (corretores, clientes, vendas, comissões, imobiliárias, unidades, contratos, membros), documentar:
- Lista ordenada de colunas (id + header label).
- Qual coluna é `PrimaryCell` e o que vira `subtitle`.
- Quais colunas ocultam em mobile (`hidden sm:table-cell` / `hidden md:table-cell`).
- Quais colunas ordenam (`SortableHeader` + `field` do backend).
- Coluna de ações: itens do dropdown por domínio (ex.: Ver detalhes / Editar / Excluir).
- Estado vazio: ícone (lucide) + copy com e sem filtros.

Insumo: as colunas atuais de cada `<domain>-columns.tsx` (ponto de partida) + `installments-columns.tsx` (referência da linguagem).

- [ ] **Step 4: Gates + Commit**

Run: `pnpm vitest run tests/unit/components/ui/data-table-cells.test.tsx && pnpm typecheck && pnpm lint`

```bash
git add src/components/ui/data-table-cells.tsx tests/unit/components/ui/data-table-cells.test.tsx docs/superpowers/specs/2026-06-11-row-language-column-maps.md
git commit -m "feat(ui): linguagem de rows (data-table-cells) + mapa de colunas por domínio"
```

---

# FASE C — Migração das páginas de lista (header + tabela juntos)

> **Pré-requisitos:** Fase A (PageHeader) e Fase B (sortable-header, data-table-cells, mapa de colunas) concluídas. Task C1 (corretores) é o **exemplar completo**. As tasks C2–C8 aplicam a **mesma transformação demonstrada nos arquivos do corretores já commitados em C1**, adaptando aos fatos do domínio (endpoint, tipo, mapa de colunas da Fase B). Isso é intencional: a receita é idêntica e os mapas de coluna vêm do artefato da Fase B — copiar ~200 linhas por domínio seria ruído.

### Task C1: Migrar **corretores** (exemplar completo)

**Files:**
- Modify: `src/hooks/use-brokers-table.ts`
- Modify: `src/components/corretores/broker-columns.tsx`
- Modify: `src/components/corretores/broker-table.tsx`
- Modify: `pages/corretores/+Page.tsx`
- (Fase D deleta `src/components/corretores/broker-pagination.tsx`)

- [ ] **Step 1: Reescrever o hook sobre `useInfiniteTable`**

```tsx
// src/hooks/use-brokers-table.ts
import type { components } from '@cacenot/construct-pro-api-client'
import { useApiClient } from '@cacenot/construct-pro-api-client'
import { parseAsString, useQueryStates } from 'nuqs'
import { useCallback, useMemo } from 'react'
import { useInfiniteTable } from './use-infinite-table'

type BrokerResponse = components['schemas']['BrokerResponse']
export type { BrokerResponse }

const PAGE_SIZE = 20
const DEFAULT_SORT = 'full_name:asc'

export interface BrokersTableFilters {
  search: string
  setSearch: (value: string) => void
}

export interface BrokersTableSort {
  sort: string
  setSort: (value: string) => void
}

export interface UseBrokersTableReturn {
  data: BrokerResponse[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
  total: number
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
  hasActiveFilters: boolean
  handleClearFilters: () => void
  filters: BrokersTableFilters
  sort: BrokersTableSort
}

const brokersQueryParsers = {
  search: parseAsString.withDefault(''),
  sort: parseAsString.withDefault(DEFAULT_SORT),
}

export function useBrokersTable(): UseBrokersTableReturn {
  const { client } = useApiClient()
  const [queryState, setQueryState] = useQueryStates(brokersQueryParsers, { history: 'push' })
  const { search, sort } = queryState

  // Parâmetros de filtro (sem page) — chave do infinite query.
  const filterParams = useMemo(() => {
    const params: { search?: string; sort_by?: string[] } = {}
    if (search) params.search = search
    if (sort) params.sort_by = [sort]
    return params
  }, [search, sort])

  const fetchPage = useCallback(
    async (page: number) => {
      const { data, error } = await client.GET('/api/v1/brokers', {
        params: { query: { ...filterParams, page, page_size: PAGE_SIZE } },
      })
      if (error) throw new Error('Falha ao carregar corretores')
      return { items: data?.items ?? [], total: data?.total ?? 0 }
    },
    [client, filterParams]
  )

  const {
    rows,
    total,
    isLoading,
    isError,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteTable<BrokerResponse>({
    queryKey: ['brokers', filterParams],
    fetchPage,
    pageSize: PAGE_SIZE,
  })

  const hasActiveFilters = !!search

  const handleClearFilters = () => setQueryState({ search: '', sort: DEFAULT_SORT })

  return {
    data: rows,
    isLoading,
    isError,
    refetch: () => {
      refetch()
    },
    total,
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    fetchNextPage: () => {
      fetchNextPage()
    },
    hasActiveFilters,
    handleClearFilters,
    filters: {
      search,
      setSearch: (value) => setQueryState({ search: value }),
    },
    sort: {
      sort,
      setSort: (value) => setQueryState({ sort: value }),
    },
  }
}
```

> Nota: o debounce de `search` que existia no hook antigo pode ser mantido se o filtro de busca já o aplicava; aqui simplificamos pois `nuqs` + infinite query refazem a chave. Se o backend de `/brokers` exigir debounce para UX, replicar o `useEffect` de debounce do hook original — confirmar com o componente de filtro.

- [ ] **Step 2: Migrar as colunas para as receitas (usar o mapa da Fase B)**

```tsx
// src/components/corretores/broker-columns.tsx
import type { ColumnDef } from '@tanstack/react-table'
import { navigate } from 'vike/client/router'
import { useState } from 'react'
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { MutedCell, PrimaryCell, RowActionsMenu } from '@/components/ui/data-table-cells'
import type { BrokerResponse } from '@/hooks/use-brokers-table'
import { formatDocument, formatPhone } from '@/lib/text-formatters'
import { BrokerDeleteDialog } from './broker-delete-dialog'

export function createBrokerColumns(): ColumnDef<BrokerResponse>[] {
  return [
    {
      id: 'full_name',
      header: 'Nome',
      cell: ({ row }) => (
        <PrimaryCell title={row.original.full_name} subtitle={formatDocument(row.original.cpf)} />
      ),
    },
    {
      id: 'creci',
      header: 'CRECI',
      meta: { className: 'hidden sm:table-cell', headClassName: 'hidden sm:table-cell' },
      cell: ({ row }) => <MutedCell>{row.original.creci}</MutedCell>,
    },
    {
      id: 'email',
      header: 'E-mail',
      meta: { className: 'hidden md:table-cell', headClassName: 'hidden md:table-cell' },
      cell: ({ row }) => <MutedCell>{row.original.email}</MutedCell>,
    },
    {
      id: 'phone',
      header: 'Telefone',
      meta: { className: 'hidden md:table-cell', headClassName: 'hidden md:table-cell' },
      cell: ({ row }) => (
        <MutedCell>{row.original.phone ? formatPhone(row.original.phone) : undefined}</MutedCell>
      ),
    },
    {
      id: 'actions',
      header: '',
      meta: { align: 'right' },
      cell: ({ row }) => <BrokerRowActions broker={row.original} />,
    },
  ]
}

function BrokerRowActions({ broker }: { broker: BrokerResponse }) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  return (
    <>
      <RowActionsMenu>
        <DropdownMenuItem onClick={() => navigate(`/corretores/${broker.id}`)}>
          Ver detalhes
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate(`/corretores/${broker.id}/editar`)}>
          Editar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => setDeleteOpen(true)}
        >
          Excluir
        </DropdownMenuItem>
      </RowActionsMenu>
      <BrokerDeleteDialog
        brokerId={broker.id}
        brokerName={broker.full_name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onSuccess={() => navigate('/corretores')}
      />
    </>
  )
}
```

> O clique no dropdown não pode disparar `onRowClick`. Como o `RowActionsMenu` vive numa célula e o trigger é um botão, adicione `onClick={(e) => e.stopPropagation()}` no trigger dentro do `RowActionsMenu` (a impeccable já inclui isso no shell na Fase B).

- [ ] **Step 3: Reescrever o table component com `DataTableInfinite`**

```tsx
// src/components/corretores/broker-table.tsx
import { useMemo } from 'react'
import { navigate } from 'vike/client/router'
import { UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTableInfinite } from '@/components/ui/data-table-infinite'
import type { BrokerResponse } from '@/hooks/use-brokers-table'
import { createBrokerColumns } from './broker-columns'

interface BrokerTableProps {
  data: BrokerResponse[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  hasActiveFilters: boolean
  onClearFilters: () => void
  total: number
  hasNextPage: boolean
  isFetchingNextPage: boolean
  onReachEnd: () => void
}

export function BrokerTable({
  data,
  isLoading,
  isError,
  onRetry,
  hasActiveFilters,
  onClearFilters,
  total,
  hasNextPage,
  isFetchingNextPage,
  onReachEnd,
}: BrokerTableProps) {
  const columns = useMemo(() => createBrokerColumns(), [])

  return (
    <DataTableInfinite
      aria-label="Corretores"
      columns={columns}
      data={data}
      isLoading={isLoading}
      isError={isError}
      onRetry={onRetry}
      onRowClick={(broker) => navigate(`/corretores/${broker.id}`)}
      total={total}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      onReachEnd={onReachEnd}
      endLabel={`Fim da lista · ${total} ${total === 1 ? 'corretor' : 'corretores'}`}
      empty={
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <UserCheck className="size-9 opacity-40" />
          <p className="text-sm">
            {hasActiveFilters
              ? 'Nenhum corretor encontrado com esses filtros.'
              : 'Nenhum corretor cadastrado ainda.'}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={onClearFilters}>
              Limpar filtros
            </Button>
          )}
        </div>
      }
    />
  )
}
```

> `DataTableInfinite` não aceita `total` na sua interface atual (`DataTableInfiniteProps` estende `Omit<DataTableProps, 'bottomSlot' | 'scrollRef'>` + infinite props). **Remova `total` da prop list do componente** e use-o só para compor `endLabel` no chamador, OU passe `endLabel` já pronto. Ajuste: o `BrokerTable` recebe `total` apenas para montar `endLabel` — não repassar `total` ao `DataTableInfinite`. (Verifique a assinatura real em `src/components/ui/data-table-infinite.tsx` antes de compilar.)

- [ ] **Step 4: Converter a página para fill-height**

```tsx
// pages/corretores/+Page.tsx
import { UserPlus } from 'lucide-react'
import { navigate } from 'vike/client/router'
import { AppLayout } from '@/components/app-layout'
import { BrokerFilters } from '@/components/corretores/broker-filters'
import { BrokerTable } from '@/components/corretores/broker-table'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { useBrokersTable } from '@/hooks/use-brokers-table'

export default function BrokersPage() {
  const {
    data,
    isLoading,
    isError,
    refetch,
    total,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    hasActiveFilters,
    handleClearFilters,
    filters,
  } = useBrokersTable()

  return (
    <AppLayout fillHeight>
      <div className="flex h-full min-h-0 flex-col gap-4">
        <PageHeader
          title="Corretores"
          description="Gerencie os corretores parceiros."
          className="shrink-0"
          action={
            <Button className="gap-2" onClick={() => navigate('/corretores/novo')}>
              <UserPlus className="size-4" />
              Novo Corretor
            </Button>
          }
        />

        <BrokerFilters
          {...filters}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
        />

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border shadow-sm">
          <BrokerTable
            data={data}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={handleClearFilters}
            total={total}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onReachEnd={fetchNextPage}
          />
        </div>
      </div>
    </AppLayout>
  )
}
```

> `BrokerFilters` deve ser `shrink-0` no fluxo fill-height. Se ele não aplicar `shrink-0` internamente, envolva em `<div className="shrink-0">`. Confirme que `BrokerFilters` ainda recebe as props certas (sem `pagination`).

- [ ] **Step 5: Gates**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: typecheck/lint limpos; testes verdes (specs de corretores podem precisar de ajuste — se houver `tests/unit` ou e2e que dependiam de paginação, anote para a Fase D).

- [ ] **Step 6: Commit**

```bash
git add src/hooks/use-brokers-table.ts src/components/corretores/broker-columns.tsx src/components/corretores/broker-table.tsx pages/corretores/+Page.tsx
git commit -m "refactor(corretores): migra para DataTableInfinite + PageHeader (fill-height)"
```

---

### Tasks C2–C8: Migrar os demais domínios (mesma receita do C1)

Para cada domínio abaixo, **replique a transformação do C1** (hook → `useInfiniteTable`; colunas → receitas de célula via mapa da Fase B; table → `DataTableInfinite`; página → fill-height com `<PageHeader>`), adaptando aos fatos do domínio. Leia os arquivos `corretores/*` migrados em C1 como referência viva. Gate por domínio: `pnpm typecheck && pnpm lint && pnpm test`. Commit por domínio: `refactor(<domain>): migra para DataTableInfinite + PageHeader`.

- [ ] **Task C2 — clientes.** Endpoint `/api/v1/customers`; tipo `CustomerResponse`; hook `use-customers-table.ts`; arquivos `src/components/clientes/customers-{table,columns}.tsx`, `pages/clientes/+Page.tsx`. Colunas/ações pelo mapa da Fase B. Mantém filtro de tipo (PF/PJ) além do search.

- [ ] **Task C3 — imobiliárias.** Endpoint `/api/v1/agencies`; tipo `AgencyResponse`; hook `use-agencies-table.ts`; `src/components/imobiliarias/agency-{table,columns}.tsx`, `pages/imobiliarias/+Page.tsx`.

- [ ] **Task C4 — unidades.** Endpoint de unidades; hook `use-units-table.ts`; `src/components/unidades/units-{table,columns}.tsx`, `pages/unidades/+Page.tsx`. **Particular:** já tem `onRowClick`→`unit-detail-drawer.tsx`, `isError`/`onRetry` e sort — preserve o drawer e o sort; a migração é a mais direta.

- [ ] **Task C5 — comissões.** Endpoint de comissões; hook `use-commissions-table.ts`; `src/components/comissoes/commission-{table,columns}.tsx`, `pages/comissoes/+Page.tsx`. **Particular:** `commission-summary-cards.tsx` permanece como faixa `shrink-0` entre o `<PageHeader>` e a tabela. Header sem `action`.

- [ ] **Task C6 — vendas.** Endpoint `/api/v1/sales`; tipo `SaleResponse`; hook `use-sales-table.ts`; `src/components/vendas/sales-{table,columns}.tsx`, `pages/vendas/+Page.tsx`. **Particular:** `sales-table.tsx` mantém o estado/handlers dos dialogs internos (ApproveSaleDialog, SignContractDialog, PayInstallmentDialog) — migre só a casca para `DataTableInfinite`, preservando os dialogs e seus gatilhos nas células de ação.

- [ ] **Task C7 — membros (organização).** Hook `use-members-table.ts`; `src/components/configuracoes/members/members-{table,columns}.tsx`. **Particular:** lista finita dentro de `SettingsLayout` — usa **`DataTable` base** (não `DataTableInfinite`, não fill-height). Aplica `data-table-cells` + `SortableHeader`; mantém callbacks `onEditRoles`/`onRemove`. Sem `<PageHeader>` (o header é o de settings da Task A3).

- [ ] **Task C8 — contratos (conversão maior).** Hook: criar `use-contracts-table.ts` sobre `useInfiniteTable` (hoje usa `useContracts()` + paginação manual); endpoint de contratos. Converter `contract-row.tsx` (rows `<div>`) em `createContractColumns()` (`ColumnDef[]`) usando as receitas. `pages/contratos/+Page.tsx` → fill-height com `<PageHeader>` (`text-2xl`→`text-3xl` já via componente) + `DataTableInfinite`. **Preserve** os filtros inline (search, status, índice CUB/IGP-M/IPCA, período, switches pending/overdue) e a lógica de índice/período. (`contract-row.tsx` e `contract-row-skeleton.tsx` são deletados na Fase D.)

---

# FASE D — Limpeza & verificação

### Task D1: Deletar artefatos órfãos

**Files (Delete):**
- `src/components/corretores/broker-pagination.tsx`
- `src/components/clientes/customers-pagination.tsx`
- `src/components/imobiliarias/agency-pagination.tsx`
- `src/components/unidades/units-pagination.tsx`
- `src/components/comissoes/commission-pagination.tsx`
- `src/components/vendas/sales-pagination.tsx`
- `src/components/contratos/contract-row.tsx`
- `src/components/contratos/contract-row-skeleton.tsx`
- Qualquer `projects-pagination.tsx`/manual de empreendimentos **NÃO** é deletado (grid permanece).

- [ ] **Step 1: Confirmar que nenhum import sobrou**

Run: `grep -rn "pagination" src/components --include="*.tsx" | grep -iE "broker|customers|agency|units|commission|sales"` e `grep -rn "contract-row" src pages`
Expected: nenhum import remanescente (fora os deletados). Se houver, corrija o consumidor.

- [ ] **Step 2: Deletar os arquivos**

```bash
git rm src/components/corretores/broker-pagination.tsx \
       src/components/clientes/customers-pagination.tsx \
       src/components/imobiliarias/agency-pagination.tsx \
       src/components/unidades/units-pagination.tsx \
       src/components/comissoes/commission-pagination.tsx \
       src/components/vendas/sales-pagination.tsx \
       src/components/contratos/contract-row.tsx \
       src/components/contratos/contract-row-skeleton.tsx
```

- [ ] **Step 3: typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: sem erros (sem referências mortas).

- [ ] **Step 4: Commit**

```bash
git commit -m "chore: remove paginação por offset e contract-row órfãos"
```

---

### Task D2: Atualizar specs e2e + verificação final

**Files (Modify):** specs Playwright em `tests/e2e/**` que dependiam de paginação por offset, `<Card>` de contagem, ou seletores de header antigos (`text-3xl font-bold`).

- [ ] **Step 1: Rodar a suíte unit completa**

Run: `pnpm test`
Expected: todos verdes. Conserte specs unitários que assumiam estrutura antiga (ex.: contagem em `<CardHeader>`).

- [ ] **Step 2: Localizar e atualizar e2e afetados**

Run: `grep -rln "Próxima\|Anterior\|page=\|font-bold\|CardHeader\|paginação" tests/e2e` (ajuste os termos aos seletores reais).
Atualize seletores: scroll infinito em vez de clique em paginação; header sem `font-bold`; tabela sem `<Card>` wrapper. Siga o setup e2e do projeto (login Firebase real + API mockada; ver memória `e2e-setup`).

- [ ] **Step 3: Rodar e2e relevantes**

Run: o comando e2e do projeto (ex.: `pnpm test:e2e` ou o script equivalente) filtrando os specs das páginas migradas.
Expected: verdes.

- [ ] **Step 4: Verificação final dos critérios de aceite**

- [ ] `<PageHeader>` é o único cabeçalho nas páginas do inventário; nenhum `<h1>` de página fora do token (`text-3xl`/`text-xl` semibold). Run: `grep -rn "text-3xl font-bold\|text-2xl font-semibold tracking-tight" pages src/components` → vazio.
- [ ] Todas as tabelas do inventário (exceto empreendimentos) usam `DataTableInfinite`/`DataTable`. Run: `grep -rln "DataTableInfinite\|<DataTable" src/components/{corretores,clientes,imobiliarias,unidades,comissoes,vendas,contratos,configuracoes}` → presentes.
- [ ] `data-table-cells` e `sortable-header` em `ui/`, reusados.
- [ ] `*-pagination.tsx` deletados; sem `<Card>` envolvendo tabelas migradas.
- [ ] Grid de empreendimentos intacto.
- [ ] `pnpm lint && pnpm typecheck && pnpm test` verdes.

- [ ] **Step 5: Commit final (se houve ajuste de testes)**

```bash
git add tests
git commit -m "test: atualiza e2e/unit para o novo padrão de header e tabela"
```

---

## Self-Review (preenchido na escrita do plano)

- **Cobertura do spec:** PageHeader (A1–A3) cobre todas as famílias de header do inventário; migração de tabela (C1–C8) cobre os 8 domínios; linguagem de rows (B1–B2) cobre as receitas + mapa; exceção de empreendimentos preservada (A3 só header); limpeza (D1) e verificação (D2) cobrem os critérios de aceite.
- **Tipos consistentes:** `UseBrokersTableReturn` (C1) define o shape que `pages/corretores/+Page.tsx` consome; `DataTableInfiniteProps` é a assinatura real lida em B/C (nota explícita sobre `total` não ser prop do componente — usado só p/ `endLabel`); contrato de `data-table-cells` (B2) fixa as assinaturas que C1–C8 importam (`PrimaryCell`/`MoneyCell`/`DateCell`/`MutedCell`/`RowActionsMenu`) e `SortableHeader` (B1).
- **Sem placeholders de código:** A1/B1 têm código completo + testes; C1 é exemplar completo; C2–C8 referenciam o exemplar vivo + o mapa da Fase B (decisão deliberada, não placeholder, pois os mapas são produzidos em B2 e a receita é idêntica).
- **Riscos sinalizados:** debounce de search (C1 nota), `stopPropagation` no trigger de ações vs `onRowClick` (C1 nota), `total` fora da interface do `DataTableInfinite` (C1 nota), fill-height em mobile (spec), contratos como conversão maior (C8).
