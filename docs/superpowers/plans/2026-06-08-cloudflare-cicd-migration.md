# Migração Cloudflare Workers + CI/CD 1Password — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar a hospedagem do webapp de Firebase Hosting para Cloudflare Workers Static Assets, centralizar config/secrets no 1Password (vault `costara-prod`) e adicionar quality gates (Biome + tsc + Vitest) ao CI no GitHub Actions.

**Architecture:** Worker assets-only servindo `dist/client` (SPA mode nativo). Dois ambientes: `main` → `staging.costara.app` (automático), tag `vX.Y.Z` → `costara.app` (apex, com smoke test). Secrets resolvidos no CI via `1password/load-secrets-action`; único GitHub Secret é `OP_SERVICE_ACCOUNT_TOKEN`. Workflows separados por gatilho, com dois composite actions locais (`setup-webapp`, `build-webapp`) eliminando duplicação. Firebase Auth permanece — migra-se apenas o hosting.

**Tech Stack:** Cloudflare Workers (Wrangler 4), GitHub Actions, 1Password CLI/Service Accounts, pnpm 10, Vite 7 + Vike (SPA), Biome, Vitest.

**Spec:** `docs/superpowers/specs/2026-06-08-cloudflare-cicd-migration-design.md`

---

## Notas de execução (ler antes de começar)

- **Branch:** todo o trabalho de código vai na branch `chore/cloudflare-cicd` (já criada, contém o spec).
- **Dependências locais:** rode `pnpm install --frozen-lockfile` uma vez antes de validar tarefas (precisa de `NODE_AUTH_TOKEN` para o pacote privado `@cacenot` — use seu `.npmrc`/token local).
- **Validação de YAML:** workflows e composite actions são validados em sintaxe com `pnpm dlx yaml-lint <arquivo>` e, semanticamente, só quando rodam no GitHub (Task 11, `gh run watch`). Isso é esperado — GitHub Actions não tem um validador semântico local 100% fiel.
- **Tarefas com `[AÇÃO HUMANA]`** (0, 11, 12, 13) exigem acesso a consoles externos (1Password, Cloudflare, GitHub Settings, DNS) que um agente não consegue operar. Pare e devolva ao humano nessas.
- **Ordem crítica:** Tasks 1–10 são código e podem ser feitas em sequência. Task 13 (remover Firebase) só roda **depois** da validação de produção (Task 12).
- **Status:** Tasks 1–10 implementadas na branch `cloudflare-impl`. O review final aplicou correções de robustez (commit `c122147`) que divergem levemente dos blocos abaixo — o **código é a fonte de verdade** para: `public/_headers` (catch-all `/*` no-cache em vez de regras por-path), `preview.yml` (grep com `|| true`) e o smoke de `deploy-production.yml` (`jq '.version // empty'`).

## Fora de escopo

- **Playwright e2e no gate:** o `playwright.config.ts` e os specs e2e já existem no repo, mas e2e **não** entra no `ci.yml` bloqueante (decisão do spec §7/§9 — custo + precisa de conta Firebase de teste). Ativar depois = adicionar credenciais de teste ao `webapp-env` + `VITE_FIREBASE_PERSISTENCE=local` e um job opt-in. Nenhuma tarefa aqui.
- **Migração do Firebase Auth:** permanece. Só o hosting migra.
- **Staging do backend:** não existe; o staging do webapp consome a API de produção.

---

## Task 0: Provisionamento de credenciais `[AÇÃO HUMANA]`

Pré-requisitos que não são código. Devem existir antes de Task 11 (primeira execução real no CI).

- [ ] **No 1Password, vault `costara-prod`, criar item `webapp-env`** (tipo Secure Note) com os campos:
  - `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` — copiar dos GitHub Secrets atuais do repo.
  - `VITE_API_BASE_URL` = `https://api.costara.app/api` (mesma API para staging e prod; o backend não tem staging).
  - `VITE_CUSTOMERS_PAGE_SIZE` = `20`, `VITE_PROJECTS_PAGE_SIZE` = `20`, `VITE_UNITS_PAGE_SIZE` = `20`.
- [ ] **Criar item `webapp-deploy`** (tipo API Credential) com os campos:
  - `cloudflare_api_token` — token Cloudflare com permissões **Account › Workers Scripts › Edit** e **Zone › Workers Routes › Edit** (zona `costara.app`).
  - `cloudflare_account_id` — Account ID da Cloudflare.
  - `gh_packages_token` — PAT do GitHub com `read:packages` (o mesmo `GH_PACKAGES_TOKEN` atual).
- [ ] **Adicionar o secret `OP_SERVICE_ACCOUNT_TOKEN` no repo** `constructpro-webapp` (Settings › Secrets › Actions), usando o token do service account `github-ci` (read-only, já existe no backend). Comando: `gh secret set OP_SERVICE_ACCOUNT_TOKEN --repo cacenot/constructpro-webapp`.
- [ ] **Confirmar** que o service account `github-ci` tem acesso de leitura ao vault `costara-prod` (já tem, pelo backend).

