---
version: "1.0"
last_updated: "2026-05-30"
created_by: "@po (Pax)"
---

# Story Backlog

Itens de débito técnico, follow-ups e otimizações rastreados por story/épico.

---

## 🔴 HIGH Priority

*(nenhum item no momento)*

---

## 🟡 MEDIUM Priority

#### [EPIC2-T1] Testes E2E com Playwright — Épico 2 (Corretores e Imobiliárias)

- **Source**: Decisão de PO — 2026-05-30
- **Priority**: 🟡 MEDIUM
- **Effort**: 4–8 horas
- **Status**: 📋 TODO
- **Assignee**: @dev + @devops
- **Sprint**: A definir
- **Description**: Os testes E2E com Playwright para o Épico 2 foram deferidos por inviabilidade de execução neste ciclo. As specs já foram criadas pelo @dev durante a implementação, mas a execução não foi possível. Este débito cobre a execução e validação completa das suítes E2E dos três módulos do épico.
- **Contexto**: Spec criada: `tests/e2e/corretores/broker-crud.spec.ts` (5 cenários: lista, criação, edição, soft-delete, busca). Stories 2.1 e 2.3 têm cenários planejados mas specs não criadas.
- **Success Criteria**:
  - [ ] `npx playwright test tests/e2e/corretores/` → 100% pass (Story 2.2 — spec já existe)
  - [ ] Criar e executar `e2e/regression/api-bump.spec.ts` → 100% pass (Story 2.1 — cenários: login, clientes, projetos, vendas sem erro)
  - [ ] Criar e executar `e2e/imobiliarias/` → 100% pass (Story 2.3 — após implementação)
  - [ ] CI pipeline passa com suíte E2E completa do épico
- **Acceptance**: `npx playwright test e2e/` passa 100% sem erros para todos os módulos do Épico 2.
- **Referências**:
  - `docs/epics/epic-2-corretores-imobiliarias.md` — seção "Testes E2E"
  - `docs/stories/2.2.story.md` — AC 18, Task 9
  - `docs/stories/2.1.story.md` — Task 7

---

## 🟢 LOW Priority

*(nenhum item no momento)*

---

## Estatísticas

| Métrica | Valor |
|---------|-------|
| Total de itens | 1 |
| 🔴 HIGH | 0 |
| 🟡 MEDIUM | 1 |
| 🟢 LOW | 0 |
| 📋 TODO | 1 |
| 🚧 IN PROGRESS | 0 |
| ✅ DONE | 0 |

---

*Gerenciado por @po (Pax) — `*backlog-review` para visão de sprint*
