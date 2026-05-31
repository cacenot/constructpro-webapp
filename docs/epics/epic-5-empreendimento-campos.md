# Epic 5: Empreendimento — Completar Formulário

## Objetivo do Épico

Completar o formulário de empreendimento com os ~16 campos que a API já aceita mas o frontend não
expõe: dados de pessoa jurídica (SPE), inscrições estadual/municipal, registros de incorporação,
alvarás e campos de construção.

---

## Contexto do Sistema Existente

- **Funcionalidade atual:** `src/components/projects/project-form.tsx` só tem `name`, `status`,
  `description`, endereço (CEP/cidade/UF/logradouro/número/bairro), `floors`, `delivery_date`,
  `features`. Não tem CNPJ nem campos jurídicos/registrais.
- **Technology stack:** React 19 + TypeScript 5.9 + Vite 7 + TanStack Query v5 + shadcn/ui + Zod +
  react-hook-form + `@cacenot/construct-pro-api-client@1.0.0`
- **Integration points:**
  - `src/components/projects/project-form.tsx` — formulário principal
  - `src/schemas/project.schema.ts` — schema Zod
  - `src/components/ui/cep-input.tsx` — input de CEP (já existe)
  - Máscara CNPJ já existe no módulo `customers` PJ — reaproveitar
  - `PATCH /api/v1/projects/{id}` + `POST /api/v1/projects`

---

## Detalhes do Incremento

**O que está sendo adicionado:**

Todos os campos são **opcionais** na API (salvo indicação). Quando `cnpj`/`legal_name` vazios,
herdam os dados do tenant — comportamento a refletir na UX (placeholder/hint).

| Grupo | Campos (nome na API) | Observação |
|---|---|---|
| Construção | `total_area` | área total (string livre) |
| Pessoa jurídica (SPE) | `cnpj`, `legal_name` (razão social), `trade_name` (nome fantasia) | `cnpj` único por tenant; quando vazio herda tenant |
| Inscrições | `state_registration` (IE), `municipal_registration` (IM) | string livre |
| Incorporação / alvarás | `incorporation_registry_number` (R.I.), `mother_property_registration` (matrícula mãe), `cno` (12 dígitos — Cadastro Nacional de Obras), `construction_permit_number` (alvará de construção), `occupancy_permit_number` (habite-se) | |
| Mídia / progresso | `construction_photos[]`, `project_photos[]`, `progress_updates[]` | escopo separado — **fora desta story**, débito técnico futuro |

---

## Referência de Domínio

`DIRECIONAMENTO-FRONTEND.md` §3

---

## Stories

### Story 5.1 — Empreendimento: campos jurídicos, registrais e de construção

**Descrição:** Expandir o formulário de empreendimento com os grupos Pessoa Jurídica, Inscrições,
Incorporação/Alvarás e Construção. Organizar em seções colapsáveis dentro do form existente.
Campos de mídia/progresso fora do escopo desta story.

**Executor Assignment:** `executor: @dev`, `quality_gate: @architect`
**Quality Gate Tools:** `[form_validation, schema_review, mask_validation]`
**UX Gate:** `@ux-design-expert` produz spec antes de `@dev` iniciar.

**Escopo:**
- `src/schemas/project.schema.ts` — adicionar todos os campos opcionais com validações:
  - `cnpj`: formato CNPJ, único por tenant (validação server-side via 409)
  - `cno`: 12 dígitos (validar formato)
  - Demais: string opcional, sem máscara especial
- `src/components/projects/project-form.tsx` — adicionar seções ao form:
  - **Dados Gerais** (já existente: name, status, description, total_area)
  - **Localização** (já existente: CEP, logradouro, etc.)
  - **Pessoa Jurídica (SPE)** — CNPJ (máscara do módulo `customers` PJ), razão social, nome fantasia;
    hint: "Quando vazio, herda os dados da organização"
  - **Registros e Alvarás** — R.I., matrícula mãe, CNO, alvará de construção, habite-se
  - **Inscrições** — IE, IM
- `pages/empreendimentos/novo/+Page.tsx` e `pages/empreendimentos/@id/editar/+Page.tsx` — sem mudança
  de rota; apenas o form ganha os novos campos

**AC principais:**
- Todos os campos novos aparecem no form de criação e edição
- Máscara CNPJ idêntica à do módulo `customers` PJ
- CNO aceita apenas 12 dígitos
- Campos opcionais não bloqueiam submit quando vazios
- Hint em CNPJ/legal_name explicando herança do tenant quando vazio
- `npm run build` limpo, `npm run lint` sem warnings
- Sem regressão no form existente (name, status, endereço, floors, delivery_date, features)

**Fora do escopo:**
- `construction_photos`, `project_photos`, `progress_updates` — escopo maior, débito técnico futuro

---

## Requisitos de Compatibilidade

- [ ] Form de criação/edição existente sem regressão de comportamento
- [ ] Empreendimentos já cadastrados sem os novos campos continuam editáveis normalmente
- [ ] Máscara CNPJ idêntica à usada no módulo `customers` PJ

---

## Testes

**Manuais bloqueantes:**
- Criar empreendimento sem campos novos (fluxo existente) → deve funcionar igual
- Criar empreendimento com CNPJ → validar máscara e unicidade (409 da API)
- CNO com menos/mais de 12 dígitos → validação inline deve bloquear submit

---

## Definition of Done

- [ ] Story 5.1 concluída e QA gate PASS/CONCERNS documentado
- [ ] `npm run build` limpo
- [ ] `npm run lint` sem warnings
- [ ] Sem regressão no CRUD de empreendimentos existente

---

## Metadata

```yaml
epic_id: epic-5
status: Ready
created_by: "@po (Pax)"
created_at: "2026-05-31"
domain_reference: DIRECIONAMENTO-FRONTEND.md (§3)
stories_count: 1
risk_level: LOW
priority: "Média — independente, baixo risco, melhora dados cadastrais do produto"
next_agent: "@sm"
next_command: "*draft epic-5-empreendimento-campos.md"
dependencies:
  - "Epic 2: API client 1.0.0 ✅ (campos já no contrato da API)"
out_of_scope:
  - "construction_photos, project_photos, progress_updates — débito técnico futuro"
```
