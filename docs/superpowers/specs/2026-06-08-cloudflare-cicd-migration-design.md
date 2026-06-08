# Migração Firebase Hosting → Cloudflare Workers + CI/CD com 1Password

- **Data:** 2026-06-08
- **Status:** Aprovado (design) — pendente implementação
- **Autor:** Fernando (com Claude Code, via brainstorming)
- **Repositório:** `constructpro-webapp` (produto Costara)

---

## 1. Contexto e motivação

O webapp hospeda hoje em **Firebase Hosting** via 3 workflows auto-gerados pelo Firebase CLI.
O backend (`construct-pro-api`) já vive inteiramente no ecossistema Cloudflare (Zero Trust Tunnel,
domínio `costara.app` gerenciado lá) e tem um CI/CD maduro, **100% orquestrado por 1Password**
(vault `costara-prod`, `op://` references, `load-secrets-action`, deploy por tag com smoke test).

O frontend está defasado em relação a isso:

- Hospedagem num provedor diferente do resto do stack (Firebase, não Cloudflare).
- Secrets espalhados como ~12 GitHub Secrets soltos, sem single-source-of-truth.
- **Nenhum quality gate** no CI — Biome, Vitest e Playwright estão configurados mas desligados.
- Workflows duplicados (mesmo bloco install+build copiado 3×).
- Um ambiente só (`construct-pro-dev`), sem separação staging/prod.

**Objetivo:** migrar a hospedagem para **Cloudflare Workers Static Assets**, centralizar
secrets/config no **1Password** (espelhando o backend), adicionar **quality gates** ao CI e
manter o **GitHub Actions** como orquestrador — tudo com paridade conceitual com o backend.

---

## 2. Estado atual (CI/CD Firebase)

Três workflows, todos auto-gerados pelo Firebase CLI, nunca customizados:

| Workflow | Trigger | Ação |
|---|---|---|
| `firebase-hosting-merge.yml` | push em `main` | build → deploy **live** em `construct-pro-dev` |
| `firebase-hosting-pull-request.yml` | PR | build → deploy num **preview channel** efêmero |
| `firebase-hosting-redeploy.yml` | `workflow_dispatch` | rebuild de um `ref` → live |

Os três repetem o mesmo bloco: `checkout` → setup pnpm/node 22 (registry `@cacenot`) →
`pnpm install` (`NODE_AUTH_TOKEN` = `GH_PACKAGES_TOKEN`) → `pnpm build` (injetando ~10 `VITE_*`
de GitHub Secrets) → `FirebaseExtended/action-hosting-deploy`.

### Gaps identificados

1. **Zero quality gates.** Único gate é o `tsc -b` implícito no `pnpm build`. Biome, Vitest e
   Playwright existem mas não rodam no pipeline.
2. **Secrets espalhados.** ~12 GitHub Secrets individuais, sem SoT — diverge do backend (1Password).
3. **Duplicação.** Bloco install+build copiado 3×, sem composite action.
4. **Um ambiente só.** Tudo cai em `construct-pro-dev`; sem staging/prod.
5. **`VITE_*` tratados como "secret"** quando na verdade são embutidos no bundle público (Firebase
   client keys são públicas por design). Falsa sensação de segurança.

---

## 3. Decisões (tomadas no brainstorming)

| # | Decisão | Escolha |
|---|---|---|
| 1 | Plataforma Cloudflare | **Workers Static Assets** (Pages está em modo manutenção) |
| 2 | Topologia de ambientes | **`main` → staging** automático; **tag `vX.Y.Z` → prod** + smoke (paridade backend) |
| 3 | Quality gates (bloqueantes) | **Biome** (lint+format), **Vitest** (unit), **Typecheck isolado** (`tsc`) |
| 3b | Playwright e2e | **Fora** do gate obrigatório por ora; estrutura preparada para ligar depois |
| 4 | Domínios | prod = **`costara.app`** (apex); staging = **`staging.costara.app`** |
| 5 | 1Password | **Reusar vault `costara-prod`**; items novos `webapp-env` + `webapp-deploy`; reusar SA `github-ci` |
| 6 | Organização de workflows | **Separados por gatilho + composite action local** |

---

## 4. Design detalhado

