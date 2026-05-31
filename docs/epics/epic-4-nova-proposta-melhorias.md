# Epic 4: Nova Proposta — Melhorias pós-API 1.0.0

## Objetivo do Épico

Completar o formulário de Nova Proposta com as funcionalidades entregues pela API 1.0.0 que ainda não
foram implementadas no frontend: wizard de seleção empreendimento × unidade, multi-entrada + entrada via
bem (asset), periodicidades novas (bimestral/trimestral/semestral), melhorias na UX de montagem de
parcelas e guardrail de teto de parcelas por mês-calendário.

---

## Contexto do Sistema Existente

- **Funcionalidade atual:** Formulário `sale-form.tsx` (~757 linhas) com form único (sem wizard),
  uma entrada, periodicidades mensais/anuais apenas, sem teto de parcelas. Comissão adicionada no
  Epic 3 (Stories 3.1/3.2).
- **Technology stack:** React 19 + TypeScript 5.9 + Vite 7 + TanStack Query v5 + shadcn/ui + Zod +
  react-hook-form + `@cacenot/construct-pro-api-client@1.0.0`
- **Integration points:**
  - `src/components/vendas/sale-form.tsx` — formulário de criação (principal arquivo afetado)
  - `src/components/vendas/sale-edit-form.tsx` — formulário de edição
  - `src/schemas/sale.schema.ts` — schema Zod compartilhado
  - `src/lib/installment-utils.ts` — cálculo de datas de parcelas
  - `src/components/ui/project-autocomplete.tsx` — já existe, aceita `projectId`
  - `src/components/ui/unit-autocomplete.tsx` — precisa aceitar `projectId` como filtro
  - `GET /api/v1/tenant-config` — expõe `max_installments_per_month` (int 1–5, default 2)

---

## Detalhes do Incremento

**O que está sendo adicionado:**

1. **Story 4.1 — Wizard step empreendimento × unidade:** separar escolha de empreendimento e unidade
   em dois passos explícitos dentro do form de proposta.
2. **Story 4.2 — Periodicidades:** adicionar bimestral, trimestral e semestral ao seletor de
   recorrência e ao cálculo de datas em `installment-utils.ts`.
3. **Story 4.3 — Multi-entrada + entrada via bem (asset):** N entradas, cada uma podendo ser
   paga via bem (veículo, imóvel, terreno, barco) com sub-form condicional de `asset_proposal`.
4. **Story 4.4 — UX de montagem de parcelas:** refatorar o "construtor de parcelas" para interface
   mais clara com grupos (entrada, regular, balão, entrega das chaves, extra).
5. **Story 4.5 — Teto de parcelas por mês:** validação local (pré-submit) e tratamento do 422 do
   backend; configuração `max_installments_per_month` na tela de configurações do tenant.

