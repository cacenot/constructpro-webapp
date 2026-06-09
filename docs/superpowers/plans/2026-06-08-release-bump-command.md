# /release-bump Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Um slash command `/release-bump` que recomenda o bump de versão (HITL), gera CHANGELOG + release notes, roda os gates e delega commit+tag+push+release ao `release.sh` estendido.

**Architecture:** O command (`.claude/commands/release-bump.md`) é o cérebro (análise de commits, recomendação, HITL, geração de notes). O `scripts/release.sh` estendido é o executor determinístico (gates, commit atômico de `package.json`+`CHANGELOG.md`, tag, push, `gh release`). A parte irreversível nunca é tocada pelo command diretamente. Um teste de integração em sandbox (`scripts/release.test.sh`) valida o `release.sh` sem tocar o GitHub real (stubs de `pnpm`/`gh`, origin bare).

**Tech Stack:** Bash, git, GitHub CLI (`gh`), Node (semver), Claude Code slash command (`$ARGUMENTS`, `AskUserQuestion`).

---

## File Structure

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `scripts/release.sh` | Modify | Executor: + flags `--e2e` e `--notes-file=`, função `prepend_changelog`, gate e2e (warn), `gh release create`, commit inclui `CHANGELOG.md` |
| `scripts/release.test.sh` | Create | Teste de integração em sandbox (stubs pnpm/gh, origin bare) |
| `package.json` | Modify | Script `test:release` |
| `.claude/commands/release-bump.md` | Create | O slash command (cérebro: preflight, análise, HITL, notes, executar) |
| `CLAUDE.md` | Modify | Nota na seção Deploy & CI/CD sobre `/release-bump` |
| `CHANGELOG.md` | (criado em runtime pelo release.sh) | — não criar manualmente |

---

## Task 1: Teste de integração do release.sh (RED)

**Files:**
- Create: `scripts/release.test.sh`
- Modify: `package.json` (scripts)

- [ ] **Step 1: Escrever o harness de teste**

Create `scripts/release.test.sh`:

```bash
#!/usr/bin/env bash
# scripts/release.test.sh — teste de integração do release.sh num sandbox.
# Cria um repo temporário com origin bare e stubs de pnpm/gh, roda o
# release.sh em --bump --e2e --notes-file e valida bump, CHANGELOG, commit,
# tag, push atômico e a chamada ao gh. e2e é stubado para FALHAR, provando
# que o gate e2e é warn (não bloqueia).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RELEASE_SH="${REPO_ROOT}/scripts/release.sh"

PASS=0
FAIL=0
assert() {
  local desc="$1"; shift
  if "$@"; then echo "  ok  ${desc}"; PASS=$((PASS + 1))
  else echo "  XX  ${desc}"; FAIL=$((FAIL + 1)); fi
}
assert_contains() {
  local desc="$1" file="$2" needle="$3"
  if [ -f "${file}" ] && grep -qF -- "${needle}" "${file}"; then
    echo "  ok  ${desc}"; PASS=$((PASS + 1))
  else
    echo "  XX  ${desc} (não achou '${needle}' em ${file})"; FAIL=$((FAIL + 1))
  fi
}

WORK="$(mktemp -d)"
trap 'rm -rf "${WORK}"' EXIT

# 1. stubs de pnpm (e2e falha de propósito) e gh
STUB="${WORK}/bin"
mkdir -p "${STUB}"
cat > "${STUB}/pnpm" <<'EOF'
#!/usr/bin/env bash
echo "[stub pnpm] $*"
case "$1" in
  test:e2e) exit 1 ;;   # e2e falha → deve ser warn, não bloquear
  lint|typecheck|test) exit 0 ;;
  *) exit 0 ;;
esac
EOF
chmod +x "${STUB}/pnpm"
cat > "${STUB}/gh" <<EOF
#!/usr/bin/env bash
echo "[stub gh] \$*" >> "${WORK}/gh-calls.log"
exit 0
EOF
chmod +x "${STUB}/gh"

# 2. origin bare + clone, seed package.json + tag inicial
ORIGIN="${WORK}/origin.git"
git init --quiet --bare "${ORIGIN}"
CLONE="${WORK}/clone"
git clone --quiet "${ORIGIN}" "${CLONE}"
cd "${CLONE}"
git config user.email t@t.dev
git config user.name Tester
git checkout -q -b main
echo '{ "name": "x", "version": "0.1.0" }' > package.json
git add package.json
git commit -q -m "chore: init"
git tag -a v0.1.0 -m "Release v0.1.0"
git push -q origin main
git push -q origin v0.1.0
echo feature > feature.txt
git add feature.txt
git commit -q -m "feat: nova feature (#2)"
git push -q origin main

# 3. notes fora da árvore
NOTES="${WORK}/notes.md"
cat > "${NOTES}" <<'EOF'
### Features
- nova feature (#2)

**Comparação:** https://example/compare/v0.1.0...v0.2.0
EOF

# 4. roda release.sh (graceful: captura RC p/ provar warn do e2e)
set +e
PATH="${STUB}:${PATH}" RELEASE_BRANCH=main \
  bash "${RELEASE_SH}" v0.2.0 --bump --e2e --notes-file="${NOTES}"
RC=$?
set -e

# 5. asserts
assert "release.sh retornou 0 apesar do e2e falhar (warn)" test "${RC}" -eq 0
assert "package.json bumpado p/ 0.2.0" \
  bash -c '[ "$(node -p "require(\"./package.json\").version")" = "0.2.0" ]'
assert_contains "CHANGELOG tem seção da versão" CHANGELOG.md "## [v0.2.0]"
assert_contains "CHANGELOG tem corpo das notes" CHANGELOG.md "nova feature (#2)"
assert "commit de release" \
  bash -c 'git log -1 --pretty=%s | grep -q "chore(release): v0.2.0"'
assert "tag v0.2.0 local" bash -c 'git rev-parse refs/tags/v0.2.0 >/dev/null 2>&1'
assert "tag v0.2.0 em origin" \
  bash -c "git -C '${ORIGIN}' rev-parse refs/tags/v0.2.0 >/dev/null 2>&1"
assert "commit empurrado p/ origin main" \
  bash -c "[ \"\$(git rev-parse main)\" = \"\$(git -C '${ORIGIN}' rev-parse main)\" ]"
assert_contains "gh release create chamado" "${WORK}/gh-calls.log" "release create v0.2.0"

echo
echo "PASS=${PASS} FAIL=${FAIL}"
[ "${FAIL}" -eq 0 ]
```

