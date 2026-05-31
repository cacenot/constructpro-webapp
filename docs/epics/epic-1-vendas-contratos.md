# Epic 1: Módulo de Vendas e Contratos — Brownfield Enhancement

## Objetivo do Épico

Implementar o módulo frontend completo de Vendas e Contratos no ConstructPro, cobrindo o pipeline comercial (Sale) e o ciclo financeiro (Contract), com base nos endpoints da API backend já disponíveis.

---

## Contexto do Sistema Existente

- **Current relevant functionality:** App React 19 existente com autenticação Firebase, listagem de projetos e clientes, navegação via Vike. O domínio de vendas não possui telas implementadas.
- **Technology stack:** React 19 + TypeScript 5.9 + Vite 7 + TanStack Query v5 + TanStack Table + shadcn/ui + Zod + react-hook-form + `@cacenot/construct-pro-api-client`
- **Integration points:**
  - Hooks disponíveis: `useSales()`, `useSale()`, `useApiClient()`
  - Client auto-attach Firebase auth token + `X-Tenant-ID`
  - Error handling: `throwApiError` / `handleApiError` de `src/lib/api-error.ts`
  - `PATCH /api/v1/sales/{sale_id}` ainda não está no schema OpenAPI — usar `(client as any).PATCH(...)`

---

## Detalhes do Incremento

**O que está sendo adicionado:**

Telas e fluxos completos para o domínio comercial/financeiro:
1. Listagem de vendas com filtros e paginação server-side
2. Criação de proposta com cronograma de parcelas (schedules)
3. Detalhe de venda com exibição de status e contrato vinculado
4. Edição de proposta (somente status `offer`)
5. Assinatura de contrato
6. Registro de pagamento manual
7. Cancelamento / rescisão (distrato)

**Como integra:** Segue padrões existentes — Table Pattern (TanStack Table + shadcn), formulários com react-hook-form + Zod, mutações com Pattern A/B de `api-error.ts`, rotas via Vike em `pages/`.

**Success criteria:**
- Usuário consegue criar, visualizar, editar e encerrar vendas do início ao fim
- Estados de `Sale` e `Contract` refletidos corretamente na UI
- Sem regressões nas features existentes (projetos, clientes, autenticação)

---

## Referência de Domínio

Documento completo: `docs/vendas-e-contratos.md`

### Ciclo de Vida — Sale

```
offer ──► reserved ──► closed
  │                      
  └──────────────────► lost
```

| Status | Campos Editáveis |
|--------|-----------------|
| `offer` | `amount_cents` |
| `reserved` / `closed` / `lost` | nenhum |

### Ciclo de Vida — Contract

```
pending ──► active ──► settled
               │
               ▼
          in_default ──► terminated
pending ──► canceled
```

### Tipos de Parcela (`installment_schedules`)

| Tipo | Obrigatório | Campos especiais |
|------|-------------|-----------------|
| `entry` | 1 exato | `quantity=1`, `specific_date` |
| `monthly` | 0..N | `recurrence_day`, `start_date` |
| `yearly` | 0..N | `recurrence_day`, `start_date`, `recurrence_month` |
| `extra` | 0..N | renegociações |

### Endpoints

| Método | Endpoint | Uso |
|--------|----------|-----|
| `POST` | `/api/v1/sales` | Criar proposta |
| `GET` | `/api/v1/sales/{id}` | Detalhe |
| `PATCH` | `/api/v1/sales/{id}` | Editar `amount_cents` (offer only) — usar `(client as any)` |
| `POST` | `/api/v1/payments` | Pagamento manual |
| `POST` | `/api/v1/sales/{contract_id}/contract/sign` | Assinar contrato |

---

## Testes Unitários — Obrigatório (Vitest)

Toda story deste épico **deve** incluir testes unitários com Vitest. Sem testes passando, a story não pode avançar para `InReview`.

**Setup:** Vitest ainda não está configurado — a primeira story a implementar testes deve adicionar:
```bash
pnpm add -D vitest @vitest/ui @testing-library/react @testing-library/user-event jsdom
```
E adicionar ao `vite.config.ts`:
```ts
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: ['./src/test-setup.ts'],
},
```

**Localização:** co-localizado com o arquivo testado — `*.test.ts` / `*.test.tsx` em `src/`.

**Cobertura mínima obrigatória por story:**