### 4.1 Hospedagem — Wrangler / Workers Static Assets

`wrangler.jsonc` na raiz. Worker **assets-only** (zero código de runtime; é SPA estático puro):

```jsonc
{
  "name": "costara-webapp",
  "compatibility_date": "2026-06-01",
  "assets": {
    "directory": "./dist/client",
    "not_found_handling": "single-page-application"
  },
  "env": {
    "staging":    { "routes": [{ "pattern": "staging.costara.app", "custom_domain": true }] },
    "production": { "routes": [{ "pattern": "costara.app",         "custom_domain": true }] }
  }
}
```

- `not_found_handling: "single-page-application"` substitui o `rewrite → /index.html` do
  `firebase.json`.
- **Headers de cache** migram do `firebase.json` para `public/_headers` (Workers Static Assets
  suporta `_headers`/`_redirects` nativamente):
  - `*.js`, `*.css` (hashed) → `Cache-Control: max-age=31536000, immutable`
  - `index.html` → `Cache-Control: no-cache, no-store, must-revalidate`
- **Custom domains** do Worker: como a zona `costara.app` já está no Cloudflare, o certificado TLS
  é provisionado automaticamente.

### 4.2 Secrets — 1Password como single source of truth

Vault **`costara-prod`** (reusado). Dois items novos:

| Item | Tipo | Campos |
|---|---|---|
| `webapp-env` | Secure Note | `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_API_BASE_URL`, `VITE_CUSTOMERS_PAGE_SIZE`, `VITE_PROJECTS_PAGE_SIZE`, `VITE_UNITS_PAGE_SIZE` |
| `webapp-deploy` | API Credential | `cloudflare_api_token` (Workers Scripts:Edit + Workers Routes:Edit), `cloudflare_account_id`, `gh_packages_token` |

Reference map (`op://`):

```
op://costara-prod/webapp-env/VITE_FIREBASE_API_KEY
op://costara-prod/webapp-env/VITE_FIREBASE_AUTH_DOMAIN
op://costara-prod/webapp-env/VITE_FIREBASE_PROJECT_ID
op://costara-prod/webapp-env/VITE_FIREBASE_STORAGE_BUCKET
op://costara-prod/webapp-env/VITE_FIREBASE_MESSAGING_SENDER_ID
op://costara-prod/webapp-env/VITE_FIREBASE_APP_ID
op://costara-prod/webapp-env/VITE_API_BASE_URL
op://costara-prod/webapp-env/VITE_CUSTOMERS_PAGE_SIZE
op://costara-prod/webapp-env/VITE_PROJECTS_PAGE_SIZE
op://costara-prod/webapp-env/VITE_UNITS_PAGE_SIZE
op://costara-prod/webapp-deploy/cloudflare_api_token
op://costara-prod/webapp-deploy/cloudflare_account_id
op://costara-prod/webapp-deploy/gh_packages_token
```

- **Único GitHub Secret no repo:** `OP_SERVICE_ACCOUNT_TOKEN` (do SA `github-ci`, read-only — já
  existe; basta adicionar o mesmo token como secret neste repo).
- No CI, `1password/load-secrets-action@v2` (`export-env: true`) resolve as `op://` e injeta como
  env **antes do `pnpm build`** — exatamente o padrão do backend.
- **Transparência (importante):** os `VITE_*` permanecem públicos no bundle. O 1Password aqui
  entrega centralização e rotação, e tira ~10 secrets soltos do GitHub; o que é *de fato* sensível
  — `cloudflare_api_token` e `gh_packages_token` — fica protegido de verdade.
- **Ambiente único de config:** como o **backend não tem staging**, o staging do webapp aponta
  `VITE_API_BASE_URL` para a API de prod (`api.costara.app`). Um item `webapp-env` atende os dois
  ambientes. Se algum valor precisar divergir no futuro, cria-se `webapp-env-staging`.
- **Dev local:** `.env` (gitignored) continua funcionando; `.env.example` será atualizado.
  Opcional (futuro): script `op run` para puxar config do vault em dev.

### 4.3 Composite action (DRY)

`.github/actions/build-webapp/action.yml` encapsula o bloco hoje repetido 3×:

