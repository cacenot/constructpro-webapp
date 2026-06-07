# Backend issues — Financeiro v2 (construct-pro-api)

Quatro agregações para alimentar a Tesouraria da carteira (`/financeiro` v2 no webapp).

> **Abertas no GitHub (cacenot/construct-pro-api):** #1 → [#122](https://github.com/cacenot/construct-pro-api/issues/122) ·
> #2 → [#123](https://github.com/cacenot/construct-pro-api/issues/123) ·
> #3 → [#124](https://github.com/cacenot/construct-pro-api/issues/124) ·
> #4 → [#125](https://github.com/cacenot/construct-pro-api/issues/125)
Todas no padrão **CQRS read** do projeto: Query Object em `app/queries/`, DI em
`app/core/dependencies/queries.py`, endpoint fino em
`app/presentation/api/v1/endpoints/installments.py`, escopo `sales:read` (`SaleReadScope`).
Multi-tenant é **DB-por-tenant**: sem filtro de escopo, a query já agrega a carteira inteira;
com `project_id`/`customer_id`, recorta.

Contrato monetário: `Money` (`app/domain/models/types/money.py`) — armazenado em **cents**,
serializa como `{cents, decimal, brl}` (WireMoney); input é decimal em reais. Taxas: `Rate`.

Toda a infraestrutura já existe (helpers `count_for`/`sum_for` em
`app/core/pagination/clauses.py`; `date_trunc` e GROUP BY usados em `queries/contracts.py`,
`queries/projects.py`, `queries/commissions.py`). Nenhum item é "complexo".

---

## Issue #1 — Aging de inadimplência no summary de installments

**Esforço:** Trivial. **Não é endpoint novo** — enriquece o `InstallmentListSummary` que a tela
já consome em `GET /installments/summary`.

**Por quê:** a v2 precisa ler a inadimplência por idade (a vencer / 1-30 / 31-60 / 61-90 / 90+),
o gargalo da carteira. Respeitar os filtros já aplicados (clicar num empreendimento → aging dele).

**Onde:** `app/queries/installments.py` → `ListInstallmentsSummaryQuery._compute_summary`
(~L547-656). É uma query single-pass; adicionar **colunas**, não GROUP BY. Reusa
`remaining_expr` e o `overdue_condition` já existentes, mais `sum_for(cond, remaining_expr)` /
`count_for(cond)` de `app/core/pagination/clauses.py`. Schema:
`app/domain/models/tenants/installment/schemas.py` → `InstallmentListSummary` (~L193).

**Faixas** (sobre parcelas com `remaining > 0` e `status != canceled`; `days = today - due_date`):
- `not_due` (due_date >= today), `d1_30` (1-30), `d31_60` (31-60), `d61_90` (61-90), `d90_plus` (>90).

**Response (campos novos em `InstallmentListSummary`):**
```jsonc
"aging": {
  "not_due":  { "count": 12, "amount": { "cents": 4500000, "decimal": "45000.00", "brl": "R$ 45.000,00" } },
  "d1_30":    { "count": 3,  "amount": { ... } },
  "d31_60":   { "count": 1,  "amount": { ... } },
  "d61_90":   { "count": 0,  "amount": { ... } },
  "d90_plus": { "count": 2,  "amount": { ... } }
}
```

**Aceite:** soma dos `amount` das 4 faixas vencidas == `total_overdue_amount`; `not_due.amount`
== a-receber não vencido; respeita todos os filtros do summary; uma só query (sem N+1).

---

## Issue #2 — Fluxo de caixa mensal da carteira

**Esforço:** Médio. **Endpoint novo:** `GET /installments/cashflow`.

**Por quê:** o bloco de timeline do Resumo (recebido realizado vs a-receber projetado vs
correção, por mês). Hoje só existe por contrato.

**Onde:** clonar `app/queries/contracts.py` → `_load_monthly_balance_timeline` (~L368-419),
que já faz `date_trunc('month', occurred_at)` + buckets por kind via `SUM(CASE...)`. Remover o
filtro `contract_id` (carteira toda) e aceitar `project_id` opcional (join Contract→Sale→Unit).
Para o **a-receber projetado**, segunda query: `SUM(remaining)` agrupado por
`date_trunc('month', due_date)` sobre parcelas não pagas (template `paid_subquery` LEFT JOIN do
summary). Novo Query Object `app/queries/financial_cashflow.py` (ou método em installments).

