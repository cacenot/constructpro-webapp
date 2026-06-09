# Design — Absorver contrato *derived-overdue* (API v1.5.0) no Financeiro v2

- **Data:** 2026-06-09
- **Branch:** `feat/financeiro-v2` (PR #38)
- **Backend de origem:** `construct-pro-api` v1.5.0 — issue `#140` / PR `#142`
- **api-client:** `1.3.0 → 1.4.0`

## Contexto e problema

O backend v1.5.0 deixou de modelar inadimplência de contrato como um **status** (`ContractStatus.in_default`, que era morto — nenhum code path o escrevia) e passou a tratá-la como uma **condição derivada das parcelas**: um contrato é "overdue" quando está *assinado, não-terminal e tem ≥1 parcela vencida com saldo*. A regra é single-sourced no backbone de installments, então toda leitura de recebíveis reconcilia por construção.

Mudanças no contrato da API absorvidas nesta entrega:

- `defaulting_contracts` → **`overdue_contracts`** (em `financial-summary` e `by-project`), agora derivado e reconciliando.
- Novo **`is_overdue`** (bool, derivado) em `ContractResponse` (lista) e `ContractDetailResponse` (detalhe).
- Novo filtro de lista **`?overdue=true`**.
- `ContractStatus` **perde `in_default`** — status passa a ser puramente ciclo de vida (`pending → active → settled`, + `canceled`/`terminated`).

**Consequência-chave de UX/modelo:** status (ciclo de vida) e inadimplência (`is_overdue`) viraram **ortogonais**. Um contrato inadimplente continua com status `active`. Antes, `in_default` pintava um badge vermelho único; esse sinal precisa ser reintroduzido como dimensão separada, senão "some" da interface.

## Estado verificado (1.4.0 no working tree)

`tsc` contra o client 1.4.0 acusa **16 erros** no branch:

- **15 da migração** (alvo desta entrega):
  - **7 de `in_default`** (status removido do enum).
  - **8 de `defaulting_contracts`** (campo renomeado).
- **1 pré-existente, não relacionado:** `proposal-workbench.tsx:187` (`stepFields` possivelmente undefined). Já corrigido no `main` pelo commit `8b0604a`, ausente neste branch. **Fora de escopo** — não será tocado; o sync com `main` resolve depois. O typecheck do branch fechará com **esse 1 erro herdado**, não zero.

Confirmações factuais que sustentam o design:
- `is_overdue?: boolean` presente em `ContractResponse` (item de lista) e `ContractDetailResponse` (detalhe).
- `?overdue` aceito como query param da lista de contratos.
- `installments-vitals-strip.tsx` já contém o código do 5º vital "Contratos"; ele só não renderiza porque a página passa apenas `summary` (não `financialSummary`).

## Decisões

1. **Escopo:** A + B + C + D no mesmo PR (#38).
2. **Surfacing da inadimplência (UX):** pill aditivo ao lado do badge de status, em todo lugar que mostra status de contrato (lista, detalhe, aba do cliente, cockpit). Status fica neutro/ciclo de vida.
3. **Termo de usuário:** **"Inadimplente"** quando o sujeito é **contrato** (pill, Pulso, empreendimentos); **"Em atraso"** quando é **parcela**. Isso mantém os rótulos atuais de B e C — só o *campo* muda.
4. **Branch:** trabalhar no `feat/financeiro-v2` como está; sincronizar com `main` (26 commits à frente: Cloudflare, auth-v2, /release-bump, v0.2.0) é tarefa separada na atualização do PR.

## Frentes de trabalho

### Pré-requisito — bump do api-client
`package.json`: `@cacenot/construct-pro-api-client` `1.3.0 → 1.4.0` (+ lockfile). Já aplicado no working tree; falta commitar.

### A — Migração `in_default` (7 arquivos)

| Arquivo | Mudança |
|---|---|
| `src/components/contratos/contract-status-badge.tsx:10` | Remover chave `in_default` do `statusStyles` (`Record<ContractStatusType, …>`). |
| `src/components/vendas/contract-status-badge.tsx:12` | Idem, remover chave `in_default`. |
| `src/components/clientes/detail/customer-contracts-tab.tsx:27` | Remover chave `in_default` do map de status. |
| `pages/contratos/+Page.tsx:64` | Remover `'in_default'` da union local do filtro `status`. |
| `pages/contratos/@id/+Page.tsx:98` | `contract.status === 'in_default'` → `contract.is_overdue` (saldo devedor em vermelho quando inadimplente). |
| `src/components/vendas/deal-cockpit.tsx:60` | `isActiveContract = contractStatus === 'active'` (inadimplente já é `active`). |
| `src/components/vendas/deal-actions.tsx:57` | `inDefault` → derivar de `contractDetail?.is_overdue` (mantém "Renegociar" como ação primária no atraso). |

### B — Rename `defaulting_contracts → overdue_contracts` (4 arquivos, 8 sites)

Troca **apenas o campo**; rótulos "inadimplente(s)" permanecem (decisão de termo). Inclui o `DefaultAlert` em `project-financial-tab`.

- `src/components/empreendimentos/financial-overview-section.tsx:37,43`
- `src/components/empreendimentos/project-financial-tab.tsx:74,76,114,147`
- `src/components/empreendimentos/project-vitals-strip.tsx:51`
- `src/components/financeiro/installments-vitals-strip.tsx:70`

### C — Religar vital "Contratos" no Pulso

1. Buscar `GET /installments/financial-summary` com os **filtros ativos** (mesmo `queryParams` da tabela), para o vital reconciliar com a carteira filtrada. Implementação: estender `useInstallmentsTable` para também expor `financialSummary` (nova query keyed nos params), ou hook dedicado `useFinancialSummary(params)` chamado na página. Preferência: estender o hook da tabela, mantendo a reconciliação automática.
2. `pages/financeiro/+Page.tsx:115`: passar `financialSummary={financialSummary}` ao `<InstallmentsVitalsStrip>` → renderiza o 5º vital (value = `active_contracts`; sub = "X inadimplentes" via `overdue_contracts`). Atualizar o comentário das L111-114 (a pendência foi resolvida).
3. Verificar na implementação que `/installments/financial-summary` aceita os mesmos filtros de installments (esperado — é a query reusada com/sem `project_id`).

### D — Inadimplência em nível de contrato

1. **Novo componente** `src/components/contratos/contract-overdue-badge.tsx`: pill destrutivo com dot, texto **"Inadimplente"**, renderiza `null` quando `!is_overdue`. Recebe `isOverdue: boolean` (ou o contrato) — não acopla a um response específico.
2. **Render** ao lado do status em:
   - `src/components/contratos/contract-row.tsx` (coluna de status da lista).
   - `pages/contratos/@id/+Page.tsx` (header do detalhe).
   - `src/components/clientes/detail/customer-contracts-tab.tsx` (linha de contrato do cliente).
   - `src/components/vendas/deal-cockpit.tsx` (header do cockpit).
3. **Filtro na lista** `pages/contratos/+Page.tsx`: Switch **"Apenas inadimplentes"** → adiciona `overdue: true` aos `queryParams`. Paralelo ao "Apenas contratos pendentes" (mutuamente exclusivos na prática — `pending` nunca é overdue). Incluir em `hasActiveFilters` e `handleClearFilters`; resetar `page` ao alternar.

## Error handling

Sem novas mutations. A nova query de `financial-summary` (frente C) segue o padrão das demais leituras do financeiro (TanStack Query, `throwApiError`/`handleApiError` quando aplicável). O filtro `?overdue` é só parametrização de query — sem tratamento especial.

## Validação

- `pnpm typecheck`: nenhum dos 15 erros da migração; resta **apenas** o erro herdado `proposal-workbench.tsx:187` (documentado).
- `pnpm lint` (Biome) limpo.
- Conferência manual em `localhost:3000` (porta 3000 obrigatória — CORS), no padrão das fases anteriores do PR:
  - Pulso com 5º vital "Contratos" reconciliando (`active_contracts` + "N inadimplentes") sob filtros.
  - Pill "Inadimplente" na lista de contratos, no detalhe, na aba do cliente e no cockpit.
  - Filtro "Apenas inadimplentes" (`?overdue=true`) retornando só inadimplentes; limpar filtros zera.
  - Empreendimentos: contagem/alerta de inadimplência batendo com a carteira.

## Fora de escopo

- Erro pré-existente `proposal-workbench.tsx:187`.
- Sincronização do branch com `main` (rebase/merge dos 26 commits).
- Lifecycle `terminated`/`canceled` (rastreado no backend em `#141`).

## Riscos / pontos a confirmar na implementação

- `/installments/financial-summary` aceitar os filtros ativos (esperado; validar com captura de rede).
- Contrato embutido em `SaleResponse` (`sale.contract`) expor `is_overdue` para o fallback em `deal-actions`/`deal-cockpit`; caso não exponha, usar `contractDetail?.is_overdue` como fonte primária (já é o caminho preferido).
- Largura da coluna de status em `contract-row` (`w-32`) pode precisar de ajuste para acomodar o par status + pill sem quebra.