- [ ] **Step 2: Adicionar o script `test:release` ao package.json**

Modify `package.json`, na seção `scripts`, logo após `"test:e2e:debug"`:

```json
    "test:e2e:debug": "playwright test --debug",
    "test:release": "bash scripts/release.test.sh"
```

- [ ] **Step 3: Rodar o teste e confirmar que FALHA**

Run: `chmod +x scripts/release.test.sh && pnpm test:release`
Expected: FAIL. Com o `release.sh` atual, `--notes-file=...` cai no caso `-*)` ("flag desconhecida") e o script sai com erro antes de bumpar — então `RC != 0` e vários asserts falham. (Pode também abortar o harness no ponto da chamada; o importante é não estar verde.)

- [ ] **Step 4: Commit**

```bash
git add scripts/release.test.sh package.json
git commit -m "test(release): harness de integração do release.sh (sandbox)"
```

---

## Task 2: Estender release.sh (GREEN)

**Files:**
- Modify: `scripts/release.sh`

- [ ] **Step 1: Adicionar parsing das flags `--e2e` e `--notes-file=`**

Em `scripts/release.sh`, declare as variáveis novas junto das existentes (após `BUMP=false`, linha ~32):

```bash
VERSION_ARG=""
BUMP=false
E2E=false
NOTES_FILE=""
```

E no laço `for arg in "$@"; do ... case`, adicione os dois casos novos antes do `-*)`:

```bash
  case "${arg}" in
    --bump) BUMP=true ;;
    --e2e) E2E=true ;;
    --notes-file=*) NOTES_FILE="${arg#*=}" ;;
    -*)
      echo "ERRO: flag desconhecida '${arg}'" >&2
      exit 1
      ;;
```

- [ ] **Step 2: Adicionar a função `prepend_changelog`**

Logo após a linha `cd "$(git rev-parse --show-toplevel)"` (~linha 62), adicione:

