# Vendas e Contratos

Referência para o domínio comercial/financeiro do ConstructPro. Baseado na documentação da API backend.

---

## Visão Geral

O sistema separa dois domínios:

| Domínio | Entidade | Responsabilidade |
|---------|----------|-----------------|
| Comercial | `Sale` | Pipeline de vendas, funil, tracking por vendedor |
| Financeiro | `Contract` | Ciclo de vida do contrato, parcelas, pagamentos |

Uma `Sale` cria automaticamente um `Contract` (com suas `Installment`s e `ContractLedgerEntry`).

---

## Sale — Status e Ciclo de Vida

```
offer ──────────────────► reserved ──────────► closed
  │    (pagamento da         │       (contrato
  │       entrada)           │       assinado +
  │                          │       entrada paga)
  └──────────────────────────┴──────► lost
       (manual ou automático)
```

| Status | Descrição | Campos Editáveis |
|--------|-----------|-----------------|
| `offer` | Proposta criada, aguardando sinal | `amount_cents` |
| `reserved` | Sinal pago, unidade bloqueada | — nenhum |
| `closed` | Contrato assinado, negócio finalizado | — nenhum |
| `lost` | Negócio perdido | — nenhum |

**Regra de edição:** a venda só pode ser editada enquanto está em `offer`. Após o primeiro pagamento do sinal, todos os campos ficam imutáveis.

**Campos imutáveis após criação:** `unit_id`, `customer_id`, `user_id`, `unit_price_cents`, `installment_schedules`.

---

## Contract — Status e Ciclo de Vida

```
pending ────────► active ────────► settled
    │               │
    │               ▼
    │          in_default ────► terminated
    │
    └──────────► canceled
```

| Status | Descrição |
|--------|-----------|
| `pending` | Aguardando assinatura e/ou pagamento do sinal |
| `active` | Financiamento em andamento |
| `in_default` | Inadimplente (parcelas vencidas) |
| `settled` | Quitado integralmente |
| `canceled` | Cancelado antes de ativar |
| `terminated` | Rescindido após ativação (distrato) |

---

## Unit — Status

| Status | Condição |
|--------|----------|
| `available` | Sem venda ativa |
| `reserved` | Sale em `reserved` (sinal pago) |
| `sold` | Sale em `closed` (contrato assinado) |
| `unavailable` | Bloqueada manualmente |

---

## Endpoints Principais

| Método | Endpoint | Ação |
|--------|----------|------|
| `POST` | `/api/v1/sales` | Criar proposta (cria Sale + Contract + Installments) |
| `GET` | `/api/v1/sales/{sale_id}` | Buscar proposta por ID |
| `PATCH` | `/api/v1/sales/{sale_id}` | Editar `amount_cents` (somente `status = offer`) |
| `POST` | `/api/v1/payments` | Registrar pagamento manual |
| `POST` | `/api/v1/sales/{contract_id}/contract/sign` | Assinar contrato |

> **Atenção frontend:** `PATCH /api/v1/sales/{sale_id}` ainda não está no schema OpenAPI do `@cacenot/construct-pro-api-client`. Use `(client as any).PATCH(...)` até o pacote ser atualizado.

---

## Criação de Venda — Payload

```ts
POST /api/v1/sales
{
  unit_id: number,
  customer_id: number,
  index_type_code: string,      // ex: "CUB_SC", "IGPM"
  installment_schedules: [
    {
      kind: 'entry',
      quantity: 1,
      amount_cents: 5000000,    // R$ 50.000,00
      specific_date: '2025-02-01',
      payment_method: 'pix',
    },
    {
      kind: 'monthly',
      quantity: 120,
      amount_cents: 200000,     // R$ 2.000,00
      recurrence_type: 'monthly',
      recurrence_day: 10,
      start_date: '2025-03-01',
      payment_method: 'boleto',
    },
  ]
}
```

Regras do cronograma:
- Exatamente **1 schedule do tipo `entry`** é obrigatório
- `entry` deve ter `quantity = 1` e `specific_date`
- `monthly`/`yearly` exigem `recurrence_day` e `start_date`
- `yearly` exige também `recurrence_month`
- `amount_cents` da Sale é **derivado** da soma dos schedules (não enviado pelo cliente)

---

## Tipos de Parcela (`kind`)

| Tipo | Descrição |
|------|-----------|
| `entry` | Sinal/Entrada — pagamento inicial para reservar a unidade |
| `monthly` | Parcelas mensais do financiamento |
| `yearly` | Reforços anuais (balões) |
| `extra` | Parcelas extras para renegociações |

---

## Assinatura do Contrato

`POST /api/v1/sales/{contract_id}/contract/sign`

Resultado depende do estado do pagamento da entrada:

| Estado da entrada | Sale | Contract | Unit |
|-------------------|------|----------|------|
| `paid` | `closed` | `active` | `sold` |
| não paga | `reserved` | `pending` | `reserved` |

---

## Hooks Disponíveis (API Client)

```ts
import { useSales, useSale, useApiClient } from '@cacenot/construct-pro-api-client'

// Lista paginada com filtros
const { data } = useSales({ page: 1, page_size: 10, status: ['offer'] })

// Uma proposta por ID (query key: ['sales', 'detail', id])
const { data: sale } = useSale(saleId)

// Chamadas raw para endpoints sem hook dedicado
const { client } = useApiClient()
```

Query keys para invalidação:
- `['sales']` — invalida listas e detalhes
- `['sales', 'detail', id]` — invalida apenas o detalhe de uma venda

---

## Automação de Venda Perdida

Configurável por tenant via `TenantConfig`:

| Regra | Comportamento |
|-------|---------------|
| `disabled` | Vendas só perdem manualmente |
| `days_in_offer` | Marca como `lost` após N dias em `offer` sem sinal (`sale_lost_days_threshold`) |

---

## Cancelamento vs Rescisão

| | Cancelamento | Rescisão (Distrato) |
|-|--------------|---------------------|
| Quando | Antes do contrato ativar | Após contrato ativo |
| Contract | `pending → canceled` | `active → terminated` |
| Sale | `→ lost` | `→ lost` |
| Unit | `→ available` | `→ available` |
| Documentação | Simples | Requer `ContractTermination` |
