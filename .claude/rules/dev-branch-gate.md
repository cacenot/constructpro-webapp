---
paths:
  - "docs/stories/**"
  - "src/**"
---

# Dev Branch Gate — Regra de Branch Obrigatória para @dev

## Propósito

Garantir que **nenhuma linha de código** seja escrita por `@dev` sem que a branch correta da task esteja criada e ativa no repositório.

**Raiz do problema:** Story 4.1 foi implementada em `docs/post-epic3-roadmap-update` em vez de `task/4.1-wizard-empreendimento-unidade`, exigindo reorganização posterior pelo @devops.

---

## Quando Esta Regra Ativa

**SEMPRE** que `@dev` iniciar qualquer implementação — independente de story, modo (YOLO/Interactive/Pre-Flight) ou complexidade.

---

## Check Obrigatório no Início de Toda Implementação

Antes de qualquer edição de arquivo, `@dev` DEVE:

### Step 1 — Verificar branch atual

```bash
git branch --show-current
```

### Step 2 — Validar padrão esperado

A branch ativa deve corresponder ao padrão:

```
task/{epicNum}.{storyNum}-{descricao-kebab}
```

**Exemplos válidos:**
```
task/4.1-wizard-empreendimento-unidade   ✅
task/3.2-comissao-edicao-proposta        ✅
```

**Exemplos inválidos:**
```
docs/post-epic3-roadmap-update           ❌
feat/epic-4                              ❌
main                                     ❌
```

### Step 3 — Bloquear se branch errada

Se a branch atual **não** corresponder ao padrão `task/{N.M}-{descricao}`:

```
🚫 Branch Gate: @dev não pode implementar na branch atual.
   Branch atual: {branch-atual}
   Branch esperada: task/{N.M}-{descricao}

   Delegue para @devops: *setup-branch {storyId}
```

**@dev BLOQUEADO** até estar na branch correta.

---

## Procedimento de Setup de Branch (@devops)

Quando `@dev` estiver na branch errada, `@devops` executa:

```bash
# 1. Verificar se feat/epic-{N} existe
git branch --list feat/epic-{N}

# 2a. Se NÃO existe — criar a partir de main
git checkout main
git pull origin main
git checkout -b feat/epic-{N}
git push -u origin feat/epic-{N}

# 2b. Se existe — apenas checkout
git checkout feat/epic-{N}

# 3. Criar branch da task a partir do épico
git checkout -b task/{N.M}-{descricao}
git push -u origin task/{N.M}-{descricao}
```

Após setup, `@devops` confirma para `@dev` retomar.

---

## Derivação do Nome da Branch

| Story ID | Epic | Branch esperada |
|----------|------|-----------------|
| `4.1` | `epic-4` | `task/4.1-{titulo-kebab}` |
| `4.2` | `epic-4` | `task/4.2-{titulo-kebab}` |
| `5.1` | `epic-5` | `task/5.1-{titulo-kebab}` |

**Regra:** epic = primeiro número do story ID. Título em kebab-case do campo `title` da story.

---

## Responsabilidades

| Agente | Responsabilidade |
|--------|-----------------|
| `@dev` | Verificar branch antes de qualquer edição — BLOQUEADO sem branch correta |
| `@devops` | Criar `feat/epic-{N}` + `task/{N.M}-{descricao}` quando solicitado |
| `@sm` | Ao criar story, incluir `branch_name` sugerido no Dev Notes |

---

## Exceções

Não há exceções. Branch correta é pré-requisito absoluto para implementação.

---

**Estabelecido:** 2026-05-31
**Owner:** @devops (Gage)
**Enforced by:** @dev (pre-implementation check)
