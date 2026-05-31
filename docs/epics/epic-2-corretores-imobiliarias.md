# Epic 2: Módulo de Corretores e Imobiliárias — Brownfield Enhancement

## Objetivo do Épico

Implementar os módulos de Corretor (broker) e Imobiliária (agency) no frontend do ConstructPro,
incluindo o bump obrigatório do API client para 1.0.0 (pré-requisito que destrava todos os módulos
do catch-up pós-release da API PR #40) e a atualização de navegação.

---

## Contexto do Sistema Existente

- **Current relevant functionality:** App React 19 com autenticação Firebase, módulo de clientes como
  padrão canônico de CRUD, módulo de vendas (Epic 1). Não existem telas de Corretor ou Imobiliária.
- **Technology stack:** React 19 + TypeScript 5.9 + Vite 7 + TanStack Query v5 + TanStack Table +
  shadcn/ui + Zod + react-hook-form + `@cacenot/construct-pro-api-client` (atualmente `0.18.0`)
- **Integration points:**
  - Padrão canônico: módulo `clientes` (`pages/clientes/`, `src/components/clientes/`)
  - `useApiClient()` hook — client auto-attach Firebase auth token + `X-Tenant-ID`
  - Error handling: `throwApiError` / `handleApiError` de `src/lib/api-error.ts`
  - Rotas via Vike file-based routing em `pages/`
  - Navegação global: `src/components/top-navbar.tsx`
  - Máscaras já disponíveis: CPF/CNPJ/telefone (`src/components/ui/`, módulo `customers`)

---

## Detalhes do Incremento

**O que está sendo adicionado:**

1. **Bump do API client** `@cacenot/construct-pro-api-client@0.18.0 → 1.0.0`: resolve breaking changes de
   `InstallmentKind`, novos campos em `SaleCreate`/`SaleResponse`, novos paths `/api/v1/brokers` e
   `/api/v1/agencies`. Destrava todos os outros módulos do catch-up.
2. **Módulo Corretor:** CRUD completo (lista / criação / detalhe / edição) consumindo `/api/v1/brokers`.
3. **Módulo Imobiliária:** CRUD completo (lista / criação / detalhe / edição) consumindo `/api/v1/agencies`.
4. **Navegação:** entrada "Corretores" e "Imobiliárias" no menu "Comercial" em `top-navbar.tsx`.

**Como integra:** segue exatamente o padrão `clientes` descrito em `DIRECIONAMENTO-FRONTEND.md §1`.

**Success criteria:**
- Usuário pode criar, listar, visualizar e editar corretores e imobiliárias
- API client atualizado sem erros de TypeScript (`npm run build` passa)
- Novos módulos acessíveis pelo menu "Comercial" sem regressão em features existentes

---

## Referência de Domínio

Documento de direcionamento completo: `DIRECIONAMENTO-FRONTEND.md` (§0, §4, §5, §7)

### Campos do Corretor (broker)

| Campo | Tipo | Observação |
|-------|------|-----------|
| `cpf` | string | único, máscara CPF |
| `full_name` | string | 3–120 chars |
| `creci` | string | 5–20, único |
| `email` | string | opcional |
| `phone` | string | opcional, E.164 |

### Campos da Imobiliária (agency)

| Campo | Tipo | Observação |
|-------|------|-----------|
| `cnpj` | string | único, máscara CNPJ |
| `legal_name` | string | razão social, 3–160 |
| `trade_name` | string | nome fantasia, opcional, 0–120 |
| `creci_j` | string | 5–20, único |
| `email` | string | opcional |
| `phone` | string | opcional, E.164 |

### Endpoints — Broker

| Método | Endpoint | Uso |
|--------|----------|-----|
| `POST` | `/api/v1/brokers` | Criar corretor |
| `GET` | `/api/v1/brokers` | Lista paginada + busca |
| `GET` | `/api/v1/brokers/{id}` | Detalhe |
| `PATCH` | `/api/v1/brokers/{id}` | Editar |
| `DELETE` | `/api/v1/brokers/{id}` | Soft-delete |

### Endpoints — Agency

| Método | Endpoint | Uso |
|--------|----------|-----|
| `POST` | `/api/v1/agencies` | Criar imobiliária |
| `GET` | `/api/v1/agencies` | Lista paginada + busca (por `legal_name`, `trade_name`, `cnpj`, `creci_j`) |
| `GET` | `/api/v1/agencies/{id}` | Detalhe |
| `PATCH` | `/api/v1/agencies/{id}` | Editar |
| `DELETE` | `/api/v1/agencies/{id}` | Soft-delete |

---

## Testes Unitários — Obrigatório (Vitest)

Toda story deste épico **deve** incluir testes unitários com Vitest. Sem testes passando, a story não pode avançar para `InReview`.

**Setup:** Vitest configurado como parte da Story 1.1 do Epic 1. Se o Epic 2 for iniciado antes, a mesma configuração se aplica:
```bash
pnpm add -D vitest @vitest/ui @testing-library/react @testing-library/user-event jsdom
```

**Localização:** co-localizado com o arquivo testado — `*.test.ts` / `*.test.tsx` em `src/`.

**Cobertura mínima obrigatória por story:**

| Story | Unidades a testar |
|-------|-------------------|
| 2.1 API Bump | `INSTALLMENT_KIND_LABELS` (5 novos kinds), `INSTALLMENT_PERIODICITY_LABELS` (6 periodicidades) |
| 2.2 Corretor | `broker.schema.ts`: CPF único, CRECI 5–20 chars, full_name 3–120 chars |
| 2.3 Imobiliária | `agency.schema.ts`: CNPJ único, CRECI-J 5–20 chars, legal_name 3–160 chars |

**Gate:** `npx vitest run` deve passar 100% antes do PR — BLOQUEANTE.

---

## Testes E2E — Débito Técnico (Playwright)

> ⚠️ **Decisão (2026-05-30):** Testes E2E com Playwright foram deferidos como débito técnico para este épico. Não são requisito bloqueante para conclusão das stories. Rastreados em `docs/STORY-BACKLOG.md` item `[EPIC2-T1]`.

**Configuração:** `playwright.config.ts` já presente no projeto.

**Localização dos testes:** `e2e/` (subdiretório por story).

**Cobertura planejada (a implementar no débito técnico):**

| Story | Cenários planejados |
|-------|----------------------|
| 2.1 Bump | Smoke test: login + navegar clientes + projetos + vendas sem erro visual (`e2e/regression/api-bump.spec.ts`) |
| 2.2 Corretor | Lista paginada, criação completa, edição, soft-delete com confirmação, busca server-side |
| 2.3 Imobiliária | Lista paginada, criação completa, edição, soft-delete com confirmação, busca por razão social/CNPJ |

**Status:** Deferido — não bloqueante. Ver `docs/STORY-BACKLOG.md` `[EPIC2-T1]`.

---

## Histórias

### Story 2.1 — Bump do API client para 1.0.0

- **Descrição:** Atualizar `@cacenot/construct-pro-api-client` de `0.18.0` para `1.0.0`, corrigir todos
  os breaking changes revelados pelo type-check (especialmente `InstallmentKind`, labels de parcela em
  `sale.schema.ts`), e garantir que `npm run build` passa sem erros.
- **Executor:** `@dev` | **Quality Gate:** `@architect`
- **Quality Gate Tools:** `[type_check, breaking_change_audit, build_validation, vitest_unit, e2e_playwright]`
- **Quality Gates:**
  - Pre-Commit: `npm run build` 100% limpo, `npm run lint` sem warnings
  - Pre-PR: **`npx vitest run src/schemas/sale.schema.test.ts` — OBRIGATÓRIO** (`INSTALLMENT_KIND_LABELS` e `INSTALLMENT_PERIODICITY_LABELS`)
  - Pre-PR: `npx playwright test e2e/regression/api-bump.spec.ts` — deferido como débito técnico `[EPIC2-T1]`
  - Pre-PR: Diff dos tipos gerados revisado — confirmar que campos `broker`, `agency`, `commission` em
    `SaleResponse` estão presentes; confirmar novos paths `/api/v1/brokers` e `/api/v1/agencies` no client
- **Risco:** MEDIUM (breaking changes em `InstallmentKind` afetam `sale.schema.ts` e labels da UI)
- **AC principais:**
  - `package.json` e lock file atualizados para `@cacenot/construct-pro-api-client@1.0.0`
  - `src/schemas/sale.schema.ts`: `INSTALLMENT_KIND_LABELS` refletindo os novos kinds
    (`entry · regular · balloon · key_delivery · extra`) e periodicidades separadas
  - `npm run build` sem erros TypeScript
  - `npm run lint` sem warnings
  - Nenhuma regressão funcional nas telas existentes (vendas, clientes, projetos)
  - PR isolado (sem misturar com código de funcionalidades novas)

---

### Story 2.2 — Módulo Corretor (CRUD completo)

- **Descrição:** Criar o módulo completo de Corretores seguindo o padrão `clientes`:
  lista paginada com busca, formulário de criação, tela de detalhe, edição e soft-delete.
- **Executor:** `@dev` | **Quality Gate:** `@architect`
- **Quality Gate Tools:** `[pattern_validation, code_review, accessibility_check, vitest_unit, e2e_playwright]`
- **Agentes especializados:** `@ux-design-expert` para layout da tabela e form (validar responsive)
- **Quality Gates:**
  - Pre-Commit: BiomeJS lint, TypeScript check, máscaras CPF corretas
  - Pre-PR: **`npx vitest run src/schemas/broker.schema.test.ts src/hooks/use-brokers-table.test.ts` — OBRIGATÓRIO**
  - Pre-PR: `npx playwright test e2e/corretores/` — deferido como débito técnico `[EPIC2-T1]`
  - Pre-PR: Code review — confirmar que segue Table Pattern do CLAUDE.md, tooltips em português em
    todos os icon buttons, dropdown de ações com `DropdownMenuLabel` + `DropdownMenuSeparator`
- **Risco:** LOW (segue padrão estabelecido, sem novos contratos de API)
- **Arquivos a criar:**
  - `pages/corretores/+Page.tsx` (lista)
  - `pages/corretores/novo/+Page.tsx` (criação)
  - `pages/corretores/@id/+Page.tsx` (detalhe)
  - `pages/corretores/@id/editar/+Page.tsx` (edição)
  - `src/components/corretores/broker-columns.tsx`
  - `src/components/corretores/broker-table.tsx`
  - `src/components/corretores/broker-filters.tsx`
  - `src/components/corretores/broker-pagination.tsx`
  - `src/components/corretores/broker-form.tsx`
  - `src/hooks/use-brokers-table.ts`
  - `src/schemas/broker.schema.ts`
- **Navegação:** adicionar "Corretores" ao grupo "Comercial" em `src/components/top-navbar.tsx`
- **AC principais:**
  - Lista com colunas: nome, CPF (mascarado), CRECI, email, telefone, ações
  - Busca por nome/CPF/CRECI server-side via query param
  - Paginação server-side, mínimo 10 itens por página
  - Formulário com validação Zod: CPF único, CRECI 5–20 chars, full_name 3–120 chars
  - Máscara CPF reutilizada do módulo `customers`
  - Soft-delete com confirmação (dialog) antes de remover
  - Toast de sucesso/erro via `handleApiError`
  - Responsivo: colunas secundárias (email, telefone) ocultas em mobile

---

### Story 2.3 — Módulo Imobiliária (CRUD completo)

- **Descrição:** Criar o módulo completo de Imobiliárias seguindo o mesmo padrão do módulo Corretor
  (Story 2.2) e `clientes`: lista paginada com busca por `legal_name`/`trade_name`/`cnpj`/`creci_j`,
  formulário de criação/edição com máscara CNPJ, detalhe e soft-delete.
- **Executor:** `@dev` | **Quality Gate:** `@architect`
- **Quality Gate Tools:** `[pattern_validation, code_review, accessibility_check, vitest_unit, e2e_playwright]`
- **Quality Gates:**
  - Pre-Commit: BiomeJS lint, TypeScript check, máscaras CNPJ corretas
  - Pre-PR: **`npx vitest run src/schemas/agency.schema.test.ts src/hooks/use-agencies-table.test.ts` — OBRIGATÓRIO**
  - Pre-PR: `npx playwright test e2e/imobiliarias/` — deferido como débito técnico `[EPIC2-T1]`
  - Pre-PR: Code review — padrão Table Pattern, tooltips, dropdown de ações
- **Risco:** LOW (mesmo padrão de Story 2.2)
- **Dependência:** Story 2.1 (API client 1.0.0 necessário para `/api/v1/agencies`)
- **Arquivos a criar:**
  - `pages/imobiliarias/+Page.tsx` (lista)
  - `pages/imobiliarias/novo/+Page.tsx` (criação)
  - `pages/imobiliarias/@id/+Page.tsx` (detalhe)
  - `pages/imobiliarias/@id/editar/+Page.tsx` (edição)
  - `src/components/imobiliarias/agency-columns.tsx`
  - `src/components/imobiliarias/agency-table.tsx`
  - `src/components/imobiliarias/agency-filters.tsx`
  - `src/components/imobiliarias/agency-pagination.tsx`
  - `src/components/imobiliarias/agency-form.tsx`
  - `src/hooks/use-agencies-table.ts`
  - `src/schemas/agency.schema.ts`
- **Navegação:** adicionar "Imobiliárias" ao grupo "Comercial" em `src/components/top-navbar.tsx`
- **AC principais:**
  - Lista com colunas: razão social, nome fantasia, CNPJ (mascarado), CRECI-J, email, ações
  - Busca por `legal_name`, `trade_name`, `cnpj`, `creci_j` server-side
  - Paginação server-side, mínimo 10 itens por página
  - Formulário com validação Zod: CNPJ único, CRECI-J 5–20 chars, legal_name 3–160 chars,
    trade_name opcional 0–120 chars
  - Máscara CNPJ reutilizada do módulo `customers` (PJ)
  - Soft-delete com confirmação (dialog)
  - Toast de sucesso/erro via `handleApiError`
  - Responsivo: colunas secundárias ocultas em mobile

---

## Requisitos de Compatibilidade

- [ ] Módulos existentes (clientes, projetos, vendas, autenticação) sem alteração de comportamento
- [ ] Interceptor 401 → auto-logout preservado (`src/lib/api.ts`)
- [ ] Auth context sem modificação (`src/contexts/auth-context.tsx`)
- [ ] Firebase singleton intocado (`src/lib/firebase.ts`)
- [ ] Design system: OKLch colors, Inter font, 8px grid, `tabular-nums` em valores monetários

---

## Mitigação de Riscos

- **Risco principal (Story 2.1):** Breaking changes do client 1.0.0 podem afetar telas existentes do
  Epic 1 (especialmente `InstallmentKind` em `sale-form.tsx` e `sale.schema.ts`)
- **Mitigação:** Story 2.1 em PR isolado; type-check revela todos os pontos afetados; correções
  incluídas no mesmo PR antes de qualquer feature nova
- **Rollback:** Novas rotas Vike são adicionais — sem modificação de rotas existentes.
  Rollback de 2.2/2.3 = reverter `pages/corretores/` e `pages/imobiliarias/`.
  Rollback de 2.1 = `pnpm up @cacenot/construct-pro-api-client@0.18.0` + reverter `sale.schema.ts`

---

## Definição de Pronto

- [x] Story 2.1: `npm run build` 100% limpo com client 1.0.0
- [x] Story 2.2: CRUD de corretor funcional, acessível via menu "Comercial"
- [x] Story 2.3: CRUD de imobiliária funcional, acessível via menu "Comercial"
- [x] `npm run lint` passa em todas as stories
- [x] **`npx vitest run` passa 100% — BLOQUEANTE**
- [ ] Testes E2E — deferido como débito técnico `[EPIC2-T1]` (ver `docs/STORY-BACKLOG.md`)
- [x] Sem regressões em vendas, clientes, projetos e autenticação
- [x] Tooltips em português em todos os icon buttons dos novos módulos
- [x] Paginação server-side com mínimo 10 itens por página

---

## Handoff para Story Manager (@sm)

"Desenvolva as stories detalhadas para este épico brownfield. Considerações-chave:

- Sistema existente: React 19 + TypeScript + TanStack Query + `@cacenot/construct-pro-api-client`
- **Padrão canônico a copiar:** módulo `clientes` — ver CLAUDE.md (Table Pattern) e `DIRECIONAMENTO-FRONTEND.md §1`
- **Padrão de tabelas obrigatório:** TanStack Table (ver CLAUDE.md — Table Pattern)
- **Error handling obrigatório:** `throwApiError` / `handleApiError` de `src/lib/api-error.ts`
- **Dependência crítica:** Story 2.1 deve ser concluída antes de 2.2/2.3
- Máscaras CPF/CNPJ já existem no módulo `customers` — reaproveitar
- Cada story deve incluir verificação de que funcionalidades existentes permanecem intactas
- Referência de domínio: `DIRECIONAMENTO-FRONTEND.md §0, §4, §5, §7`

O épico entrega os módulos de mediação que desbloqueiam a Story 2.7 (vincular corretor/imobiliária à venda) no Epic 3."

---

## Metadata

```yaml
epic_id: epic-2
status: Done
created_by: "@pm (Morgan)"
created_at: "2026-05-29"
domain_reference: DIRECIONAMENTO-FRONTEND.md (§0, §4, §5, §7)
stories_count: 3
risk_level: LOW-MEDIUM
priority: "Iniciar por aqui — independente, baixo risco, destrava Epic 3 (Nova Proposta)"
next_agent: "@sm"
next_command: "*create-next-story epic-2-corretores-imobiliarias.md"
dependencies_unlocked:
  - "Epic 3: Nova Proposta (§2.7 — vincular corretor/imobiliária à venda)"
  - "Epic 3: Nova Proposta (§2.8 — teto de parcelas, precisa do client 1.0.0)"
blocked_items_not_in_scope:
  - "§2.6: índice por grupo de parcelas — bloqueado por API #93"
  - "§6: relatório de comissões — bloqueado por API #95"
```
