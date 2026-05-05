## Plan: Testes Unitários + E2E (Playwright)

Vitest para testes de funções/componentes isolados. Playwright com Firebase 100% offline via seed de IndexedDB + interceptação de rede. API mockada com `page.route()` por módulo.

---

### Estrutura de arquivos

```
tests/
├── unit/
│   ├── setup.ts                          # jest-dom matchers + vi.mock firebase
│   ├── helpers/
│   │   └── wrapper.tsx                   # Provider wrapper (QueryClient, Auth, ApiClient mocks)
│   ├── lib/
│   │   ├── utils.test.ts
│   │   ├── text-formatters.test.ts
│   │   ├── installment-utils.test.ts
│   │   └── api-error.test.ts
│   ├── schemas/
│   │   ├── auth.schema.test.ts
│   │   ├── customer.schema.test.ts
│   │   ├── sale.schema.test.ts
│   │   ├── unit.schema.test.ts
│   │   └── project.schema.test.ts
│   ├── hooks/
│   │   ├── use-mobile.test.ts
│   │   ├── use-is-admin.test.ts
│   │   └── use-theme.test.ts
│   └── components/
│       ├── vendas/sale-status-badge.test.tsx
│       └── financeiro/installment-status-badge.test.tsx
└── e2e/
    ├── fixtures/
    │   ├── auth.fixture.ts               # fixture com seed de auth antes de cada teste
    │   └── index.ts
    ├── mocks/
    │   ├── firebase-auth.ts              # page.route() para Identity Toolkit + token refresh
    │   ├── factory.ts                    # factories de dados por domínio
    │   └── handlers/
    │       ├── clientes.ts               # page.route('/api/v1/customers/**')
    │       ├── empreendimentos.ts
    │       ├── unidades.ts
    │       ├── vendas.ts
    │       ├── financeiro.ts
    │       ├── contratos.ts
    │       └── configuracoes.ts
    ├── auth/login.spec.ts
    ├── clientes/
    │   ├── list.spec.ts
    │   ├── create.spec.ts
    │   └── detail.spec.ts
    ├── empreendimentos/
    │   ├── list.spec.ts
    │   └── create.spec.ts
    ├── unidades/list.spec.ts
    ├── vendas/
    │   ├── list.spec.ts
    │   ├── create.spec.ts
    │   └── approve.spec.ts
    ├── contratos/list.spec.ts
    ├── financeiro/installments.spec.ts
    └── configuracoes/members.spec.ts

vitest.config.ts
playwright.config.ts
```

---

### Fase 1 — Infraestrutura

**Steps** (paralelos entre si):
1. Instalar `vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom`
2. Criar `vitest.config.ts` — sem o plugin `vike()`, apenas `react()` + alias `@/*`. Env: `jsdom`, globals: `true`, setupFiles apontando para `tests/unit/setup.ts`
3. Criar `tests/unit/setup.ts` — importa `@testing-library/jest-dom` e faz `vi.mock('firebase/auth', ...)`
4. Instalar `@playwright/test` + `npx playwright install --with-deps chromium`
5. Criar `playwright.config.ts` — `webServer: { command: 'pnpm dev', url: 'http://localhost:3001' }`, `testDir: 'tests/e2e'`, `use: { baseURL: 'http://localhost:3001' }`
6. Adicionar scripts ao `package.json`: `test`, `test:watch`, `test:coverage`, `test:e2e`, `test:e2e:ui`

---

### Fase 2 — Testes unitários: `lib/`

7. **`utils.test.ts`** — `cn()`, `formatCurrency()`, `formatArea()`, `formatId()` em `src/lib/utils.ts`
8. **`text-formatters.test.ts`** — `capitalizeNameBR`, `maskBirthDate`, `parseBirthDateToISO`, `formatISOToBirthDate`, `formatDocument` (CPF/CNPJ), `formatPhone` em `src/lib/text-formatters.ts`
9. **`installment-utils.test.ts`** — `computeDefaultStartDate`, `computeAllowedDates`, `computeContractEndDate`, `formatBRDate` em `src/lib/installment-utils.ts`
10. **`api-error.test.ts`** — `extractApiErrorMessage` com 4 cenários: body.message, Error nativo, body.detail, fallback. Em `src/lib/api-error.ts`

