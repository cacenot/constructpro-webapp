# Roadmap — ConstructPro Frontend

> Atualizado em 2026-05-31 por `@po (Pax)`.
> Referência técnica: `DIRECIONAMENTO-FRONTEND.md`

---

## Legenda

| Badge | Significado |
|-------|-------------|
| ✅ Done | Implementado, mergeado, critérios de pronto atendidos |
| 🔄 InReview | Dev completo, aguardando QA gate |
| 📝 Draft | Story criada, ainda não iniciada |
| 🔴 Pendente | Story/épico a criar via `@sm` |
| ⚠️ Bloqueado | Aguarda dependência externa (API) |

---

## ✅ Epic 2 — Módulo de Corretores e Imobiliárias

> Brownfield Enhancement · **Done** · Mergeado em main

Infraestrutura comercial: bump do cliente de API para 1.0.0, CRUD de corretores e imobiliárias com
navegação integrada ao menu "Comercial".

| Story | Título | Status |
|-------|--------|--------|
| **2.1** | Bump do API client para 1.0.0 | ✅ Done |
| **2.2** | Módulo Corretor (CRUD completo) | ✅ Done |
| **2.3** | Módulo Imobiliária (CRUD completo) | ✅ Done |

> **Débito técnico:** Testes E2E diferidos como `[EPIC2-T1]`.

---

## ✅ Epic 3 — Módulo de Propostas (Comissão)

> Brownfield Enhancement · **Done** · Mergeado em main

Vincula corretor/imobiliária à venda com campos de comissão na criação e edição de propostas.

| Story | Título | Status |
|-------|--------|--------|
| **3.1** | Comissão na Criação de Proposta | ✅ Done |
| **3.2** | Comissão na Edição e Exibição de Proposta | ✅ Done |

---

## 🔴 Epic 4 — Nova Proposta: Melhorias pós-API 1.0.0

> **Próximo épico** · Status: Ready · Stories a criar via `@sm`

Completa o formulário de Nova Proposta com funcionalidades da API 1.0.0 ainda não expostas no
frontend: wizard empreendimento × unidade, multi-entrada, periodicidades novas e teto de parcelas.

| Story | Título | Status | Dependência |
|-------|--------|--------|-------------|
| **4.1** | Wizard step empreendimento × unidade | 🔴 Pendente | — |
| **4.2** | Periodicidades bimestral/trimestral/semestral | 🔴 Pendente | — |
| **4.3** | Multi-entrada + entrada via bem (asset) | 🔴 Pendente | — |
| **4.4** | UX de montagem de parcelas | 🔴 Pendente | 4.1, 4.2, 4.3 |
| **4.5** | Teto de parcelas por mês (cap + config tenant) | 🔴 Pendente | 4.4 |
| **4.6** | Índice por grupo de parcelas | ⚠️ Bloqueado | API #93 |

**Sequência de execução:**
```
Story 4.1 (Wizard) ─┐
Story 4.2 (Period.) ─┤─► Story 4.4 (UX builder) ─► Story 4.5 (Teto)
Story 4.3 (Asset)  ─┘
```

---

## 🔴 Epic 5 — Empreendimento: Completar Formulário

> Status: Ready · Stories a criar via `@sm`

Expõe os ~16 campos que a API já aceita mas o frontend não renderiza: dados de pessoa jurídica (SPE),
inscrições estadual/municipal, registros de incorporação, alvarás e campos de construção.

| Story | Título | Status |
|-------|--------|--------|
| **5.1** | Campos jurídicos, registrais e de construção | 🔴 Pendente |

---

## ⚠️ Epic 6 — Relatório de Comissões \[BLOQUEADO\]

> Status: Blocked · Aguarda **API #95**

Tela de listagem e relatório de comissões por corretor, imobiliária e período, com cards de totais
e exportação.

> **Bloqueio:** `construct-pro-api#95` — não existe endpoint de listagem/agregação de comissões.
> Hoje `Commission` está disponível apenas via `SaleResponse.commission` (detalhe por venda).

| Story | Título | Status |
|-------|--------|--------|
| **6.1** | Listagem de Comissões | ⚠️ Bloqueado |

**Ação:** Criar story detalhada via `@sm` quando API #95 for entregue e endpoint confirmado.

---

## 📝 Epic 1 — Módulo de Vendas e Contratos

> Brownfield Enhancement · Status: Ready · Parcialmente iniciado

Módulo central: lista, criação, detalhe, edição, assinatura, pagamentos e cancelamento de propostas.

| Story | Título | Status | Observação |
|-------|--------|--------|------------|
| **1.1** | Lista de Vendas | 📝 Draft | Story criada, aguarda `@po *validate-story-draft 1.1` |
| **1.2** | Criação de Proposta (form base) | 🔴 Pendente | Depende Story 1.1 |
| **1.3** | Detalhe de Venda | 🔴 Pendente | Depende Story 1.2 |
| **1.4** | Edição de Proposta | 🔴 Pendente | Depende Story 1.3 |
| **1.5** | Assinatura de Contrato | 🔴 Pendente | Depende Story 1.4 |
| **1.6** | Registro de Pagamento Manual | 🔴 Pendente | Depende Story 1.3 |
| **1.7** | Cancelamento e Rescisão | 🔴 Pendente | Depende Story 1.4 |

> **Nota:** Epic 1 foi parcialmente coberto pelos Epics 2 e 3 (formulário de Nova Proposta, edição
> e comissão). As stories 1.2–1.4 precisam considerar o que já foi implementado.

---

## Visão Geral — Progresso

```
Epic 1  [Vendas e Contratos]          ░░░░░░░░░░  1/7 stories iniciadas
Epic 2  [Corretores e Imobiliárias]   ██████████  3/3 ✅ DONE
Epic 3  [Propostas — Comissão]        ██████████  2/2 ✅ DONE
Epic 4  [Nova Proposta — Melhorias]   ░░░░░░░░░░  0/5 stories criadas (4.6 bloqueada)
Epic 5  [Empreendimento — Campos]     ░░░░░░░░░░  0/1 story criada
Epic 6  [Relatório de Comissões]      ⚠️⚠️⚠️⚠️⚠️  Bloqueado API #95
```

**Total entregue:** 5 stories (Epics 2 + 3)
**Próxima ação:** `@sm *draft` para stories do Epic 4

---

## Próximos Passos

1. **Agora:** `@sm` cria stories 4.1 → 4.3 (paralelas, sem dependência entre si)
2. **Depois:** stories 4.4 → 4.5 em sequência
3. **Paralelo:** `@po *validate-story-draft 1.1` para desbloquear Epic 1
4. **Quando API #93 entregar:** criar story 4.6
5. **Quando API #95 entregar:** `@sm` detalha story 6.1

— Pax, equilibrando prioridades 🎯
