# Padronização de Headers e Tabelas — Design

**Data:** 2026-06-11
**Branch:** `feat/padroniza-header-table`
**Status:** Aprovado (brainstorming) → pronto para `writing-plans`

## Problema

Duas famílias de componentes divergem em todo o app:

1. **Headers de página** — 18 páginas têm cabeçalho e quase todas estão estilizadas
   diferente: H1 em `text-3xl` / `text-2xl` / `text-xl`, peso `font-bold` vs
   `font-semibold`, spacing título→descrição `mt-2` vs `mt-1`, layouts `items-start`
   vs `items-center` vs `items-baseline`, botões com `gap-2` vs `mr-2` vs nada.
   **Não existe componente reutilizável genérico** — só `SectionHeader` (dashboard),
   `CustomerHeroHeader` e `ProjectHeroHeader` (páginas de detalhe).

2. **Tabelas** — duas gerações coexistem:
   - **Geração nova (financeiro):** `useInfiniteTable` + `DataTable` / `DataTableInfinite`.
     Base sólida: header sticky, scroll infinito, container fill-height, memoização por
     linha, estados loading/error/empty, alinhamento via `ColumnMeta`. **É a referência.**
   - **Geração antiga (8 domínios):** clientes, corretores, vendas, comissões,
     imobiliárias, unidades, membros — todas `use-<domain>-table` + paginação por offset
     + `<Card>` wrapper + shadcn `Table` cru.
   - **Fora de padrão:** contratos (`ContractRow` custom, sem TanStack) e empreendimentos
     (grid de cards — legitimamente não-tabular).

## Decisões (do brainstorming)

| # | Decisão | Escolha |
|---|---------|---------|
| 1 | Profundidade da padronização das tabelas | **Migração completa** para `useInfiniteTable` + `DataTable`/`DataTableInfinite`. Grid de empreendimentos = exceção documentada. |
| 2 | Escopo do `<PageHeader>` | **Listas + criação/edição + settings.** Hero/detalhe permanecem especializados, mas adotam os tokens. |
| 3 | Tipografia do título | **`text-3xl font-semibold`** (token `display` do `DESIGN.md`, fontWeight 600), **não** `font-bold`. |
| 4 | Layout das listas migradas | **Fill-height** (`AppLayout fillHeight`), como o financeiro: header + filtros fixos, tabela rola internamente. Some `<Card>` e a paginação. |
| 5 | Redesign das rows | **Linguagem única** de receitas de célula, definida 1× (via impeccable) e aplicada a todas as tabelas. |

## Objetivo / não-objetivo

**Objetivo:** um único `<PageHeader>` e um único padrão de tabela (`DataTableInfinite`
+ `useInfiniteTable` + biblioteca de receitas de célula) usados em todo o app onde fizer
sentido.

**Não-objetivo:**
- Redesenhar o grid de cards de empreendimentos (fica como exceção).
- Mudar contratos de filtros/regras de negócio (só a casca da tabela e as rows).
- Padronizar os componentes de **filtro** por domínio (continuam por domínio; só ocupam
  um slot fixo consistente entre header e tabela). Fora de escopo desta entrega.
- Mudança no backend: as listas antigas já chamam endpoints paginados por offset;
  `useInfiniteTable` envolve isso via `fetchPage(page)`. **Sem dependência de backend.**

---

## Componente 1 — `<PageHeader>`

**Arquivo novo:** `src/components/ui/page-header.tsx`

```tsx
interface PageHeaderProps {
  title: string
  description?: string
  /** Renderiza back-button ghost + ícone + tooltip "Voltar" antes do título. */
  backHref?: string
  /** Ações à direita (botão único ou grupo). */
  action?: ReactNode
  /** `default` = text-3xl; `compact` = text-xl (fill-height / financeiro). */
  size?: 'default' | 'compact'
  className?: string
}
```

**Layout canônico (consolida as variações):**

- Wrapper: `flex items-start justify-between gap-4`
- Bloco título à esquerda; com `backHref`, back-button (`Button variant="ghost"
  size="icon"`, `<ArrowLeft className="size-5" />`, `<Tooltip>`Voltar`</Tooltip>`) antes
  do bloco título, alinhados com `flex items-start gap-4`.
