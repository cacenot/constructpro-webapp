# Dashboard da Home — Front A — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o mock de `/dashboard` pelo hero de 5 vitais + seção Financeiro reais, e reduzir `/financeiro` à pura operação (sem aba Resumo) — usando apenas endpoints existentes.

**Architecture:** Cockpit condensado (spec `docs/superpowers/specs/2026-06-10-dashboard-home-design.md`). Cada card chama seus próprios hooks TanStack Query (queries com a mesma key são dedupadas automaticamente); navegação por `<a href>` com deep-links para o estado nuqs do `/financeiro`. A lógica de datas/percentuais vive em libs puras testadas com Vitest.

**Tech Stack:** React 19 + TS strict, Vike (pages/), TanStack Query v5, `@cacenot/construct-pro-api-client` (client.GET tipado), Recharts via `ui/chart`, date-fns + ptBR, BiomeJS (aspas simples, sem ponto-e-vírgula), **pnpm**.

**Branch:** `feat/dashboard-home` (já existe — trabalhar nela).

**Não depende do backend novo** (issue construct-pro-api#157). Os endpoints usados existem:
`/installments/financial-summary`, `/installments/summary`, `/installments/cashflow`.

**Convenções obrigatórias** (CLAUDE.md): texto de UI em pt-BR; `formatCurrency()` + `tabular-nums` em valores; `cn()` para classes; nunca `toast.error(error.message)` cru. Money da API = WireMoney `{cents, decimal, brl}` — componentes leem `.cents / 100`.

---

### Task 1: Lib `installment-aging` (extração + deep-links)

A tradução aging-bucket → intervalo de `due_date` hoje vive dentro de `use-installments-table.ts` (função `agingDueRange`, linhas ~30-45). O dashboard precisa dela para montar deep-links. Extrair para lib pura + adicionar builders de URL.

**Files:**
- Create: `src/lib/installment-aging.ts`
- Create: `src/lib/installment-aging.test.ts`
- Modify: `src/hooks/use-installments-table.ts` (importar da lib, apagar a cópia local)

- [ ] **Step 1: Escrever os testes (falhando)**

```ts
// src/lib/installment-aging.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  agingBucketHref,
  agingDueRange,
  monthDueHref,
  OPEN_STATUSES,
} from './installment-aging'

describe('agingDueRange', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 10)) // 10 jun 2026 (mês é 0-based)
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('not_due: de hoje em diante, sem teto', () => {
    expect(agingDueRange('not_due')).toEqual({ min: '2026-06-10', max: '' })
  })

  it('d1_30: vencidas entre ontem e 30 dias atrás', () => {
    expect(agingDueRange('d1_30')).toEqual({ min: '2026-05-11', max: '2026-06-09' })
  })

  it('d31_60', () => {
    expect(agingDueRange('d31_60')).toEqual({ min: '2026-04-11', max: '2026-05-10' })
  })

  it('d61_90', () => {
    expect(agingDueRange('d61_90')).toEqual({ min: '2026-03-12', max: '2026-04-10' })
  })

  it('d90_plus: sem piso, teto em 91 dias atrás', () => {
    expect(agingDueRange('d90_plus')).toEqual({ min: '', max: '2026-03-11' })
  })
})

describe('agingBucketHref', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 10))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('monta o deep-link do /financeiro com status abertos e intervalo custom', () => {
    const href = agingBucketHref('d1_30')
    const url = new URL(href, 'http://x')
    expect(url.pathname).toBe('/financeiro')
    expect(url.searchParams.get('status')).toBe(OPEN_STATUSES)
    expect(url.searchParams.get('duePreset')).toBe('custom')
    expect(url.searchParams.get('dueMin')).toBe('2026-05-11')
    expect(url.searchParams.get('dueMax')).toBe('2026-06-09')
  })

  it('omite o limite vazio (d90_plus não tem dueMin)', () => {
    const url = new URL(agingBucketHref('d90_plus'), 'http://x')
    expect(url.searchParams.has('dueMin')).toBe(false)
    expect(url.searchParams.get('dueMax')).toBe('2026-03-11')
  })
})

describe('monthDueHref', () => {
  it('recorta o mês inteiro por vencimento, sem filtro de status', () => {
    const url = new URL(monthDueHref('2026-07-01'), 'http://x')
    expect(url.pathname).toBe('/financeiro')
    expect(url.searchParams.get('duePreset')).toBe('custom')
    expect(url.searchParams.get('dueMin')).toBe('2026-07-01')
    expect(url.searchParams.get('dueMax')).toBe('2026-07-31')
    expect(url.searchParams.has('status')).toBe(false)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm vitest run src/lib/installment-aging.test.ts`
Expected: FAIL — `Cannot find module './installment-aging'`

- [ ] **Step 3: Implementar a lib**

O corpo de `agingDueRange` é **cópia exata** da função em `use-installments-table.ts` (com `today` como parâmetro default em vez de fixo). `OPEN_STATUSES` e o comentário também migram de lá.

```ts
// src/lib/installment-aging.ts
import { endOfMonth, format, parseISO, subDays } from 'date-fns'

/** Faixas de envelhecimento da inadimplência (espelham InstallmentAging do backend). */
export type AgingBucketKey = 'not_due' | 'd1_30' | 'd31_60' | 'd61_90' | 'd90_plus'

// Parcelas com saldo em aberto (não pagas, não canceladas) — o recorte que o
// aging mede. Usado no cross-filter de uma faixa para a tabela do /financeiro.
export const OPEN_STATUSES = 'scheduled,invoiced,partial'

/** Traduz a faixa de aging em intervalo de vencimento (due_date) relativo a hoje. */
export function agingDueRange(
  bucket: AgingBucketKey,
  today = new Date()
): { min: string; max: string } {
  const fmt = (date: Date) => format(date, 'yyyy-MM-dd')
  switch (bucket) {
    case 'not_due':
      return { min: fmt(today), max: '' }
    case 'd1_30':
      return { min: fmt(subDays(today, 30)), max: fmt(subDays(today, 1)) }
    case 'd31_60':
      return { min: fmt(subDays(today, 60)), max: fmt(subDays(today, 31)) }
    case 'd61_90':
      return { min: fmt(subDays(today, 90)), max: fmt(subDays(today, 61)) }
    case 'd90_plus':
      return { min: '', max: fmt(subDays(today, 91)) }
  }
}

/**
 * Deep-link do /financeiro recortado numa faixa de aging. Os params espelham os
 * parsers nuqs de use-installments-table (status, duePreset, dueMin, dueMax).
 */
export function agingBucketHref(bucket: AgingBucketKey, today = new Date()): string {
  const { min, max } = agingDueRange(bucket, today)
  const params = new URLSearchParams({ status: OPEN_STATUSES, duePreset: 'custom' })
  if (min) params.set('dueMin', min)
  if (max) params.set('dueMax', max)
  return `/financeiro?${params.toString()}`
}

/**
 * Deep-link do /financeiro recortado nos vencimentos de um mês (recebe o ISO do
 * primeiro dia, ex. "2026-07-01" — formato dos meses do /installments/cashflow).
 * Sem recorte de status: recebidas e a receber, reconciliando com o gráfico.
 */
export function monthDueHref(monthIso: string): string {
  const start = parseISO(monthIso)
  const params = new URLSearchParams({
    duePreset: 'custom',
    dueMin: format(start, 'yyyy-MM-dd'),
    dueMax: format(endOfMonth(start), 'yyyy-MM-dd'),
  })
  return `/financeiro?${params.toString()}`
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `pnpm vitest run src/lib/installment-aging.test.ts`
Expected: PASS (9 testes)

- [ ] **Step 5: Apontar o hook para a lib**

Em `src/hooks/use-installments-table.ts`:
1. Apagar a função local `agingDueRange`, a constante `OPEN_STATUSES` e o tipo `AgingBucketKey` (linhas ~22-45).
2. Adicionar import e re-export (o componente `installments-aging-block` importa `AgingBucketKey` deste hook até a Task 2):

```ts
import { type AgingBucketKey, agingDueRange, OPEN_STATUSES } from '@/lib/installment-aging'

export type { AgingBucketKey }
```

3. Remover `subDays` do import de date-fns (só era usado por `agingDueRange`).

- [ ] **Step 6: Verificar e commitar**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: tudo verde (testes existentes não tocam nessa função diretamente)

```bash
git add src/lib/installment-aging.ts src/lib/installment-aging.test.ts src/hooks/use-installments-table.ts
git commit -m "refactor(financeiro): extrai aging para lib com builders de deep-link"
```

---

### Task 2: `/financeiro` vira pura operação (remove aba Resumo)

O dashboard assume a visão executiva. A página perde as `Tabs`; o conteúdo da antiga aba Parcelas vira o corpo. `CarteiraCompositionBar` **permanece** (é filtro-scoped, parte da operação).

**Files:**
- Modify: `pages/financeiro/+Page.tsx`
- Modify: `src/hooks/use-installments-table.ts`
- Modify: `src/hooks/use-installments.ts` (remover hook órfão)
- Delete: `src/components/financeiro/installments-aging-block.tsx`
- Delete: `src/components/financeiro/installments-cashflow-block.tsx`
- Delete: `src/components/financeiro/installments-by-project-block.tsx`

- [ ] **Step 1: Confirmar que os blocos são órfãos fora do /financeiro**

Run: `grep -rln "InstallmentsAgingBlock\|InstallmentsCashflowBlock\|InstallmentsByProjectBlock\|useInstallmentsByProject" src/ pages/ --include="*.tsx" --include="*.ts"`
Expected: somente `pages/financeiro/+Page.tsx`, os próprios 3 componentes e `src/hooks/use-installments.ts`. Se aparecer outro consumidor, PARAR e reavaliar (não deletar).

- [ ] **Step 2: Reescrever `pages/financeiro/+Page.tsx` sem Tabs**

Remoções: imports de `Tabs/TabsContent/TabsList/TabsTrigger`, `LayoutDashboard`, `ReceiptText`, dos 3 blocos deletados e a constante `TAB_CONTENT_MOTION`. Do destructure do hook saem `view`, `queryParams`, `applyAgingBucket`, `applyMonthFilter`, `applyProjectFilter`. Toda a lógica de mutation/master-detail/drawer/dialog **permanece intacta**.

O JSX do return vira (corpo idêntico ao da antiga `TabsContent value="parcelas"`, agora direto):

```tsx
return (
  <AppLayout fillHeight>
    <div className="flex h-full min-h-0 flex-col gap-4">
      <h1 className="shrink-0 text-xl font-semibold tracking-tight">Financeiro</h1>

      {/* Pulso da carteira — filtro-scoped, acompanha o recorte da tabela. */}
      <CarteiraCompositionBar summary={summary} isLoading={isLoading} className="shrink-0" />

      <InstallmentsFilters
        {...filters}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
      />

      {/* overflow-x-clip: o aside anima com translateX e não pode vazar do layout */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-x-clip lg:flex-row lg:items-stretch">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border shadow-sm">
          <InstallmentsTable
            data={data}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={handleClearFilters}
            onViewDetails={handleViewDetails}
            selectedId={selectedInstallmentId}
            sort={sort.sort}
            onSort={sort.setSort}
            total={total}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onReachEnd={fetchNextPage}
          />
        </div>

        {/* Painel inline (master-detail) só em telas largas; abaixo de lg o mesmo
            painel vira drawer (ver abaixo). Entra e sai deslizando pela borda
            direita (transform-only); na saída fica montado até o fim do detail-out. */}
        {(detailOpen || detailExiting) && isDesktop && (
          <aside
            className={`flex min-h-0 w-[27rem] shrink-0 flex-col overflow-hidden rounded-xl border bg-card shadow-sm ${
              detailOpen ? 'animate-detail-in' : 'animate-detail-out'
            }`}
          >
            <div className="flex h-full w-[27rem] shrink-0 flex-col">
              <InstallmentDetailPanel
                installmentId={detailOpen ? selectedInstallmentId : lastInstallmentIdRef.current}
                onClose={handleCloseDrawer}
                onSelectInstallment={setSelectedInstallmentId}
                onPayInstallment={handlePayInstallment}
                onIssueBoleto={handleIssueBoleto}
              />
            </div>
          </aside>
        )}
      </div>
    </div>

    {/* Mobile/tablet: o painel da parcela abre como drawer overlay. */}
    {!isDesktop && (
      <InstallmentDetailDrawer
        installmentId={selectedInstallmentId}
        open={detailOpen}
        onClose={handleCloseDrawer}
        onSelectInstallment={setSelectedInstallmentId}
        onPayInstallment={handlePayInstallment}
        onIssueBoleto={handleIssueBoleto}
      />
    )}

    <PayInstallmentDialog
      installment={selectedInstallment}
      open={payDialogOpen}
      onOpenChange={setPayDialogOpen}
    />
  </AppLayout>
)
```

- [ ] **Step 3: Limpar `use-installments-table.ts`**

Remover:
- `DEFAULT_TAB` e a entrada `tab` de `installmentsQueryParsers` (o param `parcela` e todos os filtros **ficam** — recebem os deep-links do dashboard)
- interface `InstallmentsTableView` e o campo `view` de `UseInstallmentsTableReturn`
- os campos `applyAgingBucket`, `applyMonthFilter`, `applyProjectFilter` de `UseInstallmentsTableReturn`
- as 3 funções `applyAgingBucket` / `applyMonthFilter` / `applyProjectFilter` e suas entradas no objeto de return, e `view: {...}` do return
- destructure de `tab` do `queryState`
- imports agora órfãos: `endOfMonth`, `parseISO`, `format` de date-fns; `agingDueRange` e `OPEN_STATUSES` de `@/lib/installment-aging` (manter só `export type { AgingBucketKey }`… na verdade remover também — ver passo 4)

- [ ] **Step 4: Deletar os 3 blocos e o hook órfão**

```bash
git rm src/components/financeiro/installments-aging-block.tsx \
       src/components/financeiro/installments-cashflow-block.tsx \
       src/components/financeiro/installments-by-project-block.tsx
```

Com `installments-aging-block` deletado, ninguém mais importa `AgingBucketKey` do hook — remover o re-export `export type { AgingBucketKey }` e o import correspondente de `use-installments-table.ts`.

Em `src/hooks/use-installments.ts`, remover `useInstallmentsByProject` (era usado só pelo by-project block), as keys `byProjects`/`byProject` do `installmentKeys`, e os tipos `InstallmentsByProjectResponse`/`InstallmentProjectBreakdown` (declaração e export). Confirmar antes:

Run: `grep -rn "useInstallmentsByProject\|byProject\|InstallmentsByProjectResponse\|InstallmentProjectBreakdown" src/ pages/ --include="*.ts*" | grep -v use-installments.ts`
Expected: vazio.

- [ ] **Step 5: Verificar manualmente**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: verde.

Run: `pnpm dev` (porta **3000** — obrigatório, CORS do backend) e abrir `http://localhost:3000/financeiro`:
- página sem abas: título → barra de composição → filtros → tabela
- clicar numa linha abre o painel master-detail
- `http://localhost:3000/financeiro?status=scheduled,invoiced,partial&duePreset=custom&dueMin=2026-05-11&dueMax=2026-06-09` chega com filtros aplicados (valida o contrato do deep-link)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(financeiro): remove aba Resumo — página vira pura operação

O dashboard da home assume a visão executiva (spec dashboard-home).
CarteiraCompositionBar permanece como pulso filtro-scoped da operação."
```

---

### Task 3: Lib `dashboard-metrics` (TDD)

Cálculos puros do hero: inadimplência %, variação mensal e a janela do gráfico de recebimento.

**Files:**
- Create: `src/lib/dashboard-metrics.ts`
- Create: `src/lib/dashboard-metrics.test.ts`

- [ ] **Step 1: Escrever os testes (falhando)**

```ts
// src/lib/dashboard-metrics.test.ts
import { describe, expect, it } from 'vitest'
import { cashflowWindow, delinquencyRate, percentChange } from './dashboard-metrics'

describe('delinquencyRate', () => {
  it('fórmula Sienge: vencido / (vencido + a vencer) — sobre o saldo remanescente', () => {
    expect(delinquencyRate(13_491_000, 421_843_000)).toBeCloseTo(3.198, 2)
  })
  it('null sem carteira (evita divisão por zero)', () => {
    expect(delinquencyRate(0, 0)).toBeNull()
  })
  it('zero vencido → 0%', () => {
    expect(delinquencyRate(0, 100)).toBe(0)
  })
})

describe('percentChange', () => {
  it('variação relativa ao anterior', () => {
    expect(percentChange(342_580, 305_875)).toBeCloseTo(12, 0)
  })
  it('null sem base de comparação', () => {
    expect(percentChange(100, 0)).toBeNull()
  })
  it('queda vira negativo', () => {
    expect(percentChange(80, 100)).toBe(-20)
  })
})

describe('cashflowWindow', () => {
  it('3 meses atrás + atual + 2 à frente, com o ISO do mês corrente', () => {
    expect(cashflowWindow(new Date(2026, 5, 10))).toEqual({
      from: '2026-03',
      to: '2026-08',
      currentIso: '2026-06-01',
    })
  })
  it('vira o ano corretamente', () => {
    expect(cashflowWindow(new Date(2026, 0, 15))).toEqual({
      from: '2025-10',
      to: '2026-03',
      currentIso: '2026-01-01',
    })
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm vitest run src/lib/dashboard-metrics.test.ts`
Expected: FAIL — módulo não existe

- [ ] **Step 3: Implementar**

```ts
// src/lib/dashboard-metrics.ts
import { addMonths, format, startOfMonth, subMonths } from 'date-fns'

/**
 * Inadimplência da carteira em % (fórmula Sienge): vencido / (vencido + a vencer).
 * O denominador é o saldo remanescente total (`total_remaining_amount`), que já
 * é vencido + a vencer. Null quando não há carteira (evita 0/0).
 */
export function delinquencyRate(overdueCents: number, remainingCents: number): number | null {
  if (remainingCents <= 0) return null
  return (overdueCents / remainingCents) * 100
}

/** Variação % vs valor anterior (ex.: recebido no mês vs mês passado). Null sem base. */
export function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null
  return ((current - previous) / previous) * 100
}

/**
 * Janela do gráfico de recebimento do dashboard: 3 meses de realizado + mês
 * corrente + 2 de projeção. `from`/`to` no formato YYYY-MM do /installments/cashflow;
 * `currentIso` no formato dos itens (`months[].month` = primeiro dia do mês).
 */
export function cashflowWindow(today = new Date()): {
  from: string
  to: string
  currentIso: string
} {
  const base = startOfMonth(today)
  return {
    from: format(subMonths(base, 3), 'yyyy-MM'),
    to: format(addMonths(base, 2), 'yyyy-MM'),
    currentIso: format(base, 'yyyy-MM-dd'),
  }
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `pnpm vitest run src/lib/dashboard-metrics.test.ts`
Expected: PASS (8 testes)

- [ ] **Step 5: Commit**

```bash
git add src/lib/dashboard-metrics.ts src/lib/dashboard-metrics.test.ts
git commit -m "feat(dashboard): lib de métricas — inadimplência, variação e janela de cashflow"
```

---

### Task 4: Componente `SectionHeader`

**Files:**
- Create: `src/components/dashboard/section-header.tsx`

- [ ] **Step 1: Implementar**

```tsx
// src/components/dashboard/section-header.tsx

interface SectionHeaderProps {
  title: string
  href: string
  linkLabel: string
}

/**
 * Cabeçalho de seção do dashboard: rótulo uppercase + link de drill-down para a
 * página dedicada. `<a href>` simples — o client router do Vike intercepta.
 */
export function SectionHeader({ title, href, linkLabel }: SectionHeaderProps) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {title}
      </h2>
      <a href={href} className="text-xs font-medium text-primary hover:underline">
        {linkLabel} →
      </a>
    </div>
  )
}
```

- [ ] **Step 2: Verificar e commitar**

Run: `pnpm typecheck && pnpm lint`
Expected: verde

```bash
git add src/components/dashboard/section-header.tsx
git commit -m "feat(dashboard): componente SectionHeader"
```

---

### Task 5: Hero `DashboardVitals`

5 células sobre `VitalsStrip` (componente existente, aceita `value`/`sub` como ReactNode e `tone` semântico). Quatro queries — `summary` base tem a mesma key da usada no `AgingCard` (Task 6), então o TanStack deduplica.

**Files:**
- Create: `src/components/dashboard/dashboard-vitals.tsx`

- [ ] **Step 1: Implementar**

```tsx
// src/components/dashboard/dashboard-vitals.tsx
import { endOfMonth, format, startOfMonth, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useMemo } from 'react'
import { type Vital, VitalsStrip } from '@/components/empreendimentos/vitals-strip'
import { AnimatedNumber } from '@/components/ui/animated-number'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useInstallmentsCashflow,
  useInstallmentsFinancialSummary,
  useInstallmentsSummary,
} from '@/hooks/use-installments'
import { cashflowWindow, delinquencyRate, percentChange } from '@/lib/dashboard-metrics'
import { formatCurrency, formatPercent } from '@/lib/utils'

const fromCents = (cents: number) => formatCurrency(cents / 100)

const VITAL_LABELS = [
  'Carteira a receber',
  'Inadimplência',
  'Recebido no mês',
  'A receber no mês',
  'Contratos ativos',
]

/**
 * Hero do dashboard — os 5 vitais da carteira numa única superfície hairline.
 * Responde "como está minha carteira?" em uma olhada; o detalhe fica nas seções.
 */
export function DashboardVitals() {
  const win = useMemo(() => cashflowWindow(), [])
  const monthBounds = useMemo(() => {
    const start = startOfMonth(new Date())
    return { min: format(start, 'yyyy-MM-dd'), max: format(endOfMonth(start), 'yyyy-MM-dd') }
  }, [])

  const financial = useInstallmentsFinancialSummary({})
  const portfolio = useInstallmentsSummary({ page_size: 1 })
  const cashflow = useInstallmentsCashflow({ from: win.from, to: win.to })
  // Count de parcelas abertas vencendo no mês — chamada leve, só o bloco summary.
  const monthOpen = useInstallmentsSummary({
    'due_date[min]': monthBounds.min,
    'due_date[max]': monthBounds.max,
    page_size: 1,
  })

  if (financial.isLoading || portfolio.isLoading || cashflow.isLoading) {
    return (
      <VitalsStrip
        vitals={VITAL_LABELS.map((label) => ({
          label,
          value: <Skeleton className="h-7 w-24" />,
        }))}
      />
    )
  }

  const fin = financial.data ?? null
  const summary = portfolio.data?.summary ?? null
  const months = cashflow.data?.months ?? []

  const currentIdx = months.findIndex((m) => m.month.slice(0, 10) === win.currentIso)
  const received = currentIdx >= 0 ? (months[currentIdx]?.received?.cents ?? 0) : 0
  const prevReceived = currentIdx > 0 ? (months[currentIdx - 1]?.received?.cents ?? 0) : 0
  const dueProjected = currentIdx >= 0 ? (months[currentIdx]?.due_projected?.cents ?? 0) : 0
  const change = percentChange(received, prevReceived)
  const prevMonthName = format(subMonths(new Date(), 1), 'MMMM', { locale: ptBR })
  const monthName = format(new Date(), 'MMMM', { locale: ptBR })

  const overdueCents = summary?.total_overdue_amount?.cents ?? 0
  const remainingCents = summary?.total_remaining_amount?.cents ?? 0
  const rate = delinquencyRate(overdueCents, remainingCents)

  const monthSummary = monthOpen.data?.summary ?? null
  const monthOpenCount =
    (monthSummary?.scheduled_count ?? 0) +
    (monthSummary?.invoiced_count ?? 0) +
    (monthSummary?.partial_count ?? 0)

  const overdueContracts = fin?.overdue_contracts ?? 0

  const vitals: Vital[] = [
    {
      label: 'Carteira a receber',
      value: <AnimatedNumber value={fin?.total_outstanding?.cents ?? 0} format={fromCents} />,
      sub: `${fin?.active_contracts ?? 0} contratos · corrigida`,
    },
    {
      label: 'Inadimplência',
      value: rate == null ? '—' : `${formatPercent(rate)}%`,
      tone: rate != null && rate > 0 ? 'destructive' : 'default',
      sub: overdueCents > 0 ? `${fromCents(overdueCents)} vencidos` : 'Nada vencido',
    },
    {
      label: 'Recebido no mês',
      value: <AnimatedNumber value={received} format={fromCents} />,
      tone: 'success',
      sub:
        change == null ? (
          <span className="first-letter:capitalize">{monthName}</span>
        ) : (
          <span className={change >= 0 ? 'text-success' : 'text-destructive'}>
            {change >= 0 ? '▲' : '▼'} {formatPercent(Math.abs(change), 0)}% vs {prevMonthName}
          </span>
        ),
    },
    {
      label: 'A receber no mês',
      value: <AnimatedNumber value={dueProjected} format={fromCents} />,
      sub: `${monthOpenCount} ${monthOpenCount === 1 ? 'parcela vence' : 'parcelas vencem'} em ${monthName}`,
    },
    {
      label: 'Contratos ativos',
      value: <AnimatedNumber value={fin?.active_contracts ?? 0} />,
      sub:
        overdueContracts > 0 ? (
          <span className="text-destructive">
            {overdueContracts} {overdueContracts === 1 ? 'inadimplente' : 'inadimplentes'}
          </span>
        ) : (
          'Carteira em dia'
        ),
    },
  ]

  return <VitalsStrip vitals={vitals} />
}
```

Notas:
- `months[].month` vem como `YYYY-MM-DD` (primeiro dia do mês) — comparar com `win.currentIso` por slice(0, 10).
- Queries com erro: o coalesce para 0/null degrada para zeros — sem crash, sem toast (dashboard é leitura passiva; retry automático do query-client cobre transientes).

- [ ] **Step 2: Verificar e commitar**

Run: `pnpm typecheck && pnpm lint`
Expected: verde

```bash
git add src/components/dashboard/dashboard-vitals.tsx
git commit -m "feat(dashboard): hero DashboardVitals com 5 vitais da carteira"
```

---

### Task 6: Card `AgingCard` (aging compacto + maiores atrasos)

Variante compacta do antigo bloco de aging (deletado na Task 2): mesma escala de severidade coral e glow dots, linhas viram `<a href>` com deep-link, + lista "maiores atrasos".

**Files:**
- Create: `src/components/dashboard/aging-card.tsx`

- [ ] **Step 1: Implementar**

```tsx
// src/components/dashboard/aging-card.tsx
import { ChevronRight, ShieldCheck } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useInstallmentsSummary } from '@/hooks/use-installments'
import { type AgingBucketKey, agingBucketHref } from '@/lib/installment-aging'
import { cn, formatCurrency } from '@/lib/utils'

// Coral (destructive) escalando por opacidade: quanto mais velho o atraso, mais
// intenso. Uma só voz semântica (coral = atraso), a idade modula a intensidade.
const OVERDUE_BUCKETS: { key: AgingBucketKey; label: string; accent: string }[] = [
  { key: 'd1_30', label: '1-30 dias', accent: 'text-destructive/55' },
  { key: 'd31_60', label: '31-60 dias', accent: 'text-destructive/75' },
  { key: 'd61_90', label: '61-90 dias', accent: 'text-destructive/90' },
  { key: 'd90_plus', label: '90+ dias', accent: 'text-destructive' },
]

function plural(count: number): string {
  return count === 1 ? 'parcela' : 'parcelas'
}

/**
 * Parcelas vencidas por idade (versão compacta do dashboard) + maiores atrasos.
 * Cada faixa deep-linka o /financeiro já recortado (estado nuqs na URL).
 */
export function AgingCard() {
  // Mesma key do hero ({ page_size: 1 }) — o TanStack deduplica o fetch.
  const { data, isLoading, isError } = useInstallmentsSummary({ page_size: 1 })
  const topOverdue = useInstallmentsSummary({
    overdue: true,
    sort_by: ['current_amount:desc'],
    page_size: 3,
  })

  if (isLoading) return <AgingCardSkeleton />

  const summary = data?.summary ?? null
  const overdueTotal = summary?.total_overdue_amount?.cents ?? 0
  const overdueCount = summary?.overdue_count ?? 0
  const buckets = OVERDUE_BUCKETS.map((meta) => {
    const bucket = summary?.aging?.[meta.key]
    return { ...meta, count: bucket?.count ?? 0, cents: bucket?.amount?.cents ?? 0 }
  })
  const hasOverdue = overdueTotal > 0 || overdueCount > 0
  const topItems = topOverdue.data?.items ?? []

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <header className="flex items-start justify-between gap-4 p-5 pb-4">
        <div>
          <h3 className="text-sm font-semibold">Parcelas vencidas</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Por tempo de atraso</p>
        </div>
        {hasOverdue && (
          <div className="shrink-0 text-right">
            <div className="text-xl font-semibold leading-none tracking-tight tabular-nums text-destructive">
              {formatCurrency(overdueTotal / 100)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground tabular-nums">
              {overdueCount} {plural(overdueCount)}
            </div>
          </div>
        )}
      </header>

      <div className="px-5 pb-4">
        {isError ? (
          <p className="text-sm text-muted-foreground">Não foi possível carregar o aging.</p>
        ) : hasOverdue ? (
          <>
            <div
              aria-hidden
              className="mb-3 flex h-2 w-full gap-px overflow-hidden rounded-full bg-muted"
            >
              {buckets.map(
                (bucket) =>
                  bucket.cents > 0 && (
                    <div
                      key={bucket.key}
                      className={cn('h-full min-w-[3px] bg-current', bucket.accent)}
                      style={{ width: `${(bucket.cents / overdueTotal) * 100}%` }}
                    />
                  )
              )}
            </div>

            <div className="-mx-2 flex flex-col">
              {buckets.map((bucket) => (
                <a
                  key={bucket.key}
                  href={agingBucketHref(bucket.key)}
                  className="group flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/50"
                >
                  <span
                    aria-hidden
                    className={cn(
                      'size-2 shrink-0 rounded-full bg-current',
                      bucket.accent,
                      bucket.cents > 0 && 'shadow-[0_0_6px_currentColor]'
                    )}
                  />
                  <span className="whitespace-nowrap text-sm">{bucket.label}</span>
                  <span className="ml-auto flex items-baseline gap-3">
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {bucket.count}
                    </span>
                    <span
                      className={cn(
                        'shrink-0 text-right text-sm font-medium tabular-nums sm:w-24',
                        bucket.cents === 0 ? 'text-muted-foreground' : 'text-foreground'
                      )}
                    >
                      {formatCurrency(bucket.cents / 100)}
                    </span>
                  </span>
                  <ChevronRight className="hidden size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-60 sm:block" />
                </a>
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3 rounded-lg bg-success/[0.08] px-4 py-3.5">
            <ShieldCheck className="size-5 shrink-0 text-success" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-success">Carteira em dia</p>
              <p className="text-xs text-muted-foreground">Nenhuma parcela em atraso.</p>
            </div>
          </div>
        )}
      </div>

      {hasOverdue && topItems.length > 0 && (
        <div className="border-t px-5 py-3">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Maiores atrasos
          </p>
          <div className="-mx-2 flex flex-col">
            {topItems.map((item) => (
              <a
                key={item.id}
                href={`/financeiro?parcela=${item.id}`}
                className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50"
              >
                <span className="min-w-0 truncate text-sm">
                  {item.customer?.full_name ?? 'Cliente'}
                  <span className="ml-2 text-xs text-destructive tabular-nums">
                    {item.days_overdue} {item.days_overdue === 1 ? 'dia' : 'dias'}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-medium tabular-nums">
                  {formatCurrency((item.remaining_amount?.cents ?? 0) / 100)}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

function AgingCardSkeleton() {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <header className="flex items-start justify-between gap-4 p-5 pb-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-6 w-24" />
      </header>
      <div className="px-5 pb-5">
        <Skeleton className="mb-3 h-2 w-full rounded-full" />
        <div className="space-y-1.5">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
    </Card>
  )
}
```

Nota: o campo do item é `item.remaining_amount` e `item.days_overdue` (shape de `InstallmentSummaryItemResponse` — conferir em `src/hooks/use-installments.ts` se o typecheck reclamar).

- [ ] **Step 2: Verificar e commitar**

Run: `pnpm typecheck && pnpm lint`
Expected: verde

```bash
git add src/components/dashboard/aging-card.tsx
git commit -m "feat(dashboard): AgingCard — aging compacto com deep-links + maiores atrasos"
```

---

### Task 7: Card `CashflowCard` (recebimento 6m)

Versão compacta do antigo bloco de cashflow: 6 meses (3 realizados + atual + 2 projetados), sem eixo Y (tooltip carrega o valor exato), clique no mês deep-linka o `/financeiro`.

**Files:**
- Create: `src/components/dashboard/cashflow-card.tsx`

- [ ] **Step 1: Implementar**

```tsx
// src/components/dashboard/cashflow-card.tsx
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'
import { navigate } from 'vike/client/router'
import { Card } from '@/components/ui/card'
import { type ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { LegendDot } from '@/components/ui/legend-dot'
import { Skeleton } from '@/components/ui/skeleton'
import { useInstallmentsCashflow } from '@/hooks/use-installments'
import { cashflowWindow } from '@/lib/dashboard-metrics'
import { monthDueHref } from '@/lib/installment-aging'
import { cn, formatCurrency } from '@/lib/utils'

const chartConfig = {
  received: { label: 'Recebido', color: 'var(--color-success)' },
  due: { label: 'A receber', color: 'var(--color-info)' },
} satisfies ChartConfig

interface CashflowDatum {
  monthIso: string
  label: string
  received: number
  due: number
}

function monthAbbrev(iso: string): string {
  return format(parseISO(iso), 'MMM', { locale: ptBR }).replace('.', '')
}

/**
 * Recebimento 6m — realizado (esmeralda) vs a receber por vencimento (azul),
 * versão compacta do dashboard. Clicar num mês recorta o /financeiro nos
 * vencimentos daquele mês. Mesma linguagem de cores do app inteiro.
 */
export function CashflowCard() {
  const win = useMemo(() => cashflowWindow(), [])
  const { data, isLoading, isError } = useInstallmentsCashflow({ from: win.from, to: win.to })

  const chartData: CashflowDatum[] = useMemo(
    () =>
      (data?.months ?? []).map((month) => ({
        monthIso: month.month,
        label: monthAbbrev(month.month),
        received: (month.received?.cents ?? 0) / 100,
        due: (month.due_projected?.cents ?? 0) / 100,
      })),
    [data]
  )

  const hasMovement = chartData.some((d) => d.received > 0 || d.due > 0)

  if (isLoading) return <CashflowCardSkeleton />

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 p-5 pb-2">
        <div>
          <h3 className="text-sm font-semibold">Recebimento</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Realizado vs a receber · 6 meses</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <LegendDot className="bg-success" label="Recebido" />
          <LegendDot className="bg-info" label="A receber" />
        </div>
      </header>

      {isError ? (
        <CashflowNote>Não foi possível carregar o recebimento.</CashflowNote>
      ) : !hasMovement ? (
        <CashflowNote>Sem movimentação no período.</CashflowNote>
      ) : (
        <div className="px-2 pb-3 pt-1">
          <ChartContainer
            config={chartConfig}
            className="h-44 w-full [&_.recharts-bar_path]:cursor-pointer"
          >
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
              onClick={(state) => {
                const datum = state?.activePayload?.[0]?.payload as CashflowDatum | undefined
                if (datum) navigate(monthDueHref(datum.monthIso))
              }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} interval={0} />
              <ChartTooltip content={<CashflowTooltip />} />
              <Bar dataKey="received" fill="var(--color-received)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="due" fill="var(--color-due)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>
      )}
    </Card>
  )
}

function CashflowNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-5 pb-5">
      <div className="flex h-36 items-center justify-center rounded-lg border border-dashed">
        <p className="text-sm text-muted-foreground">{children}</p>
      </div>
    </div>
  )
}

function CashflowTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: CashflowDatum }>
}) {
  if (!active || !payload?.length) return null
  const datum = payload[0]?.payload
  if (!datum) return null
  const fullMonth = format(parseISO(datum.monthIso), "MMMM 'de' yyyy", { locale: ptBR })

  return (
    <div className="min-w-44 rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="mb-1.5 font-medium capitalize">{fullMonth}</p>
      <div className="flex flex-col gap-1">
        <TooltipRow dotClass="bg-success" label="Recebido" value={datum.received} />
        <TooltipRow dotClass="bg-info" label="A receber" value={datum.due} />
      </div>
    </div>
  )
}

function TooltipRow({
  dotClass,
  label,
  value,
}: {
  dotClass: string
  label: string
  value: number
}) {
  return (
    <div className="flex items-center justify-between gap-6">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <span className={cn('size-2 rounded-full', dotClass)} />
        {label}
      </span>
      <span className="font-medium tabular-nums text-foreground">{formatCurrency(value)}</span>
    </div>
  )
}

function CashflowCardSkeleton() {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <header className="flex items-start justify-between gap-4 p-5 pb-2">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-44" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
        </div>
      </header>
      <div className="px-5 pb-5 pt-2">
        <div className="flex h-36 items-end gap-3">
          {[55, 70, 45, 85, 60, 75].map((h, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton bars
            <Skeleton key={i} className="flex-1 rounded-t" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    </Card>
  )
}
```

Nota: a query tem a mesma key da do hero (mesmos `from`/`to`) — um único fetch.

- [ ] **Step 2: Verificar e commitar**

Run: `pnpm typecheck && pnpm lint`
Expected: verde

```bash
git add src/components/dashboard/cashflow-card.tsx
git commit -m "feat(dashboard): CashflowCard — recebimento 6m compacto com deep-link por mês"
```

---

### Task 8: Montar a página `/dashboard`

Substitui o mock inteiro. Saudação permanece; saem o dropdown "Último mês" e o botão "Exportar" (mock sem função). As seções Vendas e Operacional entram no plano Front B.

**Files:**
- Modify: `pages/dashboard/+Page.tsx` (reescrever)

- [ ] **Step 1: Reescrever a página**

```tsx
// pages/dashboard/+Page.tsx
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AppLayout } from '@/components/app-layout'
import { AgingCard } from '@/components/dashboard/aging-card'
import { CashflowCard } from '@/components/dashboard/cashflow-card'
import { DashboardVitals } from '@/components/dashboard/dashboard-vitals'
import { SectionHeader } from '@/components/dashboard/section-header'
import { useAuth } from '@/contexts/auth-context'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function getFirstName(name: string | null | undefined): string {
  if (!name) return ''
  return name.split(' ')[0] ?? ''
}

export default function DashboardPage() {
  const { user } = useAuth()
  const firstName = getFirstName(user?.displayName)
  const today = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })

  return (
    <AppLayout>
      <div className="space-y-8">
        <header className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            {getGreeting()}
            {firstName ? `, ${firstName}` : ''}
          </h1>
          <span className="text-sm text-muted-foreground first-letter:capitalize">{today}</span>
        </header>

        <DashboardVitals />

        <section className="space-y-3">
          <SectionHeader title="Financeiro" href="/financeiro" linkLabel="Ver financeiro" />
          <div className="grid items-start gap-4 lg:grid-cols-2">
            <AgingCard />
            <CashflowCard />
          </div>
        </section>
      </div>
    </AppLayout>
  )
}
```

- [ ] **Step 2: Verificar manualmente**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: verde

Run: `pnpm dev` (porta 3000) → `http://localhost:3000/dashboard` (login dev: ver memória `dev-login`):
- hero com 5 células e valores reais animando
- aging com severidade coral; clicar em "1-30 dias" → `/financeiro` filtrado
- gráfico de recebimento com 6 meses; clicar num mês → `/financeiro` filtrado no mês
- redimensionar para mobile: hero empilha, cards empilham

- [ ] **Step 3: Commit**

```bash
git add pages/dashboard/+Page.tsx
git commit -m "feat(dashboard): home real — hero + seção financeiro (substitui mock)"
```

---

### Task 9: E2E — mocks atualizados + smoke do dashboard

Os handlers de `tests/e2e/mocks/handlers/financeiro.ts` devolvem o shape **antigo** do summary (pré-WireMoney, sem aging) — dívida conhecida. Atualizar para o contrato atual e cobrir o dashboard. (Os specs antigos de `tests/e2e/financeiro/installments.spec.ts` já estavam defasados da UI — não fazem parte do gate; não piorar, mas não é escopo consertá-los todos.)

**Files:**
- Modify: `tests/e2e/mocks/factory.ts` (exportar `money`)
- Modify: `tests/e2e/mocks/handlers/financeiro.ts`
- Create: `tests/e2e/dashboard/dashboard.spec.ts`

- [ ] **Step 1: Exportar o helper `money` da factory**

Em `tests/e2e/mocks/factory.ts`, trocar `const money = (cents: number): Money => ({...})` por `export const money = (cents: number): Money => ({...})` (linha ~22).

- [ ] **Step 2: Reescrever os handlers de installments com o contrato atual**

Em `tests/e2e/mocks/handlers/financeiro.ts`, substituir o handler de `**/api/v1/installments/summary*` e adicionar `financial-summary` e `cashflow`:

```ts
import { addMonths, format, startOfMonth } from 'date-fns'
import type { Page } from '@playwright/test'
import * as factory from '../factory'

const { money } = factory

/** Item do /installments/summary no shape atual (InstallmentSummaryItemResponse). */
function summaryItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 'b9f7a2c4-0000-4000-8000-000000000001',
    contract_id: 42,
    kind: 'regular',
    payment_method: 'boleto',
    due_date: '2026-05-05',
    base_amount: money(1_500_000),
    current_amount: money(1_842_000),
    paid_amount: money(0),
    remaining_amount: money(1_842_000),
    status: 'invoiced',
    installment_number: '3/36',
    is_overdue: true,
    days_overdue: 38,
    created_at: '2026-01-10T14:30:00Z',
    customer: { id: 7, full_name: 'João Silva', cpf_cnpj: '123.456.789-00' },
    project: { id: 3, name: 'Residencial Aurora' },
    unit: { id: 15, name: 'Apt 302-B' },
    boleto: null,
    payments: [],
    ...overrides,
  }
}

function aging() {
  return {
    not_due: { count: 41, amount: money(40_500_000) },
    d1_30: { count: 5, amount: money(8_245_000) },
    d31_60: { count: 2, amount: money(2_876_000) },
    d61_90: { count: 1, amount: money(1_420_000) },
    d90_plus: { count: 1, amount: money(950_000) },
  }
}

function fullSummary() {
  return {
    total_current_amount: money(72_000_000),
    total_base_amount: money(70_000_000),
    total_paid_amount: money(18_009_000),
    total_overdue_amount: money(13_491_000),
    total_remaining_amount: money(53_991_000),
    total_correction_amount: money(2_000_000),
    scheduled_count: 30,
    invoiced_count: 10,
    partial_count: 3,
    paid_count: 5,
    canceled_count: 0,
    overdue_count: 9,
    entry_total: 1,
    regular_total: 40,
    balloon_total: 4,
    key_delivery_total: 1,
    extra_total: 3,
    aging: aging(),
  }
}

export async function registerFinanceiroHandlers(page: Page) {
  // GET /api/v1/installments/financial-summary — KPIs executivos do hero
  await page.route('**/api/v1/installments/financial-summary*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        total_contracts: 92,
        active_contracts: 89,
        settled_contracts: 3,
        overdue_contracts: 3,
        total_principal: money(800_000_000),
        total_paid: money(380_000_000),
        total_refunded: money(0),
        total_outstanding: money(421_843_000),
        total_correction: money(1_843_000),
        payment_progress_percentage: 47.5,
      }),
    })
  })

  // GET /api/v1/installments/cashflow — 6 meses ancorados na data real do teste
  await page.route('**/api/v1/installments/cashflow*', async (route) => {
    const base = startOfMonth(new Date())
    const months = [-3, -2, -1, 0, 1, 2].map((offset) => {
      const month = addMonths(base, offset)
      const isPast = offset < 0
      const isCurrent = offset === 0
      return {
        month: format(month, 'yyyy-MM-dd'),
        received: money(isPast ? 30_000_000 + offset * 1_000_000 : isCurrent ? 34_258_000 : 0),
        refunded: money(0),
        correction: money(0),
        due_projected: money(offset >= 0 ? 41_820_000 : 0),
      }
    })
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ months }),
    })
  })

  // GET /api/v1/installments/summary — shape atual (items + summary com aging).
  // Branch por `overdue=true` (lista "maiores atrasos" do dashboard).
  await page.route('**/api/v1/installments/summary*', async (route) => {
    const url = new URL(route.request().url())
    const overdueOnly = url.searchParams.get('overdue') === 'true'
    const items = overdueOnly
      ? [
          summaryItem(),
          summaryItem({
            id: 'b9f7a2c4-0000-4000-8000-000000000002',
            customer: { id: 8, full_name: 'Maria Lopes', cpf_cnpj: '987.654.321-00' },
            days_overdue: 52,
            remaining_amount: money(1_230_000),
            current_amount: money(1_230_000),
          }),
          summaryItem({
            id: 'b9f7a2c4-0000-4000-8000-000000000003',
            customer: { id: 9, full_name: 'Pedro Martins', cpf_cnpj: '111.222.333-44' },
            days_overdue: 95,
            remaining_amount: money(815_000),
            current_amount: money(815_000),
          }),
        ]
      : []
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      // factory.paginated → { items, total, page, ... }: é o shape que o código lê
      // (use-installments-table consome data.items / data.total).
      body: JSON.stringify({
        ...factory.paginated(items, items.length),
        summary: fullSummary(),
      }),
    })
  })

  // GET /api/v1/installments — listagem paginada (regex cobre query params)
  // [MANTER o handler existente da listagem, detalhe e pay como estão]
}
```

Importante: **manter** os handlers existentes de `/api/v1/installments` (lista), `/api/v1/installments/:id` (detalhe) e `pay` no fim da função — só o de `summary` é substituído e os dois novos entram.

A UI lê `data.items` / `data.total` (`use-installments-table.ts` → `fetchPage`) — por isso o mock usa `factory.paginated`, que entrega exatamente esse shape.

- [ ] **Step 3: Escrever o smoke do dashboard**

```ts
// tests/e2e/dashboard/dashboard.spec.ts
import { expect, test } from '../fixtures'

test.describe('Dashboard — Início', () => {
  test('exibe o hero com os 5 vitais da carteira', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard')
    await expect(page.getByText('Carteira a receber')).toBeVisible()
    await expect(page.getByText('Inadimplência')).toBeVisible()
    await expect(page.getByText('Recebido no mês')).toBeVisible()
    await expect(page.getByText('A receber no mês')).toBeVisible()
    await expect(page.getByText('Contratos ativos')).toBeVisible()
    // Inadimplência calculada: 13.491.000 / 53.991.000 ≈ 25%
    await expect(page.getByText('25%')).toBeVisible()
  })

  test('exibe a seção financeiro com aging e maiores atrasos', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/dashboard')
    await expect(page.getByText('Parcelas vencidas')).toBeVisible()
    await expect(page.getByText('1-30 dias')).toBeVisible()
    await expect(page.getByText('90+ dias')).toBeVisible()
    await expect(page.getByText('Maiores atrasos')).toBeVisible()
    await expect(page.getByText('João Silva')).toBeVisible()
    await expect(page.getByText('Recebimento')).toBeVisible()
  })

  test('faixa de aging deep-linka o financeiro filtrado', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/dashboard')
    await page.getByRole('link', { name: /1-30 dias/ }).click()
    await expect(page).toHaveURL(/\/financeiro\?.*duePreset=custom/)
    await expect(page.getByRole('heading', { name: 'Financeiro' })).toBeVisible()
  })
})
```

Nota: o valor esperado de inadimplência no 1º teste depende de `formatPercent` (25 → "25"). Se o assert quebrar por arredondamento, calcular a partir do mock: `13_491_000 / 53_991_000 * 100 = 24,98…` → `formatPercent` com 1 casa → "25%". Ajustar o assert ao output real, nunca o contrário silenciosamente.

- [ ] **Step 4: Rodar e2e do dashboard**

Run: `pnpm test:e2e tests/e2e/dashboard/`
Expected: 3 testes PASS (exige `VITE_FIREBASE_PERSISTENCE=local` no `.env` — ver memória `e2e-setup`)

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/mocks/factory.ts tests/e2e/mocks/handlers/financeiro.ts tests/e2e/dashboard/dashboard.spec.ts
git commit -m "test(dashboard): smoke e2e + mocks de installments no contrato atual (WireMoney/aging)"
```

---

### Task 10: Gates finais

- [ ] **Step 1: Rodar todos os gates**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
Expected: tudo verde (build inclui tsc)

- [ ] **Step 2: Revisão do diff**

Run: `git log --oneline main..HEAD && git diff main --stat`
Conferir: nenhum arquivo fora do escopo (spec/preview + libs + dashboard + financeiro + e2e).

- [ ] **Step 3: Push**

```bash
git push -u origin feat/dashboard-home
```

PR para `main` fica a critério do usuário (pode aguardar o Front B na mesma branch).

---

## Self-review (executado na escrita do plano)

- **Cobertura do spec (Front A):** hero 5 células ✓ · aging compacto + deep-link ✓ · maiores atrasos ✓ · recebimento 6m + deep-link por mês ✓ · remoção da aba Resumo (deleta blocos, mantém CarteiraCompositionBar, extrai agingDueRange) ✓ · estados loading/erro/vazio ✓ · testes unit + e2e ✓. Vendas/Operacional → plano Front B.
- **Riscos conhecidos:** (1) `sort_by=current_amount:desc` com `overdue=true` depende da whitelist do backend — verificação na issue #157; se rejeitado, trocar por `sort_by=due_date:asc` (mais antigas primeiro) e anotar. (2) Shape de paginação do mock e2e (`page_info` vs `total`) — alinhar ao `use-infinite-table` se o teste acusar.
