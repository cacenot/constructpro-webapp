# GitFlow — ConstructPro WebApp

## Modelo de branches

```
main
└── feat/epic-{N}                    ← uma por épico
    ├── feat/{N.M}-{descricao}       ← uma por story
    ├── feat/{N.M+1}-{descricao}
    └── feat/{N.M+2}-{descricao}
```

## Convenção de nomes

| Tipo      | Padrão                             | Exemplo                          |
|-----------|------------------------------------|----------------------------------|
| Épico     | `feat/epic-{N}`                    | `feat/epic-2`                    |
| Story     | `feat/{N.M}-{descricao-kebab}`     | `feat/2.1-api-client-bump`       |
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

### 2. Nova story

```bash
# A partir da branch do épico
git checkout feat/epic-{N}
git checkout -b feat/{N.M}-{descricao}
git push -u origin feat/{N.M}-{descricao}
```

### 3. Desenvolvimento da story

- Commits com prefixo convencional referenciando a story:
  ```
  feat(story-N.M): <descricao>
  fix(story-N.M): <descricao>
  test(story-N.M): <descricao>
  docs(story-N.M): <descricao>
  ```
- Atualizar `docs/stories/N.M.story.md` conforme progresso.

### 4. Story concluída → merge no épico

1. QA gate aprovado (status `Done` ou `Ready for Review` na story)
2. Lint, typecheck e build passando
3. Merge da story no épico:
   ```bash
   git checkout feat/epic-{N}
   git merge feat/{N.M}-{descricao} --no-ff -m "merge(epic-{N}): story {N.M} concluída"
   git push origin feat/epic-{N}
   ```
4. Branch da story pode ser deletada após merge confirmado:
   ```bash
   git push origin --delete feat/{N.M}-{descricao}
   git branch -d feat/{N.M}-{descricao}
   ```

### 5. Épico concluído → merge na main

Quando todas as stories do épico estiverem mergeadas e o épico validado:

1. Executar `*pre-push` no @devops para quality gates completos
2. Criar PR: `feat/epic-{N}` → `main`
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
| Nunca commitar direto em `feat/epic-{N}` | Só merges de stories |
| Story sempre parte do épico | `git checkout feat/epic-{N}` antes de criar story branch |
| Branch da story = 1 story | Não misturar work de stories diferentes |
| Commits atômicos | 1 mudança lógica por commit |
| Push exclusivo do @devops | Só Gage executa `git push` ao remoto |

## Exemplo — Épico 2 completo

```
main (d45ba38)
└── feat/epic-2
    ├── feat/2.1-api-client-bump     → merge → feat/epic-2
    ├── feat/2.2-modulo-corretor     → merge → feat/epic-2  (em andamento)
    └── feat/2.3-...                 → merge → feat/epic-2  (futuro)
    → PR → main (quando épico concluído)
```

## Diagrama de fluxo

```
main ──────────────────────────────────────────────────── merge epic ──► main
       │
       └─► feat/epic-2 ─────────────── merge 2.1 ─── merge 2.2 ─── ...
                 │              │
                 └─► feat/2.1   │
                 (commits)      │
                     ─────────►─┘ merge --no-ff
                 └─► feat/2.2
                 (commits)
                     ─────────────────────────────────►─┘ merge --no-ff
```

## Referência rápida

```bash
# Criar branch de story a partir do épico
git checkout feat/epic-{N} && git checkout -b feat/{N.M}-{descricao}

# Merge de story no épico
git checkout feat/epic-{N} && git merge feat/{N.M}-{descricao} --no-ff

# Ver todas as branches
git branch -a

# Ver histórico do épico
git log feat/epic-{N} --oneline --graph
```