- Título: `text-3xl font-semibold tracking-tight` (token `display`).
  `size="compact"` → `text-xl font-semibold tracking-tight`.
- Descrição (quando presente): `mt-1.5 text-sm text-muted-foreground`.
- `action` renderizado à direita do wrapper `justify-between`.

**Tokens (DESIGN.md `typography.display`):** fontSize `1.875rem` (= `text-3xl`),
fontWeight `600` (= `font-semibold`), lineHeight `1.2`.

**Páginas que adotam o `<PageHeader>`:**

| Página | Mudança | Props |
|--------|---------|-------|
| `/corretores` | `font-bold` → `font-semibold` | `title`, `description`, `action` |
| `/clientes` | `font-bold` → `font-semibold` | idem |
| `/imobiliarias` | idem | idem |
| `/vendas` | idem | idem |
| `/unidades` | já `semibold`; só extrai p/ componente | idem |
| `/empreendimentos` (lista) | idem | idem |
| `/comissoes` | sem `action` | `title`, `description` |
| `/contratos` | `text-2xl semibold` → `text-3xl semibold` | `title`, `description`, `action` |
| `/financeiro` | `text-xl` → `size="compact"` | `title`, `size="compact"` |
| `*/novo`, `*/editar` (todos) | back-button + título unificados | `title`, `description`, `backHref` |
| `/configuracoes` | mantém `text-3xl semibold`; extrai p/ componente | `title`, `description` |
| `/organizacao` | idem | `title`, `description` |

**Hero/detalhe (não usam `<PageHeader>`, mas alinham tokens):**
`CustomerHeroHeader` e `ProjectHeroHeader` mantêm avatar/badges/card financeiro/vitals,
mas seus `<h1>` passam a `text-3xl font-semibold tracking-tight` (hoje `ProjectHeroHeader`
já usa semibold; `CustomerHeroHeader` usa bold → ajustar).

**Testes:** unit test do `<PageHeader>` cobrindo: render de título; descrição
opcional; back-button só com `backHref` (com tooltip); `size="compact"`; slot `action`.

---

## Componente 2 — Padrão de Tabela (migração)

A base **não muda**: `src/components/ui/data-table.tsx`, `data-table-infinite.tsx`,
`src/hooks/use-infinite-table.ts`. O trabalho é **migrar** cada domínio para ela.

### Receita de migração por domínio (ex.: corretores)

1. **Hook** `use-<domain>-table.ts` — reescrever sobre `useInfiniteTable`:
   - `fetchPage(page)` → chama o mesmo endpoint paginado (`page`, `page_size`), devolve
     `{ items, total, response }`.
   - `queryKey` estável a partir dos `filterParams` (sem `page`).
   - Mantém filtros via `nuqs`; **remove** o objeto `pagination` e o `page` param.
   - Passa a expor: `data` (rows acumuladas), `total`, `isLoading`, `isError`, `refetch`,
     `hasNextPage`, `isFetchingNextPage`, `fetchNextPage`, `hasActiveFilters`,
     `handleClearFilters`, `filters`, e `sort` (`{ sort, setSort }`) onde a tabela ordena.
   - `pageSize`: 20 (alinha com o financeiro; mínimo 10 do CLAUDE.md respeitado).
2. **Colunas** `<domain>-columns.tsx` — migrar para as receitas de célula (§ Componente 3)
   + `ColumnMeta` (`align`/`className`/`headClassName`) + `SortableHeader` nas colunas
   ordenáveis. A coluna de **ações `...`** permanece (ver receita "Ações").
3. **Table** `<domain>-table.tsx` — renderizar `<DataTableInfinite>`:
   - props: `columns`, `data`, `isLoading`, `isError`, `onRetry`, `empty`, `endLabel`,
     `hasNextPage`, `isFetchingNextPage`, `onReachEnd`, `meta={{ sort, onSort }}`.
   - `empty`: ícone do domínio + copy condicional (com/sem filtros) + "Limpar filtros".
   - `endLabel`: `Fim da lista · {total} {plural}`.
   - **Remove** o `<Card>`/`<CardHeader>` de contagem.
   - `onRowClick`: navega para o detalhe (onde existe) ou abre drawer (unidades já faz).