---

### Fase 3 — Testes unitários: `schemas/`

11. Um arquivo por schema — válidos (devem passar) e inválidos (devem falhar) com `zod.safeParse()`. Schemas em `src/schemas/`

---

### Fase 4 — Testes unitários: hooks + components

12. Criar `tests/unit/helpers/wrapper.tsx` — componente que envolve children com `QueryClientProvider` (client fresco), mock de `AuthContext`, mock de `ApiClientProvider`
13. **Hooks**: `use-mobile` (mock `window.matchMedia`), `use-is-admin` (mock AuthContext), `use-theme` (mock `next-themes`)
14. **Badges**: `sale-status-badge.test.tsx` e `installment-status-badge.test.tsx` — renderiza cada variante de status e verifica texto + classe exibidos

---

### Fase 5 — E2E: Infraestrutura

*Depende da Fase 1*

15. **`tests/e2e/mocks/firebase-auth.ts`** — função `mockFirebaseAuth(page)` que:
    - usa `page.evaluate()` para fazer seed do IndexedDB (`firebaseLocalStorageDb`) com user mock antes de navegar
    - usa `page.route('https://securetoken.googleapis.com/v1/token*', ...)` → retorna fake access token
    - usa `page.route('https://identitytoolkit.googleapis.com/v1/accounts:lookup*', ...)` → retorna fake user

16. **`tests/e2e/fixtures/auth.fixture.ts`** — estende `test` do Playwright com `authenticatedPage` fixture: aplica `mockFirebaseAuth` + registra handlers de API antes de cada teste

17. **`tests/e2e/mocks/factory.ts`** — factories tipadas com dados realistas para cada entidade (customer, project, unit, sale, contract, installment)

18. **`tests/e2e/mocks/handlers/`** — um arquivo por domínio com `page.route('/api/v1/...')`. Cada handler usa `factory.ts` para responder. Ex: `GET /api/v1/customers` → `{ items: [factory.customer()], total: 1 }`

---

### Fase 6 — E2E: Módulo por módulo

*Depende da Fase 5. Steps dentro desta fase são paralelos entre si.*

19. **`auth/login.spec.ts`** — fluxo de login sem mock de Firebase (testa a UI do formulário, validações de campo vazio, etc.)
20. **`clientes/`** — listagem com filtros de busca, criação via formulário, visualização de detalhe do cliente
21. **`empreendimentos/`** — listagem, criar novo empreendimento
22. **`unidades/`** — listagem com filtros
23. **`vendas/`** — listagem, criar nova venda, aprovar/reprovar venda via dialog
24. **`financeiro/`** — listagem de parcelas com filtros de status, abrir drawer de detalhe, pagar parcela via dialog
25. **`contratos/`** — listagem de contratos, visualizar detalhe
26. **`configuracoes/`** — listar membros, criar membro via dialog

---

### Pacotes

```bash
pnpm add -D vitest @vitest/coverage-v8 jsdom \
  @testing-library/react @testing-library/user-event @testing-library/jest-dom \
  @playwright/test
npx playwright install --with-deps chromium
```

---

### Verificação

1. `pnpm test` — todos os testes unitários passam
2. `pnpm test:coverage` — cobertura gerada para `src/lib/`, `src/schemas/`
3. `pnpm dev` em paralelo + `pnpm test:e2e` — todos os specs E2E passam com Firebase 100% mockado
4. `pnpm test:e2e:ui` — inspecionar traces dos testes com a UI do Playwright

---

**Escopo excluído:** snapshot tests de componentes, testes de integração com Firebase real, coverage de páginas completas via Vitest, CI pipeline (pode ser adicionado separadamente).
