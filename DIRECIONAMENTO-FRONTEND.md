# Direcionamento Frontend — Catch-up pós-release da API + telas novas

> **Para quem vai pegar o trabalho.** Este é um documento de **direção**, não um passo a passo fechado.
> Ele mapeia o que mudou na API (release **PR #40** do `construct-pro-api`, 26/05/2026) e o que
> o frontend precisa fazer para acompanhar, além de algumas telas novas. Cada seção segue o mesmo
> template: **Estado atual · Objetivo · API · Arquivos do front · UX proposta · Dependências**.

## Legenda de status

- ✅ **Pronto na API** — dá pra implementar no front contra a API atual.
- ⚠️ **Bloqueado por gap de API** — precisa de mudança no backend antes (issue de follow-up aberta).

## Status de Execução Frontend

> Atualizado em 2026-05-31 por `@po (Pax)`.

| Seção | Descrição | Status Frontend | Story/Epic | Observação |
|-------|-----------|----------------|------------|------------|
| §0 | Bump API client 1.0.0 | ✅ **Done** | Story 2.1 ✅ | Merged PR Epic 2 |
| §2.3 | Labels `key_delivery` | ✅ **Done** | Story 2.1 ✅ | `sale.schema.ts` atualizado |
| §4 | Módulo Corretor | ✅ **Done** | Story 2.2 ✅ | Epic 2 merged |
| §5 | Módulo Imobiliária | ✅ **Done** | Story 2.3 ✅ | Epic 2 merged |
| §7 | Navegação (Corretores/Imobiliárias) | ✅ **Done** | Story 2.2/2.3 ✅ | Menu "Comercial" atualizado |
| §2.7 | Vincular corretor/imobiliária à venda | ✅ **Done** | Story 3.1/3.2 ✅ | Epic 3 merged |
| §2.5 | Periodicidades (bimestral/trimestral/semestral) | 🔴 **PENDENTE** | Epic 4, Story 4.2 | UI de seleção + cálculo datas `installment-utils.ts` |
| §2.1 | Wizard step empreendimento × unidade | 🔴 **PENDENTE** | Epic 4, Story 4.1 | — |
| §2.2 | Multi-entrada + entrada via bem (asset) | 🔴 **PENDENTE** | Epic 4, Story 4.3 | — |
| §2.4 | UX da montagem de parcelas | 🔴 **PENDENTE** | Epic 4, Story 4.4 | — |
| §2.8 | Teto de parcelas por mês | 🔴 **PENDENTE** | Epic 4, Story 4.5 | API entregue (#97) |
| §3 | Empreendimento — campos novos | 🔴 **PENDENTE** | Epic 5, Story 5.1 | — |
| §2.6 | Índice por grupo de parcelas | ⚠️ **BLOQUEADO** | Epic 4 (condicional) | Aguarda API #93 |
| §6 | Relatório de comissões | ⚠️ **BLOQUEADO** | Epic 6 (condicional) | Aguarda API #95 |

---

## 0. Pré-requisito que destrava tudo: subir o API client para `1.0.0` — 🟢 EXECUTADO (Story 2.1)

Hoje o front usa `@cacenot/construct-pro-api-client@0.18.0` (ver `package.json`). O release da API
(PR #40) trouxe brokers, agencies, commission, novos tipos de parcela, novas periodicidades e novos
campos de empreendimento. **Antes de qualquer tela**, suba o pacote para **`1.0.0`** e regenere/atualize:

```bash
# no repo da API, gera o client a partir do OpenAPI:
make generate-api-client
# depois, no frontend:
pnpm up @cacenot/construct-pro-api-client@1.0.0   # ou a versão publicada
```

**Breaking changes esperados ao subir** (validar no diff dos tipos gerados):

- **`InstallmentKind` mudou**: não existem mais `monthly`/`yearly`. Agora é
  `entry · regular · balloon · key_delivery · extra`. A frequência virou um campo separado
  (`InstallmentPeriodicity`: `one_shot · monthly · bimonthly · quarterly · semestral · yearly`).
  → Os labels atuais `INSTALLMENT_KIND_LABELS` em `src/schemas/sale.schema.ts` precisam ser revistos.
- **`SaleResponse` ganhou `commission`** (snapshot, preenchido só após approve) e os campos de mediação
  `broker`/`agency` aninhados.
- **`SaleCreate`/`SaleUpdate` ganharam** `broker_id`, `agency_id`, `commission_broker_rate`,
  `commission_agency_rate`.
- **Novos paths** no client tipado: `/api/v1/brokers`, `/api/v1/agencies`.
- **`Project` (empreendimento) ganhou ~16 campos novos** (CNPJ, razão social, registros, alvarás etc. — ver §3).

> Faça o bump em um PR isolado e rode o type-check — assim os erros de compilação já apontam todos os
> pontos do front que tocam contratos que mudaram.

---

## 1. Padrões do projeto (leia antes de criar telas novas)

Para os CRUDs novos (corretor, imobiliária) **copie o módulo `clientes`**, que é o padrão canônico:

| Camada | Onde | Exemplo (clientes) |
|---|---|---|
| Página de lista | `pages/{dominio}/+Page.tsx` | `pages/clientes/+Page.tsx` |
| Página de criação | `pages/{dominio}/novo/+Page.tsx` | `pages/clientes/novo/+Page.tsx` |
| Detalhe | `pages/{dominio}/@id/+Page.tsx` | `pages/clientes/@id/+Page.tsx` |
| Edição | `pages/{dominio}/@id/editar/+Page.tsx` | `pages/clientes/@id/editar/+Page.tsx` |
| Colunas/tabela/filtros/paginação | `src/components/{dominio}/{x}-columns.tsx`, `-table.tsx`, `-filters.tsx`, `-pagination.tsx` | `src/components/clientes/` |
| Formulário | `src/components/{dominio}/{dominio}-form.tsx` | `src/components/customers/customer-pf-form.tsx` |
| Hook de listagem | `src/hooks/use-{dominio}-table.ts` | `src/hooks/use-customers-table.ts` |
| Schema (Zod) | `src/schemas/{dominio}.schema.ts` | `src/schemas/customer.schema.ts` |

**Como chamar a API** (padrão visto em `pages/clientes/novo/+Page.tsx`):

```ts
const { client } = useApiClient()
const createMutation = useMutation({
  mutationFn: async (data) => {
    const { data: res, error } = await client.POST('/api/v1/brokers', { body: { ... } })
    if (error) throwApiError(error, 'Falha ao cadastrar corretor')
    return res
  },
})
// no submit: try { await createMutation.mutateAsync(data) } catch (e) { handleApiError(e, '...') }
```

- Erros: sempre `throwApiError` / `handleApiError` de `@/lib/api-error`.
- Tenant + auth (`X-Tenant-ID` + token Firebase) são injetados automaticamente pelo client.
- Valores monetários: `<CurrencyInput>` (`src/components/ui/currency-input.tsx`), exibição com `formatCentsToDisplay`.
- CPF/CNPJ/telefone/CEP: já existem inputs/máscaras (ver `src/components/ui/` e o módulo `customers`).

---

## 2. Nova Proposta (tela de venda) — a maior frente

**Arquivos centrais:** `src/components/vendas/sale-form.tsx` (criação, ~757 linhas),
`src/components/vendas/sale-edit-form.tsx` (edição), `src/schemas/sale.schema.ts`,
`src/lib/installment-utils.ts`, `src/components/ui/unit-autocomplete.tsx`.

### 2.1 Separar empreendimento × unidade em um step ✅

**Estado atual:** empreendimento e unidade são escolhidos **juntos** via `<UnitAutocomplete>`
(`src/components/ui/unit-autocomplete.tsx`): busca direto em `/api/v1/units?status=available` e o nome
do empreendimento aparece só como texto secundário (derivado de `project_id`). É um form único, sem steps.

**Objetivo:** separar em duas escolhas explícitas e, idealmente, transformar a tela em um **wizard**:

- **Step 1 — Imóvel:** escolher **empreendimento** primeiro (`/api/v1/projects`), depois a **unidade**
  daquele empreendimento (`/api/v1/units?project_id=…&status=available`).
- **Step 2 — Financeiro:** montar parcelas, índice, mediação (corretor/imobiliária), etc.

**API:** ✅ já dá. `/api/v1/projects` (lista/autocomplete de empreendimento) e `/api/v1/units` filtrável
por `project_id`. Confirmar o filtro `project_id` no client tipado.

**Front:** usar o `<ProjectAutocomplete>` que **já existe** (`src/components/ui/project-autocomplete.tsx`)
e fazer o `<UnitAutocomplete>` aceitar `projectId` como filtro — hoje ele busca `/api/v1/units` **sem**
filtrar por empreendimento (só monta um mapa de nomes de projeto). Quebrar `sale-form.tsx` em
sub-componentes por step (o arquivo já está grande — bom momento pra dividir).

**UX:** wizard com 2 (ou 3) passos, resumo financeiro fixo (já existe na coluna direita) visível no step financeiro.

### 2.2 Mais de uma entrada + entrada via bem (asset) ✅

**Estado atual:** o form aceita **uma** entrada (valor + data específica).

**Objetivo:** permitir **N entradas** (parcelamento do sinal), e cada entrada poder ser paga via **bem**
(veículo, imóvel, terreno, barco) em vez de dinheiro.

**API:** ✅ pronto. No `installment_schedules[]`:
- **Multi-entrada:** declarar vários itens com `kind="entry"`, cada um com `quantity=1` e seu `specific_date`.
- **Entrada via bem:** item `kind="entry"` + `payment_method="asset"` + bloco `asset_proposal`:
  ```jsonc
  {
    "kind": "entry", "quantity": 1, "amount_cents": 5000000,
    "specific_date": "2026-07-01", "payment_method": "asset",
    "asset_proposal": {
      "type": "vehicle",                  // vehicle | real_estate | land | boat
      "description": "Honda Civic 2022",
      "appraisal_amount": 5000000,        // centavos
      "appraisal_date": "2026-05-01",
      "appraisal_source": "FIPE 05/2026", // opcional
      "asset_metadata": { /* chaves obrigatórias por tipo (abaixo) */ }
    }
  }
  ```
  Chaves obrigatórias de `asset_metadata` por tipo:
  - `vehicle`: plate, renavam, brand, model, year
  - `real_estate`: address, property_type, area_sqm, registration_number
  - `land`: address, area_sqm, registration_number
  - `boat`: registration, length_meters, brand, model, year

  Regra: `payment_method="asset"` exige `kind="entry"` (asset só na entrada).

**Front:** no bloco de entrada, permitir adicionar várias entradas; ao escolher método "Bem", abrir um
sub-form de `asset_proposal` com campos condicionais por `type`. Refletir no `sale.schema.ts` (Zod) as
mesmas regras (asset ⇒ entry, metadata obrigatória por tipo).

**UX:** "Adicionar entrada"; cada entrada com seletor de método; método "Bem" expande o sub-form do bem.

### 2.3 Tipo de parcela "entrega das chaves" (`key_delivery`) ✅

**Estado atual:** não existe na UI.

**Objetivo:** permitir parcela de **entrega das chaves** — pagamento único no momento do handover
(ver `docs/domain/sales-contracts.md` no repo da API para a semântica do fluxo de venda).

**API:** ✅ `InstallmentKind.key_delivery` já é aceito em `installment_schedules[].kind`.

**Front:** adicionar `key_delivery` aos labels/opções de tipo de parcela em `sale.schema.ts` e à montagem.

### 2.4 Melhorar a UX da "montagem" das parcelas ✅

**Estado atual:** linhas com quantidade/valor/tipo/método/recorrência, botões "Mensais"/"Anuais".

**Objetivo:** UI mais clara para montar grupos de parcelas (entrada(s), regulares, balões/reforços,
entrega das chaves, extras), com o resumo financeiro batendo com o que a API vai materializar.

**Front:** revisar `sale-form.tsx` + `installment-utils.ts` (cálculo de datas) considerando os novos
`kind` e as periodicidades. Vale extrair um componente "construtor de parcelas".

### 2.5 Mais periodicidades das parcelas ✅

**Estado atual:** só mensal e anual.

**Objetivo:** bimestral, trimestral, semestral.

**API:** ✅ **entregue** ([construct-pro-api#94](https://github.com/cacenot/construct-pro-api/issues/94),
PR #96). `RecurrenceType` agora aceita `monthly · bimonthly · quarterly · semestral · yearly`, e o
schedule service materializa todas por uma fonte única de datas (`schedule_dates`) — o preview da
proposta nunca diverge das parcelas geradas.

**Front:** adicionar `bimonthly`/`quarterly`/`semestral` ao seletor de recorrência e ajustar o cálculo
de datas em `installment-utils.ts` — intervalos de 2/3/6 meses a partir de `start_date`, ancorado em
`recurrence_day`, com clamp de fim de mês (dia 31 em fevereiro → 28/29). Espelha o `schedule_dates` do
backend.

### 2.6 Índice (index type) por grupo de parcelas ⚠️

**Estado atual:** índice **único** por proposta — campo `index_type_code` global (dropdown de
`/api/v1/index-types`).

**Objetivo:** deixar **evidente na UI** que o índice agora é por **grupo de parcelas**. Requisito de
produto: ainda dá pra escolher "um índice para a proposta inteira" pela UI (que preenche todos os
grupos), mas internamente é por parcela.

**API:** ⚠️ **bloqueado.** Hoje `index_type_code` só existe no nível da venda (`SaleCreate`). O
`Installment` materializado já tem índice por parcela, mas o DTO de proposta `InstallmentScheduleConfig`
**não** carrega `index_type_code` por grupo. → **Follow-up:**
[construct-pro-api#93](https://github.com/cacenot/construct-pro-api/issues/93).

**Front (quando destravar):** mover o seletor de índice para dentro de cada grupo de parcelas, com um
toggle "usar o mesmo índice para toda a proposta" que replica a escolha. `entry` não tem índice.

### 2.7 Vincular corretor e imobiliária à venda (+ comissão) ✅

**Estado atual:** a venda não tem campos de mediação.

**Objetivo:** na proposta, escolher **corretor** e/ou **imobiliária** e suas **taxas de comissão**.

**API:** ✅ `SaleCreate`/`SaleUpdate` aceitam:
- `broker_id` (opcional) + `commission_broker_rate` (**obrigatório e > 0 quando `broker_id` setado**)
- `agency_id` (opcional) + `commission_agency_rate` (**obrigatório e > 0 quando `agency_id` setado**)

Regras de negócio (refletir no Zod):
- **Imobiliária exige corretor**: setar `agency_id` exige `broker_id` presente.
- **Taxas são `Rate` em PPM** (1% = 10.000 PPM). O input deve ser em % e converter para PPM.
- `commission_broker_rate + commission_agency_rate <= TenantConfig.max_commission_rate`.
- No PATCH, limpar o id exige limpar a taxa no mesmo request.
- A comissão efetiva (`SaleResponse.commission`) é um **snapshot imutável criado no approve** — só aparece depois de aprovado.

**Front:** seletores `<BrokerAutocomplete>` / `<AgencyAutocomplete>` (criar, consumindo `/api/v1/brokers`
e `/api/v1/agencies`) + inputs de taxa em %. Precisa de um `<RateInput>` (% → PPM) análogo ao
`CurrencyInput` — **não existe ainda** (confirmado: nenhum input de taxa/percentual em `src/components/ui/`), criar.

### 2.8 Teto de parcelas por mês-calendário ✅

**Estado atual:** sem limite — entrada + mensal + anual podem empilhar livremente num mesmo mês.

**Objetivo:** guardrail configurável por tenant. No mercado-alvo a venda é entrada + mensais + anuais,
então é normal 2 parcelas coincidirem num mês (a mensal e a anual). Um cap evita empilhamento acidental
(ex.: 3+ no mesmo mês) ao montar a proposta.

**API:** ✅ **entregue** ([construct-pro-api#97](https://github.com/cacenot/construct-pro-api/issues/97)).
Nova config `TenantConfig.max_installments_per_month` (int **1–5, default 2**) exposta em
`GET`/`PATCH /api/v1/tenant-config`. Ao montar a proposta, `POST`/`PATCH /api/v1/sales` rejeita com
**422** (`error_code` `SALE_INSTALLMENTS_PER_MONTH_EXCEEDS_CAP`, com `details.month`/`count`/`cap`)
quando algum mês-calendário excede o cap. Conta **todas** as parcelas do mês, **entrada inclusive**.
Propostas já existentes não são revalidadas (grandfathering).

**Front:**
- **Montagem da proposta:** pré-validar localmente (somar as `due_date` por mês-calendário ≤ cap) para
  feedback imediato e tratar o 422 do backend. O cap vem do `TenantConfig` — incluir no fetch do config
  do tenant.
- **Configuração do tenant:** nova **range bar** (1–5, default 2) para `max_installments_per_month`, ao
  lado do `max_commission_rate`.

---

## 3. Empreendimento — completar o formulário ✅ — 🔴 PENDENTE (Epic 4 — a criar)

**Arquivos:** `src/components/projects/project-form.tsx`, `src/schemas/project.schema.ts`,
`src/components/ui/cep-input.tsx`.

**Estado atual (form só tem):** `name`, `status`, `description`, endereço (CEP/cidade/UF/logradouro/
número/bairro), `floors`, `delivery_date`, `features`. **Não tem CNPJ nem os campos jurídicos/registrais.**

**Objetivo:** adicionar os campos que a API já aceita (todos opcionais salvo indicação):

| Grupo | Campos (nome na API) | Observação |
|---|---|---|
| Construção | `total_area` | área total (string) |
| Pessoa jurídica (SPE) | `cnpj`, `legal_name` (razão social), `trade_name` (nome fantasia) | quando vazios, herdam do tenant; `cnpj` único por tenant |
| Inscrições | `state_registration` (IE), `municipal_registration` (IM) | |
| Incorporação / alvarás | `incorporation_registry_number` (R.I.), `mother_property_registration` (matrícula mãe), `cno` (Cadastro Nacional de Obras, 12 dígitos), `construction_permit_number` (alvará), `occupancy_permit_number` (habite-se) | |
| Mídia / progresso | `construction_photos[]`, `project_photos[]`, `progress_updates[]` (`{created_at, percentage 0–100, description, status}`) | upload/galeria — escopo maior, pode ficar pra depois |

**Front:** agrupar em seções (Dados gerais / Localização / Pessoa jurídica / Registros e alvarás /
Mídia e progresso). Máscara de CNPJ já existe no módulo de clientes PJ (reaproveitar). Refletir no Zod.

---

## 4. Corretor (broker) — módulo novo ✅ — 🔴 PENDENTE (Story 2.2 — a criar via @sm)

**Estado atual:** não existe tela.

**API:** ✅ CRUD completo em `/api/v1/brokers` (permissões `brokers:*`):
`POST` (criar), `GET` (lista paginada/busca), `GET /{id}`, `PATCH /{id}`, `DELETE /{id}` (soft-delete).

Campos do broker:
- `cpf` (único)
- `full_name` (3–120)
- `creci` (5–20, único)
- `email` (opcional)
- `phone` (opcional, E.164)

**Front:** criar módulo seguindo o padrão `clientes` (§1):
- `pages/corretores/+Page.tsx` (lista), `/novo`, `/@id`, `/@id/editar`
- `src/components/corretores/*` (columns/table/filters/pagination + `broker-form.tsx`)
- `src/hooks/use-brokers-table.ts`, `src/schemas/broker.schema.ts`

---

## 5. Imobiliária (agency) — módulo novo ✅ — 🔴 PENDENTE (Story 2.3 — a criar via @sm)

**Estado atual:** não existe tela.

**API:** ✅ CRUD completo em `/api/v1/agencies` (permissões `agencies:*`):
mesmos verbos do broker. Busca cobre `legal_name`, `trade_name`, `cnpj`, `creci_j`.

Campos da agency:
- `cnpj` (único)
- `legal_name` (razão social, 3–160)
- `trade_name` (nome fantasia, opcional, 0–120)
- `creci_j` (5–20, único)
- `email` (opcional)
- `phone` (opcional, E.164)

**Front:** módulo `pages/imobiliarias/*` + `src/components/imobiliarias/*` + `use-agencies-table.ts` +
`src/schemas/agency.schema.ts`, mesmo padrão.

---

## 6. Relatório de comissões ⚠️

**Estado atual:** não existe tela.

**Objetivo:** relatório/listagem de comissões (por corretor, por imobiliária, por período).

**API:** ⚠️ **bloqueado.** `Commission` existe só como snapshot por venda, exposto via
`SaleResponse.commission` (`GET /api/v1/sales/{id}`). **Não há** endpoint de listagem/agregação.
→ **Follow-up:** [construct-pro-api#95](https://github.com/cacenot/construct-pro-api/issues/95).

**Campos do snapshot** (`CommissionResponse`): `sale_id`, `broker_id?`, `agency_id?`, `broker_rate?`,
`agency_rate?`, `broker_amount?`, `agency_amount?`, `total_amount`, `sale_amount_at_approval`,
`created_at`, + `broker`/`agency` aninhados.

**Front (quando destravar):** tela de listagem com filtros (corretor, imobiliária, período) + cards de
totais; padrão de tabela igual aos demais módulos. Antes do endpoint sair, dá pra prototipar a UI, mas
não dá pra alimentar com dados reais.

---

## 7. Navegação

Onde encaixar as telas novas no menu (`src/components/top-navbar.tsx` — hoje: Início · Clientes ·
Empreendimentos[Empreendimentos, Unidades] · Comercial[Vendas, Contratos] · Financeiro):

- **Comercial** → adicionar **Corretores** e **Imobiliárias** (ou um agrupador "Cadastros").
- **Comissões** → item dedicado (sob Comercial ou Financeiro) — só quando a tela existir (§6).

---

## 8. Gaps de API / follow-ups abertos

Os itens abaixo **dependem de mudança no backend** antes do trabalho de frontend. Issues já abertas no
`construct-pro-api`:

| # | Issue | Destrava |
|---|---|---|
| ⚠️ | [#93 — index_type por grupo de parcelas](https://github.com/cacenot/construct-pro-api/issues/93) | §2.6 |
| ✅ | [#94 — periodicidades além de mensal/anual](https://github.com/cacenot/construct-pro-api/issues/94) — entregue (PR #96) | §2.5 |
| ✅ | [#97 — teto de parcelas por mês](https://github.com/cacenot/construct-pro-api/issues/97) — entregue (PR stack sobre #96) | §2.8 |
| ⚠️ | [#95 — endpoint de relatório de comissões](https://github.com/cacenot/construct-pro-api/issues/95) | §6 |

Tudo o que está marcado ✅ não depende dessas issues e pode tocar em paralelo.

---

## 9. Nota: doc de domínio da API está desatualizada

`construct-pro-api/docs/domain/sales-contracts.md` ainda descreve os tipos de parcela como
`entry/monthly/yearly/extra`. O código já migrou para `kind` (`entry · regular · balloon · key_delivery
· extra`) **separado** de `periodicity`. Ao validar o comportamento da venda, confie no código/no OpenAPI,
não nessa doc — e vale sinalizar a atualização dela.

---

## Resumo de prioridade sugerida

1. **Bump do API client para 1.0.0** (§0) — 🟢 EXECUTADO (Story 2.1).
2. **Empreendimento** (§3) e **CRUDs de corretor/imobiliária** (§4, §5) — ✅ independentes, baixo risco.
3. **Nova Proposta** ✅ (§2.1 step, §2.2 multi-entrada/asset, §2.3 key_delivery, §2.4 UX, §2.7 mediação).
4. **Itens ⚠️** (§2.6 índice por grupo, §6 comissões) — conforme #93/#95 forem entregues. §2.5 periodicidades e §2.8 cap de parcelas/mês já têm backend entregue (#94 PR #96 / #97 stack), prontos para o front.

---

## 10. Backlog de Execução — Estado Atual das Stories

> Atualizado em 2026-05-31 por `@po (Pax)`.

### Stories Concluídas

| Story | Título | Épico | Status |
|-------|--------|-------|--------|
| **2.1** | Bump API client 1.0.0 | Epic 2 | ✅ **Done** |
| **2.2** | Módulo Corretor (CRUD completo) | Epic 2 | ✅ **Done** |
| **2.3** | Módulo Imobiliária (CRUD completo) | Epic 2 | ✅ **Done** |
| **3.1** | Comissão na Criação de Proposta | Epic 3 | ✅ **Done** |
| **3.2** | Comissão na Edição e Exibição de Proposta | Epic 3 | ✅ **Done** |

### Stories Existentes (em andamento)

| Story | Título | Épico | Status | Ação necessária |
|-------|--------|-------|--------|----------------|
| **1.1** | Lista de Vendas | Epic 1 | 📝 **Draft** | `@po *validate-story-draft 1.1` |

### Stories a Criar (via `@sm`)

| Story | Título | Épico | Dependência | Seção DIRECIONAMENTO |
|-------|--------|-------|-------------|---------------------|
| **4.1** | Wizard step empreendimento × unidade | Epic 4 | — | §2.1 |
| **4.2** | Periodicidades bimestral/trimestral/semestral | Epic 4 | — | §2.5 |
| **4.3** | Multi-entrada + entrada via bem (asset) | Epic 4 | — | §2.2 |
| **4.4** | UX de montagem de parcelas | Epic 4 | — | §2.4 |
| **4.5** | Teto de parcelas por mês (cap + config tenant) | Epic 4 | — | §2.8 |
| **5.1** | Empreendimento — completar formulário | Epic 5 | — | §3 |
| **1.2** | Criação de Proposta (form base) | Epic 1 | Story 1.1 | §2 (estado atual) |
| **1.3** | Detalhe de Venda | Epic 1 | Story 1.2 | — |
| **1.4** | Edição de Proposta | Epic 1 | Story 1.3 | — |
| **1.5** | Assinatura de Contrato | Epic 1 | Story 1.4 | — |
| **1.6** | Registro de Pagamento Manual | Epic 1 | Story 1.5 | — |
| **1.7** | Cancelamento e Rescisão | Epic 1 | Story 1.6 | — |

> Stories 1.2–1.7 estão definidas no `epic-1-vendas-contratos.md` mas sem arquivos `.story.md` criados.

### Épicos Existentes

| Épico | Escopo | Status |
|-------|--------|--------|
| **Epic 1** | Módulo de Vendas e Contratos | 🟡 Em andamento |
| **Epic 2** | Corretores + Imobiliárias + API bump | ✅ **Done** |
| **Epic 3** | Comissão na proposta | ✅ **Done** |
| **Epic 4** | Nova Proposta — melhorias pós-API 1.0.0 | 📋 **Criado** — aguarda `@sm *draft` |
| **Epic 5** | Empreendimento — completar formulário | 📋 **Criado** — aguarda `@sm *draft` |
| **Epic 6** | Relatório de Comissões | ⚠️ **Condicional** — bloqueado API #95 |

### Próxima Ação Recomendada

```
Prioridade 1 (paralelas, independentes):
  @sm *draft → Story 4.1 (Wizard step) — epic: epic-4-nova-proposta-melhorias.md
  @sm *draft → Story 4.2 (Periodicidades) — epic: epic-4-nova-proposta-melhorias.md
  @sm *draft → Story 5.1 (Empreendimento campos) — epic: epic-5-empreendimento-campos.md

Prioridade 2:
  @po *validate-story-draft 1.1
  @sm *draft → Stories 4.3–4.5 (Multi-entrada, UX parcelas, Teto)

Prioridade 3 (condicional — após API #95):
  @sm *draft → Stories do Epic 6 (Relatório de Comissões)
```
