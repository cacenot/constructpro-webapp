# Design — Slash command `/release-bump`

**Data:** 2026-06-08
**Autor:** Fernando + Claude
**Status:** Aprovado para planejamento

## Objetivo

Automatizar o corte de release do webapp num único comando interativo, com
recomendação de versão e Human-in-the-Loop (HITL). O command orquestra a parte
"inteligente" (analisar mudanças, recomendar bump, gerar notas) e delega a parte
determinística/irreversível (gates, commit, tag, push, release) ao
`scripts/release.sh` estendido — preservando a garantia atual de que **nada é
escrito/empurrado até tudo estar verde**.

## Decisões de arquitetura (fechadas no brainstorming)

1. **Artefato:** slash command (`.claude/commands/release-bump.md`) — gatilho
   explícito, ideal para fluxo HITL.
2. **Integração:** estender `scripts/release.sh` como executor determinístico; o
   command é o cérebro. `release.sh` continua a única fonte de verdade dos
   guard-rails e da atomicidade.
3. **Gate e2e:** informativo (warn) — não bloqueia, igual ao tratamento atual do
   vitest. `lint` e `typecheck` seguem hard (abortam).
4. **Release notes:** híbrido — seções curadas em PT-BR (Features/Correções/
   Outros) + link de compare (`prev...vX.Y.Z`) + lista de PRs. Mesmo conteúdo
   alimenta o `CHANGELOG.md` e o `gh release`.

Defaults confirmados: `gh release create` mora no `release.sh`; sem `--dry-run`
(os dois pontos de HITL bastam).

## Divisão de responsabilidades

| Parte | Dono | Responsabilidade |
|---|---|---|
| Análise + decisão + narrativa | `/release-bump` (command) | Lê commits desde a última tag, classifica, recomenda bump, conduz HITL, gera notes/changelog |
| Guard-rails + gates + git/gh | `scripts/release.sh` (estendido) | Revalida preflight, roda gates, escreve `package.json`, monta `CHANGELOG.md`, commit+tag atômico, push, `gh release` |

O command **nunca** executa a parte irreversível de git diretamente — delega ao
`release.sh`.

## Fluxo

```
/release-bump [patch|minor|major|vX.Y.Z]   (argumento opcional pré-semeia o bump)

1. PREFLIGHT (instantâneo, no command)
   - branch atual == main
   - working tree limpa
   - local == origin/main (git fetch antes)
   - gh autenticado (gh auth status)
   - detecta última tag + range de commits (<última-tag>..HEAD)
   - Aborta cedo e claro. Se não há commits novos → "nada para releasar".

2. ANÁLISE (command)
   - classifica conventional commits no range: feat / fix / breaking / perf /
     refactor / chore / docs / outros
   - recomenda bump + justificativa (quais commits puxaram a decisão)

3. HITL #1 — escolha do bump (recomendado pré-selecionado)
   - Patch (vX.Y.Z+1) · Minor · Major · Other (versão custom vX.Y.Z)
   - argumento da invocação, se dado, vira o default

4. GERAÇÃO DE NOTES (command) → /tmp/release-notes-<versao>.md
   - seções curadas PT-BR + link de compare (prev...vX.Y.Z) + lista de PRs
   - mostra preview do que entrará no CHANGELOG

5. HITL #2 — go/no-go final
   - mostra: versão · notes · ações que virão (gates → commit[package.json +
     CHANGELOG] → tag anotada → push atômico → gh release → dispara
     deploy-production.yml)

6. GO → release.sh vX.Y.Z --bump --notes-file /tmp/release-notes-<versao>.md --e2e
   - revalida preflight (defesa em profundidade)
   - gates: lint + typecheck (HARD) · vitest + e2e (WARN, output mostrado)
   - escreve package.json (npm pkg set version)
   - prepend CHANGELOG.md  ("## [vX.Y.Z] - YYYY-MM-DD" + body do notes-file)
   - git add package.json CHANGELOG.md
   - git commit -m "chore(release): vX.Y.Z"
   - git tag -a vX.Y.Z -m "Release vX.Y.Z"
   - git push --atomic origin main vX.Y.Z
   - gh release create vX.Y.Z --title vX.Y.Z --notes-file <notes>

7. REPORT (command): tag empurrada · URL do workflow de deploy · URL do release
```

### Por que esta ordem

- **Preflight antes do HITL:** não faz sentido perguntar o bump a um humano se a
  árvore está suja ou o branch errado. Falha barata e instantânea.
- **Gates dentro do `release.sh`, após o GO:** o humano dá o go/no-go e os gates
  (incluindo e2e, que é lento) rodam sem supervisão. Se um gate **hard** falhar,
  o `release.sh` não escreveu nada — mesma garantia de hoje. O confirm é honesto:
  é um go/no-go para *iniciar* o release com gates.
- **Push atômico preservado:** `release.sh --bump` empurra commit+tag juntos
  (`--atomic`). Um run que falha nunca "queima" versão.