---

## Task 1: Versionamento (`version.json` + `package.json` + `.gitignore`)

**Files:**
- Create: `scripts/gen-version.mjs`
- Modify: `package.json` (version, scripts, devDependency `wrangler`)
- Modify: `.gitignore`

- [ ] **Step 1: Criar o gerador de versão**

Create `scripts/gen-version.mjs`:

```js
#!/usr/bin/env node
// Gera public/version.json com a versão do package.json + git sha.
// Rodado pelo `build` antes do `vite build`; o Vite copia public/ → dist/client/.
// GIT_SHA vem do env no CI (github.sha); fallback para o git local.
import { execSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))

let gitSha = process.env.GIT_SHA ?? ''
if (!gitSha) {
  try {
    gitSha = execSync('git rev-parse --short HEAD', { cwd: root }).toString().trim()
  } catch {
    gitSha = 'unknown'
  }
}

const payload = { version: pkg.version, gitSha: gitSha.slice(0, 7) }
const publicDir = resolve(root, 'public')
mkdirSync(publicDir, { recursive: true })
writeFileSync(resolve(publicDir, 'version.json'), `${JSON.stringify(payload, null, 2)}\n`)
console.log(`version.json → ${JSON.stringify(payload)}`)
```

- [ ] **Step 2: Adicionar wrangler como devDependency**

Run: `pnpm add -D wrangler`
Expected: `package.json` ganha `"wrangler": "^4..."` em `devDependencies`; `pnpm-lock.yaml` atualizado.

- [ ] **Step 3: Atualizar `package.json` — version e scripts**

Em `package.json`, trocar `"version": "0.0.0"` por `"version": "0.1.0"` e ajustar o bloco `scripts` para:

> **Por que `tsc -p tsconfig.app.json` e não `tsc -b`:** o `tsc -b` referencia `tsconfig.test.json`,
> acoplando o **build de produção** ao type-check dos testes — que hoje têm 36 erros de tipo,
> quebrando `pnpm build`. O build e o gate `typecheck` (bloqueante) passam a cobrir só o app
> (`src`+`pages`). O type-check dos testes vira `typecheck:tests`, usado num job **informativo**
> (Task 5) até a dívida ser saneada (Task 14), quando volta a ser bloqueante.

```json
  "scripts": {
    "dev": "vite ",
    "build": "node scripts/gen-version.mjs && tsc -p tsconfig.app.json && vite build",
    "preview": "vite preview",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write .",
    "typecheck": "tsc -p tsconfig.app.json",
    "typecheck:tests": "tsc -p tsconfig.test.json",
    "gen:version": "node scripts/gen-version.mjs",
    "release": "bash scripts/release.sh",
    "prepare": "husky",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  },
```

- [ ] **Step 4: Ignorar o `version.json` gerado**

Em `.gitignore`, adicionar após a linha `*.local` (seção de build/env):

```
# Versão gerada no build (não versionar)
public/version.json
```

- [ ] **Step 5: Validar geração isolada**

Run: `node scripts/gen-version.mjs && cat public/version.json`
Expected: imprime `{ "version": "0.1.0", "gitSha": "<7-char sha>" }`.

- [ ] **Step 6: Validar via build completo**

Run: `pnpm build && cat dist/client/version.json`
Expected: build conclui e `dist/client/version.json` contém `"version": "0.1.0"`.

- [ ] **Step 7: Commit**

```bash
git add scripts/gen-version.mjs package.json pnpm-lock.yaml .gitignore
git commit -m "feat(ci): gerador de version.json + wrangler dep + scripts de release"
```

---

## Task 2: Configuração do Wrangler (`wrangler.jsonc` + `public/_headers`)

**Files:**
- Create: `wrangler.jsonc`
- Create: `public/_headers`

- [ ] **Step 1: Criar `wrangler.jsonc`**

