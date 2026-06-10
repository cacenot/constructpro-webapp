# Dashboard da Home — Design

**Data:** 2026-06-10 · **Status:** aprovado (brainstorming concluído)
**Preview visual:** `2026-06-10-dashboard-home-preview.html` (abrir no navegador, mock estático)
**Issue do backend:** [construct-pro-api#157](https://github.com/cacenot/construct-pro-api/issues/157)

## Contexto e objetivo

A rota `/` redireciona para `/dashboard`, que hoje é 100% mock (nenhuma chamada de API). Este
design substitui o mock por um dashboard real, **financeiro-primeiro**, no modelo "cockpit
condensado": cada seção é um resumo compacto e clicável que leva à página dedicada. O dashboard
responde "como está minha carteira?" em ~5 segundos; profundidade fica nas páginas de domínio.

Benchmarks considerados: dashboard de Contas a Receber do Sienge (cards no prazo/vencido +
fórmula de inadimplência), CV CRM (funil/VSO). Dois vazios de mercado guiam o roadmap: aging em
buckets 30/60/90 (já temos backend+front prontos) e cobrança de boletos como cidadã de primeira
classe via Plug Boleto (adiado para v2, ver "Fora de escopo").

## Decisões registradas

| Decisão | Escolha | Racional |
|---|---|---|
| Seções | 3 — Financeiro (hero), Vendas, Operacional | Cobre o produto inteiro com hierarquia financeiro-primeiro |
| Boletos (Plug Boleto) | **v2** | Widget-assinatura do diferencial, mas exige `/boletos/summary` novo; v1 foca no que existe |
| Endpoints | Por seção (CQRS), não monolito `/dashboard` | Padrão do repo, cache por TTL próprio, degradação graciosa |
| Período | Foto de hoje, sem seletor | Menos estado; recortes fixos "este mês"; seletor fica para v2 (param `month` já previsto no `/sales/summary`) |
| Composição | Cockpit condensado (abordagem B) | Dashboard com identidade própria; não duplica `/financeiro` |
| Aba Resumo do `/financeiro` | **Removida** | O dashboard assume a visão executiva; `/financeiro` vira pura operação |

## Layout

```
Saudação + data ("Bom dia, Fernando · terça, 10 de junho")
─────────────────────────────────────────────────────────
HERO — VitalsStrip (5 células, hairlines)
─────────────────────────────────────────────────────────
FINANCEIRO (→ /financeiro)                  [grid 2 col lg]
  Aging compacto + maiores atrasos │ Recebimento 6m
─────────────────────────────────────────────────────────
VENDAS (→ /vendas)        │ OPERACIONAL (→ /empreendimentos)
  Funil + VGV + recentes  │ Estoque + progresso por empreend.
```

Mobile: tudo empilha (1 coluna); hero vira grid 2×3.

## Hero — VitalsStrip (5 células)

Reusa o padrão `VitalsStrip` (`src/components/empreendimentos/vitals-strip.tsx`) — grid com
hairlines `gap-px`, tons semânticos, `AnimatedNumber` nos valores.

| Célula | Valor | Sub | Tom | Fonte |
|---|---|---|---|---|
| Carteira a receber | `total_outstanding` | "{N} contratos · corrigida" | default | `/installments/financial-summary` |
| Inadimplência | `total_overdue / total_remaining` em % | valor absoluto vencido | destructive se > 0 | `/installments/summary` |
| Recebido no mês | `months[atual].received` | "▲/▼ {x}% vs {mês anterior}" | success | `/installments/cashflow` |
| A receber no mês | `months[atual].due_projected` | "{N} parcelas vencem em {mês}"¹ | default | `/installments/cashflow` |
| Contratos ativos | `active_contracts` | "{N} inadimplentes" | sub destructive se > 0 | `/installments/financial-summary` |

Fórmula de inadimplência (padrão Sienge): `vencido / (vencido + a vencer)` =
`total_overdue_amount / total_remaining_amount` do bloco `summary`.

¹ Count de parcelas do mês exige uma chamada leve adicional:
`/installments/summary?due_date[min/max]={mês}&page_size=1` (counts vêm no bloco `summary`).
Se julgado caro na implementação, degradar o sub para "vencem em {mês}" sem count.

## Seção Financeiro

### Card "Parcelas vencidas" (aging compacto + maiores atrasos)

- 4 buckets (1–30 / 31–60 / 61–90 / 90+) com a escala de severidade coral existente
  (`destructive/55 → /75 → /90 → full`), glow dot, barra proporcional, count + valor.
- Linhas clicáveis com **deep-link**: `/financeiro?overdue=true&dueMin=…&dueMax=…` — a tradução
  bucket→intervalo de `due_date` já existe (`agingDueRange` em `use-installments-table.ts`);
  **extrair para `src/lib/installment-aging.ts`** para reuso pelo dashboard.
- Divider + "Maiores atrasos": 3 parcelas vencidas de maior valor — cliente, dias de atraso,
  valor. Fonte: `/installments/summary?overdue=true&sort_by=current_amount:desc&page_size=3`.
  Linha clicável → `/financeiro?parcela={id}` (param de seleção já existe).
  Nota: é "maiores parcelas em atraso" (grão parcela); top devedores agrupado por cliente é v2.
- Dados do aging vêm do mesmo `summary` do hero (1 chamada compartilhada).

### Card "Recebimento 6m"

- Barras: 3 meses passados + atual + 2 futuros. Recebido (emerald, sólido) vs projetado
  (outline tracejado). Mês atual com label em lime. `ChartContainer`/Recharts + tooltip.
- Fonte: `/installments/cashflow?from={hoje-3m}&to={hoje+2m}` (mesma chamada alimenta as células
  do hero "Recebido/A receber no mês" — 1 fetch, 3 widgets).
- Clique em mês → deep-link `/financeiro` com due-range do mês (mesmo mecanismo do aging).

## Seção Vendas

Requer `GET /sales/summary` (novo — contrato completo na issue #157).

- **Funil compacto** (4 células hairline): Propostas, Ag. assinatura, Ag. pagamento — counts do
  `pipeline` — e "Fechadas no mês" (count, tom success) do bloco `month`.
- **Par de KPIs**: "VGV em negociação" (`pipeline.total_open_amount`) e "VGV fechado no mês"
  (`month.closed_amount`, tom success).
- **Recentes** (3): cliente, unidade · empreendimento, valor, badge de status (tokens pipeline
  existentes). Fonte: `GET /sales?sort_by=created_at:desc&page_size=3` (existe).
  Linha → `/vendas/{id}`.

## Seção Operacional

Requer `GET /units/summary` (novo — contrato completo na issue #157).

- **Estoque** (3 células hairline): Disponíveis / Reservadas / Vendidas com dots na paleta
  "semáforo imobiliário" (emerald / amber / coral) + glow.
- **Sub-linha**: "Estoque a vender: R$ {totals.available.vgv} em VGV".
- **Empreendimentos** (top 4 por `sold_percentage`): nome + barra de progresso de vendas +
  fração vendidas/total + %. Linha → `/empreendimentos/{id}`.

## Remoção da aba Resumo do `/financeiro`

O dashboard assume a visão executiva; `/financeiro` vira **pura operação** (filtros + tabela de
parcelas + master-detail + ações de pagar/boleto).

**Remove-se:**
- O componente `Tabs` inteiro de `pages/financeiro/+Page.tsx` (a página deixa de ter abas; o
  conteúdo da antiga aba Parcelas vira o corpo da página).
- O param de URL `tab` dos parsers nuqs (`use-installments-table.ts`); demais params (filtros,
  `parcela`) permanecem — são eles que recebem os deep-links do dashboard.
- Componentes que ficam órfãos (deletar): `installments-aging-block.tsx`,
  `installments-cashflow-block.tsx`, `installments-by-project-block.tsx` — o dashboard usa
  variantes compactas próprias, não estes blocos full.
- Handlers de cross-filter que só serviam ao Resumo (`applyAgingBucket`, `applyMonthFilter`,
  `applyProjectFilter`) — a lógica de tradução bucket→due-range migra para
  `src/lib/installment-aging.ts` (usada pelo dashboard para montar URLs).

**Permanece:**
- `CarteiraCompositionBar` acima da tabela — é filtro-scoped ("pulso" do recorte filtrado),
  parte da operação, não do resumo executivo.

**Perda aceita:** a visão "carteira por empreendimento" (`InstallmentsByProjectBlock`) deixa de
existir como bloco transversal; o equivalente vive em `/empreendimentos/{id}` (aba Financeiro,
`CarteiraStrip`) e o dashboard traz o recorte operacional por empreendimento (progresso de
vendas).

## API — mapa completo

| Widget | Endpoint | Status |
|---|---|---|
| Hero: carteira, contratos | `GET /installments/financial-summary` | existe |
| Hero: inadimplência · Aging · Maiores atrasos | `GET /installments/summary` (com variações de params) | existe |
| Hero: recebido/a receber mês · Recebimento 6m | `GET /installments/cashflow` | existe (verificar roteamento — issue #157) |
| Vendas: funil + VGV | `GET /sales/summary` | **novo** — issue #157 |
| Vendas: recentes | `GET /sales?sort_by=created_at:desc&page_size=3` | existe |
| Operacional: estoque + por empreendimento | `GET /units/summary` | **novo** — issue #157 |

Valores monetários seguem WireMoney (`{cents, decimal, brl}`); exibição via `formatCurrency()` +
`tabular-nums`.

## Arquitetura do front

```
pages/dashboard/+Page.tsx            — orquestrador fino (substitui o mock atual)
src/components/dashboard/
  section-header.tsx                 — label uppercase + link "Ver X →" (lime)
  dashboard-vitals.tsx               — hero (reusa VitalsStrip)
  aging-card.tsx                     — aging compacto + maiores atrasos
  cashflow-card.tsx                  — recebido vs projetado 6m
  sales-card.tsx                     — funil + VGV + recentes
  inventory-card.tsx                 — estoque semáforo + progresso por empreendimento
src/hooks/use-dashboard.ts           — hooks de query por seção
src/lib/installment-aging.ts         — agingDueRange extraído (compartilhado com /financeiro)
```

- **Queries em paralelo** (TanStack Query): `financial-summary`, `installments/summary`
  (page_size=1), `installments/summary?overdue` (top 3), `cashflow`, `sales/summary` + `sales`
  recentes, `units/summary`. Reusar key factories existentes (`installmentKeys.*`) onde houver;
  novas keys estáveis para sales/units. `staleTime` padrão do projeto (5min).
- **Navegação**: `<a href>` simples (Vike client router intercepta) em todas as linhas/headers.
- **Sem estado local de filtro** — dashboard é foto de hoje, zero params próprios na URL.

## Estados

- **Loading**: skeleton por card (nunca página inteira); hero com células skeleton.
- **Erro**: degradação por seção — card de erro inline com botão "Tentar novamente" (refetch);
  uma seção falhar não derruba as outras. Usar `extractApiErrorMessage` (api-error.ts).
- **Vazio** (tenant novo): cada seção mostra estado vazio com CTA — "Cadastre seu primeiro
  empreendimento" (→ /empreendimentos), "Registre uma venda" (→ /vendas). Hero mostra zeros
  (R$ 0,00), não skeleton infinito.

## Testes

- **Unit (Vitest)**: cálculo de inadimplência %, montagem do range de meses do cashflow,
  `agingDueRange` (lib extraída), mapeamento de funil.
- **E2E (Playwright, API mockada)**: smoke do dashboard — 3 seções renderizam com factories
  WireMoney; estado vazio; erro de uma seção não derruba as outras; deep-link de aging chega em
  `/financeiro` com filtros aplicados.
- **Regressão de `/financeiro`**: e2e existente da operação continua passando sem a aba Resumo.

## Sequenciamento

1. **Backend** (issue construct-pro-api#157): `/sales/summary` + `/units/summary` + verificações
   (cashflow/by-project roteados; `sort_by=current_amount` na whitelist; semântica de
   `due_projected`). Executado no repo da API.
2. **api-client**: regenerar e publicar `@cacenot/construct-pro-api-client`.
3. **Front A** (não depende de 1–2): hero + seção Financeiro + remoção da aba Resumo do
   `/financeiro` — só endpoints existentes.
4. **Front B** (depende de 2): seções Vendas + Operacional.

## Fora de escopo (v2 — registrado)

- **Funil de cobrança Plug Boleto** (`/boletos/summary`): emitidos → registrados → liquidados /
  vencidos / rejeitados, taxa de liquidação, boletos rejeitados pelo banco. Widget-assinatura do
  diferencial "use seu próprio banco" — nenhum concorrente tem.
- Top devedores agrupado por cliente (exige agregação nova).
- Seletor de período global (param `month` do `/sales/summary` já prepara).
- Distratos como widget; previsão IA de inadimplência (paridade Sienge "Análise Inteligente").