## Recomendação de bump (SemVer)

Sobre os conventional commits no range `<última-tag>..HEAD`:

| Sinal | Bump |
|---|---|
| `BREAKING CHANGE:` no corpo, ou `feat!`/`fix!` | major |
| algum `feat:` | minor |
| só `fix:` / `perf:` / `refactor:` / `chore:` / `docs:` | patch |

O command mostra a contagem por tipo e os commits que justificam a recomendação.
O HITL **sempre** permite sobrescrever (inclusive versão custom via "Other") —
útil no pré-1.0, onde o time pode querer segurar o major manualmente.

## Release notes / CHANGELOG (híbrido)

Um único arquivo de notes (`/tmp/release-notes-<versao>.md`) contém apenas o
**corpo**:

```markdown
### ✨ Features
- ... (#PR)

### 🐛 Correções
- ... (#PR)

### 🔧 Outros
- ...

**Comparação:** https://github.com/cacenot/constructpro-webapp/compare/<prev>...vX.Y.Z
**PRs:** #40, #41, ...
```

Destinos:
- **`CHANGELOG.md`** (commitado): `release.sh` faz prepend de
  `## [vX.Y.Z] - YYYY-MM-DD` + corpo. Cria o arquivo com header
  [Keep a Changelog](https://keepachangelog.com) se não existir.
- **GitHub release** (`gh release create`): usa o mesmo corpo via `--notes-file`.

A data (`YYYY-MM-DD`) é gerada pelo `release.sh` via `date` (bash) no momento do
prepend — o command não precisa fabricá-la.

## Mudanças concretas

### `scripts/release.sh` (extend-only, retrocompatível)

Novas flags (default sem elas = comportamento atual intacto):

- `--notes-file <path>`:
  - prepend no `CHANGELOG.md` (cria com header Keep a Changelog se ausente)
  - inclui `CHANGELOG.md` no `git add` do commit de bump
  - passo final `gh release create vX.Y.Z --title vX.Y.Z --notes-file <path>`
    após push bem-sucedido (warn-only se falhar, imprime comando de retry)
- `--e2e`:
  - roda `pnpm test:e2e` como gate **warn** (output sempre mostrado)
  - garante `VITE_FIREBASE_PERSISTENCE=local` no ambiente do run

Detalhes do prepend (CHANGELOG):
- se `CHANGELOG.md` não existe: cria com título + a primeira seção de versão
- se existe: insere a nova seção logo após o bloco de header, antes da primeira
  `## [` existente
- a seção atômica do commit passa a ser `package.json` + `CHANGELOG.md`

### `.claude/commands/release-bump.md` (novo)

- frontmatter:
  - `description`: "Corta uma release: recomenda bump (HITL), gera CHANGELOG +
    release notes, roda gates e dá push da tag."
  - `argument-hint`: `[patch|minor|major|vX.Y.Z]`
  - `allowed-tools`: `Bash, Read, AskUserQuestion, Write`
- corpo: prompt que orquestra o fluxo acima, com os dois pontos de HITL via
  `AskUserQuestion`.

## Edge cases

- **Sem commits novos** desde a última tag → aborta ("nada para releasar").
- **`gh` ausente ou não autenticado** → preflight barra antes de qualquer
  mutação (notes no GitHub são entregável; não faz sentido empurrar tag e falhar
  o release depois).
- **`CHANGELOG.md` inexistente** → `release.sh` cria com header.
- **Tag já existe** (local ou origin) → `release.sh` já guarda hoje.
- **Env do Playwright:** `playwright.config.ts` carrega `.env` via dotenv e sobe
  `pnpm dev` na porta 3000 (CORS exige 3000). `VITE_FIREBASE_PERSISTENCE=local` e
  as credenciais de login do `global.setup.ts` precisam estar no `.env`. Como o
  gate e2e é warn, falhas de ambiente apenas avisam, não bloqueiam o release.

## Não-objetivos (YAGNI)

- `--dry-run` dedicado (os dois HITL já dão preview + abort).
- Mover criação do GitHub release para o workflow (fica local no `release.sh`).
- Versionamento pré-1.0 especial automático (HITL cobre via override manual).
- Assinatura de tags / changelog por escopo de módulo.

## Critérios de sucesso

1. `/release-bump` num `main` limpo e sincronizado conduz do bump ao push da tag
   sem comandos manuais de git.
2. A recomendação de bump reflete corretamente os conventional commits do range.
3. O HITL permite override do bump e abort no go/no-go final.
4. `CHANGELOG.md` recebe uma seção nova e correta; o GitHub release sai com o
   mesmo corpo.
5. `pnpm release vX.Y.Z` (uso manual, sem as novas flags) continua funcionando
   exatamente como hoje.
6. Um gate `hard` falhando (lint/typecheck) aborta sem escrever/empurrar nada.
```