```bash
prepend_changelog() {
  local version="$1" notes_file="$2" changelog="CHANGELOG.md"
  local date_str header
  date_str="$(date +%Y-%m-%d)"
  header="## [${version}] - ${date_str}"

  if [[ ! -f "${changelog}" ]]; then
    {
      printf '# Changelog\n\n'
      printf 'Todas as mudanças notáveis deste projeto são documentadas aqui.\n'
      printf 'O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)\n'
      printf 'e o projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).\n\n'
      printf '%s\n\n' "${header}"
      cat "${notes_file}"
      printf '\n'
    } > "${changelog}"
    return 0
  fi

  # Insere a nova seção logo antes da primeira "## " existente; se não houver
  # nenhuma (changelog só com header), insere no fim.
  local tmp
  tmp="$(mktemp)"
  awk -v header="${header}" -v bodyfile="${notes_file}" '
    BEGIN { inserted = 0 }
    /^## / && !inserted {
      print header; print ""
      while ((getline line < bodyfile) > 0) print line
      print ""
      inserted = 1
    }
    { print }
    END {
      if (!inserted) {
        print ""; print header; print ""
        while ((getline line < bodyfile) > 0) print line
      }
    }
  ' "${changelog}" > "${tmp}"
  mv "${tmp}" "${changelog}"
}
```

- [ ] **Step 3: Adicionar o gate e2e (warn) após o gate de testes**

Localize o bloco de gates (~linha 99-102):

```bash
echo "Rodando quality gate (lint + typecheck + test)..."
pnpm lint
pnpm typecheck
pnpm test || echo "AVISO: testes falharam — revise antes de prosseguir com o release."
```

Adicione, logo abaixo do `pnpm test ...`:

```bash
if [[ "${E2E}" == true ]]; then
  echo "Rodando e2e (Playwright) — informativo..."
  VITE_FIREBASE_PERSISTENCE=local pnpm test:e2e \
    || echo "AVISO: e2e falharam — informativo, seguindo com o release."
fi
```

- [ ] **Step 4: Incluir CHANGELOG no commit de bump e mudar a mensagem**

Localize o bloco `if [[ "${BUMP}" == true ]]; then` (~linha 105-109):

```bash
next="${VERSION#v}"
if [[ "${BUMP}" == true ]]; then
  echo "Escrevendo versão ${next} em package.json..."
  npm pkg set version="${next}"
  git add package.json
  git commit -m "chore(release): bump version to ${VERSION}"
else
```

Substitua por:

```bash
next="${VERSION#v}"
if [[ "${BUMP}" == true ]]; then
  echo "Escrevendo versão ${next} em package.json..."
  npm pkg set version="${next}"
  git add package.json
  if [[ -n "${NOTES_FILE}" ]]; then
    echo "Atualizando CHANGELOG.md..."
    prepend_changelog "${VERSION}" "${NOTES_FILE}"
    git add CHANGELOG.md
  fi
  git commit -m "chore(release): ${VERSION}"
else
```

- [ ] **Step 5: Adicionar `gh release create` no fim**

No final do arquivo, antes do bloco final de `echo`s (a linha `echo` em branco seguida de `echo "✅ Release ..."`, ~linha 130), adicione:

```bash
if [[ -n "${NOTES_FILE}" ]]; then
  echo "Criando GitHub release ${VERSION}..."
  if ! gh release create "${VERSION}" --title "${VERSION}" --notes-file "${NOTES_FILE}"; then
    echo "AVISO: 'gh release create' falhou. Crie manualmente:" >&2
    echo "  gh release create ${VERSION} --title ${VERSION} --notes-file ${NOTES_FILE}" >&2
  fi
fi
```

- [ ] **Step 6: Rodar o teste e confirmar que PASSA**

Run: `pnpm test:release`
Expected: PASS. Saída termina com `PASS=9 FAIL=0` e exit 0.

- [ ] **Step 7: Sanidade — uso manual sem as novas flags continua válido**

Run: `bash scripts/release.sh 2>&1 | head -1`
Expected: `ERRO: nenhuma VERSION informada. Uso: ... vX.Y.Z [--bump]` (parsing antigo intacto; nenhuma regressão).

- [ ] **Step 8: Commit**

```bash
git add scripts/release.sh
git commit -m "feat(release): release.sh aceita --e2e e --notes-file (CHANGELOG + gh release)"
```

---

## Task 3: Slash command `/release-bump`

**Files:**
- Create: `.claude/commands/release-bump.md`

- [ ] **Step 1: Escrever o command**

Create `.claude/commands/release-bump.md` com EXATAMENTE este conteúdo:

````markdown
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
git describe --tags --abbrev=0 --match "v[0-9]*"
```

Pare e explique o que corrigir se: branch != `main`; `git status --porcelain`
não-vazio (tree suja); `SYNC_FAIL`; `gh auth status` não autenticado. Guarde a
última tag como `PREV`. Se não houver tags `v*` (primeira release do projeto), use o commit raiz como `PREV` (`git rev-list --max-parents=0 HEAD`) e trate como release inicial.

Liste o range e aborte se vazio:

```bash
PREV="$(git describe --tags --abbrev=0 --match "v[0-9]*")"
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
````

