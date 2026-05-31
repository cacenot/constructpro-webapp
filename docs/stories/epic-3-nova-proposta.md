# Epic 3: Módulo de Propostas — Brownfield Enhancement

## Objetivo do Épico

Integrar corretor e imobiliária ao fluxo de criação e edição de propostas comerciais no ConstructPro,
expondo os campos de comissão (broker/agency + taxas PPM) nos formulários e exibindo o resumo de
comissão prevista na visão de detalhe da venda.

---

## Contexto do Sistema Existente

- **Funcionalidade atual relevante:** Módulo `/vendas` com CRUD completo de propostas (create,
  edit, approve, sign-contract). Corretor (`/corretores`) e imobiliária (`/imobiliarias`) entregues
  no Epic 2 como módulos independentes. O formulário de Nova Proposta (`sale-form.tsx`) e o de
  Edição (`sale-edit-form.tsx`) já existem — mas não expõem os campos de comissão.
- **Technology stack:** React 19 + TypeScript 5.9 + Vite 7 + TanStack Query v5 + TanStack Table +
  shadcn/ui + Zod + react-hook-form + `@cacenot/construct-pro-api-client@1.0.0`
- **Integration points:**
  - `sale-form.tsx` / `sale-edit-form.tsx` — formulários que precisam receber os campos de comissão
  - `src/schemas/sale.schema.ts` — schema Zod que precisa dos novos campos
  - `pages/vendas/novo/+Page.tsx` — passa body ao `POST /api/v1/sales`
  - `pages/vendas/@id/editar/+Page.tsx` — passa body ao `PATCH /api/v1/sales/{sale_id}`
  - `pages/vendas/@id/+Page.tsx` — detalhe da venda (deve exibir comissão prevista)
  - Hooks de broker/agency disponíveis via `@cacenot/construct-pro-api-client` (Epic 2)

---

## Detalhes do Incremento

**O que está sendo adicionado:**

A API já suporta comissão na proposta (campos `broker_id`, `commission_broker_rate`, `agency_id`,
`commission_agency_rate`), mas o frontend não os expõe. Com o Epic 2 entregue, corretor e imobiliária
são entidades gerenciáveis — agora é possível selecionar corretor/imobiliária ao criar/editar uma proposta
e vincular taxas de comissão (em PPM: 1% = 10.000 PPM).

**Como integra:**

- Segue o padrão canônico do módulo `clientes` para selects de FK
- Reutiliza `useApiClient()` para listar brokers e agencies nos selects
- Regras de negócio da API:
  - `broker_id` e `commission_broker_rate` sempre juntos (C1)
  - `agency_id` + `commission_agency_rate` requerem broker (agency sem broker é inválido)
  - Soma das taxas ≤ `TenantConfig.max_commission_rate`
  - Taxa em PPM (integer > 0 quando campo preenchido)
- Comissão é "frozen" apenas na aprovação da proposta; enquanto em `proposal`, é somente intenção

**Critérios de sucesso:**

- Usuário consegue criar proposta com corretor e/ou imobiliária + taxas
- Validação frontend espelha as regras da API (C1, cap, PPM)
- Edição de proposta em status `proposal` permite alterar ou limpar comissão
- Detalhe da venda exibe corretor, imobiliária e taxas previstas quando definidos

---

## Stories

### Story 3.1 — Comissão na Criação de Proposta

**Descrição:** Adicionar campos de corretor, imobiliária e taxas de comissão ao formulário de Nova
Proposta, com validação Zod espelhando as regras de negócio da API.

**Executor Assignment:** `executor: @dev`, `quality_gate: @architect`
**Quality Gate Tools:** `[form_validation, schema_review, api_contract_check]`

**Escopo:**
- `src/schemas/sale.schema.ts` — adicionar campos opcionais `broker_id`, `commission_broker_rate`,
  `agency_id`, `commission_agency_rate` com `.superRefine()` para regras C1 e PPM
- `src/components/vendas/sale-form.tsx` — seção "Comissão" com:
  - Select de corretor (listagem via `GET /api/v1/brokers`)
  - Select de imobiliária (listagem via `GET /api/v1/agencies`, habilitado somente se corretor selecionado)
  - Inputs de taxa em % (convertidos para PPM ao submeter)