```
inputs: op-token (required)
steps:
  - pnpm/action-setup@v4
  - actions/setup-node@v4 (node 22, registry npm.pkg.github.com, scope @cacenot, cache pnpm)
  - 1password/load-secrets-action@v2 (export-env: true)   # resolve webapp-env + gh_packages_token
  - pnpm install --frozen-lockfile  (NODE_AUTH_TOKEN = gh_packages_token)
  - node scripts/gen-version.mjs    # escreve public/version.json (gitignored), lendo GIT_SHA do env
  - pnpm build  (VITE_* já no env; Vite copia public/version.json → dist/client/version.json)
```

Saída: `dist/client/` pronto para `wrangler deploy`/`versions upload`.
`checkout` permanece no caller (cada workflow faz o seu, eventualmente com `ref` próprio).

### 4.4 Os quatro workflows

| Workflow | Trigger | Jobs |
|---|---|---|
| `ci.yml` | `pull_request` + `push` | **paralelos:** `lint` (`biome check .`), `typecheck` (`tsc -b`), `unit` (`vitest run`). **Sem deploy.** Required checks para merge. |
| `preview.yml` | `pull_request` (mesmo repo) | build (composite) → `wrangler versions upload` → sticky comment com a **preview URL** no PR |
| `deploy-staging.yml` | `push` em `main` | build (composite) → `wrangler deploy --env staging` → `staging.costara.app` |
| `deploy-production.yml` | `push` tag `v*.*.*` | **gate** (tag == `package.json` version) → build → `wrangler deploy --env production` → **smoke** |

`ci.yml` roda os três jobs em paralelo para feedback rápido. `deploy-production.yml` repete os
checks antes de publicar (defesa em profundidade — a tag pode ser criada de um commit não coberto
por PR).

### 4.5 Versionamento, release e smoke test (paridade backend)

- `package.json` `version` vira **source of truth** (hoje `0.0.0` → inicializar, ex. `0.1.0`).
- `scripts/gen-version.mjs` escreve **`public/version.json`** (gitignored) antes do build, lendo
  `package.json` version + `GIT_SHA` do env; o Vite copia `public/` → `dist/client/`, resultando em:
  ```json
  { "version": "0.1.0", "gitSha": "abc1234" }
  ```
  servido em `costara.app/version.json` — análogo do `/health` do backend.
- `scripts/release.sh` (espelha `construct-pro-api`):
  1. valida working tree limpa, branch `main`, sincronizado com `origin`
  2. roda os checks locais (biome + tsc + vitest)
  3. cria tag anotada `vX.Y.Z` (== `package.json` version)
  4. `git push origin vX.Y.Z` → dispara `deploy-production.yml`
- **Gate de release** no workflow: aborta se `v$(package.json version) != tag`.
- **Smoke:** após o deploy de produção, poll em `costara.app/version.json` (~18× a cada 10s ≈ 3 min)
  exigindo `version == tag` (sem o `v`). Espelha o smoke do backend.

### 4.6 Preview de PR

`wrangler versions upload` publica uma versão **não-roteada** e devolve uma preview URL
(`<hash>-costara-webapp.<subdomínio>.workers.dev`). Um sticky comment (ex. via `gh` CLI ou action
de comentário) posta a URL no PR. Não afeta staging nem prod.

### 4.7 Rollback

Workers tem rollback nativo de versão: `wrangler rollback` (ou re-deploy/re-tag da versão anterior)
reverte produção instantaneamente. Procedimento documentado no README/`scripts/`.

---

## 5. Plano de cutover (zero downtime)

1. **Setup de credenciais:** criar items 1Password (`webapp-env`, `webapp-deploy`), gerar o Cloudflare
   API token (Workers Scripts:Edit + Routes:Edit), adicionar `OP_SERVICE_ACCOUNT_TOKEN` como secret
   do repo.
2. **Branch dedicada** `chore/cloudflare-cicd`: adicionar `wrangler.jsonc`, composite action, os 4
   workflows, `public/_headers`, geração de `version.json`, `scripts/release.sh`, atualizar
   `package.json` e `.env.example`.
3. **Validar staging:** merge → deploy em `staging.costara.app`; testar login Firebase + chamadas à
   API reais ponta a ponta.
