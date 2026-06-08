#!/usr/bin/env bash
# scripts/release.sh — cria e dá push numa tag de release do webapp.
#
# Valida o estado local e roda o quality gate completo (lint + typecheck +
# test) ANTES de qualquer mutação ou push, então cria uma tag anotada e a
# envia para origin. O workflow .github/workflows/deploy-production.yml é
# disparado pela tag e cuida de build/deploy/smoke.
#
# Modos:
#   plain:  ./scripts/release.sh vX.Y.Z
#       A versão já está em package.json e em origin/<branch>. O script só
#       valida, cria a tag em HEAD e dá push na tag.
#   bump:   ./scripts/release.sh vX.Y.Z --bump
#       A versão ainda NÃO foi escrita. Depois de TODOS os gates passarem, o
#       script escreve a versão em package.json, commita o bump, cria a tag e
#       dá push do commit + tag juntos (--atomic). Nada é escrito/commitado/
#       enviado até tudo estar verde — um run que falha nunca "queima" versão.
#
# Recusa rodar a menos que:
#   - working tree limpa
#   - branch atual == RELEASE_BRANCH (default "main")
#   - branch local sincronizada com origin/<branch>
#   - VERSION casa com v\d+\.\d+\.\d+
#   - a tag não exista local nem em origin
#   - lint + typecheck + test passem

set -euo pipefail

RELEASE_BRANCH="${RELEASE_BRANCH:-main}"

VERSION_ARG=""
BUMP=false
for arg in "$@"; do
  case "${arg}" in
    --bump) BUMP=true ;;
    -*)
      echo "ERRO: flag desconhecida '${arg}'" >&2
      exit 1
      ;;
    *)
      if [[ -n "${VERSION_ARG}" ]]; then
        echo "ERRO: argumento extra inesperado '${arg}'" >&2
        exit 1
      fi
      VERSION_ARG="${arg}"
      ;;
  esac
done

VERSION="${VERSION_ARG:-${VERSION:-}}"

if [[ -z "${VERSION}" ]]; then
  echo "ERRO: nenhuma VERSION informada. Uso: $0 vX.Y.Z [--bump]" >&2
  exit 1
fi

if ! [[ "${VERSION}" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "ERRO: VERSION '${VERSION}' deve casar com vX.Y.Z (ex.: v1.2.3)" >&2
  exit 1
fi

cd "$(git rev-parse --show-toplevel)"

current_branch=$(git rev-parse --abbrev-ref HEAD)
if [[ "${current_branch}" != "${RELEASE_BRANCH}" ]]; then
  echo "ERRO: precisa estar na branch '${RELEASE_BRANCH}' (atual: '${current_branch}')" >&2
  echo "Sobrescreva com RELEASE_BRANCH=<nome> se liberar de outra branch." >&2
  exit 1
fi

if ! git diff-index --quiet HEAD --; then
  echo "ERRO: working tree tem mudanças não commitadas" >&2
  git status --short >&2
  exit 1
fi

echo "Buscando origin..."
git fetch origin "${RELEASE_BRANCH}"

local_sha=$(git rev-parse HEAD)
origin_sha=$(git rev-parse "origin/${RELEASE_BRANCH}")
if [[ "${local_sha}" != "${origin_sha}" ]]; then
  echo "ERRO: ${RELEASE_BRANCH} local fora de sincronia com origin/${RELEASE_BRANCH}" >&2
  echo "  local:  ${local_sha}" >&2
  echo "  origin: ${origin_sha}" >&2
  exit 1
fi

if git rev-parse "refs/tags/${VERSION}" >/dev/null 2>&1; then
  echo "ERRO: tag ${VERSION} já existe localmente" >&2
  exit 1
fi

if git ls-remote --tags origin "refs/tags/${VERSION}" | grep -q "${VERSION}"; then
  echo "ERRO: tag ${VERSION} já existe em origin" >&2
  exit 1
fi

echo "Rodando quality gate (lint + typecheck + test)..."
pnpm lint
pnpm typecheck
pnpm test || echo "AVISO: testes falharam — revise antes de prosseguir com o release."

next="${VERSION#v}"
if [[ "${BUMP}" == true ]]; then
  echo "Escrevendo versão ${next} em package.json..."
  npm pkg set version="${next}"
  git add package.json
  git commit -m "chore(release): bump version to ${VERSION}"
else
  current_pkg="v$(node -p "require('./package.json').version")"
  if [[ "${current_pkg}" != "${VERSION}" ]]; then
    echo "ERRO: package.json está em ${current_pkg}, mas você pediu ${VERSION}." >&2
    echo "Commite o bump primeiro, ou use --bump." >&2
    exit 1
  fi
fi

echo "Criando tag anotada ${VERSION}..."
git tag -a "${VERSION}" -m "Release ${VERSION}"

if [[ "${BUMP}" == true ]]; then
  echo "Push do commit de bump + tag ${VERSION} (atômico)..."
  git push --atomic origin "${RELEASE_BRANCH}" "${VERSION}"
else
  echo "Push da tag ${VERSION}..."
  git push origin "${VERSION}"
fi

echo
echo "✅ Release ${VERSION} enviado."
echo "   Acompanhe em: https://github.com/cacenot/constructpro-webapp/actions"
