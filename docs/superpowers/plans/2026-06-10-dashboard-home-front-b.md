# Dashboard da Home — Front B — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar as seções Vendas (funil + VGV + recentes) e Operacional (estoque + progresso por empreendimento) ao dashboard da home.

**Architecture:** Mesma do Front A (cockpit condensado, spec `docs/superpowers/specs/2026-06-10-dashboard-home-design.md`). Vendas sai de **uma** chamada ao `/sales/summary` estendido (items = recentes, `summary` = funil); Operacional combina `/units/summary` estendido (estoque) com `/projects/summary` já existente (progresso por projeto, hook `useProjectsSummary` pronto).

**Tech Stack:** idem Front A. **pnpm** sempre.

**Branch:** `feat/dashboard-home` (continuação do Front A).

---

## ⛔ PRÉ-REQUISITOS (verificar antes de começar)

1. **Issue [construct-pro-api#157](https://github.com/cacenot/construct-pro-api/issues/157) concluída no backend** — `GET /sales/summary` e `GET /units/summary` estendidos com bloco `summary`; `amount: Money` adicionado ao `SaleSummaryResponse`.
2. **`@cacenot/construct-pro-api-client` republicado** com o schema novo.
3. **Front A concluído** (Tasks 1-10 do plano `2026-06-10-dashboard-home-front-a.md`).

Verificação:

```bash
pnpm update @cacenot/construct-pro-api-client --latest
grep -n "amount" node_modules/@cacenot/construct-pro-api-client/dist/schema.d.ts | grep -i "salesummary" 
grep -n "by_status\|pipeline" node_modules/@cacenot/construct-pro-api-client/dist/schema.d.ts | head
```

Expected: o schema contém o campo `amount` no `SaleSummaryResponse` e os blocos agregados (`pipeline`/`month` em sales, `by_status` em units). **Os nomes exatos dos tipos/campos podem divergir do contrato proposto na issue — Task 1 confirma e este plano usa os nomes da issue; ajustar os acessos nos componentes se o backend tiver nomeado diferente (mudança localizada nos hooks/cards).**

---

### Task 1: Bump do api-client + conferência de contrato

**Files:**
- Modify: `package.json` / `pnpm-lock.yaml` (via pnpm)
- Modify: `src/hooks/use-sales-summary.ts` (expor o bloco summary tipado)

- [ ] **Step 1: Atualizar o pacote**

```bash
pnpm update @cacenot/construct-pro-api-client --latest
pnpm typecheck
```

Expected: typecheck verde (a extensão é aditiva — response ganha campo `summary` opcional).

- [ ] **Step 2: Conferir o shape real do bloco summary**

Run: `grep -n -A 30 "PaginatedResponse_SaleSummaryResponse_" node_modules/@cacenot/construct-pro-api-client/dist/schema.d.ts | head -50`

Anotar os nomes reais de: bloco agregado de sales (`summary.pipeline.*`, `summary.month.*`), campo `amount` do item, e bloco de units (`summary.by_status.*`). Se divergirem da issue, usar os reais daqui em diante.

- [ ] **Step 3: Tipar o summary no hook de vendas**

Em `src/hooks/use-sales-summary.ts`, o response já vem tipado pelo schema — apenas re-exportar o tipo do agregado para os componentes (ajustar o nome ao schema real):

```ts
type SalesAggregateSummary = NonNullable<PaginatedSaleSummaryResponse['summary']>

export type { SaleSummaryResponse, PaginatedSaleSummaryResponse, SalesAggregateSummary }
```

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml src/hooks/use-sales-summary.ts
git commit -m "chore(api-client): bump com summaries agregados de sales/units (#157 do backend)"
```

---

### Task 2: Hook `useUnitsInventory`

O `/units/summary` já é consumido pela tabela de `/unidades` (dentro de `use-units-table.ts`, key `['units-summary', params]`). O dashboard só precisa do bloco agregado — hook dedicado com `page_size=1`.

**Files:**
- Create: `src/hooks/use-units-inventory.ts`

- [ ] **Step 1: Implementar**

```ts
// src/hooks/use-units-inventory.ts
import { useApiClient } from '@cacenot/construct-pro-api-client'
import { useQuery } from '@tanstack/react-query'

/**
 * Bloco agregado do estoque de unidades (summary.by_status do /units/summary).
 * page_size=1: só o agregado interessa — os items ficam para a página /unidades.
 */
export function useUnitsInventory() {
  const { client } = useApiClient()

  return useQuery({
    queryKey: ['units-summary', 'inventory'] as const,
    queryFn: async () => {
      const { data, error } = await client.GET('/api/v1/units/summary', {
        params: { query: { page: 1, page_size: 1 } },
      })
      if (error) throw new Error('Falha ao carregar estoque de unidades')
      return data
    },
  })
}
```

- [ ] **Step 2: Verificar e commitar**

Run: `pnpm typecheck && pnpm lint`
Expected: verde

```bash
git add src/hooks/use-units-inventory.ts
git commit -m "feat(dashboard): hook useUnitsInventory (agregado de estoque)"
```

---

### Task 3: Card `SalesCard` (funil + VGV + recentes)

Uma chamada (`page_size=3`): `summary` alimenta funil/VGV, `items` alimentam os recentes. Badge de status reutiliza `SaleStatusBadge` (`src/components/vendas/sale-status-badge.tsx`, prop `status`).

**Files:**
- Create: `src/components/dashboard/sales-card.tsx`

- [ ] **Step 1: Implementar**

```tsx
// src/components/dashboard/sales-card.tsx
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { SaleStatusBadge } from '@/components/vendas/sale-status-badge'
import { useSalesSummary } from '@/hooks/use-sales-summary'
import { cn, formatCurrency } from '@/lib/utils'

const fromCents = (cents: number) => formatCurrency(cents / 100)

/**
 * Vendas no dashboard: funil compacto (pipeline aberto + fechadas no mês),
 * par de VGVs e as 3 vendas mais recentes. Tudo de uma chamada ao /sales/summary.
 */
export function SalesCard() {
  const { data, isLoading, isError } = useSalesSummary({ page_size: 3 })

  if (isLoading) return <SalesCardSkeleton />

  const summary = data?.summary
  const recents = data?.items ?? []

  if (isError || !summary) {
    return (
      <Card className="gap-0 py-0">
        <div className="flex h-48 items-center justify-center p-5">
          <p className="text-sm text-muted-foreground">Não foi possível carregar as vendas.</p>
        </div>
      </Card>
    )
  }

  const funnel = [
    { label: 'Propostas', count: summary.pipeline.proposal.count },
    { label: 'Ag. assinatura', count: summary.pipeline.pending_signature.count },
    { label: 'Ag. pagamento', count: summary.pipeline.pending_payment.count },
    { label: 'Fechadas no mês', count: summary.month.closed_count, success: true },
  ]

  const hasAnySale = summary.pipeline.total_open_count > 0 || summary.month.closed_count > 0

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="p-5">
        {hasAnySale ? (
          <>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-4">
              {funnel.map((stage) => (
                <div key={stage.label} className="bg-muted/30 px-3 py-2.5">
                  <div
                    className={cn(
                      'text-lg font-semibold tabular-nums',
                      stage.success && 'text-success'
                    )}
                  >
                    {stage.count}
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">{stage.label}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
              <div>
                <div className="text-[11px] text-muted-foreground">VGV em negociação</div>
                <div className="mt-0.5 text-sm font-semibold tabular-nums">
                  {fromCents(summary.pipeline.total_open_amount?.cents ?? 0)}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground">VGV fechado no mês</div>
                <div className="mt-0.5 text-sm font-semibold tabular-nums text-success">
                  {fromCents(summary.month.closed_amount?.cents ?? 0)}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-28 flex-col items-center justify-center gap-2 rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">Nenhuma venda registrada ainda.</p>
            <a href="/vendas" className="text-xs font-medium text-primary hover:underline">
              Registrar uma venda →
            </a>
          </div>
        )}
      </div>

      {recents.length > 0 && (
        <div className="border-t px-5 py-3">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Recentes
          </p>
          <div className="-mx-2 flex flex-col">
            {recents.map((sale) => (
              <a
                key={sale.id}
                href={`/vendas/${sale.id}`}
                className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm">
                    {sale.customer?.full_name ?? 'Cliente'}
                  </span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {sale.unit?.name}
                    {sale.unit?.project?.name ? ` · ${sale.unit.project.name}` : ''}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2.5">
                  <span className="text-sm font-medium tabular-nums">
                    {fromCents(sale.amount?.cents ?? 0)}
                  </span>
                  <SaleStatusBadge status={sale.status} />
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

function SalesCardSkeleton() {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="p-5">
        <div className="grid grid-cols-4 gap-px overflow-hidden rounded-lg">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 rounded-none" />
          ))}
        </div>
        <div className="mt-4 flex gap-8">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
      <div className="border-t px-5 py-3 space-y-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    </Card>
  )
}
```

Notas:
- `sale.unit.project` existe no `UnitSummaryInfo`? **Conferir no schema** (Task 1 Step 2): se `unit` não embute `project`, exibir só `sale.unit?.name` (a issue não muda o item além de `amount`).
- Acessos `summary.pipeline.*` / `summary.month.*`: nomes da issue #157 — ajustar ao schema real se divergirem.

- [ ] **Step 2: Verificar e commitar**

Run: `pnpm typecheck && pnpm lint`
Expected: verde

```bash
git add src/components/dashboard/sales-card.tsx
git commit -m "feat(dashboard): SalesCard — funil, VGVs e vendas recentes"
```

---

### Task 4: Card `InventoryCard` (estoque + por empreendimento)

Estoque na paleta "semáforo imobiliário" (disponível = success, reservada = warning, vendida = destructive — ver memória `unit-status-palette`); progresso por projeto via `useProjectsSummary` (já existe em `src/hooks/useProjects.ts`).

**Files:**
- Create: `src/components/dashboard/inventory-card.tsx`

- [ ] **Step 1: Implementar**

```tsx
// src/components/dashboard/inventory-card.tsx
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useProjectsSummary } from '@/hooks/useProjects'
import { useUnitsInventory } from '@/hooks/use-units-inventory'
import { cn, formatCurrency, formatPercent } from '@/lib/utils'

// Semáforo imobiliário do espelho de vendas (≠ linguagem do funil):
// disponível = verde, reservada = âmbar, vendida = coral.
const STOCK_STATUSES = [
  { key: 'available', label: 'Disponíveis', accent: 'text-success' },
  { key: 'reserved', label: 'Reservadas', accent: 'text-warning' },
  { key: 'sold', label: 'Vendidas', accent: 'text-destructive' },
] as const

/**
 * Operacional no dashboard: estoque de unidades por status + VGV a vender, e o
 * progresso de vendas dos empreendimentos (top 4 por % vendido).
 */
export function InventoryCard() {
  const inventory = useUnitsInventory()
  const projects = useProjectsSummary({ page: 1, page_size: 50 })

  if (inventory.isLoading || projects.isLoading) return <InventoryCardSkeleton />

  const byStatus = inventory.data?.summary?.by_status
  const items = projects.data?.items ?? []
  // Top 4 por % vendido — tenants têm poucos projetos; ordenar no cliente.
  const topProjects = [...items]
    .sort((a, b) => (b.sold_percentage ?? 0) - (a.sold_percentage ?? 0))
    .slice(0, 4)

  const hasUnits = byStatus
    ? STOCK_STATUSES.some((s) => (byStatus[s.key]?.count ?? 0) > 0)
    : false

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="p-5">
        {inventory.isError ? (
          <p className="text-sm text-muted-foreground">Não foi possível carregar o estoque.</p>
        ) : hasUnits && byStatus ? (
          <>
            <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border bg-border">
              {STOCK_STATUSES.map((status) => (
                <div key={status.key} className="bg-muted/30 px-3 py-2.5">
                  <div className="flex items-center gap-2 text-lg font-semibold tabular-nums">
                    <span
                      aria-hidden
                      className={cn(
                        'size-1.5 rounded-full bg-current shadow-[0_0_6px_currentColor]',
                        status.accent
                      )}
                    />
                    {byStatus[status.key]?.count ?? 0}
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">{status.label}</div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Estoque a vender:{' '}
              <span className="font-semibold text-foreground tabular-nums">
                {formatCurrency((byStatus.available?.vgv?.cents ?? 0) / 100)}
              </span>{' '}
              em VGV
            </p>
          </>
        ) : (
          <div className="flex h-28 flex-col items-center justify-center gap-2 rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">Nenhuma unidade cadastrada ainda.</p>
            <a
              href="/empreendimentos"
              className="text-xs font-medium text-primary hover:underline"
            >
              Cadastrar um empreendimento →
            </a>
          </div>
        )}
      </div>

      {topProjects.length > 0 && (
        <div className="border-t px-5 py-3">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Empreendimentos
          </p>
          <div className="-mx-2 flex flex-col">
            {topProjects.map((project) => (
              <a
                key={project.id}
                href={`/empreendimentos/${project.id}`}
                className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/50"
              >
                <span className="w-36 shrink-0 truncate text-sm">{project.name}</span>
                <Progress value={project.sold_percentage ?? 0} className="h-1.5 flex-1" />
                <span className="w-14 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                  {project.sold_count}/{project.total_units}
                </span>
                <span className="w-10 shrink-0 text-right text-xs font-medium tabular-nums">
                  {formatPercent(project.sold_percentage ?? 0, 0)}%
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

function InventoryCardSkeleton() {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="p-5">
        <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14 rounded-none" />
          ))}
        </div>
        <Skeleton className="mt-3 h-4 w-48" />
      </div>
      <div className="border-t px-5 py-3 space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-7 w-full" />
        ))}
      </div>
    </Card>
  )
}
```

Nota: `byStatus[status.key]` com chave literal tipada — se o schema gerar `by_status` como objeto fixo (available/reserved/sold/unavailable), o acesso indexado funciona com `as const` nas keys. Se o typecheck reclamar, trocar por acessos diretos (`byStatus.available`, etc.).

- [ ] **Step 2: Verificar e commitar**

Run: `pnpm typecheck && pnpm lint`
Expected: verde

```bash
git add src/components/dashboard/inventory-card.tsx
git commit -m "feat(dashboard): InventoryCard — estoque semáforo + progresso por empreendimento"
```

---

### Task 5: Montar as seções na página

**Files:**
- Modify: `pages/dashboard/+Page.tsx`

- [ ] **Step 1: Adicionar a linha Vendas | Operacional**

Imports novos:

```tsx
import { InventoryCard } from '@/components/dashboard/inventory-card'
import { SalesCard } from '@/components/dashboard/sales-card'
```

Depois da `<section>` Financeiro (dentro do `div.space-y-8`):

```tsx
<div className="grid items-start gap-x-4 gap-y-8 lg:grid-cols-2">
  <section className="space-y-3">
    <SectionHeader title="Vendas" href="/vendas" linkLabel="Ver vendas" />
    <SalesCard />
  </section>
  <section className="space-y-3">
    <SectionHeader title="Operacional" href="/empreendimentos" linkLabel="Ver empreendimentos" />
    <InventoryCard />
  </section>
</div>
```

- [ ] **Step 2: Verificar manualmente**

Run: `pnpm dev` (porta 3000) → `http://localhost:3000/dashboard`:
- funil com counts reais + VGVs; recentes com badge e link para `/vendas/:id`
- estoque com dots semáforo + "Estoque a vender"; empreendimentos com barra e link
- mobile: as duas seções empilham

- [ ] **Step 3: Commit**

```bash
git add pages/dashboard/+Page.tsx
git commit -m "feat(dashboard): seções Vendas e Operacional na home"
```

---

### Task 6: E2E — mocks dos summaries + asserts das seções

**Files:**
- Modify: `tests/e2e/mocks/handlers/vendas.ts` (bloco `summary` + `amount` nos items)
- Modify: `tests/e2e/mocks/handlers/unidades.ts` (bloco `summary.by_status`)
- Modify: `tests/e2e/mocks/handlers/empreendimentos.ts` (conferir shape de `/projects/summary`)
- Modify: `tests/e2e/dashboard/dashboard.spec.ts`

- [ ] **Step 1: Estender o handler de `/sales/summary`**

No handler existente de `**/api/v1/sales/summary*` em `vendas.ts`, adicionar ao body (mantendo os items existentes, agora com `amount: money(...)` em cada um):

```ts
summary: {
  pipeline: {
    proposal: { count: 8, amount: money(240_000_000) },
    pending_signature: { count: 3, amount: money(94_000_000) },
    pending_payment: { count: 2, amount: money(61_000_000) },
    total_open_count: 13,
    total_open_amount: money(395_000_000),
  },
  month: {
    closed_count: 3,
    closed_amount: money(119_500_000),
    lost_count: 1,
  },
},
```

(import: `const { money } = factory` — exportado na Task 9 do Front A.)

- [ ] **Step 2: Estender o handler de `/units/summary`**

Em `unidades.ts`, adicionar ao body do route de `**/api/v1/units/summary*`:

```ts
summary: {
  by_status: {
    available: { count: 47, vgv: money(1_840_000_000) },
    reserved: { count: 12, vgv: money(460_000_000) },
    sold: { count: 89, vgv: money(3_350_000_000) },
    unavailable: { count: 0, vgv: money(0) },
  },
},
```

- [ ] **Step 3: Conferir `/projects/summary` em `empreendimentos.ts`**

O handler já existe (linha ~24). Garantir que os items têm `sold_count`, `total_units`, `sold_percentage` e `total_vgv` (shape atual do `ProjectSummaryResponse`); completar se a factory antiga não tiver esses campos.

- [ ] **Step 4: Asserts novos no spec do dashboard**

Adicionar a `tests/e2e/dashboard/dashboard.spec.ts`:

```ts
test('exibe a seção vendas com funil e recentes', async ({ authenticatedPage: page }) => {
  await page.goto('/dashboard')
  await expect(page.getByText('Propostas')).toBeVisible()
  await expect(page.getByText('Fechadas no mês')).toBeVisible()
  await expect(page.getByText('VGV em negociação')).toBeVisible()
  await expect(page.getByText('Recentes')).toBeVisible()
})

test('exibe a seção operacional com estoque e empreendimentos', async ({
  authenticatedPage: page,
}) => {
  await page.goto('/dashboard')
  await expect(page.getByText('Disponíveis')).toBeVisible()
  await expect(page.getByText('Estoque a vender:')).toBeVisible()
  await expect(page.getByText('Empreendimentos', { exact: true })).toBeVisible()
})
```

- [ ] **Step 5: Rodar e commitar**

Run: `pnpm test:e2e tests/e2e/dashboard/`
Expected: 5 testes PASS

```bash
git add tests/e2e/mocks/handlers/ tests/e2e/dashboard/dashboard.spec.ts
git commit -m "test(dashboard): e2e das seções vendas e operacional"
```

---

### Task 7: Gates finais + PR

- [ ] **Step 1: Gates**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
Expected: verde

- [ ] **Step 2: Push e PR**

```bash
git push origin feat/dashboard-home
gh pr create --base main --head feat/dashboard-home \
  --title "feat(dashboard): home real — cockpit financeiro + vendas + operacional" \
  --body "Implementa o spec docs/superpowers/specs/2026-06-10-dashboard-home-design.md (Front A + B).

- Hero VitalsStrip com 5 vitais da carteira
- Seção Financeiro: aging compacto + maiores atrasos + recebimento 6m (deep-links nuqs)
- /financeiro perde a aba Resumo (vira pura operação)
- Seções Vendas (funil/VGV/recentes) e Operacional (estoque semáforo + progresso)
- Depende de construct-pro-api#157 (summaries agregados)

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

---

## Self-review (executado na escrita do plano)

- **Cobertura do spec (Front B):** funil compacto ✓ · par de VGVs ✓ · recentes com badge/valor/link ✓ · estoque semáforo + VGV a vender ✓ · top 4 empreendimentos por sold_percentage ✓ · estados vazios com CTA ✓ · e2e ✓.
- **Riscos conhecidos:** (1) nomes dos campos do bloco `summary` dependem da implementação do backend — Task 1 Step 2 confirma o schema real antes dos cards; (2) `unit.project` no item de sales pode não existir — fallback documentado na Task 3; (3) tipagem do acesso indexado `by_status[key]` — fallback para acessos diretos documentado na Task 4.