**Item condicional (bloqueado):**
- **§2.6 — Índice por grupo de parcelas:** mover seletor de índice para dentro de cada grupo.
  Bloqueado por API [#93](https://github.com/cacenot/construct-pro-api/issues/93). Incluir como
  Story 4.6 quando a API entregar.

---

## Referência de Domínio

`DIRECIONAMENTO-FRONTEND.md` §2.1, §2.2, §2.4, §2.5, §2.8

---

## Stories

### Story 4.1 — Wizard step empreendimento × unidade

**Descrição:** Separar a escolha de empreendimento e unidade no form de proposta em dois passos
explícitos. Step 1: escolher empreendimento via `<ProjectAutocomplete>`, depois unidade filtrada
por `project_id`. Step 2: financeiro (parcelas, comissão).

**Executor Assignment:** `executor: @dev`, `quality_gate: @architect`
**Quality Gate Tools:** `[form_validation, ux_review, regression_check]`
**UX Gate:** `@ux-design-expert` produz spec antes de `@dev` iniciar.

**Escopo:**
- `src/components/ui/unit-autocomplete.tsx` — adicionar prop `projectId?: string`; quando presente,
  filtrar `GET /api/v1/units?project_id=…&status=available` (hoje busca sem filtro de projeto)
- `src/components/vendas/sale-form.tsx` — implementar wizard 2 passos:
  - Step 1: `<ProjectAutocomplete>` (já existe) → ao selecionar, habilita `<UnitAutocomplete projectId=…>`
  - Step 2: campos financeiros existentes (parcelas, comissão)
- Quebrar `sale-form.tsx` em sub-componentes por step (arquivo já está grande)

**API:** ✅ `GET /api/v1/projects` e `GET /api/v1/units?project_id=…&status=available` já disponíveis.

**AC principais:**
- Seleção de empreendimento primeiro; unidade só habilitada após empreendimento escolhido
- Unidades listadas filtradas pelo empreendimento selecionado
- Ao trocar empreendimento, campo de unidade é resetado
- Step 2 acessível apenas com empreendimento + unidade selecionados
- Sem regressão no form de edição (`sale-edit-form.tsx`)

---

### Story 4.2 — Periodicidades bimestral/trimestral/semestral

**Descrição:** Adicionar bimestral (2 meses), trimestral (3 meses) e semestral (6 meses) ao seletor
de recorrência das parcelas e ao cálculo de datas em `installment-utils.ts`.

**Executor Assignment:** `executor: @dev`, `quality_gate: @architect`
**Quality Gate Tools:** `[unit_tests, date_calculation_review, schema_check]`

**Escopo:**
- `src/lib/installment-utils.ts` — adicionar intervalos 2/3/6 meses; ancorar em `recurrence_day`
  com clamp de fim de mês (dia 31 em fevereiro → 28/29). Espelhar lógica do backend `schedule_dates`.
- `src/schemas/sale.schema.ts` — adicionar `bimonthly | quarterly | semestral` a `RecurrenceType`
- `src/components/vendas/sale-form.tsx` — adicionar as novas opções ao seletor de periodicidade
- `src/components/vendas/sale-edit-form.tsx` — mesma atualização

**API:** ✅ `RecurrenceType` já aceita `monthly · bimonthly · quarterly · semestral · yearly`
(entregue em PR #96 sobre issue #94).

**Testes unitários obrigatórios (Vitest):**
- `installment-utils.test.ts`: calcular próxima data bimestral/trimestral/semestral com clamp de
  fim de mês — pelo menos 3 casos de borda por periodicidade.

**AC principais:**
- Dropdown de recorrência exibe as 3 novas opções com labels em português
- Datas calculadas localmente no preview batem com as datas materializadas pela API
- Clamp de fim de mês funciona (fevereiro, meses com 30 dias)

---

### Story 4.3 — Multi-entrada + entrada via bem (asset)

**Descrição:** Permitir N entradas no form de proposta. Cada entrada pode ser paga via dinheiro ou
via bem (veículo, imóvel, terreno, barco). Entrada via bem abre sub-form condicional de
`asset_proposal` com campos obrigatórios por tipo.

**Executor Assignment:** `executor: @dev`, `quality_gate: @architect`
**Quality Gate Tools:** `[form_validation, schema_review, api_contract_check]`
**UX Gate:** `@ux-design-expert` produz spec antes de `@dev` iniciar.

**Escopo:**
- `src/schemas/sale.schema.ts` — adicionar array de entradas ao schema; regra: `payment_method="asset"`
  exige `kind="entry"` e `asset_proposal` com `asset_metadata` obrigatório por tipo:
  - `vehicle`: plate, renavam, brand, model, year
  - `real_estate`: address, property_type, area_sqm, registration_number
  - `land`: address, area_sqm, registration_number
  - `boat`: registration, length_meters, brand, model, year
- `src/components/vendas/sale-form.tsx` — bloco "Entradas" com botão "+ Adicionar entrada";
  cada item com: valor, data, método de pagamento (dinheiro/bem); método "Bem" expande sub-form
  de `asset_proposal` com campos condicionais por `type`.

**API:** ✅ `installment_schedules[].kind="entry"` + `payment_method="asset"` + `asset_proposal`
já aceitos pelo `POST /api/v1/sales`.

**AC principais:**
- Mínimo 1, máximo N entradas (sem limite hard definido pela API)
- Ao selecionar "Bem", sub-form expande com campos do tipo selecionado
- Troca de tipo limpa campos do sub-form anterior
- Validação Zod espelha restrições da API (asset só em entry, metadata obrigatória por tipo)
- Valor total das entradas refletido no resumo financeiro lateral

---

### Story 4.4 — UX de montagem de parcelas

**Descrição:** Refatorar o "construtor de parcelas" do form de proposta para uma interface mais clara,
com grupos visuais por tipo (entrada, regular, balão, entrega das chaves, extra) e resumo financeiro
em tempo real batendo com o que a API materializará.

**Executor Assignment:** `executor: @dev`, `quality_gate: @architect`
**Quality Gate Tools:** `[ux_review, regression_check, calculation_review]`
**UX Gate:** `@ux-design-expert` produz spec antes de `@dev` iniciar.

**Escopo:**
- Extrair componente `<InstallmentScheduleBuilder>` de `sale-form.tsx`
- Organizar por grupos: Entrada(s) (Story 4.3), Regulares (mensais/bimestrais/etc.), Balões/Reforços,
  Entrega das Chaves (`key_delivery`), Extras
- Resumo financeiro: total de parcelas por grupo, soma total bate com `amount_cents` da proposta
- Reutilizar em `sale-edit-form.tsx`

**AC principais:**
- Grupos visuais com label e subtotal por grupo
- Totais em tempo real sem submit
- Nenhuma regressão no cálculo de datas existente
- `sale-form.tsx` reduzido — lógica de parcelas encapsulada no componente extraído

---

### Story 4.5 — Teto de parcelas por mês (cap + config tenant)

**Descrição:** Implementar validação local de teto de parcelas por mês-calendário no form de proposta
e adicionar campo de configuração `max_installments_per_month` na tela de configurações do tenant.

**Executor Assignment:** `executor: @dev`, `quality_gate: @architect`
**Quality Gate Tools:** `[validation_review, api_422_handling, config_review]`

**Escopo:**
- `src/components/vendas/sale-form.tsx` — pré-validar localmente: somar `due_date` por mês-calendário
  ≤ `TenantConfig.max_installments_per_month`; exibir feedback inline por mês violado antes do submit.
  Tratar o 422 do backend (`SALE_INSTALLMENTS_PER_MONTH_EXCEEDS_CAP`, com `details.month`/`count`/`cap`)
  com mensagem clara.
- Incluir `max_installments_per_month` no fetch de `GET /api/v1/tenant-config`
- `pages/configuracoes/+Page.tsx` — adicionar **range bar** (1–5, default 2) para
  `max_installments_per_month`, ao lado de `max_commission_rate`. Persistir via `PATCH /api/v1/tenant-config`.

**API:** ✅ `TenantConfig.max_installments_per_month` exposto em `GET`/`PATCH /api/v1/tenant-config`
(issue #97, entregue no PR stack sobre #96).

**AC principais:**
- Feedback inline antes do submit (sem roundtrip ao servidor)
- Erro 422 do backend exibido com mês e contagem violados
- Range bar na config do tenant (1–5) com label descritivo
- Propostas existentes não são revalidadas (grandfathering — comportamento correto)

---

### Story 4.6 — Índice por grupo de parcelas [CONDICIONAL — bloqueado API #93]

**Descrição:** Mover seletor de índice do nível global da proposta para dentro de cada grupo de
parcelas, com toggle "usar o mesmo índice para toda a proposta".

**Status:** ⚠️ **Bloqueado** — aguarda `InstallmentScheduleConfig.index_type_code` por grupo
([construct-pro-api#93](https://github.com/cacenot/construct-pro-api/issues/93)).

**Ação:** Criar story detalhada via `@sm` assim que a API #93 for entregue.

---

## Requisitos de Compatibilidade

- [ ] `sale-form.tsx` refatorado sem regressão no fluxo de criação de proposta existente
- [ ] `sale-edit-form.tsx` atualizado com as mesmas features (periodicidades, multi-entrada)
- [ ] Propostas sem campos novos (sem asset, sem multi-entrada) continuam funcionando
- [ ] Tenant config sem campos novos continua sem erro

---

## Testes

**Unitários obrigatórios (Story 4.2):**
- `installment-utils.test.ts`: cálculo de datas bimestral/trimestral/semestral com clamp de fim de mês

**Testes manuais bloqueantes (todas as stories):**
- Form de proposta: fluxo completo criação → aprovação sem regressão
- Periodicidades: datas geradas localmente == datas materializadas pela API
- Asset: validação dos campos obrigatórios por tipo de bem

---

## Sequenciamento

```
Story 4.1 (Wizard) ─┐
Story 4.2 (Period.) ─┤─► Story 4.4 (UX builder) ─► Story 4.5 (Teto)
Story 4.3 (Asset)  ─┘
```

Story 4.4 depende de 4.1, 4.2, 4.3 para ter todos os grupos definidos no builder.
Story 4.5 pode rodar em paralelo com 4.4 (afeta config do tenant, não o builder).

---

## Definition of Done

- [ ] Stories 4.1–4.5 concluídas e QA gate PASS/CONCERNS documentados
- [ ] `npm run build` limpo
- [ ] `npm run lint` sem warnings
- [ ] Testes unitários `installment-utils.test.ts` passando (Story 4.2)
- [ ] Sem regressão no fluxo completo de proposta (criação → aprovação → contrato)
- [ ] Story 4.6 em aguardo da API #93

---

## Metadata

```yaml
epic_id: epic-4
status: Ready
created_by: "@po (Pax)"
created_at: "2026-05-31"
domain_reference: DIRECIONAMENTO-FRONTEND.md (§2.1, §2.2, §2.4, §2.5, §2.8)
stories_count: 5 (+ 1 condicional)
risk_level: MEDIUM
priority: "Alta — melhorias no core do fluxo comercial, API já entregue"
next_agent: "@sm"
next_command: "*draft epic-4-nova-proposta-melhorias.md"
dependencies:
  - "Epic 2: API client 1.0.0 ✅"
  - "Epic 3: Comissão na proposta ✅"
blocked_items:
  - "Story 4.6: índice por grupo — bloqueado API #93"
```
