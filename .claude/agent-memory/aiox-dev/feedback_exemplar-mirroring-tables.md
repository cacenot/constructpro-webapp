---
name: dev-exemplar-mirroring-tables
description: When migrating a domain list to DataTableInfinite, mirror the exemplar exactly and watch for the orphaned hook test asserting the dead pagination API
metadata:
  type: feedback
---

When migrating a domain table to `DataTableInfinite` + `PageHeader`, mirror the corretores/clientes exemplars to the letter — these are validated conventions, not suggestions.

**Why:** the base components encode hard contracts that silently break if ignored. The recurring traps: `DataTableInfinite` has **no `total` prop** (`total` only feeds `endLabel`); `onRowClick`/`getRowId` must be **module-scope consts** (`getRowId = String(row.id)`) or the memoized rows re-render the whole list; `MutedCell` owns the `—` fallback so pass `value || null` (a ternary→`null`), never `|| '—'`; `meta.className` + `meta.headClassName` must be **identical** for responsive hiding.

**How to apply:** before running gates, grep `src/hooks/` for the matching `use-<domain>-table.test.ts` — the pre-migration hook test mocks `useQuery`/`parseAsInteger` and asserts a `pagination` object that the infinite hook no longer returns, so `pnpm typecheck` fails on it. Rewrite it to mirror `use-brokers-table.test.ts` (mock `./use-infinite-table`, assert `'pagination' in result.current === false`). For Razão Social-style anchors, Biome will collapse a multi-line `<PrimaryCell .../>` to one line if it fits 100 cols — let `lint:fix`/the pre-commit hook handle it. The e2e specs already select row actions via `getByRole('button', { name: 'Ações' })` (robust, survives migration) and the base `DataTable` renders a real `<table>`, so `page.locator('table tbody tr')` locators keep working.
