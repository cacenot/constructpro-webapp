# Financeiro v2 — Contrato *derived-overdue* (API v1.5.0) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Absorver o contrato da API v1.5.0 (`construct-pro-api` #140/#142) no webapp — migrar a remoção de `ContractStatus.in_default`, renomear `defaulting_contracts → overdue_contracts`, religar o vital "Contratos" no Pulso do `/financeiro` e expor a inadimplência de contrato (`is_overdue`) como pill + filtro `?overdue=true`.

**Architecture:** Inadimplência deixou de ser um *status* e virou condição *derivada* das parcelas (`is_overdue`), ortogonal ao ciclo de vida. Um contrato inadimplente continua com status `active`. A UI ganha uma pill "Inadimplente" separada do badge de status, e o filtro `?overdue=true` na lista. As leituras de carteira (`financial-summary`, `by-project`) reconciliam por construção.

**Tech Stack:** React 19 + TypeScript 5.9 (strict), Vike SPA, TanStack Query v5, `@cacenot/construct-pro-api-client` 1.4.0, shadcn/ui, BiomeJS.

**Spec:** `docs/superpowers/specs/2026-06-09-financeiro-v2-derived-overdue-design.md`

**Branch:** `feat/financeiro-v2` (PR #38). Trabalhar como está; sync com `main` é tarefa separada.

---

## Notas de execução

- **Sem framework de teste unitário de componente** neste repo (`CLAUDE.md`: "No test framework is configured"). A verificação de cada task segue o padrão das fases anteriores deste PR: **`pnpm typecheck`** + **`pnpm lint`** + conferência manual em `localhost:3000`. Não inventar suíte vitest para estes componentes.
- **Erro herdado conhecido:** `proposal-workbench.tsx:187` (`stepFields` possivelmente undefined) é pré-existente e **fora de escopo**. O `pnpm typecheck` continuará acusando **esse 1 erro** até o sync com `main` (commit `8b0604a`). Em cada task, "typecheck limpo" = **nenhum erro além desse**.
- **Porta do dev server:** rodar em `localhost:3000` (CORS do backend só libera a 3000).
- Convenção de commits: conventional commits, sem ponto-e-vírgula/aspas simples (Biome auto-fix no pre-commit).

---

## Task 1: Bump do api-client + migração `in_default` e `defaulting_contracts`

Restaura o typecheck (resolve os 15 erros da migração). O bump quebra a compilação; A+B consertam exatamente esses pontos — por isso vão juntos num único commit coerente.

**Files:**
- Modify: `package.json` (dependência do api-client)
- Modify: `src/components/contratos/contract-status-badge.tsx:10-11`
- Modify: `src/components/vendas/contract-status-badge.tsx:12-13`
- Modify: `src/components/clientes/detail/customer-contracts-tab.tsx:27-30`
- Modify: `pages/contratos/+Page.tsx:64`
- Modify: `pages/contratos/@id/+Page.tsx:95-100`
- Modify: `src/components/vendas/deal-cockpit.tsx:60`
- Modify: `src/components/vendas/deal-actions.tsx:57,72,120`
- Modify: `src/components/empreendimentos/financial-overview-section.tsx` (×2)
- Modify: `src/components/empreendimentos/project-financial-tab.tsx` (×4)
- Modify: `src/components/empreendimentos/project-vitals-strip.tsx` (×1)
- Modify: `src/components/financeiro/installments-vitals-strip.tsx:70`

- [ ] **Step 1: Bump do api-client para 1.4.0**

Run:
```bash
pnpm add @cacenot/construct-pro-api-client@1.4.0
```
Expected: `package.json` passa a `"@cacenot/construct-pro-api-client": "1.4.0"` e o lockfile atualiza. (Se já estiver 1.4.0 no working tree, o comando é idempotente.)

- [ ] **Step 2: Confirmar a superfície de erro do bump**

Run:
```bash
pnpm typecheck 2>&1 | grep -c "error TS"
```
Expected: `16` (15 da migração + 1 herdado).

- [ ] **Step 3: `contract-status-badge` (contratos) — remover chave `in_default`**

Em `src/components/contratos/contract-status-badge.tsx`, remover as duas linhas:
```ts
  in_default:
    'rounded-full border bg-pipeline-perdido   text-pipeline-perdido-fg   border-pipeline-perdido-dot/30 font-semibold',
```

- [ ] **Step 4: `contract-status-badge` (vendas) — remover chave `in_default`**

Em `src/components/vendas/contract-status-badge.tsx`, remover as duas linhas:
```ts
  in_default:
    'rounded-full border bg-pipeline-perdido    text-pipeline-perdido-fg    border-pipeline-perdido-dot/30',
```

- [ ] **Step 5: `customer-contracts-tab` — remover bloco `in_default`**

Em `src/components/clientes/detail/customer-contracts-tab.tsx`, remover o bloco (4 linhas) do `STATUS_CONFIG`:
```ts
  in_default: {
    label: 'Inadimplente',
    className: 'border-destructive/30 bg-destructive/10 text-destructive',
  },
```
(O `?? { label: contract.status, className: '' }` no `ContractCard` já cobre qualquer status fora do map.)

- [ ] **Step 6: `pages/contratos/+Page.tsx` — remover `'in_default'` da union do filtro**

Trocar (linha 64):
```ts
      status?: ('active' | 'settled' | 'pending' | 'in_default' | 'canceled' | 'terminated')[]
```
por:
```ts
      status?: ('active' | 'settled' | 'pending' | 'canceled' | 'terminated')[]
```

- [ ] **Step 7: `pages/contratos/@id/+Page.tsx` — saldo devedor vermelho via `is_overdue`**

Trocar o bloco (linhas 95-100):
```ts
  const outstandingBalanceColor =
    contract.status === 'settled'
      ? 'text-emerald-600 dark:text-emerald-400'
      : contract.status === 'in_default'
        ? 'text-red-600 dark:text-red-400'
        : ''
```
por:
```ts
  const outstandingBalanceColor =
    contract.status === 'settled'
      ? 'text-emerald-600 dark:text-emerald-400'
      : contract.is_overdue
        ? 'text-red-600 dark:text-red-400'
        : ''
```

- [ ] **Step 8: `deal-cockpit.tsx` — `isActiveContract` só com `active`**

Trocar (linha 60):
```ts
  const isActiveContract = contractStatus === 'active' || contractStatus === 'in_default'
```
por:
```ts
  const isActiveContract = contractStatus === 'active'
```
(Inadimplente já é `active`; `isActiveContract` é usado na linha 108 — comportamento preservado.)

- [ ] **Step 9: `deal-actions.tsx` — derivar `isOverdue` de `is_overdue`**

Trocar (linha 57):
```ts
  const inDefault = contractStatus === 'in_default'
```
por:
```ts
  const isOverdue = contractDetail?.is_overdue ?? sale.contract?.is_overdue ?? false
```
Depois renomear as duas referências a `inDefault`:
- Linha 72: `const hasAnyAction = canApprove || canSign || canPayEntry || inDefault || canEdit || hasOverflow`
  → `const hasAnyAction = canApprove || canSign || canPayEntry || isOverdue || canEdit || hasOverflow`
- Linha 120: `{inDefault && (` → `{isOverdue && (`

- [ ] **Step 10: Rename `defaulting_contracts → overdue_contracts` (4 arquivos)**

A propriedade `defaulting_contracts` é um token único; substituir cada ocorrência por `overdue_contracts`. **Rótulos de texto ("inadimplente(s)") permanecem** (decisão de termo).

`src/components/empreendimentos/financial-overview-section.tsx` (2 ocorrências):
```ts
          {data.defaulting_contracts > 0 && (   →   {data.overdue_contracts > 0 && (
              {data.defaulting_contracts} inadimplentes   →   {data.overdue_contracts} inadimplentes
```

`src/components/empreendimentos/project-financial-tab.tsx` (4 ocorrências):
```ts
        {data.defaulting_contracts > 0 && (     →   {data.overdue_contracts > 0 && (
            count={data.defaulting_contracts}    →   count={data.overdue_contracts}
  const n = data.defaulting_contracts            →   const n = data.overdue_contracts
      {financial.defaulting_contracts > 0 && <DefaultAlert data={financial} />}
                                                 →   {financial.overdue_contracts > 0 && <DefaultAlert data={financial} />}
```

`src/components/empreendimentos/project-vitals-strip.tsx` (1 ocorrência):
```ts
    const defaulting = financialSummary.defaulting_contracts   →   const defaulting = financialSummary.overdue_contracts
```

`src/components/financeiro/installments-vitals-strip.tsx` (1 ocorrência, linha 70):
```ts
    const defaulting = financialSummary.defaulting_contracts ?? 0   →   const defaulting = financialSummary.overdue_contracts ?? 0
```

- [ ] **Step 11: Verificar typecheck e lint**

Run:
```bash
pnpm typecheck 2>&1 | grep "error TS"
```
Expected: **apenas** `proposal-workbench.tsx(187,16): error TS...` (o erro herdado). Nenhum erro de `in_default` ou `defaulting_contracts`.

Run:
```bash
pnpm lint
```
Expected: sem erros (Biome limpo).

- [ ] **Step 12: Commit**

```bash
git add package.json pnpm-lock.yaml src/ pages/
git commit -m "feat(contratos): absorve contrato derived-overdue (api-client 1.4.0)

Remove in_default (status agora é só ciclo de vida; inadimplente continua active)
e renomeia defaulting_contracts -> overdue_contracts. construct-pro-api #140."
```

---

## Task 2: Religar o vital "Contratos" no Pulso do /financeiro

O 5º vital já existe em `installments-vitals-strip.tsx` (renderiza `if (financialSummary)`); a página só não passava o prop. O hook `useInstallmentsFinancialSummary` já existe em `use-installments.ts`.

**Files:**
- Modify: `pages/financeiro/+Page.tsx:23,111-115`

- [ ] **Step 1: Importar o hook de financial-summary**

Em `pages/financeiro/+Page.tsx`, trocar a linha 23:
```ts
import { installmentKeys } from '@/hooks/use-installments'
```
por:
```ts
import { installmentKeys, useInstallmentsFinancialSummary } from '@/hooks/use-installments'
```

- [ ] **Step 2: Buscar o financial-summary com os filtros ativos**

Logo após o bloco `const { client } = useApiClient()` / `const queryClient = useQueryClient()` (≈ linha 52), adicionar:
```ts
  // Pulso nível-ledger (contratos): reconcilia com os filtros de projeto/cliente.
  const { data: financialSummary } = useInstallmentsFinancialSummary({
    project_id: filters.projectFilter,
    customer_id: filters.customerFilter?.id ?? null,
  })
```
(`filters` já vem do `useInstallmentsTable` no topo do componente.)

- [ ] **Step 3: Passar `financialSummary` ao Pulso e atualizar o comentário**

Trocar o bloco (linhas 111-115):
```tsx
        {/* Pulso. O 5º vital "Contratos" (financial-summary) está pronto no
            componente, mas desligado até o backend reconciliar a contagem de
            contratos ativos/inadimplentes — hoje reporta "todos em dia" com
            R$ 690k em atraso na carteira (ver issue no construct-pro-api). */}
        <InstallmentsVitalsStrip summary={summary} isLoading={isLoading} />
```
por:
```tsx
        {/* Pulso. 5º vital "Contratos" (financial-summary) ligado: contratos
            ativos + inadimplência derivada (overdue_contracts), reconciliando
            com a carteira. construct-pro-api #140 resolveu a contagem. */}
        <InstallmentsVitalsStrip
          summary={summary}
          financialSummary={financialSummary}
          isLoading={isLoading}
        />
```

- [ ] **Step 4: Verificar typecheck e lint**

Run:
```bash
pnpm typecheck 2>&1 | grep "error TS"
```
Expected: apenas o erro herdado `proposal-workbench.tsx:187`.

Run:
```bash
pnpm lint
```
Expected: limpo.

- [ ] **Step 5: Conferência manual**

Run: `pnpm dev` (porta 3000) → abrir `/financeiro`.
Expected: o Pulso mostra **5 vitais**; o 5º "Contratos" exibe `active_contracts` como valor e "N inadimplentes" / "todos em dia" no sub. Filtrar por empreendimento (cross-filter da carteira) recorta a contagem coerentemente.

- [ ] **Step 6: Commit**

```bash
git add pages/financeiro/+Page.tsx
git commit -m "feat(financeiro): religa vital Contratos no Pulso via overdue_contracts"
```

---

## Task 3: Componente `ContractOverdueBadge`

Pill destrutiva "Inadimplente", desacoplada do response (recebe `isOverdue: boolean`). Renderiza `null` quando não há inadimplência.

**Files:**
- Create: `src/components/contratos/contract-overdue-badge.tsx`

- [ ] **Step 1: Criar o componente**

Criar `src/components/contratos/contract-overdue-badge.tsx`:
```tsx
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ContractOverdueBadgeProps {
  /** Quando false/null/undefined, o componente não renderiza nada. */
  isOverdue: boolean | null | undefined
  className?: string
}

/**
 * Pill de inadimplência do contrato — sinal derivado (is_overdue), ortogonal ao
 * status (ciclo de vida). Só aparece quando o contrato está inadimplente:
 * assinado, não-terminal e com >=1 parcela vencida com saldo. Ver construct-pro-api #140.
 */
export function ContractOverdueBadge({ isOverdue, className }: ContractOverdueBadgeProps) {
  if (!isOverdue) return null
  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1.5 rounded-full border-destructive/30 bg-destructive/10 text-destructive',
        className
      )}
    >
      <span className="size-1.5 rounded-full bg-destructive" aria-hidden />
      Inadimplente
    </Badge>
  )
}
```

- [ ] **Step 2: Verificar typecheck e lint**

Run:
```bash
pnpm typecheck 2>&1 | grep "error TS"
```
Expected: apenas o erro herdado `proposal-workbench.tsx:187`.

Run: `pnpm lint`
Expected: limpo.

- [ ] **Step 3: Commit**

```bash
git add src/components/contratos/contract-overdue-badge.tsx
git commit -m "feat(contratos): pill ContractOverdueBadge (inadimplencia derivada)"
```

---

## Task 4: Renderizar a pill (lista, detalhe, cockpit)

3 sites — todos consomem um tipo com `is_overdue` (`ContractResponse`/`ContractDetailResponse`).

**Files:**
- Modify: `src/components/contratos/contract-row.tsx:22,56-59`
- Modify: `pages/contratos/@id/+Page.tsx:13,132`
- Modify: `src/components/vendas/deal-cockpit.tsx:193-195` (+ import)

- [ ] **Step 1: `contract-row` — pill na coluna de status da lista**

Em `src/components/contratos/contract-row.tsx`, adicionar o import após a linha 22 (`import { ContractStatusBadge } from './contract-status-badge'`):
```ts
import { ContractOverdueBadge } from './contract-overdue-badge'
```
Trocar o bloco de status (linhas 56-59):
```tsx
      {/* Status */}
      <div className="w-32 shrink-0">
        <ContractStatusBadge status={contract.status || 'pending'} />
      </div>
```
por:
```tsx
      {/* Status + inadimplência */}
      <div className="flex w-44 shrink-0 flex-wrap items-center gap-1.5">
        <ContractStatusBadge status={contract.status || 'pending'} />
        <ContractOverdueBadge isOverdue={contract.is_overdue} />
      </div>
```
(Largura `w-32 → w-44` para caber o par sem quebra.)

- [ ] **Step 2: `contratos/@id` — pill no header do detalhe**

Em `pages/contratos/@id/+Page.tsx`, adicionar o import após a linha 13 (`import { ContractStatusBadge } ...`):
```ts
import { ContractOverdueBadge } from '@/components/contratos/contract-overdue-badge'
```
Trocar (linha 132):
```tsx
                {contract.status && <ContractStatusBadge status={contract.status} />}
```
por:
```tsx
                {contract.status && <ContractStatusBadge status={contract.status} />}
                <ContractOverdueBadge isOverdue={contract.is_overdue} />
```

- [ ] **Step 3: `deal-cockpit` — pill no header do cockpit**

Em `src/components/vendas/deal-cockpit.tsx`, adicionar o import após a linha 5 (`import { ContractStatusBadge } from '@/components/vendas/contract-status-badge'`):
```ts
import { ContractOverdueBadge } from '@/components/contratos/contract-overdue-badge'
```
Trocar o bloco (linhas 193-195):
```tsx
              {financialMode && contractDetail?.status && (
                <ContractStatusBadge status={contractDetail.status} />
              )}
```
por:
```tsx
              {financialMode && contractDetail?.status && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <ContractStatusBadge status={contractDetail.status} />
                  <ContractOverdueBadge isOverdue={contractDetail.is_overdue} />
                </div>
              )}
```

- [ ] **Step 4: Verificar typecheck e lint**

Run:
```bash
pnpm typecheck 2>&1 | grep "error TS"
```
Expected: apenas o erro herdado `proposal-workbench.tsx:187`.

Run: `pnpm lint`
Expected: limpo.

- [ ] **Step 5: Conferência manual**

Run: `pnpm dev` (porta 3000).
Expected: pill "Inadimplente" (vermelha, com dot) ao lado do status de contratos inadimplentes em `/contratos` (lista), `/contratos/:id` (detalhe) e no cockpit de `/vendas/:id` (negócio fechado com atraso). Contratos em dia não mostram a pill.

- [ ] **Step 6: Commit**

```bash
git add src/components/contratos/contract-row.tsx pages/contratos/@id/+Page.tsx src/components/vendas/deal-cockpit.tsx
git commit -m "feat(contratos): exibe pill Inadimplente na lista, detalhe e cockpit"
```

---

## Task 5: Filtro "Apenas inadimplentes" na lista de contratos

Adiciona o param `overdue: true` (`?overdue=true`) via um Switch paralelo ao "Apenas contratos pendentes".

**Files:**
- Modify: `pages/contratos/+Page.tsx` (state, queryParams, JSX do filtro, hasActiveFilters, handleClearFilters)

- [ ] **Step 1: State do toggle**

Em `pages/contratos/+Page.tsx`, após `const [onlyPendingContracts, setOnlyPendingContracts] = useState(false)` (linha 44), adicionar:
```ts
  const [onlyOverdueContracts, setOnlyOverdueContracts] = useState(false)
```

- [ ] **Step 2: Incluir `overdue` no tipo e na montagem dos params**

No objeto de tipo de `queryParams` (após a linha do `status?:` — agora sem `in_default`), adicionar a propriedade:
```ts
      overdue?: boolean
```
Depois, no corpo do `useMemo`, após o bloco `if (onlyPendingContracts) { params.status = ['pending'] }`, adicionar:
```ts
    if (onlyOverdueContracts) {
      params.overdue = true
    }
```
E incluir `onlyOverdueContracts` no array de dependências do `useMemo` (junto de `onlyPendingContracts`).

- [ ] **Step 3: Switch "Apenas inadimplentes" no JSX**

Após o bloco do Switch "Apenas contratos pendentes" (o `<div className="flex items-center gap-2 border rounded-lg px-3 py-2"> ... id="only-pending" ...</div>`), adicionar um bloco análogo:
```tsx
          <div className="flex items-center gap-2 border rounded-lg px-3 py-2">
            <Switch
              id="only-overdue"
              checked={onlyOverdueContracts}
              onCheckedChange={(checked) => {
                setOnlyOverdueContracts(checked)
                setPage(1)
              }}
            />
            <Label htmlFor="only-overdue" className="text-sm cursor-pointer">
              Apenas inadimplentes
            </Label>
          </div>
```

- [ ] **Step 4: `hasActiveFilters` e `handleClearFilters`**

No `hasActiveFilters`, adicionar `|| onlyOverdueContracts`:
```ts
  const hasActiveFilters =
    search ||
    statusFilter !== 'all' ||
    indexTypeFilter !== 'all' ||
    periodFilter !== 'all' ||
    onlyPendingContracts ||
    onlyOverdueContracts
```
No `handleClearFilters`, adicionar `setOnlyOverdueContracts(false)` junto de `setOnlyPendingContracts(false)`.

- [ ] **Step 5: Verificar typecheck e lint**

Run:
```bash
pnpm typecheck 2>&1 | grep "error TS"
```
Expected: apenas o erro herdado `proposal-workbench.tsx:187`.

Run: `pnpm lint`
Expected: limpo.

- [ ] **Step 6: Conferência manual**

Run: `pnpm dev` (porta 3000) → `/contratos`.
Expected: ligar "Apenas inadimplentes" retorna só contratos com a pill "Inadimplente" (request com `?overdue=true`); "Limpar filtros" zera o toggle. Combinar com "Apenas pendentes" retorna vazio (esperado: pending nunca é inadimplente).

- [ ] **Step 7: Commit**

```bash
git add pages/contratos/+Page.tsx
git commit -m "feat(contratos): filtro 'Apenas inadimplentes' (?overdue=true) na lista"
```

---

## Self-review (autor)

**Cobertura do spec:**
- Pré-requisito (bump 1.4.0) → Task 1, Step 1. ✓
- Frente A (in_default, 7 arquivos) → Task 1, Steps 3-9. ✓
- Frente B (defaulting→overdue, 4 arquivos) → Task 1, Step 10. ✓
- Frente C (vital Contratos no Pulso) → Task 2. ✓
- Frente D — componente → Task 3; render (3 sites) → Task 4; filtro `?overdue` → Task 5. ✓
- Customer-contracts-tab adiado (sem `is_overdue`) → coberto em A (só remoção de `in_default`), pill não renderizada. ✓

**Consistência de tipos/nomes:**
- `ContractOverdueBadge` recebe `isOverdue` em todos os sites (Task 3 define, Task 4 usa). ✓
- `is_overdue` existe em `ContractResponse` (lista/embutido) e `ContractDetailResponse` (detalhe) — todos os sites de render usam um desses. ✓
- `overdue_contracts` existe em `ProjectFinancialSummary` (Pulso, empreendimentos). ✓
- `overdue` (query param) existe na lista de contratos. ✓

**Placeholders:** nenhum — todo step tem código/comando concreto.

**Escopo:** focado num único PR; sem refator não relacionado.