- [ ] **Step 2: Dry rehearsal dos snippets read-only**

Rode os comandos do preflight (são read-only) para confirmar que executam neste repo:

Run:
```bash
git rev-parse --abbrev-ref HEAD; git status --porcelain; git describe --tags --abbrev=0; \
PREV="$(git describe --tags --abbrev=0)"; git log --pretty='%H %s' "${PREV}..HEAD" | head; \
node -e 'const v=require("./package.json").version.split(".").map(Number);const f=a=>"v"+a.join(".");console.log("patch",f([v[0],v[1],v[2]+1]));console.log("minor",f([v[0],v[1]+1,0]));console.log("major",f([v[0]+1,0,0]))'
```
Expected: imprime o branch atual (`feat/release-bump-command`), tree limpa, `v0.1.0`, a lista de commits desde `v0.1.0`, e as 3 versões candidatas (`patch v0.1.1`, `minor v0.2.0`, `major v1.0.0`). Nenhuma mutação ocorre.

- [ ] **Step 3: Commit**

```bash
git add .claude/commands/release-bump.md
git commit -m "feat(release): slash command /release-bump (HITL + notes + gates)"
```

---

## Task 4: Documentação + memória

**Files:**
- Modify: `CLAUDE.md`
- Modify: `/home/cacenot/.claude/projects/-home-cacenot-repositories-constructpro-webapp/memory/MEMORY.md`
- Create: `/home/cacenot/.claude/projects/-home-cacenot-repositories-constructpro-webapp/memory/release-bump.md`

- [ ] **Step 1: Nota no CLAUDE.md (seção Deploy & CI/CD)**

Em `CLAUDE.md`, na subseção `**Release:**` dentro de `## Deploy & CI/CD`, acrescente ao final do parágrafo existente:

```markdown
Para um corte guiado (recomendação de bump via HITL, CHANGELOG + release notes,
gates incl. e2e), use o slash command **`/release-bump`** — ele orquestra a
decisão e delega a parte determinística (commit+tag+push+`gh release`) ao
`release.sh` (flags `--bump --e2e --notes-file=`).
```

- [ ] **Step 2: Memória do projeto**

Create `/home/cacenot/.claude/projects/-home-cacenot-repositories-constructpro-webapp/memory/release-bump.md`:

```markdown
---
name: release-bump
description: Slash command /release-bump para cortar release (HITL + CHANGELOG + notes + gates) sobre release.sh estendido.
metadata:
  type: project
---

`/release-bump` (`.claude/commands/release-bump.md`) corta releases: preflight
read-only → análise de conventional commits → HITL do bump → gera release notes
híbridas (/tmp) → HITL go/no-go → `scripts/release.sh <v> --bump --e2e
--notes-file=`. O command é o cérebro; o `release.sh` é o executor determinístico
(gates lint/typecheck hard + vitest/e2e warn, commit atômico de
package.json+CHANGELOG.md, tag, push, `gh release create`).

Teste de integração: `pnpm test:release` (`scripts/release.test.sh`) roda o
release.sh num sandbox com origin bare e stubs de pnpm/gh — não toca o GitHub.

Relaciona-se a [[cloudflare-cicd-migration]] (deploy por tag dispara
deploy-production.yml).
```

E adicione a linha-ponteiro em `MEMORY.md`, junto da lista de bullets no topo:

```markdown
- [Release bump](release-bump.md) — slash command /release-bump (HITL + CHANGELOG + notes) sobre release.sh estendido.
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(release): documenta /release-bump no CLAUDE.md"
```

(Os arquivos de memória ficam fora do repo — não entram no commit.)

---

## Task 5: Fechamento da branch

- [ ] **Step 1:** Invoque a skill `superpowers:finishing-a-development-branch` para decidir merge/PR/cleanup da branch `feat/release-bump-command`.

---

## Notas de implementação

- **Não** criar `CHANGELOG.md` manualmente — o `release.sh` o cria no primeiro release real. O teste de sandbox exercita a criação isoladamente.
- O env de e2e (`VITE_FIREBASE_PERSISTENCE=local` + credenciais do `global.setup.ts`) vem do `.env`; o `release.sh` força `VITE_FIREBASE_PERSISTENCE=local` no run. Como o gate é warn, falhas de ambiente apenas avisam.
- O command roda os gates **uma vez**, dentro do `release.sh` (o preflight do command é read-only). Sem duplicação.
- A versão candidata é calculada a partir de `package.json`, que hoje (`0.1.0`) coincide com a última tag (`v0.1.0`).
```