| Story | Unidades a testar |
|-------|-------------------|
| 1.1 Lista | `useSalesTable` (filtros, paginação), `SalesStatusBadge` (variante por status) |
| 1.2 Criação | Schema Zod: `entry` obrigatório único, `quantity=1`, `specific_date` required |
| 1.3 Detalhe | Renderização condicional de botões de ação por status |
| 1.4 Edição | Campos bloqueados quando `status !== 'offer'` |
| 1.5 Assinatura | Lógica de transição de estado pós-assinatura (entrada paga vs não paga) |
| 1.6 Pagamento | Tratamento de `error_code: 6012`, formatação `tabular-nums` |
| 1.7 Cancelamento | Distinção cancelamento vs rescisão, textos de confirmação |

**Gate:** `npx vitest run` deve passar 100% antes do PR — BLOQUEANTE.

---

## Testes E2E — Obrigatório (Playwright)

Toda story deste épico **deve** incluir testes E2E com Playwright. Sem testes passando, a story não pode avançar para `InReview`.

**Configuração:** `playwright.config.ts` já presente no projeto.

**Localização dos testes:** `e2e/sales/` (criar se não existir).

**Cobertura mínima obrigatória por story:**

| Story | Cenários obrigatórios |
|-------|----------------------|
| 1.1 Lista | Carrega lista, filtra por status, pagina, skeleton visível durante loading |
| 1.2 Criação | Preenche form completo, valida regras de entry, submete com sucesso, erro de API exibido |
| 1.3 Detalhe | Exibe dados de Sale e Contract, botões contextuais corretos por status |
| 1.4 Edição | Edita `amount_cents` em `offer`, campos read-only bloqueados, botão desabilitado em `reserved` |
| 1.5 Assinatura | Dialog de confirmação, transição de estado pós-assinatura exibida corretamente |
| 1.6 Pagamento | Registra pagamento, erro `6012` exibido corretamente, confirmação antes de submeter |
| 1.7 Cancelamento | Dialog com texto de irreversibilidade, fluxo cancelamento vs rescisão distintos |

**Padrão de teste:**

```ts
// e2e/sales/lista-vendas.spec.ts
import { test, expect } from '@playwright/test'

test('exibe lista de vendas com paginação', async ({ page }) => {
  await page.goto('/sales')
  await expect(page.getByRole('table')).toBeVisible()
  // ...
})

test('filtra por status offer', async ({ page }) => {
  await page.goto('/sales')
  await page.getByRole('combobox', { name: /status/i }).selectOption('offer')
  await expect(page.getByText('offer')).toBeVisible()
})
```

**Gate:** Pre-PR. `npx playwright test e2e/sales/` deve passar 100% antes do PR.

---

## Histórias

### Story 1.1 — Lista de Vendas
- **Descrição:** Tela de listagem de vendas com filtros (status, vendedor, data) e paginação server-side
- **Executor:** `@dev` | **Quality Gate:** `@architect`
- **Quality Gate Tools:** `[pattern_validation, code_review, accessibility_check, vitest_unit, e2e_playwright]`
- **Agentes especializados:** `@ux-design-expert` para layout da tabela responsiva
- **Quality Gates:**
  - Pre-Commit: BiomeJS lint, TypeScript check
  - Pre-PR: **`npx vitest run src/hooks/use-sales-table.test.ts src/components/sales/sales-status-badge.test.tsx` — OBRIGATÓRIO**
  - Pre-PR: Code review, acessibilidade de tooltips nos ícones, **`npx playwright test e2e/sales/lista-vendas.spec.ts` — OBRIGATÓRIO**
- **Risco:** LOW
- **AC principais:**
  - Hook `useSales({ page, page_size, status })` retorna dados paginados
  - Skeleton durante loading, empty state quando sem dados
  - Filtros persistem durante navegação
  - Coluna de status com badge colorido por `Sale.status`
  - Responsivo: colunas ocultas em mobile

### Story 1.2 — Criação de Proposta
- **Descrição:** Formulário multi-step para criação de venda com seleção de unidade, cliente, índice e cronograma de parcelas
- **Executor:** `@dev` | **Quality Gate:** `@architect`
- **Quality Gate Tools:** `[schema_validation, form_validation, api_contract_check, vitest_unit, e2e_playwright]`
- **Quality Gates:**
  - Pre-Commit: Validação Zod de `installment_schedules`, TypeScript
  - Pre-PR: **`npx vitest run src/schemas/sale.schema.test.ts` — OBRIGATÓRIO** (regras: 1 entry, quantity=1, specific_date)
  - Pre-PR: Validação de regras de negócio (1 entry obrigatório, quantity=1), **`npx playwright test e2e/sales/criar-venda.spec.ts` — OBRIGATÓRIO**
