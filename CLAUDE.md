# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Dev server on localhost:5173
npm run build      # TypeScript check + Vite production build to dist/
npm run preview    # Preview production build locally
npm run lint       # BiomeJS check (lint + format)
npm run lint:fix   # Auto-fix lint/format issues
npm run format     # BiomeJS formatting only
```

No test framework is configured.

Add shadcn components: `npx shadcn@latest add <component>`

## Architecture

**Stack:** React 19 + TypeScript 5.9 (strict) + Vite 7 + Tailwind CSS 4

**Routing:** Vike file-based routing in SPA mode (SSR disabled). Routes live in `pages/` — each route needs a `+Page.tsx` file. Route groups use `(groupName)/` for non-URL grouping (e.g., `pages/(auth)/login/+Page.tsx` → `/login`). The root layout `pages/+Layout.tsx` wraps all routes with providers.

**State management:**
- **Zustand** (`src/stores/app-store.ts`) — UI state (sidebar, theme), persisted to localStorage
- **TanStack Query v5** (`src/lib/query-client.ts`) — server state (5min stale, 30min GC, 3 retries except 401)

**API layer:** `@cacenot/construct-pro-api-client` is a private OpenAPI-generated package providing `ApiClientProvider` context and `useApiClient()` hook for type-safe calls. It includes pre-built hooks (`useProjects()`, `useCustomers()`, `useSales()`) with TanStack Query integration. The client auto-attaches Firebase auth tokens and X-Tenant-ID headers. An Axios interceptor in `src/lib/api.ts` handles token attachment and 401 → auto-logout.

**Auth:** Firebase Authentication via React Context (`src/contexts/auth-context.tsx`). Access with `useAuth()` hook — never use Firebase directly. Firebase singleton initialized in `src/lib/firebase.ts`.

**Forms:** react-hook-form + Zod. Schemas in `src/schemas/`. Always infer types from schemas: `type T = z.infer<typeof schema>`.

**UI:** shadcn/ui (New York style) in `src/components/ui/`. Use `cn()` for dynamic class composition. Icons from lucide-react. Toasts via sonner.

## Key Conventions

- **Language:** All UI text is in Brazilian Portuguese
- **Code style:** BiomeJS enforces single quotes, no semicolons, 2-space indent, 100-char line width. Pre-commit hooks auto-fix via Husky + lint-staged
- **Path alias:** `@/*` maps to `src/*`
- **Env vars:** Must use `VITE_` prefix, accessed via `import.meta.env.VITE_*`
- **Design system:** OKLch color space, Inter font, `tabular-nums` on monetary values, 8px grid spacing. Details in `.design-engineer/system.md`
- **File organization:** `src/lib/` (core utils), `src/schemas/` (Zod schemas by domain), `src/contexts/` (React contexts), `src/stores/` (Zustand), `src/services/` (API wrappers using Query), `src/hooks/` (custom hooks)

## Common Gotchas

- Firebase must be initialized once — `src/lib/firebase.ts` checks `getApps()`
- Vike routes require `+Page.tsx` — without it, the page won't render
- Query keys must be stable arrays (avoid inline objects)
- Services should use TanStack Query for fetching, never raw axios
- Auth context is already provided in `+Layout.tsx` — no manual provider setup needed
