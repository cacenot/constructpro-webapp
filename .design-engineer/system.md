# ConstructPro Design System

## Intent

**Who:** Brazilian construction company staff — sales reps, financial managers, admins, construction managers. They work long hours managing property sales pipelines, tracking installment payments, and monitoring construction progress.

**What they do:** Manage real estate project lifecycles — list units, move sales through the funnel (offer → reserved → closed), track contracts and installments, issue boletos, apply monetary corrections.

**Feel:** Structured and trustworthy. Like a well-organized ledger. Warm enough for all-day use, precise enough to trust with money. Not playful, not cold.

---

## Palette

**Color space:** OKLch (perceptually uniform, modern CSS)

### Primary — Royal Navy Blue
- Light: `oklch(0.42 0.14 258)`
- Dark: `oklch(0.62 0.14 258)`

### Surfaces
- Background (light): `oklch(0.988 0.002 80)` — warm off-white
- Background (dark): `oklch(0.14 0.018 258)` — cool dark with royal blue undertone
- Card (light): pure white `oklch(1 0 0)`
- Card (dark): `oklch(0.19 0.018 258)`

### Semantic Status Colors
- **Success** (available/paid/active): `oklch(0.55 0.16 155)` / dark `oklch(0.6 0.14 155)`
- **Warning** (pending/partial/reserved): `oklch(0.75 0.15 75)` / dark `oklch(0.78 0.13 75)`
- **Destructive** (overdue/lost/canceled): `oklch(0.55 0.22 25)` / dark `oklch(0.65 0.2 22)`

### Chart Palette (construction-world)
1. Royal blue (primary): `oklch(0.42 0.14 258)`
2. Amber (construction): `oklch(0.72 0.15 85)`
3. Slate-blue (neutral): `oklch(0.52 0.06 258)`
4. Green (progress): `oklch(0.6 0.16 155)`
5. Warm orange (alert): `oklch(0.65 0.18 50)`

---

## Typography

- **Font:** Plus Jakarta Sans — geometric, modern, warm personality with excellent data readability and Portuguese diacritic support.
- **Font features:** `rlig`, `calt` enabled
- **Loaded via:** Google Fonts (preconnected in index.html)
- **Tabular nums:** Use `tabular-nums` class on all monetary values and numeric columns

---

## Spacing

- **Base unit:** 4px (Tailwind default)
- **Grid:** 8px increments for layout
- **Content max-width:** `max-w-[1400px]` for main content area
- **Page padding:** `p-6` for main content areas

---

## Depth & Surfaces

- **Approach:** Layered cards with subtle shadows
- **Cards:** White surface with `rounded-2xl`, `shadow-sm`, very subtle border (`border-border/50`)
- **Border color:** Warm-tinted border `oklch(0.91 0.005 80)` at 50% opacity

---

## Radius

- **Base:** `0.75rem` (12px)
- **Cards:** `rounded-2xl` (16px)
- **Buttons:** `rounded-lg` (default)
- **Navigation tabs:** `rounded-full` for pill-style active state
- **Badges:** `rounded-full` (pill shape)
- **Logo mark:** `rounded-xl`

---

## Component Patterns

### Layout Shell
- `AppLayout` wraps `TopNavbar` + main content area
- No sidebar — horizontal top navigation
- Content area: `max-w-[1400px] mx-auto px-6 py-6`

### Top Navigation Bar (`TopNavbar`)
- Sticky top position with backdrop blur
- Container: white card with `rounded-2xl`, `shadow-sm`, inside `px-6 pt-4`
- **Left:** Logo (CP badge) + "ConstructPro" brand name
- **Center:** Navigation tabs with pill-style active state (`bg-primary text-primary-foreground rounded-full`)
- **Right:** Icon buttons (Search, Settings, Notifications) + Avatar with dropdown menu
- Navigation items: Painel, Empreendimentos, Unidades, Clientes, Vendas, Contratos, Parcelas

### Page Headers
- Greeting-style header: "Bom dia, [Nome]!" with subtitle
- Action buttons on the right (filters, export)
- No breadcrumbs — page identity comes from active nav tab

### Metric Cards
- 4-column grid on large screens, 2-column on medium
- Icon top-right, value prominent, trend indicator below
- `ArrowUpRight` (emerald) / `ArrowDownRight` (red) for trends

### Status Badges (Sale Pipeline)
Pill-shaped badges with background tints:
- **Proposta (offer):** `bg-amber-100 text-amber-800`
- **Reservado (reserved):** `bg-blue-100 text-blue-800`
- **Fechado (closed):** `bg-emerald-100 text-emerald-800`
- **Perdido (lost):** `bg-red-100 text-red-800`

### Data Lists
- Use `divide-y` for row separation (no alternating backgrounds)
- Consistent `px-6 py-3` padding per row
- Right-aligned monetary values with `tabular-nums` and fixed width

### Alert Cards (Overdue)
- Destructive border tint: `border-destructive/20`
- Subtle background: `bg-destructive/[0.03]`
- Dividers match: `divide-destructive/10`

---

## Language

All UI text is in **Brazilian Portuguese**. Key terms:
- Dashboard → Painel
- Projects → Empreendimentos
- Units → Unidades
- Customers → Clientes
- Sales → Vendas
- Contracts → Contratos
- Installments → Parcelas
- Sign in → Entrar
- Sign out → Sair
- Settings → Configurações

---

## Files

- Tokens: `src/styles/globals.css`
- Layout: `src/components/app-layout.tsx`
- Navigation: `src/components/top-navbar.tsx`
- UI components: `src/components/ui/` (shadcn/ui New York style)