- **Risco:** MEDIUM (form complexo com regras de negócio)
- **AC principais:**
  - Schema Zod valida: exatamente 1 schedule `entry`, `quantity=1` para entry, `specific_date` obrigatório para entry
  - `amount_cents` derivado (soma dos schedules), não editável pelo usuário
  - Após criação, redireciona para detalhe da venda
  - Toast de sucesso/erro via `handleApiError`

### Story 1.3 — Detalhe de Venda
- **Descrição:** Tela de detalhe mostrando dados da Sale, status do Contract vinculado e parcelas
- **Executor:** `@dev` | **Quality Gate:** `@architect`
- **Quality Gate Tools:** `[code_review, pattern_validation, vitest_unit, e2e_playwright]`
- **Quality Gates:**
  - Pre-Commit: TypeScript, lint
  - Pre-PR: **`npx vitest run src/components/sales/sale-detail.test.tsx` — OBRIGATÓRIO** (botões contextuais por status)
  - Pre-PR: Verificação de query key invalidation, **`npx playwright test e2e/sales/detalhe-venda.spec.ts` — OBRIGATÓRIO**
- **Risco:** LOW
- **AC principais:**
  - Hook `useSale(id)` com query key `['sales', 'detail', id]`
  - Exibe status de Sale e Contract com badges distintos
  - Mostra cronograma de parcelas (tipo, valor, data, status)
  - Botões de ação contextuais por status (editar se `offer`, assinar se `pending`)

### Story 1.4 — Edição de Proposta
- **Descrição:** Edição de `amount_cents` quando Sale está em `offer`; campos imutáveis bloqueados visualmente
- **Executor:** `@dev` | **Quality Gate:** `@architect`
- **Quality Gate Tools:** `[code_review, api_workaround_validation, vitest_unit, e2e_playwright]`
- **Quality Gates:**
  - Pre-Commit: TypeScript, lint
  - Pre-PR: **`npx vitest run src/components/sales/sale-edit-form.test.tsx` — OBRIGATÓRIO** (campos bloqueados quando status != `offer`)
  - Pre-PR: Teste do workaround `(client as any).PATCH`, **`npx playwright test e2e/sales/editar-venda.spec.ts` — OBRIGATÓRIO**
- **Risco:** MEDIUM (workaround de API — endpoint não está no schema OpenAPI)
- **AC principais:**
  - Usar `(client as any).PATCH('/api/v1/sales/{id}', ...)` enquanto pacote não é atualizado
  - Campos `unit_id`, `customer_id`, `user_id`, `unit_price_cents`, `installment_schedules` exibidos como read-only
  - Botão "Salvar" desabilitado se status != `offer`
  - Invalidação de `['sales']` e `['sales', 'detail', id]` após sucesso

### Story 1.5 — Assinatura de Contrato
- **Descrição:** Fluxo de assinatura com confirmação e exibição do estado resultante (Sale + Contract + Unit)
- **Executor:** `@dev` | **Quality Gate:** `@architect`
- **Quality Gate Tools:** `[code_review, state_transition_validation, vitest_unit, e2e_playwright]`
- **Quality Gates:**
  - Pre-Commit: TypeScript, lint
  - Pre-PR: **`npx vitest run src/components/sales/sign-contract.test.tsx` — OBRIGATÓRIO** (transições: entrada paga → `closed/active/sold`; não paga → `reserved/pending/reserved`)
  - Pre-PR: Validação das transições de estado documentadas, **`npx playwright test e2e/sales/assinar-contrato.spec.ts` — OBRIGATÓRIO**
- **Risco:** MEDIUM (transições críticas de estado)
- **AC principais:**
  - Dialog de confirmação antes de assinar
  - `POST /api/v1/sales/{contract_id}/contract/sign`
  - Se entrada paga: Sale→`closed`, Contract→`active`, Unit→`sold`
  - Se entrada não paga: Sale→`reserved`, Contract→`pending`, Unit→`reserved`
  - Feedback visual do estado resultante após assinatura

### Story 1.6 — Registro de Pagamento Manual
- **Descrição:** Modal/form para registrar pagamento de parcela via `POST /api/v1/payments`
- **Executor:** `@dev` | **Quality Gate:** `@architect`
- **Quality Gate Tools:** `[code_review, monetary_value_validation, vitest_unit, e2e_playwright]`
- **Quality Gates:**
  - Pre-Commit: TypeScript, lint, `tabular-nums` em valores monetários
  - Pre-PR: **`npx vitest run src/components/sales/payment-form.test.tsx` — OBRIGATÓRIO** (error_code 6012, formatação monetária)
  - Pre-PR: Code review de tratamento de `error_code` do backend, **`npx playwright test e2e/sales/pagamento-manual.spec.ts` — OBRIGATÓRIO**
