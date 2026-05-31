# GitFlow — ConstructPro WebApp

## Modelo de branches

```
main
└── feat/epic-{N}                    ← uma por épico
    ├── task/{N.M}-{descricao}       ← uma por story/task
    ├── task/{N.M+1}-{descricao}
    └── task/{N.M+2}-{descricao}
```

**Hierarquia:** `task` → `feat/epic` → `main`

## Convenção de nomes

| Tipo      | Padrão                             | Exemplo                          |
|-----------|------------------------------------|----------------------------------|
| Épico     | `feat/epic-{N}`                    | `feat/epic-2`                    |
| Task      | `task/{N.M}-{descricao-kebab}`     | `task/2.1-api-client-bump`       |
| Hotfix    | `hotfix/{descricao-kebab}`         | `hotfix/correcao-login`          |
| Docs      | `docs/{descricao-kebab}`           | `docs/frontend-direction`        |

## Ciclo de vida completo

### 1. Novo épico

```bash
# A partir de main atualizado
git checkout main && git pull origin main
git checkout -b feat/epic-{N}
git push -u origin feat/epic-{N}
```

### 2. Nova task

```bash
# A partir da branch do épico
git checkout feat/epic-{N}
git checkout -b task/{N.M}-{descricao}
git push -u origin task/{N.M}-{descricao}
```

### 3. Desenvolvimento da task

**@dev DEVE verificar branch antes de qualquer edição de arquivo:**

```bash
git branch --show-current
# Esperado: task/{N.M}-{descricao}
```

Se branch errada → solicitar `@devops *setup-branch {storyId}` antes de continuar.
Se branch correta → implementar normalmente.

- Commits com prefixo convencional referenciando a story:
  ```
  feat(story-N.M): <descricao>
  fix(story-N.M): <descricao>
  test(story-N.M): <descricao>
  docs(story-N.M): <descricao>
  ```
- Atualizar `docs/stories/N.M.story.md` conforme progresso.

### 4. Task concluída → PR para o épico

1. QA gate aprovado (status `Done` ou `Ready for Review` na story)
2. Lint, typecheck e build passando
3. Executar `*pre-push` no @devops para quality gates completos
4. Criar PR: `task/{N.M}-{descricao}` → `feat/epic-{N}`
   ```bash
   gh pr create \
     --base feat/epic-{N} \
     --head task/{N.M}-{descricao} \
     --title "feat(story-{N.M}): <descricao>" \
     --body "Story {N.M} concluída. Closes #{issue}"
   ```
5. Após merge do PR, deletar branch da task:
   ```bash
   git push origin --delete task/{N.M}-{descricao}
   git branch -d task/{N.M}-{descricao}
   ```

### 5. Épico concluído → PR para main

Quando **todas** as tasks do épico estiverem mergeadas e o épico validado:

1. Executar `*pre-push` no @devops para quality gates completos
2. Criar PR: `feat/epic-{N}` → `main`
   ```bash
   gh pr create \
     --base main \
     --head feat/epic-{N} \
     --title "feat(epic-{N}): <descricao do épico>" \
     --body "Épico {N} concluído. Inclui stories: {N.1}, {N.2}, ..."
   ```
3. Após aprovação e merge, criar tag de release:
   ```bash
   git tag -a vX.Y.Z -m "release: épico {N} concluído"
   git push origin vX.Y.Z
   ```
4. Deletar branch do épico após merge confirmado.

## Regras

| Regra | Detalhe |
|-------|---------|
| Nunca commitar direto em `main` | Toda mudança via PR |
| Nunca commitar direto em `feat/epic-{N}` | Só merges de tasks via PR |
| Task sempre parte do épico | `git checkout feat/epic-{N}` antes de criar task branch |
| Branch da task = 1 story | Não misturar work de stories diferentes |
| PR de task → épico | Nunca PR de task direto para main |
| PR de épico → main | Só quando todas as tasks estiverem mergeadas |
| Commits atômicos | 1 mudança lógica por commit |
| Push exclusivo do @devops | Só Gage executa `git push` ao remoto |

## Exemplo — Épico 2 completo

```
main (d45ba38)
└── feat/epic-2
    ├── task/2.1-api-client-bump     → PR → feat/epic-2
    ├── task/2.2-modulo-corretor     → PR → feat/epic-2
    └── task/2.3-modulo-imobiliaria  → PR → feat/epic-2
    → PR → main (quando épico concluído)
```

## Diagrama de fluxo

```
main ──────────────────────────────────────────────────── PR epic ──► main
       │
       └─► feat/epic-2 ─────────────── PR 2.1 ─── PR 2.2 ─── ...
                 │              │
                 └─► task/2.1   │
                 (commits)      │
                     ─────────►─┘ gh pr create --base feat/epic-2
                 └─► task/2.2
                 (commits)
                     ─────────────────────────────────►─┘ gh pr create --base feat/epic-2
```

## Referência rápida

```bash
# [DEV] Verificar branch antes de implementar (obrigatório)
git branch --show-current

# [DEVOPS] Setup completo: épico + task (quando @dev está na branch errada)
git checkout main && git pull origin main
git checkout -b feat/epic-{N} && git push -u origin feat/epic-{N}
git checkout -b task/{N.M}-{descricao} && git push -u origin task/{N.M}-{descricao}

# Criar branch de task a partir do épico (quando épico já existe)
git checkout feat/epic-{N} && git checkout -b task/{N.M}-{descricao}

# PR de task para o épico
gh pr create --base feat/epic-{N} --head task/{N.M}-{descricao}

# PR de épico para main (só quando épico completo)
gh pr create --base main --head feat/epic-{N}

# Ver todas as branches
git branch -a

# Ver histórico do épico
git log feat/epic-{N} --oneline --graph
```
