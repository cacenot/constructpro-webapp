# ConstructPro Design System

## Intent

**Who:** Real estate salespeople and directors spending their entire workday inside the system. Not occasional users — ConstructPro is their primary work tool, open on screen all day long.

**What they do:** Visually scan the sales funnel, quickly identify bottlenecks, see which proposals need attention, which contracts are overdue. Fast decisions based on visual status.

**Feel:** Modern efficiency. Not a serious formal bank, not a heavy spreadsheet. It's a clean, fast, direct tech tool. Comfortable for extended use, but information-dense.

---

## Palette

**Color space:** OKLch (perceptually uniform, modern CSS)

### Primary — Vivid Tech Blue
- Light: `oklch(0.50 0.18 240)`
- Dark: `oklch(0.65 0.18 240)`

Not navy corporate blue — this is energetic, modern, tech.

### Surfaces
- Background (light): `oklch(0.98 0.002 240)` — very light gray, almost white
- Background (dark): `oklch(0.12 0.015 240)` — dark with blue undertone
- Card (light): pure white `oklch(1 0 0)`
- Card (dark): `oklch(0.16 0.015 240)`
- Border: `oklch(0.88 0.005 240)` — subtle, not harsh

### Pipeline Status Colors
Based on construction site signage — attention, progress, completion:

- **Proposta (offer):** `oklch(0.70 0.15 60)` / dark `oklch(0.75 0.13 60)` — amber/orange, needs action
- **Reservado (reserved):** `oklch(0.60 0.14 220)` / dark `oklch(0.70 0.12 220)` — blue, in progress
- **Fechado (closed):** `oklch(0.58 0.16 150)` / dark `oklch(0.65 0.14 150)` — green, success
- **Perdido (lost):** `oklch(0.55 0.22 25)` / dark `oklch(0.65 0.20 25)` — red, alert

### Semantic Colors
- **Success:** `oklch(0.58 0.16 150)` / dark `oklch(0.65 0.14 150)`
- **Warning:** `oklch(0.70 0.15 60)` / dark `oklch(0.75 0.13 60)`
- **Destructive:** `oklch(0.55 0.22 25)` / dark `oklch(0.65 0.20 25)` — warmer red for urgency

### Chart Palette
1. Primary blue: `oklch(0.50 0.18 240)`
2. Amber (construction): `oklch(0.70 0.15 60)`
3. Slate-blue (neutral): `oklch(0.52 0.08 240)`
4. Green (progress): `oklch(0.58 0.16 150)`
5. Orange (alert): `oklch(0.63 0.18 45)`

---

## Typography

- **Font:** Inter — modern, geometric, excellent dashboard readability, neutral without being boring
- **Fallback:** -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
- **Font features:** `rlig`, `calt` enabled
- **Loaded via:** Google Fonts or Fontsource
- **Tabular nums:** Use `tabular-nums` class on ALL monetary values and numeric columns

---

## Spacing

- **Base unit:** 4px (Tailwind default)
- **Grid:** Generous spacing — system is used all day, needs breathing room
- **Content max-width:** `max-w-7xl` (1280px) for main content
- **Page padding:** `px-6 py-6` for main areas

---

## Depth & Surfaces

- **Approach:** Subtle borders + very light shadows — not flat, not heavy Material
- **Cards:** White surface with `rounded-xl`, very subtle shadow, thin border
- **Border:** `border-border` at normal opacity (subtle but present)
- **Shadow:** `shadow-sm` for cards, `shadow-md` for dropdowns/popovers

Surfaces elevate slightly from background — creates hierarchy without visual weight.

---

## Radius

- **Base:** `0.5rem` (8px)
- **Cards:** `rounded-xl` (12px)
- **Buttons:** `rounded-lg` (8px default)
- **Badges/Pills:** `rounded-full`
- **Inputs:** `rounded-md` (6px)
- **Dropdowns/Popovers:** `rounded-lg` (8px) with items `rounded-md` (6px)

---

## Component Patterns

### Layout Structure
- Top navigation bar (horizontal)
- No sidebar — direct navigation
- Content area centered with generous padding

### Page Headers
- Greeting-style: "Bom dia, [Nome]!"
- Subtitle explaining the page purpose
- Action buttons right-aligned (filters, export)

### Metric Cards
- Grid: 4 columns on large screens, 2 on medium, 1 on mobile
- Icon top-right (muted)
- Value prominent with proper font weight
- Trend indicator below (up/down arrow with color)

### Status Badges — Signature Element
Pill-shaped with craft:
- Subtle background tint (low opacity)
- Thin matching border (same hue, higher opacity)
- Rounded full (true pills)

Example:
```tsx
// Proposta
className="rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
```

This is NOT a generic badge — the border adds definition and craft.

### Data Lists
- Dividers between rows (`divide-y`)
- Consistent padding `px-6 py-3`
- Right-align monetary values with `tabular-nums`
- Fixed width for number columns to maintain alignment

### Progress Bars (Construction)
- Thin height: `h-1.5` or `h-2`
- Rounded caps
- Percentage right-aligned with `tabular-nums`
- Use semantic colors (green for completion)

### Alert/Warning Cards
- Tinted border: `border-destructive/30`
- Subtle background: `bg-destructive/5`
- Matching dividers: `divide-destructive/20`

### Dropdowns & Popovers
- Container: `rounded-lg` (8px) to match buttons
- Items: `rounded-md` (6px) for subtle hover states
- Shadow: `shadow-md` for elevation
- Border: `border-border` at normal opacity

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
- Overdue → Em atraso
- Offer → Proposta
- Reserved → Reservado
- Closed → Fechado
- Lost → Perdido

---

## Files

- Tokens: `src/styles/globals.css`
- Layout: `src/components/app-layout.tsx`
- Navigation: `src/components/top-navbar.tsx`
- UI components: `src/components/ui/` (shadcn/ui)
