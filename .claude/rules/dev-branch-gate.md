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

## Post-QA Flow (@devops)

Após `@qa` emitir veredicto **PASS**, **CONCERNS** ou **WAIVED**:

### Step 1 — Abrir PR task → épico

```bash
gh pr create \
  --base feat/epic-{N} \
  --head task/{N.M}-{descricao} \
  --title "feat({N.M}): {titulo-da-story}" \
  --body "Closes story {N.M}. QA: {veredicto}."
```

**NUNCA** abrir PR direto para `main` a partir de uma branch `task/`.

### Step 2 — Merge do PR

Após aprovação (ou auto-merge se configurado):

```bash
gh pr merge --squash --delete-branch
```

### Step 3 — Atualizar feat/epic-{N} localmente

```bash
git checkout feat/epic-{N}
git pull origin feat/epic-{N}
```

Próxima task deve ser criada a partir deste `feat/epic-{N}` já atualizado (ver Procedimento de Setup acima, step 3).

### Ao fim do épico — PR épico → main

Quando todas as stories do épico estiverem `Done`:

```bash
gh pr create \
  --base main \
  --head feat/epic-{N} \
  --title "feat(epic-{N}): {nome-do-epico}" \
  --body "Epic {N} completo. Stories: {lista}."
```

---

## Responsabilidades

| Agente | Responsabilidade |
|--------|-----------------|
| `@dev` | Verificar branch antes de qualquer edição — BLOQUEADO sem branch correta |
| `@devops` | Criar `feat/epic-{N}` + `task/{N.M}-{descricao}`; abrir PR `task → feat/epic`; merge; PR `feat/epic → main` ao fim do épico |
| `@sm` | Ao criar story, incluir `branch_name` sugerido no Dev Notes |

---

## Hierarquia de Branches

```
main
  └── feat/epic-{N}         ← base do épico (não mergeia em main até épico completo)
        ├── task/{N.1}-*    ← task 1 (PR → feat/epic após QA)
        ├── task/{N.2}-*    ← task 2 (branches de feat/epic atualizado)
        └── task/{N.M}-*    ← última task
```

**Regra:** `task/*` → `feat/epic-*` → `main`. Nunca `task/*` → `main`.

---

## Exceções

Não há exceções. Branch correta é pré-requisito absoluto para implementação.

---

**Estabelecido:** 2026-05-31
**Atualizado:** 2026-05-31 (Post-QA Flow + hierarquia de branches)
**Owner:** @devops (Gage)
**Enforced by:** @dev (pre-implementation check), @devops (post-QA PR flow)