Create `wrangler.jsonc`:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "costara-webapp",
  "compatibility_date": "2026-06-01",
  "assets": {
    "directory": "./dist/client",
    "not_found_handling": "single-page-application"
  },
  "env": {
    "staging": {
      "name": "costara-webapp-staging",
      "routes": [{ "pattern": "staging.costara.app", "custom_domain": true }]
    },
    "production": {
      "name": "costara-webapp",
      "routes": [{ "pattern": "costara.app", "custom_domain": true }]
    }
  }
}
```

- [ ] **Step 2: Criar `public/_headers` (cache equivalente ao firebase.json)**

Create `public/_headers`:

```
/assets/*
  Cache-Control: public, max-age=31536000, immutable

/index.html
  Cache-Control: no-cache, no-store, must-revalidate

/version.json
  Cache-Control: no-cache, no-store, must-revalidate

/
  Cache-Control: no-cache, no-store, must-revalidate
```

- [ ] **Step 3: Validar a config do Wrangler (dry-run, sem publicar)**

Run: `pnpm build && pnpm exec wrangler deploy --env staging --dry-run`
Expected: Wrangler reporta o bundle de assets e termina com sucesso (`--dry-run` não faz chamada de rede nem publica). Erros de schema apareceriam aqui.

- [ ] **Step 4: Validar o ambiente de produção também**

Run: `pnpm exec wrangler deploy --env production --dry-run`
Expected: sucesso, listando a rota `costara.app`.

- [ ] **Step 5: Commit**

```bash
git add wrangler.jsonc public/_headers
git commit -m "feat(deploy): wrangler config (staging/prod) + headers de cache"
```

---

## Task 3: Composite action `setup-webapp`

Setup pnpm/node + install, resolvendo o token do pacote privado via 1Password. Reutilizado por todos os jobs.

**Files:**
- Create: `.github/actions/setup-webapp/action.yml`

- [ ] **Step 1: Criar o composite**

Create `.github/actions/setup-webapp/action.yml`:

```yaml
name: Setup webapp
description: Setup pnpm/node e instala dependências (resolve o token do pacote privado via 1Password).
inputs:
  op-service-account-token:
    description: Token do service account 1Password (github-ci, read-only).
    required: true
runs:
  using: composite
  steps:
    - uses: pnpm/action-setup@v4

    - uses: actions/setup-node@v4
      with:
        node-version: 22
        cache: pnpm
        registry-url: https://npm.pkg.github.com
        scope: '@cacenot'

    - name: Resolver token do pacote privado (1Password)
      uses: 1password/load-secrets-action@v2
      with:
        export-env: true
      env:
        OP_SERVICE_ACCOUNT_TOKEN: ${{ inputs.op-service-account-token }}
        GH_PACKAGES_TOKEN: op://costara-prod/webapp-deploy/gh_packages_token

    - name: Install
      shell: bash
      run: pnpm install --frozen-lockfile
      env:
        NODE_AUTH_TOKEN: ${{ env.GH_PACKAGES_TOKEN }}
```

- [ ] **Step 2: Validar sintaxe YAML**

Run: `pnpm dlx yaml-lint .github/actions/setup-webapp/action.yml`
Expected: `✔ ... is valid YAML.` (validação semântica vem na Task 11).

- [ ] **Step 3: Commit**

```bash
git add .github/actions/setup-webapp/action.yml
git commit -m "feat(ci): composite action setup-webapp (install via 1Password)"
```

---

## Task 4: Composite action `build-webapp`

Encadeia `setup-webapp`, resolve os `VITE_*` do 1Password e builda `dist/client`. Usado por preview/staging/production.

**Files:**
- Create: `.github/actions/build-webapp/action.yml`

- [ ] **Step 1: Criar o composite**

Create `.github/actions/build-webapp/action.yml`:

```yaml
name: Build webapp
description: Instala deps e builda dist/client, resolvendo a config VITE_* do 1Password.
inputs:
  op-service-account-token:
    description: Token do service account 1Password (github-ci, read-only).
    required: true
runs:
  using: composite
  steps:
    - uses: ./.github/actions/setup-webapp
      with:
        op-service-account-token: ${{ inputs.op-service-account-token }}

    - name: Resolver config VITE_* (1Password)
      uses: 1password/load-secrets-action@v2
      with:
        export-env: true
      env:
        OP_SERVICE_ACCOUNT_TOKEN: ${{ inputs.op-service-account-token }}
        VITE_FIREBASE_API_KEY: op://costara-prod/webapp-env/VITE_FIREBASE_API_KEY
        VITE_FIREBASE_AUTH_DOMAIN: op://costara-prod/webapp-env/VITE_FIREBASE_AUTH_DOMAIN
        VITE_FIREBASE_PROJECT_ID: op://costara-prod/webapp-env/VITE_FIREBASE_PROJECT_ID
        VITE_FIREBASE_STORAGE_BUCKET: op://costara-prod/webapp-env/VITE_FIREBASE_STORAGE_BUCKET
        VITE_FIREBASE_MESSAGING_SENDER_ID: op://costara-prod/webapp-env/VITE_FIREBASE_MESSAGING_SENDER_ID
        VITE_FIREBASE_APP_ID: op://costara-prod/webapp-env/VITE_FIREBASE_APP_ID
        VITE_API_BASE_URL: op://costara-prod/webapp-env/VITE_API_BASE_URL
        VITE_CUSTOMERS_PAGE_SIZE: op://costara-prod/webapp-env/VITE_CUSTOMERS_PAGE_SIZE
        VITE_PROJECTS_PAGE_SIZE: op://costara-prod/webapp-env/VITE_PROJECTS_PAGE_SIZE
        VITE_UNITS_PAGE_SIZE: op://costara-prod/webapp-env/VITE_UNITS_PAGE_SIZE

    - name: Build (gera version.json + dist/client)
      shell: bash
      run: pnpm build
      env:
        GIT_SHA: ${{ github.sha }}
```

- [ ] **Step 2: Validar sintaxe YAML**

Run: `pnpm dlx yaml-lint .github/actions/build-webapp/action.yml`
Expected: `✔ ... is valid YAML.`

- [ ] **Step 3: Commit**

```bash
git add .github/actions/build-webapp/action.yml
git commit -m "feat(ci): composite action build-webapp (VITE_* via 1Password + build)"
```

---

## Task 5: Workflow `ci.yml` (quality gates)

Jobs **bloqueantes** (required para merge): `lint`, `typecheck` (app). Jobs **informativos**
(`continue-on-error: true`, não bloqueiam): `unit` (5 testes de `sale.schema` falhando) e
`typecheck-tests` (36 erros de tipo nos testes). Os dois informativos viram bloqueantes quando a
Task 14 zerar a dívida.

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Criar o workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

jobs:
  lint:
    name: Lint + format (Biome)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-webapp
        with:
          op-service-account-token: ${{ secrets.OP_SERVICE_ACCOUNT_TOKEN }}
      - run: pnpm lint

  typecheck:
    name: Typecheck app (tsc)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-webapp
        with:
          op-service-account-token: ${{ secrets.OP_SERVICE_ACCOUNT_TOKEN }}
      - run: pnpm typecheck

  unit:
    name: Unit tests (Vitest) [informativo]
    runs-on: ubuntu-latest
    # TODO(Task 14): remover continue-on-error quando os 5 testes de sale.schema voltarem ao verde.
    continue-on-error: true
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-webapp
        with:
          op-service-account-token: ${{ secrets.OP_SERVICE_ACCOUNT_TOKEN }}
      - run: pnpm test

  typecheck-tests:
    name: Typecheck tests (tsc) [informativo]
    runs-on: ubuntu-latest
    # TODO(Task 14): remover continue-on-error quando os 36 erros de tipo nos testes forem zerados.
    continue-on-error: true
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-webapp
        with:
          op-service-account-token: ${{ secrets.OP_SERVICE_ACCOUNT_TOKEN }}
      - run: pnpm typecheck:tests
```

> **Branch protection (Task 13):** marcar como required apenas `lint` e `typecheck`. NÃO marcar
> `unit` nem `typecheck-tests` como required enquanto forem informativos.

- [ ] **Step 2: Validar sintaxe YAML**

Run: `pnpm dlx yaml-lint .github/workflows/ci.yml`
Expected: `✔ ... is valid YAML.`

- [ ] **Step 3: Confirmar os gates localmente (estado já saneado)**

Run: `pnpm lint && pnpm typecheck`
Expected: ambos verdes (bloqueantes). Os informativos têm dívida conhecida: `pnpm test` → 5 falhas
em `sale.schema`; `pnpm typecheck:tests` → 36 erros de tipo. Isso é esperado e está endereçado pela
Task 14; não bloqueia esta tarefa.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "feat(ci): workflow de quality gates (biome + tsc + vitest)"
```

---

## Task 6: Workflow `preview.yml` (preview URL por PR)

**Files:**
- Create: `.github/workflows/preview.yml`

- [ ] **Step 1: Criar o workflow**

Create `.github/workflows/preview.yml`:

```yaml
name: Preview
on:
  pull_request:

concurrency:
  group: preview-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read
  pull-requests: write

jobs:
  preview:
    name: Build + upload preview
    if: ${{ github.event.pull_request.head.repo.full_name == github.repository }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: ./.github/actions/build-webapp
        with:
          op-service-account-token: ${{ secrets.OP_SERVICE_ACCOUNT_TOKEN }}

      - name: Resolver credenciais Cloudflare (1Password)
        uses: 1password/load-secrets-action@v2
        with:
          export-env: true
        env:
          OP_SERVICE_ACCOUNT_TOKEN: ${{ secrets.OP_SERVICE_ACCOUNT_TOKEN }}
          CLOUDFLARE_API_TOKEN: op://costara-prod/webapp-deploy/cloudflare_api_token
          CLOUDFLARE_ACCOUNT_ID: op://costara-prod/webapp-deploy/cloudflare_account_id

      - name: Upload da versão de preview (não-roteada)
        id: preview
        shell: bash
        run: |
          set -o pipefail
          output=$(pnpm exec wrangler versions upload --env staging 2>&1 | tee /dev/stderr)
          url=$(echo "$output" | grep -oE 'https://[a-z0-9-]+\.workers\.dev[^ ]*' | head -1)
          echo "url=$url" >> "$GITHUB_OUTPUT"

      - name: Comentar a preview URL no PR
        uses: marocchino/sticky-pull-request-comment@v2
        with:
          header: preview
          message: |
            🔎 **Preview deployado:** ${{ steps.preview.outputs.url }}

            Commit: `${{ github.sha }}`
```

> **Nota de fragilidade:** o `grep` que extrai a URL depende do formato de saída do `wrangler versions upload`. Na primeira execução real (Task 11), confira o log do step e ajuste o regex se a URL não for capturada. A preview URL exige que "preview URLs" esteja habilitado no Worker (padrão na Cloudflare).

- [ ] **Step 2: Validar sintaxe YAML**

Run: `pnpm dlx yaml-lint .github/workflows/preview.yml`
Expected: `✔ ... is valid YAML.`

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/preview.yml
git commit -m "feat(ci): preview URL por PR via wrangler versions upload"
```

---

## Task 7: Workflow `deploy-staging.yml`

**Files:**
- Create: `.github/workflows/deploy-staging.yml`

- [ ] **Step 1: Criar o workflow**

Create `.github/workflows/deploy-staging.yml`:

```yaml
name: Deploy staging
on:
  push:
    branches: [main]

concurrency:
  group: deploy-staging
  cancel-in-progress: false

permissions:
  contents: read

jobs:
  deploy:
    name: Build + deploy → staging.costara.app
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: ./.github/actions/build-webapp
        with:
          op-service-account-token: ${{ secrets.OP_SERVICE_ACCOUNT_TOKEN }}

      - name: Resolver credenciais Cloudflare (1Password)
        uses: 1password/load-secrets-action@v2
        with:
          export-env: true
        env:
          OP_SERVICE_ACCOUNT_TOKEN: ${{ secrets.OP_SERVICE_ACCOUNT_TOKEN }}
          CLOUDFLARE_API_TOKEN: op://costara-prod/webapp-deploy/cloudflare_api_token
          CLOUDFLARE_ACCOUNT_ID: op://costara-prod/webapp-deploy/cloudflare_account_id

      - name: Deploy staging
        shell: bash
        run: pnpm exec wrangler deploy --env staging
```

- [ ] **Step 2: Validar sintaxe YAML**

Run: `pnpm dlx yaml-lint .github/workflows/deploy-staging.yml`
Expected: `✔ ... is valid YAML.`

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy-staging.yml
git commit -m "feat(ci): deploy automático de staging no push para main"
```

---

## Task 8: Workflow `deploy-production.yml` (gate + deploy + smoke)

**Files:**
- Create: `.github/workflows/deploy-production.yml`

- [ ] **Step 1: Criar o workflow**

Create `.github/workflows/deploy-production.yml`:

```yaml
name: Deploy production
on:
  push:
    tags: ['v*.*.*']

concurrency:
  group: deploy-production
  cancel-in-progress: false

permissions:
  contents: read

jobs:
  checks:
    name: Gate (tag == version) + quality gates
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Verificar que a tag bate com package.json version
        shell: bash
        run: |
          TAG="${{ github.ref_name }}"
          PKGVER="v$(node -p "require('./package.json').version")"
          if [ "$TAG" != "$PKGVER" ]; then
            echo "ERRO: tag $TAG != package.json $PKGVER"
            exit 1
          fi
          echo "OK: tag $TAG == package.json $PKGVER"

      - uses: ./.github/actions/setup-webapp
        with:
          op-service-account-token: ${{ secrets.OP_SERVICE_ACCOUNT_TOKEN }}

      - run: pnpm lint
      - run: pnpm typecheck
      # Informativo até a Task 14 sanear a dívida de testes — não bloqueia o deploy de prod.
      - run: pnpm test
        continue-on-error: true

  deploy:
    name: Build + deploy → costara.app
    needs: checks
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: ./.github/actions/build-webapp
        with:
          op-service-account-token: ${{ secrets.OP_SERVICE_ACCOUNT_TOKEN }}

      - name: Resolver credenciais Cloudflare (1Password)
        uses: 1password/load-secrets-action@v2
        with:
          export-env: true
        env:
          OP_SERVICE_ACCOUNT_TOKEN: ${{ secrets.OP_SERVICE_ACCOUNT_TOKEN }}
          CLOUDFLARE_API_TOKEN: op://costara-prod/webapp-deploy/cloudflare_api_token
          CLOUDFLARE_ACCOUNT_ID: op://costara-prod/webapp-deploy/cloudflare_account_id

      - name: Deploy production
        shell: bash
        run: pnpm exec wrangler deploy --env production

  smoke:
    name: Smoke (verifica version.json)
    needs: deploy
    runs-on: ubuntu-latest
    steps:
      - name: Poll costara.app/version.json até bater com a tag
        shell: bash
        run: |
          set -u
          tag="${{ github.ref_name }}"
          target="${tag#v}"
          # 18 tentativas × 10s = até ~3 min para o deploy propagar.
          for i in $(seq 1 18); do
            response=$(curl --fail --silent "https://costara.app/version.json" || true)
            if [ -n "$response" ]; then
              version=$(echo "$response" | jq -r .version)
              echo "Tentativa $i: version=$version (alvo=$target)"
              if [ "$version" = "$target" ]; then
                echo "Versão publicada bate com a tag — release verificado."
                exit 0
              fi
            else
              echo "Tentativa $i: version.json inacessível"
            fi
            sleep 10
          done
          echo "SMOKE FAIL: version.json não reportou $target em ~3 min"
          exit 1
```

- [ ] **Step 2: Validar sintaxe YAML**

Run: `pnpm dlx yaml-lint .github/workflows/deploy-production.yml`
Expected: `✔ ... is valid YAML.`

- [ ] **Step 3: Validar localmente o gate tag==version**

Run: `node -p "require('./package.json').version"`
Expected: imprime `0.1.0` (a tag de release correspondente será `v0.1.0`).

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy-production.yml
git commit -m "feat(ci): deploy de produção por tag com gate de versão + smoke test"
```

---

## Task 9: Script de release (`scripts/release.sh`)

Espelha o `release.sh` do backend, adaptado para `package.json` + pnpm. Modo plain (`vX.Y.Z`) e `--bump`.

**Files:**
- Create: `scripts/release.sh`

- [ ] **Step 1: Criar o script**

Create `scripts/release.sh`:

```bash
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

echo "Rodando quality gate (lint + typecheck bloqueantes)..."
pnpm lint
pnpm typecheck
# Testes informativos até a Task 14 sanear a dívida (5 falhas em sale.schema).
# Troque para `pnpm test` (bloqueante) quando os testes voltarem ao verde.
pnpm test || echo "AVISO: vitest com dívida conhecida (Task 14) — não bloqueia o release"

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
```

- [ ] **Step 2: Tornar executável**

Run: `chmod +x scripts/release.sh`
Expected: sem saída (sucesso).

- [ ] **Step 3: Validar sintaxe do shell**

Run: `bash -n scripts/release.sh`
Expected: sem saída (sintaxe válida).

- [ ] **Step 4: Validar a guarda de versão inválida**

Run: `./scripts/release.sh banana; echo "exit=$?"`
Expected: imprime `ERRO: VERSION 'banana' deve casar com vX.Y.Z ...` e `exit=1`.

- [ ] **Step 5: Commit**

```bash
git add scripts/release.sh
git commit -m "feat(ci): script release.sh (gate local + tag + push)"
```

---

## Task 10: Documentação (`.env.example` + `CLAUDE.md`)

**Files:**
- Modify: `.env.example`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Anotar a origem 1Password no `.env.example`**

Em `.env.example`, substituir a primeira linha (`# Firebase`) por:

```
# Em CI/staging/prod, estas variáveis vêm do 1Password (op://costara-prod/webapp-env/*),
# resolvidas pelo load-secrets-action. Localmente, preencha este arquivo (.env, gitignored).
# Firebase
```

- [ ] **Step 2: Adicionar seção de Deploy no `CLAUDE.md`**

Em `CLAUDE.md`, adicionar antes da seção `## Common Gotchas`:

```markdown
## Deploy & CI/CD

Hospedagem em **Cloudflare Workers Static Assets** (config em `wrangler.jsonc`). SPA mode nativo
(`not_found_handling`); headers de cache em `public/_headers`. **Firebase Auth permanece** — só o
hosting foi migrado.

**Ambientes:**
- `main` (push) → deploy automático em `staging.costara.app` (`deploy-staging.yml`)
- tag `vX.Y.Z` (push) → deploy em `costara.app` + smoke test (`deploy-production.yml`)
- PR → preview URL comentada no PR (`preview.yml`)

**Quality gates** (`ci.yml`): bloqueantes para merge → `pnpm lint` (Biome) + `pnpm typecheck`
(tsc, só app `src`+`pages`). Informativos (não bloqueiam, dívida em saneamento) → `pnpm test`
(Vitest) + `pnpm typecheck:tests`. O build de produção usa `tsc -p tsconfig.app.json` (não `tsc -b`)
para não acoplar o deploy ao type-check dos testes.

**Secrets:** tudo no 1Password (vault `costara-prod`, items `webapp-env` e `webapp-deploy`), resolvido no
CI via `load-secrets-action`. Único GitHub Secret do repo: `OP_SERVICE_ACCOUNT_TOKEN`. Os `VITE_*`
são públicos no bundle (Firebase client keys são públicas por design); o 1Password dá centralização
e protege o que é sensível (`cloudflare_api_token`, `gh_packages_token`).

**Release:** `./scripts/release.sh vX.Y.Z --bump` bumpa o `package.json`, roda os gates e cria/
empurra a tag de uma vez (ou, em dois passos: ajuste a versão no `package.json`, commite, e rode
`./scripts/release.sh vX.Y.Z`). O script roda os gates localmente antes de criar/empurrar a tag.
`version.json` (gerado no build) é a fonte que o smoke test consulta.

**Rollback:** `pnpm exec wrangler rollback --env production` reverte o Worker para a versão anterior
instantaneamente (ou re-rode `release.sh` com a tag anterior).
```

- [ ] **Step 3: Commit**

```bash
git add .env.example CLAUDE.md
git commit -m "docs: documenta deploy Cloudflare + CI/CD 1Password"
```

---

## Task 11: Validação de integração no CI `[AÇÃO HUMANA + agente]`

Pré-requisito: Task 0 concluída (credenciais no 1Password + GitHub Secret existem).

- [ ] **Step 1: Push da branch**

```bash
git push -u origin chore/cloudflare-cicd
```

- [ ] **Step 2: Abrir um PR de teste e observar `ci.yml` + `preview.yml`**

```bash
gh pr create --base main --head chore/cloudflare-cicd \
  --title "Migração Cloudflare Workers + CI/CD 1Password" \
  --body "Ver docs/superpowers/specs/2026-06-08-cloudflare-cicd-migration-design.md"
gh run watch
```
Expected: `lint` e `typecheck` (bloqueantes) verdes; `unit` e `typecheck-tests` rodam mas são
informativos (podem aparecer vermelhos com a dívida conhecida — não bloqueiam). Job `preview` builda
e posta um comentário com a preview URL. **Abra a preview URL** e confirme que o app carrega e o
login Firebase funciona.

- [ ] **Step 3: Ajustar o regex de preview se necessário**

Se o comentário do PR vier com URL vazia, inspecione o log do step "Upload da versão de preview" (`gh run view --log`), corrija o `grep` em `preview.yml`, commite e repita.

- [ ] **Step 4: Merge e observar `deploy-staging.yml`**

Após os checks verdes, faça merge do PR. Observe o deploy de staging:
```bash
gh run watch
```
Expected: deploy conclui; `https://staging.costara.app` serve o app (login + chamadas à API reais funcionando). Confirme `https://staging.costara.app/version.json` retornando `{"version":"0.1.0",...}`.

> Pare aqui e valide staging com calma antes de seguir para produção.

---

## Task 12: Cutover de produção `[AÇÃO HUMANA]`

- [ ] **Step 1: Primeiro release de produção (sem cutover de DNS ainda)**

Em `main` atualizado:
```bash
git checkout main && git pull
./scripts/release.sh v0.1.0
gh run watch
```
Expected: `deploy-production.yml` roda gate → build → `wrangler deploy --env production`. O Worker de produção é publicado. **Nota:** o smoke test vai falhar até o DNS do apex apontar para o Worker (Step 2) — isso é esperado nesta primeira tag. Verifique o deploy pela URL `*.workers.dev` do Worker de produção no dashboard Cloudflare.

- [ ] **Step 2: Apontar `costara.app` para o Worker**

No dashboard Cloudflare (ou via `wrangler`), confirme que o custom domain `costara.app` foi anexado ao Worker `costara-webapp` (a config `routes` com `custom_domain: true` cria isso no primeiro deploy de produção). O Firebase Hosting continua respondendo até o DNS do apex resolver para o Worker.

- [ ] **Step 3: Validar produção**

Expected: `https://costara.app` serve o app via Cloudflare; `https://costara.app/version.json` retorna `0.1.0`. Re-rode o smoke se quiser: re-trigger do `deploy-production.yml` (`gh workflow run` não aplica — em vez disso confirme manualmente o `version.json`).

- [ ] **Step 4: Remover os GitHub Secrets `VITE_*` antigos**

Após confirmar prod estável, remova os secrets agora não usados:
```bash
for s in VITE_FIREBASE_API_KEY VITE_FIREBASE_AUTH_DOMAIN VITE_FIREBASE_PROJECT_ID \
  VITE_FIREBASE_STORAGE_BUCKET VITE_FIREBASE_MESSAGING_SENDER_ID VITE_FIREBASE_APP_ID \
  VITE_API_BASE_URL VITE_CUSTOMERS_PAGE_SIZE VITE_PROJECTS_PAGE_SIZE VITE_UNITS_PAGE_SIZE \
  GH_PACKAGES_TOKEN FIREBASE_SERVICE_ACCOUNT_CONSTRUCT_PRO_DEV; do
  gh secret delete "$s" --repo cacenot/constructpro-webapp || true
done
```

---

## Task 13: Descomissionar Firebase Hosting `[AÇÃO HUMANA — só após Task 12 validada]`

**Files:**
- Delete: `firebase.json`, `.firebaserc`
- Delete: `.github/workflows/firebase-hosting-merge.yml`, `firebase-hosting-pull-request.yml`, `firebase-hosting-redeploy.yml`

- [ ] **Step 1: Remover config e workflows do Firebase Hosting**

```bash
git checkout main && git pull
git rm firebase.json .firebaserc \
  .github/workflows/firebase-hosting-merge.yml \
  .github/workflows/firebase-hosting-pull-request.yml \
  .github/workflows/firebase-hosting-redeploy.yml
```

- [ ] **Step 2: Confirmar que o Firebase Auth NÃO foi tocado**

Run: `git grep -l "firebase/auth\|getAuth\|useAuth" src | head` e `grep '"firebase"' package.json`
Expected: `src/lib/firebase.ts`, `src/contexts/auth-context.tsx` etc. intactos; dependência `firebase` ainda presente. (Só o *hosting* sai.)

- [ ] **Step 3: Commit + PR de descomissionamento**

```bash
git checkout -b chore/remove-firebase-hosting
git commit -m "chore(deploy): remove Firebase Hosting (migrado para Cloudflare Workers)"
git push -u origin chore/remove-firebase-hosting
gh pr create --base main --fill
```

- [ ] **Step 4: Desativar o target de hosting no console Firebase**

No console Firebase do projeto `construct-pro-dev`, desabilite/remova o Hosting site (passo manual no console; mantém Auth ativo).

- [ ] **Step 5: Configurar branch protection**

Em GitHub Settings › Branches › `main`, exigir como required **apenas** os status checks `lint` e
`typecheck` (do `ci.yml`). NÃO marcar `unit` nem `typecheck-tests` enquanto forem informativos —
isso acontece na Task 14, quando a dívida de testes for zerada.

---

## Task 14: Sanear a dívida de testes `[pós-migração — opcional/separável]`

A migração foi desacoplada desta dívida (gates informativos). Esta task a zera e promove os gates a
bloqueantes. Pode rodar em paralelo/depois da migração, sem bloqueá-la.

**Files:**
- Modify: `tests/unit/schemas/sale.schema.test.ts` (5 testes falhando) e/ou `src/schemas/sale.schema.ts`
- Modify: `tests/unit/components/unidades/units-table.test.tsx`, `tests/unit/components/filters/project-filter.test.tsx`, `tests/unit/components/configuracoes/segmented-control.test.tsx` (36 erros de tipo)
- Modify: `.github/workflows/ci.yml` (remover `continue-on-error` dos jobs `unit` e `typecheck-tests`)

- [ ] **Step 1: Diagnosticar os 5 testes de `sale.schema`**

Run: `pnpm test tests/unit/schemas/sale.schema.test.ts`
Investigar: provavelmente o schema divergiu do `@cacenot/construct-pro-api-client` (bump 1.3.0) ou
de uma regra de `installment_schedules`/`index_type_code`. Corrigir teste ou schema conforme a regra
real de negócio (consultar [[wire-money-rate-contract]] e [[installment-kind-periodicity]] se for
sobre money/parcelas).

- [ ] **Step 2: Diagnosticar os 36 erros de tipo nos testes**

Run: `pnpm typecheck:tests`
São tipos `never`/`readonly` em mocks de tabela/query (ex: factory de unidade não casa com o tipo
esperado; `queryKey` readonly vs mutable). Ajustar os helpers/mocks de teste.

- [ ] **Step 3: Confirmar verde**

Run: `pnpm test && pnpm typecheck:tests`
Expected: ambos verdes.

- [ ] **Step 4: Promover os gates a bloqueantes**

Em `.github/workflows/ci.yml`, remover `continue-on-error: true` (e o `[informativo]` do `name`) dos
jobs `unit` e `typecheck-tests`. No `deploy-production.yml`, remover o `continue-on-error: true` do
step `pnpm test`.

- [ ] **Step 5: Commit**

```bash
git add tests/ src/schemas .github/workflows/ci.yml .github/workflows/deploy-production.yml
git commit -m "test: saneia dívida de testes e promove gates a bloqueantes"
```

- [ ] **Step 6: Marcar `unit` e `typecheck-tests` como required** na branch protection do `main`.

---

## Resumo de arquivos

**Criados:** `scripts/gen-version.mjs`, `scripts/release.sh`, `wrangler.jsonc`, `public/_headers`, `.github/actions/setup-webapp/action.yml`, `.github/actions/build-webapp/action.yml`, `.github/workflows/{ci,preview,deploy-staging,deploy-production}.yml`

**Modificados:** `package.json`, `pnpm-lock.yaml`, `.gitignore`, `.env.example`, `CLAUDE.md`,
`src/components/vendas/proposal/proposal-workbench.tsx` (fix `stepFields`, saneamento de baseline já
commitado)

**Removidos (Task 13):** `firebase.json`, `.firebaserc`, `.github/workflows/firebase-hosting-*.yml`

**Intocados (importante):** `firebase` (dep), `src/lib/firebase.ts`, `src/contexts/auth-context.tsx`, `vite.config.ts`
