# Epic 6: Relatório de Comissões [CONDICIONAL — bloqueado API #95]

## Objetivo do Épico

Implementar tela de listagem/relatório de comissões por corretor, imobiliária e período, com cards de
totais e exportação.

> ⚠️ **BLOQUEADO:** Este épico não pode ser iniciado enquanto a API não entregar endpoint de
> listagem/agregação de comissões.
> **Follow-up:** [construct-pro-api#95](https://github.com/cacenot/construct-pro-api/issues/95)
>
> Hoje `Commission` existe apenas como snapshot por venda, exposto via `SaleResponse.commission`
> em `GET /api/v1/sales/{id}`. Não há endpoint de listagem ou agregação.

---

## Contexto do Sistema Existente

- **Funcionalidade atual:** Comissão disponível apenas no detalhe da venda (`SaleResponse.commission`),
  implementada no Epic 3. Não existe listagem de comissões.
- **Technology stack:** React 19 + TypeScript 5.9 + Vite 7 + TanStack Query v5 + TanStack Table +
  shadcn/ui + `@cacenot/construct-pro-api-client@1.0.0`
- **Integration points:**
  - Padrão canônico: Table Pattern (CLAUDE.md), módulo `clientes`
  - `CommissionResponse` disponível no client: `sale_id`, `broker_id?`, `agency_id?`, `broker_rate?`,
    `agency_rate?`, `broker_amount?`, `agency_amount?`, `total_amount`, `sale_amount_at_approval`,
    `created_at`, + `broker`/`agency` aninhados
  - Novo endpoint esperado: `GET /api/v1/commissions` (paginado + filtros)

---

## Detalhes do Incremento (planejado)

**O que será adicionado quando a API #95 for entregue:**

1. **Tela de listagem de comissões:** filtros por corretor, imobiliária, período (data de criação).
   Paginação server-side. Cards de totais (total broker, total agency, total geral).
2. **Navegação:** item "Comissões" no menu "Financeiro" (ou "Comercial") em `top-navbar.tsx`.

**Estrutura esperada do endpoint (a confirmar quando #95 for entregue):**
```
GET /api/v1/commissions?broker_id=…&agency_id=…&from=…&to=…&page=…&page_size=…
```

---

## Referência de Domínio

`DIRECIONAMENTO-FRONTEND.md` §6

---

## Stories (a detalhar após desbloqueio da API)

### Story 6.1 — Listagem de Comissões [bloqueado]

**Descrição:** Criar tela de listagem de comissões seguindo o padrão Table Pattern com filtros de
corretor, imobiliária e período, paginação server-side e cards de totais no topo.

**Status:** ⚠️ Bloqueado — aguarda API #95.

**Escopo previsto:**
- `pages/comissoes/+Page.tsx`
- `src/components/comissoes/commission-columns.tsx`
- `src/components/comissoes/commission-table.tsx`
- `src/components/comissoes/commission-filters.tsx`
- `src/components/comissoes/commission-pagination.tsx`
- `src/hooks/use-commissions-table.ts`
- Adicionar "Comissões" ao menu em `src/components/top-navbar.tsx`

**AC principais (provisório):**
- Listagem paginada com filtros por corretor, imobiliária e período
- Cards de totais: total corretor, total imobiliária, total geral
- Tabela com colunas: data, venda, corretor, imobiliária, valor venda, taxa corretor, taxa imob.,
  valor comissão total
- Responsivo: colunas secundárias ocultas em mobile

**Ação:** Criar story detalhada via `@sm` quando API #95 for entregue e endpoint confirmado.

---

## Pré-protótipo (opcional, antes da API)

É possível prototipar a UI antes do endpoint sair, mas não alimentar com dados reais.
Se desejado, criar branch de prototipagem com dados mockados para validação de UX antes do dev.

---

## Definition of Done (quando desbloqueado)

- [ ] Story 6.1 concluída e QA gate PASS/CONCERNS documentado
- [ ] `npm run build` limpo
- [ ] `npm run lint` sem warnings
- [ ] Comissões acessíveis pelo menu de navegação
- [ ] Filtros funcionando server-side

---

## Metadata

```yaml
epic_id: epic-6
status: Blocked
created_by: "@po (Pax)"
created_at: "2026-05-31"
domain_reference: DIRECIONAMENTO-FRONTEND.md (§6)
stories_count: 1 (a detalhar)
risk_level: LOW (quando desbloqueado — padrão Table Pattern)
priority: "Baixa — bloqueado por API #95"
next_agent: "@sm"
next_command: "*draft epic-6-relatorio-comissoes.md  # apenas após API #95 ser entregue"
blocked_by:
  - "construct-pro-api#95 — endpoint de listagem/agregação de comissões"
dependencies:
  - "Epic 3: Comissão na proposta ✅ (CommissionResponse já existe por venda)"
```