4. **Validar prod sem cutover:** criar tag de teste → Worker de produção publicado, acessível via
   `workers.dev`; conferir `version.json` + smoke passando, sem ainda mexer no DNS do apex.
5. **Cutover DNS:** anexar o custom domain `costara.app` ao Worker de produção no Cloudflare.
   **Firebase Hosting continua no ar** até a confirmação.
6. **Descomissionar Firebase Hosting:** remover `firebase.json`, `.firebaserc` e os 3 workflows
   `firebase-hosting-*.yml`. Remover os secrets `VITE_*` antigos do GitHub. Desativar o target de
   hosting no console Firebase.

> **Manter intacto:** dependência `firebase` (SDK), `src/lib/firebase.ts`,
> `src/contexts/auth-context.tsx` e todos os `VITE_FIREBASE_*`. O Firebase **Auth** continua em uso;
> migramos **apenas o hosting**.

---

## 6. Arquivos afetados

**Novos:**
- `wrangler.jsonc`
- `.github/actions/build-webapp/action.yml`
- `.github/workflows/ci.yml`
- `.github/workflows/preview.yml`
- `.github/workflows/deploy-staging.yml`
- `.github/workflows/deploy-production.yml`
- `scripts/release.sh`
- `scripts/gen-version.mjs` (ou mini plugin Vite) → `version.json`
- `public/_headers`

**Removidos (fase 6 do cutover):**
- `firebase.json`
- `.firebaserc`
- `.github/workflows/firebase-hosting-merge.yml`
- `.github/workflows/firebase-hosting-pull-request.yml`
- `.github/workflows/firebase-hosting-redeploy.yml`

**Atualizados:**
- `package.json` (`version` inicial + script `release`)
- `.env.example` (refletir o conjunto canônico de `VITE_*`)
- `CLAUDE.md` (seção de deploy/CI)
- `.gitignore` (adicionar `public/version.json`)
- Branch protection do `main` (exigir os checks de `ci.yml`)

**Não tocar:** `firebase` (Auth), `src/lib/firebase.ts`, `src/contexts/auth-context.tsx`.

---

## 7. Playwright e2e (fora do gate, estrutura preparada)

O job e2e fica **preparado mas desligado** — opt-in por label no PR ou rodando só antes do deploy
de produção. Ativar depois exige adicionar ao `webapp-env` as credenciais de uma conta Firebase de
teste e `VITE_FIREBASE_PERSISTENCE=local` no ambiente de CI (ver memória `e2e-setup`).

---

## 8. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Cutover de DNS quebrar o apex | Firebase Hosting permanece ativo até validação; custom domain do Worker é reversível |
| Build depender de 1Password indisponível | `load-secrets-action` falha cedo e de forma clara; secrets podem ser injetados manualmente em emergência |
| Tag criada de commit não testado | `deploy-production.yml` repete os checks antes de publicar |
| SPA fallback divergir do Firebase | `not_found_handling: single-page-application` + `public/_headers` replicam rewrites/headers atuais |
| `cloudflare_api_token` vazar | Token escopado só a Workers (Scripts/Routes); rotação via 1Password documentada |

---

## 9. Fora de escopo (YAGNI)

- Migração do Firebase **Auth** (permanece).
- Ambiente de staging para o **backend** (não existe; webapp staging usa a API de prod).
- SSR/edge functions (Worker é assets-only por ora; a escolha de Workers deixa a porta aberta).
- Ativar Playwright e2e no gate (preparado, não ligado).
- Múltiplos sets de config por ambiente (`webapp-env-staging`) — só se um valor divergir.

---

## 10. Critérios de sucesso

1. `costara.app` e `staging.costara.app` servidos por Cloudflare Workers, com SPA routing e headers
   de cache equivalentes aos atuais.
2. Todo deploy passa por Biome + Typecheck + Vitest verdes.
3. Merge em `main` publica staging automaticamente; tag `vX.Y.Z` publica produção com smoke test
   confirmando a versão em `version.json`.
4. PRs recebem uma preview URL comentada automaticamente.
5. Nenhum `VITE_*` solto no GitHub: tudo vem de `op://costara-prod/webapp-env/*`; único secret do repo
   é `OP_SERVICE_ACCOUNT_TOKEN`.
6. Firebase Hosting descomissionado; Firebase Auth intacto.
