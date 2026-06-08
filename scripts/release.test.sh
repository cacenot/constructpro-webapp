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

# --- Cenário 2: segundo release sobre CHANGELOG existente (caminho de insert) ---
echo "feature 2" >> feature.txt
git add feature.txt
git commit -q -m "feat: outra feature (#3)"
git push -q origin main

NOTES2="${WORK}/notes2.md"
cat > "${NOTES2}" <<'EOF'
### Features
- outra feature (#3)
EOF

set +e
PATH="${STUB}:${PATH}" RELEASE_BRANCH=main \
  bash "${RELEASE_SH}" v0.3.0 --bump --notes-file="${NOTES2}"
RC2=$?
set -e

assert "2º release retornou 0" test "${RC2}" -eq 0
assert "package.json bumpado p/ 0.3.0" \
  bash -c '[ "$(node -p "require(\"./package.json\").version")" = "0.3.0" ]'
assert_contains "CHANGELOG mantém seção v0.2.0" CHANGELOG.md "## [v0.2.0]"
assert_contains "CHANGELOG ganhou seção v0.3.0" CHANGELOG.md "## [v0.3.0]"
assert_contains "CHANGELOG tem corpo da 2ª release" CHANGELOG.md "outra feature (#3)"
assert "v0.3.0 inserido ACIMA de v0.2.0" bash -c '
  l3=$(grep -n "## \[v0.3.0\]" CHANGELOG.md | head -1 | cut -d: -f1)
  l2=$(grep -n "## \[v0.2.0\]" CHANGELOG.md | head -1 | cut -d: -f1)
  [ -n "$l3" ] && [ -n "$l2" ] && [ "$l3" -lt "$l2" ]
'

echo
echo "PASS=${PASS} FAIL=${FAIL}"
[ "${FAIL}" -eq 0 ]