4. **Página** `+Page.tsx` — converter para fill-height:
   - `<AppLayout fillHeight>` + `<div className="flex h-full min-h-0 flex-col gap-4">`.
   - `<PageHeader>` (shrink-0) → filtros (shrink-0) → container
     `flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border shadow-sm`
     envolvendo a `<DataTableInfinite>`.
   - **Deletar** `<domain>-pagination.tsx`.

### Inventário de escopo

| Domínio | Header | Tabela |
|---------|--------|--------|
| corretores | `PageHeader` | → `DataTableInfinite` |
| clientes | `PageHeader` | → `DataTableInfinite` |
| vendas | `PageHeader` | → `DataTableInfinite` (mantém dialogs internos: approve/sign/pay) |
| comissões | `PageHeader` | → `DataTableInfinite` (mantém summary cards acima da tabela) |
| imobiliárias | `PageHeader` | → `DataTableInfinite` |
| unidades | `PageHeader` | → `DataTableInfinite` (mantém `onRowClick`→drawer e sort) |
| contratos | `PageHeader` | `ContractRow` custom → `DataTableInfinite` |
| membros (organização) | header de settings | → **`DataTable` base** (lista finita, sem infinite) |
| financeiro | `PageHeader` `compact` | já é o padrão — **referência, sem mudança** |
| **empreendimentos (grid)** | `PageHeader` | **exceção documentada** — não é tabela |

### Particularidades por domínio

- **vendas:** o `sales-table.tsx` carrega estado de dialogs (ApproveSaleDialog,
  SignContractDialog, PayInstallmentDialog). Preservar esse estado/handlers; migrar
  só a casca da tabela.
- **comissões:** `commission-summary-cards.tsx` continua acima da tabela (shrink-0, entre
  filtros e a tabela ou logo abaixo do header — decidir no plano de UI da impeccable).
- **unidades:** já tem `isError`/`onRetry`/`onRowClick`/sort — migração é a mais direta.
- **membros:** vive dentro de `SettingsLayout`, sem paginação hoje. Usa `DataTable`
  (base, finito) — não precisa de scroll infinito nem de fill-height; mantém a casca do
  settings. Aplica as mesmas receitas de célula.
- **contratos:** maior conversão (de `<div>` rows para `<table>`). Manter os filtros
  inline e a lógica de índice/período; só a renderização vira tabela.

---

## Componente 3 — Linguagem de rows (impeccable, 1×)

**Arquivo novo:** `src/components/ui/data-table-cells.tsx` — biblioteca de receitas de
célula, extraída do financeiro (`installments-columns.tsx`) e refinada pela impeccable.
`SortableHeader` é **extraído** do financeiro para `src/components/ui/` e reusado.

| Receita | Forma canônica |
|---------|----------------|
| **Célula primária** | `text-sm font-medium` (truncate, `min-w-0`) + sub-label `text-xs text-muted-foreground tabular-nums` (nome + documento/id). *(broker-columns já usa exatamente isso.)* |
| **Monetário** | `text-sm font-medium tabular-nums` + `meta.align: 'right'` |
| **Status** | badge tonal; semáforo onde aplicável (ver memória `unit-status-palette`) |
| **Data** | `tabular-nums` + linha de distância relativa (vermelho `text-destructive font-medium` se vencida) |
| **Header ordenável** | `SortableHeader` (extraído p/ `ui/`): `text-[0.6875rem] uppercase tracking-[0.08em]`, ícone `ArrowUp`/`ArrowDown`/`ArrowUpDown` |
| **Ações** | dropdown `...` (`Button variant="ghost" size="icon-sm"`) com `DropdownMenuLabel "Ações"`, **sem ícones** nos itens, `DropdownMenuSeparator` agrupando, item destrutivo `text-destructive` (segue CLAUDE.md). Trigger em `<Tooltip>`. |
| **Responsividade** | ocultação por `meta.className` (`hidden md:table-cell` + `headClassName` igual), **nunca** CSS solto na célula |