- **Risco:** LOW
- **AC principais:**
  - Valores monetários com `tabular-nums` (design system)
  - Error handling específico para `error_code: 6012` (pagamento parcial não permitido)
  - Invalidação das queries de sale e contrato após pagamento
  - Confirmação antes de registrar

### Story 1.7 — Cancelamento e Rescisão
- **Descrição:** Fluxo de cancelamento (pre-ativo) e rescisão/distrato (pós-ativo) com documentação de `ContractTermination`
- **Executor:** `@dev` | **Quality Gate:** `@architect`
- **Quality Gate Tools:** `[code_review, destructive_action_validation, vitest_unit, e2e_playwright]`
- **Quality Gates:**
  - Pre-Commit: TypeScript, lint
  - Pre-PR: **`npx vitest run src/components/sales/cancellation-dialog.test.tsx` — OBRIGATÓRIO** (distinção cancelamento vs rescisão, texto de irreversibilidade)
  - Pre-PR: Revisão de ações destrutivas e confirmações, **`npx playwright test e2e/sales/cancelamento-rescisao.spec.ts` — OBRIGATÓRIO**
- **Risco:** HIGH (operações irreversíveis)
- **AC principais:**
  - Dialog de confirmação com texto explícito sobre irreversibilidade
  - Cancelamento: `Contract: pending→canceled`, `Sale→lost`, `Unit→available`
  - Rescisão: `Contract: active→terminated`, `Sale→lost`, `Unit→available`
  - Rescisão exige campo `ContractTermination` (dados do distrato)
  - Pre-Deployment: rollback plan documentado

---

## Requisitos de Compatibilidade

- [ ] API endpoints existentes (projetos, clientes) sem alteração
- [ ] Interceptor 401 → auto-logout preservado (`src/lib/api.ts`)
- [ ] Auth context sem modificação (`src/contexts/auth-context.tsx`)
- [ ] Firebase singleton intocado (`src/lib/firebase.ts`)
- [ ] Design system: OKLch colors, Inter font, 8px grid, `tabular-nums` monetário

---

## Mitigação de Riscos

- **Risco principal:** `PATCH /api/v1/sales/{id}` não está no schema OpenAPI → usar workaround `(client as any)` até pacote ser atualizado
- **Mitigação:** Comentário explícito no código; story 1.4 inclui task para remover workaround quando pacote atualizar
- **Rollback:** Todas as telas são adicionadas em novas rotas Vike — sem modificação de rotas existentes. Rollback = reverter arquivos em `pages/sales/`

---

## Definição de Pronto

- [ ] Todas as 7 stories completas com acceptance criteria atendidos
- [ ] `npm run build` sem erros TypeScript
- [ ] `npm run lint` passa sem warnings
- [ ] **`npx vitest run` passa 100% — BLOQUEANTE**
- [ ] **`npx playwright test e2e/sales/` passa 100% — BLOQUEANTE**
- [ ] Fluxo completo E2E: criar proposta → assinar contrato → pagar parcela funcional
- [ ] Sem regressões em projetos, clientes e autenticação
- [ ] Documentação de workarounds atualizada

---

## Handoff para Story Manager (@sm)

"Desenvolva as stories detalhadas para este épico brownfield. Considerações-chave:

- Sistema existente: React 19 + TypeScript + TanStack Query + `@cacenot/construct-pro-api-client`
- Hooks disponíveis sem implementação adicional: `useSales()`, `useSale()`, `useApiClient()`
- **Padrão de tabelas obrigatório:** TanStack Table (ver CLAUDE.md — Table Pattern)
- **Error handling obrigatório:** `throwApiError` / `handleApiError` de `src/lib/api-error.ts`
- **Testes E2E obrigatórios:** Playwright — cada story cria `e2e/sales/{story}.spec.ts`. Story não avança para InReview sem testes passando. Gate: `npx playwright test e2e/sales/` 100% no Pre-PR
- **Workaround crítico:** `PATCH /api/v1/sales/{id}` usa `(client as any).PATCH(...)` — documentado em `docs/vendas-e-contratos.md`
- Referência de domínio completa: `docs/vendas-e-contratos.md`
- Cada story deve incluir verificação de que funcionalidades existentes permanecem intactas

O épico mantém a integridade do sistema existente enquanto entrega o módulo completo de Vendas e Contratos."

---

## Metadata

```yaml
epic_id: epic-1
status: Ready
created_by: "@pm (Morgan)"
created_at: "2026-05-29"
domain_reference: docs/vendas-e-contratos.md
stories_count: 7
risk_level: MEDIUM
next_agent: "@sm"
next_command: "*create-next-story epic-1-vendas-contratos.md"
```