- `pages/vendas/novo/+Page.tsx` — incluir os quatro campos no body do `POST /api/v1/sales`

**Quality Gates:**
- Pre-Commit: Lint + TypeScript sem erros
- Pre-PR: Validação das regras C1 nos testes manuais (broker sem rate = erro, agency sem broker = erro)

**UX Gate:** `@ux-design-expert` deve produzir `docs/stories/3.1-ux-spec.md` antes do @dev iniciar.

---

### Story 3.2 — Comissão na Edição e Exibição de Proposta

**Descrição:** Adicionar campos de comissão ao formulário de Edição de Proposta e exibir o resumo
de corretor/imobiliária/taxas na página de detalhe da venda.

**Executor Assignment:** `executor: @dev`, `quality_gate: @architect`
**Quality Gate Tools:** `[form_validation, ui_regression, api_contract_check]`

**Escopo:**
- `src/schemas/sale.schema.ts` — adicionar campos ao `saleEditFormSchema` (mesmas regras C1)
- `src/components/vendas/sale-edit-form.tsx` — seção "Comissão" idêntica à da Story 3.1
  (pre-populate com valores atuais do sale; quando status não é `proposal`, campos read-only/ocultos)
- `pages/vendas/@id/editar/+Page.tsx` — incluir quatro campos no body do `PATCH /api/v1/sales/{sale_id}`
- `pages/vendas/@id/+Page.tsx` — card "Comissão Prevista" visível quando `broker_id != null`:
  - Nome do corretor, nome da imobiliária (se houver)
  - Taxa corretor (%) e taxa imobiliária (%)
  - Total da comissão estimada sobre o valor da venda

**Quality Gates:**
- Pre-Commit: Lint + TypeScript sem erros, campos ocultos quando proposta já aprovada
- Pre-PR: Verificar que edição limpa comissão (null/null) funciona sem erro 422 da API

**UX Gate:** `@ux-design-expert` deve produzir `docs/stories/3.2-ux-spec.md` antes do @dev iniciar.

---

## Requisitos de Compatibilidade

- [ ] API `POST /api/v1/sales` com body sem campos de comissão continua funcionando (campos opcionais)
- [ ] `PATCH /api/v1/sales/{sale_id}` sem campos de comissão é no-op (API garante)
- [ ] Propostas existentes sem comissão continuam exibindo o detalhe sem o card de comissão
- [ ] Nenhuma mudança em rotas, navegação ou módulos externos

---

## Mitigação de Riscos

- **Risco principal:** Validação PPM incorreta gera erro 422 silencioso na aprovação da proposta
- **Mitigação:** `superRefine` no schema Zod valida regras C1, taxa > 0 quando preenchida,
  e exibe percentual (%) na UI enquanto converte para PPM internamente antes do submit
- **Plano de rollback:** Os quatro campos são novos e opcionais — reverter as alterações não
  quebra propostas existentes nem a API

---

## Definition of Done

- [ ] Story 3.1 concluída com UX spec aprovado e campos de comissão funcionando na criação
- [ ] Story 3.2 concluída com comissão editável e exibida no detalhe da venda
- [ ] Lint (`npm run lint`) e build (`npm run build`) passando sem erros
- [ ] Funcionalidade existente de criação/edição/aprovação de venda sem regressões
- [ ] QA gate PASS ou CONCERNS documentados em ambas as stories

---

## Sequenciamento

```
Story 3.1 → Story 3.2
```

Story 3.2 depende do schema atualizado em 3.1. Executar em série.

---

## Handoff ao Story Manager

"River, desenvolver as stories deste epic brownfield para integrar comissão de corretor/imobiliária
ao fluxo de propostas. Contexto:

- Sistema existente: React 19 + shadcn/ui + TanStack Query v5
- Padrão canônico: módulo `clientes` e `corretores` (Epic 2)
- Integração: `@cacenot/construct-pro-api-client@1.0.0` — campos `broker_id`,
  `commission_broker_rate`, `agency_id`, `commission_agency_rate` já no contrato da API
- UX Gate ativo: ambas as stories têm UI — `@ux-design-expert` produz spec antes de `@dev`
- Sequência: 3.1 antes de 3.2 (schema compartilhado)

O epic mantém integridade do sistema enquanto fecha o gap funcional aberto pelo Epic 2."

— Morgan, planejando o futuro 📊
