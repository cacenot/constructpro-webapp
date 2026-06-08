---
description: Corta uma release — recomenda bump (HITL), gera CHANGELOG + release notes, roda gates e dá push da tag.
argument-hint: [patch|minor|major|vX.Y.Z]
allowed-tools: Bash, Read, AskUserQuestion, Write
---

# /release-bump

Você está cortando uma release do webapp. Siga EXATAMENTE este fluxo. Nunca pule
os dois pontos de HITL. Nunca rode git de commit/tag/push manualmente — isso é
delegado ao `scripts/release.sh`.

Argumento opcional: `$ARGUMENTS`
- se for `patch|minor|major`: use como bump pré-selecionado no HITL #1
- se for `vX.Y.Z`: use como versão pré-selecionada (opção "Other")
- se vazio: recomende com base nos commits

## 1. Preflight (read-only — aborte em qualquer falha)

```bash
git rev-parse --abbrev-ref HEAD
git status --porcelain
git fetch origin main --tags
[ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" ] && echo SYNC_OK || echo SYNC_FAIL
gh auth status
git describe --tags --abbrev=0
```

Pare e explique o que corrigir se: branch != `main`; `git status --porcelain`
não-vazio (tree suja); `SYNC_FAIL`; `gh auth status` não autenticado. Guarde a
última tag como `PREV`.

Liste o range e aborte se vazio:

```bash
PREV="$(git describe --tags --abbrev=0)"
git log --pretty='%H %s' "${PREV}..HEAD"
```

Se vazio → "Nada para releasar desde ${PREV}." e pare.

## 2. Análise + recomendação

Classifique cada commit do range por conventional type. Verifique breaking:

```bash
git log "${PREV}..HEAD" --pretty=full | grep -i "BREAKING CHANGE" || true
```

Regras de recomendação:
- `BREAKING CHANGE:` no corpo, ou `feat!`/`fix!` → **major**
- algum `feat:` → **minor**
- caso contrário (fix/perf/refactor/chore/docs) → **patch**

Apresente: contagem por tipo, os commits que puxaram a decisão, e a recomendação.

## 3. HITL #1 — escolha do bump

Calcule as 3 versões candidatas a partir da versão atual do `package.json`:

```bash
node -e 'const v=require("./package.json").version.split(".").map(Number);const f=a=>"v"+a.join(".");console.log("patch",f([v[0],v[1],v[2]+1]));console.log("minor",f([v[0],v[1]+1,0]));console.log("major",f([v[0]+1,0,0]))'
```

Use `AskUserQuestion`: opções **Patch (vX.Y.Z)**, **Minor (vX.Y.Z)**,
**Major (vX.Y.Z)** — marque a recomendada no label — e deixe "Other" para versão
custom. Se `$ARGUMENTS` indicou nível/versão, trate como default. Resolva em
`VERSION` no formato `vX.Y.Z`.

## 4. Gerar release notes (híbrido)

Ache os PRs do range:

```bash
git log "${PREV}..HEAD" --pretty='%s' | grep -oE '#[0-9]+' | sort -u
```

Monte o corpo das notes em PT-BR (omita seções vazias):

```markdown
### ✨ Features
- <descrição> (#PR)

### 🐛 Correções
- <descrição> (#PR)

### 🔧 Outros
- <descrição>

**Comparação:** https://github.com/cacenot/constructpro-webapp/compare/<PREV>...<VERSION>
**PRs:** #N, #M, ...
```

Escreva o corpo com `Write` em `/tmp/release-notes-<VERSION>.md` (substitua
`<VERSION>` pelo valor real).

## 5. HITL #2 — go/no-go final

Mostre: `VERSION`, o conteúdo das notes, e as ações que virão — gates
(lint/typecheck **hard**; vitest/e2e **warn**) → commit [package.json +
CHANGELOG] → tag anotada → push atômico → `gh release` → dispara
`deploy-production.yml`.

Use `AskUserQuestion`: "Confirmar release <VERSION>" / "Cancelar". Em cancelar,
pare sem mutar nada (nenhum arquivo foi alterado no repo até aqui).

## 6. Executar

```bash
bash scripts/release.sh <VERSION> --bump --e2e --notes-file="/tmp/release-notes-<VERSION>.md"
```

Substitua `<VERSION>` pelo valor resolvido. NÃO rode git manualmente — o script
faz gates + commit + tag + push atômico + `gh release`.

## 7. Report

Confirme a tag empurrada e dê os links:
- Deploy: https://github.com/cacenot/constructpro-webapp/actions
- Release: a URL impressa pelo `gh release create`