**Query params:** `from` (YYYY-MM), `to` (YYYY-MM), `project_id?`, `customer_id?`.

**Response:**
```jsonc
{
  "months": [
    { "month": "2026-01",
      "received":  { "cents": 1200000, "decimal": "12000.00", "brl": "..." },  // realizado (ledger payment)
      "correction":{ "cents":   80000, ... },                                  // ledger correction
      "due_projected": { "cents": 2000000, ... }                              // remaining das parcelas que vencem no mês
    }
  ]
}
```

**Aceite:** `received` por mês == soma dos ledger `kind=payment` (abs) daquele mês; `due_projected`
== remaining das parcelas não pagas com due_date no mês; respeita `project_id`; meses sem
movimento retornam zeros (série contínua entre `from` e `to`).

---

## Issue #3 — Breakdown da carteira por empreendimento

**Esforço:** Médio. **Endpoint novo:** `GET /installments/by-project`.

**Por quê:** o bloco "Carteira por empreendimento" (onde está o dinheiro e o risco). Cada
empreendimento com a-receber, em atraso, % recebido, nº de contratos inadimplentes.

**Onde:** mesma agregação do summary, com `GROUP BY Unit.project_id, Project.name` — tornar o
join Contract→Sale→Unit→Project **incondicional**. Precedentes idênticos:
`app/queries/commissions.py` `_by_broker`/`_by_agency` (~L259-316) e
`app/queries/projects.py` `_load_financial_summary` (~L500). Reusa `count_for`/`sum_for`.

**Query params:** mesmos filtros do summary (status, due_date, paid_at...) menos `project_id`.

**Response:**
```jsonc
{
  "items": [
    { "project": { "id": 3, "name": "Residencial Aurora" },
      "total_remaining_amount": { "cents": 5700000, ... },
      "total_overdue_amount":   { "cents":  300000, ... },
      "total_paid_amount":      { "cents": 1500000, ... },
      "payment_progress_percentage": "20.83",
      "overdue_count": 2,
      "defaulting_contracts": 1 }
  ]
}
```

**Aceite:** soma dos `total_remaining_amount` por projeto == `total_remaining_amount` do summary
global (mesmos filtros); ordenável por a-receber/atraso desc; uma query (sem N+1 por projeto).

---

## Issue #4 (opcional) — KPI financeiro da carteira (nível ledger)

**Esforço:** Médio. **Endpoint novo:** `GET /installments/financial-summary` (ou
`/contracts/financial-summary`).

**Por quê:** enriquecer o Pulso com KPIs do **ledger do contrato** (saldo devedor real,
correção acumulada, contratos inadimplentes), que o summary de parcelas não dá. O
`InstallmentListSummary` cobre o essencial da Fase 1; este é o "nice to have" da Fase 4.

**Onde:** reusar `app/queries/projects.py` `_load_financial_summary` (~L500-584) e o schema
`ProjectFinancialSummary` (`app/domain/models/tenants/project/schemas.py:331`) **sem o filtro de
projeto** (carteira toda) — opcionalmente com `project_id`.

**Response:** shape de `ProjectFinancialSummary` — `total_contracts, active_contracts,
settled_contracts, defaulting_contracts, total_principal, total_paid, total_outstanding,
total_correction` (Money) + `payment_progress_percentage` (Rate).

**Aceite:** `total_outstanding` == soma dos saldos (`get_outstanding_balance`) de todos os
contratos `active`/`in_default`; números batem com a soma dos contract details.

---

## Notas transversais

- **Reaproveitar `_common_where`** de `queries/installments.py` (~L415) em #1 e #3 para herdar
  exatamente os mesmos filtros da tela (customer_id/project_id/paid_at/due_date) — single source.
- **Naming:** mantive sob `/installments/*` por coerência (mesmo recurso/escopo). Se preferirem
  um grupo `/financeiro/*` ou `/financial/*`, tanto faz para o front (ajusto o client).
- **Wire:** todos os valores como `WireMoney`; taxas como `WireRate` (string %). Sem cents crus
  no front (ver memória wire-money-rate-contract).