**Header sticky / densidade:** já vêm do `DataTable` base (`h-11`, `text-[0.6875rem]
uppercase tracking-[0.08em]`, `px-2 sm:px-4`, hairline `border-b`). As receitas só
preenchem o corpo das células.

**Entregável da impeccable:** além da biblioteca de receitas, um **mapa de colunas por
domínio** — para cada tabela: lista ordenada de colunas, qual vira sub-label, o que oculta
em mobile (`sm`/`md`), quais ordenam, e o estado vazio (ícone + copy). Esse mapa é o
artefato de design que guia a Fase C (satisfaz o princípio design-first do `ux-gate`).

---

## Plano de execução (subagent-driven)

Fases A e B são independentes e rodam em paralelo. **C depende de A** (precisa do
`<PageHeader>`) **e de B** (precisa das receitas de célula + mapa de colunas). D fecha.

**Regra de propriedade de arquivo:** cada `+Page.tsx` tem um único dono por fase. Para as
páginas de **lista**, header e tabela vivem no mesmo arquivo — então a migração do header
dessas páginas acontece **junto** com a da tabela, na Fase C (um subagente é dono do arquivo
inteiro). A Fase A só migra headers **desacoplados** de tabela.

- **Fase A — Headers (desacoplados).** Criar `<PageHeader>` + test. Migrar os headers que
  **não** compartilham `+Page.tsx` com uma tabela em migração:
  - `*/novo` e `*/editar` (todos os domínios) — `backHref` + título.
  - `/configuracoes` e `/organizacao` — o cabeçalho de settings (a tabela de membros é
    migrada na Fase C).
  - `/financeiro` — header → `size="compact"` (a tabela já é o padrão, sem conflito).
  - Ajuste dos `h1` de `CustomerHeroHeader` / `ProjectHeroHeader` para o token `display`.
  Baixo risco, mecânico.
- **Fase B — Linguagem de rows (impeccable).** Criar `data-table-cells.tsx` + extrair
  `SortableHeader` p/ `ui/`. Produzir o mapa de colunas por domínio. **Artefato de design.**
- **Fase C — Migração das páginas de lista (header + tabela juntos).** 1 subagente por
  domínio (corretores, clientes, vendas, comissões, imobiliárias, unidades, contratos),
  cada um dono do `+Page.tsx` inteiro: troca o header por `<PageHeader>`, converte para
  fill-height e migra a tabela aplicando a receita de migração (§ Componente 2) + as
  receitas de célula (§ Componente 3) + o mapa da Fase B. **Membros** entra aqui também,
  mas com `DataTable` base (finito) dentro do `SettingsLayout`.
- **Fase D — Limpeza & verificação.** Deletar `*-pagination.tsx` órfãos e hooks/colunas
  mortos; atualizar specs e2e afetados; rodar `pnpm lint && pnpm typecheck && pnpm test`
  e a suíte e2e relevante.

## Critérios de aceite

- [ ] `<PageHeader>` existe, testado, e é o único cabeçalho em todas as páginas do inventário.
- [ ] Nenhum H1 de página fora do token `display` (`text-3xl`/`text-xl` semibold).
- [ ] Todas as tabelas do inventário (exceto exceções) usam `DataTableInfinite`/`DataTable`
      + `useInfiniteTable`, com header sticky, estados loading/error/empty e scroll infinito.
- [ ] `data-table-cells.tsx` e `SortableHeader` em `ui/`, reusados por todas as tabelas.
- [ ] Componentes `*-pagination.tsx` antigos deletados; sem `<Card>` envolvendo tabelas migradas.
- [ ] Grid de empreendimentos permanece como exceção documentada.
- [ ] `pnpm lint && pnpm typecheck && pnpm test` verdes; e2e relevantes atualizados e verdes.

## Riscos

- **Mudança de UX nas listas** (page-scroll → fill-height interno). Intencional e aprovado;
  validar em mobile (header/filtros fixos não podem comer a viewport).
- **Volume:** 8 domínios de tabela. Mitigado por 1 subagente por domínio e receita única.
- **contratos** é a conversão mais profunda (rows custom → tabela) — tratar como item maior.
- **e2e desatualizados:** seletores de paginação/`<Card>` quebram; cobertos na Fase D.
