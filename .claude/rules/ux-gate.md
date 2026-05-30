---
paths:
  - "src/components/**"
  - "pages/**"
  - "docs/stories/**"
---

# UX Gate — Regra de Bloqueio para Stories com Interface

## Propósito

Garantir que **nenhuma tela, página, componente visual ou form** seja implementado por `@dev` antes que `@ux-design-expert` tenha documentado o design e o comportamento esperado.

---

## Quando Esta Regra Ativa

Esta regra ativa para **qualquer story** cujo título, scope ou Acceptance Criteria contenha um ou mais dos seguintes termos:

```
tela | página | page | screen | componente | component
modal | dialog | form | formulário | dashboard | card
lista | table | tabela | UI | layout | view
```

---

## Artefato Exigido

`@ux-design-expert` deve produzir **antes** do @dev iniciar:

```
docs/stories/{epicNum}.{storyNum}-ux-spec.md
```

**Exemplo:** Story `3.2.story.md` → UX spec em `docs/stories/3.2-ux-spec.md`

### Conteúdo mínimo obrigatório do UX spec

O arquivo deve conter ao menos:

```markdown
## Objetivo da tela / componente
## Fluxo principal do usuário
## Estados da UI (loading, empty, error, success)
## Comportamentos esperados (interações, validações visuais)
## Referências (Figma, design system tokens, componentes shadcn)
```

Se alguma seção não se aplica, marcar explicitamente como `N/A`.

---

## Regra de Bloqueio para @dev

**ANTES** de iniciar qualquer implementação de tela/componente, @dev DEVE:

1. Verificar existência de `docs/stories/{epicNum}.{storyNum}-ux-spec.md`
2. Confirmar que todas as 5 seções obrigatórias estão preenchidas (não apenas `N/A`)
3. Se o arquivo não existir ou estiver incompleto → **BLOQUEAR implementação**

**Mensagem de bloqueio padrão:**

```
🚫 UX Gate: Story {id} requer @ux-design-expert antes de @dev.
   Artefato ausente: docs/stories/{id}-ux-spec.md
   Delegue para @ux-design-expert: *design-story {id}
```

---

## Responsabilidades

| Agente | Responsabilidade |
|--------|-----------------|
| `@ux-design-expert` | Produzir `{id}-ux-spec.md` completo antes de qualquer implementação |
| `@dev` | Verificar UX spec antes de iniciar qualquer tela — BLOQUEADO sem ele |
| `@po` | Durante `*validate-story-draft`, confirmar se story é UI e recomendar UX phase |
| `@sm` | Ao criar story com scope de UI, adicionar nota de dependência de @ux |

---

## Exceções

UX Gate pode ser dispensado APENAS com justificativa explícita:

```
# No topo do arquivo .story.md:
ux_gate: waived
ux_gate_reason: "Componente interno sem interação de usuário / Refactor sem mudança visual"
```

Dispensa requer aprovação do `@po` durante validação da story.

---

## Fluxo SDC com UX Gate

```
@sm create → @po validate → @ux-design-expert design → @dev implement → @qa gate
```

Ver `workflow-execution.md` — SDC Phase 2.5 (UX Design Phase).

---

**Estabelecido:** 2026-05-29
**Owner:** @aiox-master (Orion)
**Enforced by:** @dev (pre-implementation check), @po (story validation)
