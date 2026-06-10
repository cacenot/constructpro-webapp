# Redesign do Formulário de Proposta — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesenhar a etapa de pagamento da proposta com balanceamento por saldo (modelo C), datas unificadas (só "Início"), encadeamento automático de mensais, adição inteligente de balões e um mapa mensal interativo no Resumo.

**Architecture:** Lógica pura em `src/lib/installment-utils.ts` e `src/lib/proposal-vitals.ts` (testada via vitest/TDD). UI em `proposal-parties.tsx`, `proposal-workbench.tsx`, `installment-ledger.tsx`, `proposal-vitals.tsx` e um novo `installment-calendar.tsx`. Sem mudanças de backend — a API é dirigida por `start_date` (dia/mês derivados no submit). "Valor da proposta" é estado client-side.

**Tech Stack:** React 19, react-hook-form, Zod, TanStack Query, shadcn/ui, Tailwind 4, vitest + @testing-library/react.

**Spec:** `docs/superpowers/specs/2026-06-09-proposta-form-redesign-design.md`

**Convenções:** valores monetários em **centavos** (inteiros). BiomeJS (aspas simples, sem `;`, 2 espaços, 100 col). Datas ISO `YYYY-MM-DD`; ao instanciar `Date`, usar `new Date(\`${iso}T12:00:00\`)` para evitar off-by-one de timezone (padrão já usado em `sale-edit-workbench.tsx:55`).

---

## File Structure

| Arquivo | Responsabilidade |
|---------|------------------|
| `src/lib/installment-utils.ts` (modificar) | Helpers puros: derivação de dia/mês, span das mensais, quantidade derivada, balanceamento, encadeamento, breakdown mensal |
| `src/lib/installment-utils.test.ts` (criar) | Testes dos helpers acima |
| `src/lib/proposal-vitals.ts` (modificar) | Adicionar `valorPropostaCents`, `saldo`, `agio` aos vitais |
| `src/lib/proposal-vitals.test.ts` (criar) | Testes de saldo/ágio |
| `src/components/vendas/proposal/proposal-parties.tsx` (modificar) | Layout 3 linhas, Cliente→Empreendimento→Unidade |
| `src/components/vendas/proposal/proposal-workbench.tsx` (modificar) | Índice na mesma linha; "Valor da proposta"+ágio; gate por saldo; remover divider |
| `src/components/vendas/proposal/installment-ledger.tsx` (modificar) | Linhas só com "Início"; início→fim; adição inteligente; encadeamento travado; aviso fixo de teto |
| `src/components/vendas/proposal/installment-calendar.tsx` (criar) | Mapa mensal + popover + animação + cor de chaves |
| `src/components/vendas/proposal/proposal-vitals.tsx` (modificar) | Card "Saldo" + "Distribuir" + embutir o calendário |
| `pages/vendas/novo/+Page.tsx` (modificar) | Submit: derivar `recurrence_day`/`month` de `start_date` |
| `pages/vendas/@id/editar/+Page.tsx` (modificar) | Idem no submit de edição |
| `src/components/vendas/proposal/sale-edit-workbench.tsx` (modificar) | Default de "Valor da proposta" = soma do plano |

---

## Phase A — Lógica pura (TDD)

### Task 1: Helpers de data — derivação e fim de cronograma

**Files:**
- Modify: `src/lib/installment-utils.ts`
- Test: `src/lib/installment-utils.test.ts` (criar)

- [ ] **Step 1: Escrever os testes que falham**

Criar `src/lib/installment-utils.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  computeScheduleEnd,
  deriveRecurrenceFields,
  isoFromMonthIndex,
  monthIndexFromISO,
} from './installment-utils'
import type { InstallmentScheduleFormData } from '@/schemas/sale.schema'

const sched = (o: Partial<InstallmentScheduleFormData>): InstallmentScheduleFormData => ({
  kind: 'regular',
  payment_method: 'boleto',
  quantity: 1,
  amount: 1000,
  specific_date: null,
  recurrence_type: 'monthly',
  recurrence_day: null,
  recurrence_month: null,
  start_date: null,
  asset_proposal: null,
  ...o,
})

describe('monthIndexFromISO / isoFromMonthIndex', () => {
  it('converte ISO para índice de mês absoluto', () => {
    expect(monthIndexFromISO('2026-01-15')).toBe(2026 * 12 + 0)
    expect(monthIndexFromISO('2026-12-01')).toBe(2026 * 12 + 11)
  })
  it('reconstrói ISO a partir do índice, clampando o dia', () => {
    expect(isoFromMonthIndex(2027 * 12 + 0, 15)).toBe('2027-01-15')
    expect(isoFromMonthIndex(2026 * 12 + 1, 31)).toBe('2026-02-28') // fev não tem 31
  })
})

describe('deriveRecurrenceFields', () => {
  it('mensal: deriva o dia, mês nulo', () => {
    expect(deriveRecurrenceFields('2026-03-10', 'monthly')).toEqual({
      recurrence_day: 10,
      recurrence_month: null,
    })
  })
  it('anual: deriva dia e mês', () => {
    expect(deriveRecurrenceFields('2026-12-05', 'yearly')).toEqual({
      recurrence_day: 5,
      recurrence_month: 12,
    })
  })
})

describe('computeScheduleEnd', () => {
  it('mensal 12x desde 01/01/2026 termina em 01/12/2026', () => {
    const end = computeScheduleEnd(sched({ start_date: '2026-01-01', quantity: 12 }))
    expect(end?.getFullYear()).toBe(2026)
    expect(end?.getMonth()).toBe(11)
    expect(end?.getDate()).toBe(1)
  })
  it('anual 3x desde 15/12/2026 termina em 15/12/2028', () => {
    const end = computeScheduleEnd(
      sched({ recurrence_type: 'yearly', start_date: '2026-12-15', quantity: 3 })
    )
    expect(end?.getFullYear()).toBe(2028)
    expect(end?.getMonth()).toBe(11)
  })
  it('entrada/chaves usam specific_date', () => {
    const end = computeScheduleEnd(sched({ kind: 'entry', recurrence_type: null, specific_date: '2026-05-20' }))
    expect(end?.getMonth()).toBe(4)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- installment-utils`
Expected: FAIL (funções não exportadas).

- [ ] **Step 3: Implementar os helpers**

Em `src/lib/installment-utils.ts`, adicionar (após `addMonthsClamped` e antes/depois das funções existentes; `intervalMap` já existe no módulo, linha ~179):

```ts
type RecurrenceTypeAll = 'monthly' | 'bimonthly' | 'quarterly' | 'semestral' | 'yearly'

/** Índice de mês absoluto (ano*12 + mês0) a partir de uma data ISO. */
export function monthIndexFromISO(iso: string): number {
  const [y, m] = iso.split('-').map(Number)
  return y * 12 + (m - 1)
}

/** ISO `YYYY-MM-DD` a partir do índice de mês absoluto, clampando o dia ao mês. */
export function isoFromMonthIndex(idx: number, day: number): string {
  const y = Math.floor(idx / 12)
  const m = (idx % 12) + 1
  const daysInMonth = new Date(y, m, 0).getDate()
  return formatDateISO(y, m, Math.min(day, daysInMonth))
}

/** Deriva recurrence_day/month a partir da data de início (fonte da verdade). */
export function deriveRecurrenceFields(
  startISO: string,
  recurrenceType: RecurrenceTypeAll
): { recurrence_day: number; recurrence_month: number | null } {
  const d = new Date(`${startISO}T12:00:00`)
  return {
    recurrence_day: d.getDate(),
    recurrence_month: recurrenceType === 'yearly' ? d.getMonth() + 1 : null,
  }
}

/** Data da última parcela de um cronograma (ou specific_date para entrada/chaves). */
export function computeScheduleEnd(schedule: InstallmentScheduleFormData): Date | null {
  if (schedule.kind === 'entry' || schedule.kind === 'key_delivery') {
    return schedule.specific_date ? new Date(`${schedule.specific_date}T12:00:00`) : null
  }
  if (!schedule.start_date || !schedule.recurrence_type) return null
  const start = new Date(`${schedule.start_date}T12:00:00`)
  const qty = schedule.quantity ?? 1
  if (schedule.recurrence_type === 'yearly') {
    const end = new Date(start)
    end.setFullYear(end.getFullYear() + (qty - 1))
    return end
  }
  const interval = intervalMap[schedule.recurrence_type] ?? 1
  return addMonthsClamped(start, (qty - 1) * interval, start.getDate())
}
```

> Nota: mover a declaração `const intervalMap` para o topo do módulo (antes do primeiro uso) se o lint apontar uso-antes-da-declaração. Ele já existe na linha ~179; basta garantir que `computeScheduleEnd` seja declarada depois dele OU içar `intervalMap` para o topo.

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- installment-utils`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/installment-utils.ts src/lib/installment-utils.test.ts
git commit -m "feat(proposta): helpers de derivação de data e fim de cronograma"
```

---

### Task 2: Span das mensais + quantidade derivada do balão

**Files:**
- Modify: `src/lib/installment-utils.ts`
- Test: `src/lib/installment-utils.test.ts`

- [ ] **Step 1: Testes que falham**

Adicionar ao `installment-utils.test.ts`:

```ts
import { computeMonthlySpan, deriveRecurringFromSpan } from './installment-utils'

describe('computeMonthlySpan', () => {
  it('cobre do menor início ao maior fim das mensais', () => {
    const span = computeMonthlySpan([
      sched({ start_date: '2026-01-01', quantity: 60, recurrence_type: 'monthly' }),
    ])
    expect(span).toEqual({ startIdx: monthIndexFromISO('2026-01-01'), endIdx: monthIndexFromISO('2030-12-01') })
  })
  it('retorna null sem mensais', () => {
    expect(computeMonthlySpan([sched({ kind: 'entry', recurrence_type: null })])).toBeNull()
  })
})

describe('deriveRecurringFromSpan', () => {
  it('anual sobre 60 meses (01/2026→12/2030) = 4x, início no aniversário', () => {
    const span = { startIdx: monthIndexFromISO('2026-01-01'), endIdx: monthIndexFromISO('2030-12-01') }
    const r = deriveRecurringFromSpan(span, 12, 1)
    expect(r.quantity).toBe(4)
    expect(r.startISO).toBe('2027-01-01')
  })
  it('semestral sobre o mesmo span = 9x', () => {
    const span = { startIdx: monthIndexFromISO('2026-01-01'), endIdx: monthIndexFromISO('2030-12-01') }
    expect(deriveRecurringFromSpan(span, 6, 15).quantity).toBe(9)
  })
  it('span menor que o período → 1x', () => {
    const span = { startIdx: monthIndexFromISO('2026-01-01'), endIdx: monthIndexFromISO('2026-06-01') }
    expect(deriveRecurringFromSpan(span, 12, 1).quantity).toBe(1)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- installment-utils`
Expected: FAIL.

- [ ] **Step 3: Implementar**

Adicionar em `installment-utils.ts`:

```ts
/** Período (menor início → maior fim) coberto pelas parcelas mensais regulares. */
export function computeMonthlySpan(
  schedules: InstallmentScheduleFormData[]
): { startIdx: number; endIdx: number } | null {
  const monthly = schedules.filter(
    (s) => s.kind === 'regular' && s.recurrence_type === 'monthly' && s.start_date
  )
  if (!monthly.length) return null
  let startIdx = Number.POSITIVE_INFINITY
  let endIdx = Number.NEGATIVE_INFINITY
  for (const s of monthly) {
    const sIdx = monthIndexFromISO(s.start_date as string)
    const end = computeScheduleEnd(s)
    const eIdx = end ? end.getFullYear() * 12 + end.getMonth() : sIdx
    if (sIdx < startIdx) startIdx = sIdx
    if (eIdx > endIdx) endIdx = eIdx
  }
  return { startIdx, endIdx }
}

/** Quantidade e início de um grupo recorrente derivados do span das mensais. */
export function deriveRecurringFromSpan(
  span: { startIdx: number; endIdx: number },
  periodMonths: number,
  day: number
): { quantity: number; startISO: string } {
  const quantity = Math.max(1, Math.floor((span.endIdx - span.startIdx) / periodMonths))
  const startISO = isoFromMonthIndex(span.startIdx + periodMonths, day)
  return { quantity, startISO }
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- installment-utils`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/installment-utils.ts src/lib/installment-utils.test.ts
git commit -m "feat(proposta): span das mensais e quantidade derivada de balão"
```

---

### Task 3: Balanceamento determinístico de grupo

**Files:**
- Modify: `src/lib/installment-utils.ts`
- Test: `src/lib/installment-utils.test.ts`

- [ ] **Step 1: Teste que falha**

```ts
import { balanceGroupAmount } from './installment-utils'

describe('balanceGroupAmount', () => {
  it('eleva o valor por parcela para absorver o saldo', () => {
    // valores em centavos: base R$2.000 (200000c), saldo R$3.000 (300000c) em 3 parcelas
    // → +100000c por parcela → 300000c (R$3.000)
    expect(balanceGroupAmount(200_000, 3, 300_000)).toBe(300_000)
  })
  it('distribui em partes inteiras de centavo (resíduo < quantidade)', () => {
    // saldo 6.000.001c em 4 parcelas → Math.round(1500000.25)=1500000c, base 0 → 1.500.000c
    expect(balanceGroupAmount(0, 4, 6_000_001)).toBe(1_500_000)
  })
  it('nunca fica negativo', () => {
    expect(balanceGroupAmount(1_000, 2, -5_000)).toBe(0)
  })
  it('quantidade zero é no-op', () => {
    expect(balanceGroupAmount(500, 0, 1_000)).toBe(500)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- installment-utils`
Expected: FAIL.

- [ ] **Step 3: Implementar**

```ts
/**
 * Novo valor por parcela de um grupo para absorver o saldo (modelo C).
 * Grupos têm valor uniforme: distribui em centavos inteiros; resíduo (< quantidade
 * centavos) permanece como saldo. Nunca negativo.
 */
export function balanceGroupAmount(
  currentAmountCents: number,
  quantity: number,
  saldoCents: number
): number {
  if (quantity <= 0) return currentAmountCents
  return Math.max(0, currentAmountCents + Math.round(saldoCents / quantity))
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- installment-utils`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/installment-utils.ts src/lib/installment-utils.test.ts
git commit -m "feat(proposta): balanceamento determinístico de grupo (modelo C)"
```

---

### Task 4: Encadeamento de mensais (início sem sobreposição)

**Files:**
- Modify: `src/lib/installment-utils.ts`
- Test: `src/lib/installment-utils.test.ts`

- [ ] **Step 1: Teste que falha**

```ts
import { computeChainedStart } from './installment-utils'

describe('computeChainedStart', () => {
  it('começa no mês seguinte ao fim do grupo mensal anterior', () => {
    const prev = sched({ start_date: '2026-01-01', quantity: 12, recurrence_type: 'monthly' })
    // fim = 01/12/2026 → próximo início = 01/01/2027
    expect(computeChainedStart(prev, 1)).toBe('2027-01-01')
  })
  it('respeita o dia informado e clampa', () => {
    const prev = sched({ start_date: '2026-01-31', quantity: 1, recurrence_type: 'monthly' })
    // fim = 31/01/2026 → próximo = fev/2026, dia 31 → 28
    expect(computeChainedStart(prev, 31)).toBe('2026-02-28')
  })
  it('null se o anterior não tem fim calculável', () => {
    expect(computeChainedStart(sched({ start_date: null }), 1)).toBeNull()
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- installment-utils`
Expected: FAIL.

- [ ] **Step 3: Implementar**

```ts
/** Próximo início (ISO) logo após o fim do grupo mensal anterior — sem sobreposição. */
export function computeChainedStart(
  prevSchedule: InstallmentScheduleFormData,
  day: number
): string | null {
  const end = computeScheduleEnd(prevSchedule)
  if (!end) return null
  const next = addMonthsClamped(end, 1, day)
  return formatDateISO(next.getFullYear(), next.getMonth() + 1, next.getDate())
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- installment-utils`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/installment-utils.ts src/lib/installment-utils.test.ts
git commit -m "feat(proposta): encadeamento de grupos mensais sem sobreposição"
```

---

### Task 5: Breakdown mensal por tipo/valor (para o mapa)

**Files:**
- Modify: `src/lib/installment-utils.ts`
- Test: `src/lib/installment-utils.test.ts`

- [ ] **Step 1: Teste que falha**

```ts
import { computeMonthlyBreakdown } from './installment-utils'

describe('computeMonthlyBreakdown', () => {
  it('expande recorrentes em parcelas por mês com tipo e valor', () => {
    const m = computeMonthlyBreakdown([
      sched({ kind: 'entry', recurrence_type: null, specific_date: '2026-01-15', amount: 5000 }),
      sched({ start_date: '2026-02-01', quantity: 2, recurrence_type: 'monthly', amount: 1000 }),
      sched({ kind: 'balloon', start_date: '2026-12-15', quantity: 1, recurrence_type: 'yearly', amount: 8000 }),
    ])
    expect(m.get('2026-01')).toEqual([{ kind: 'entry', amount: 5000 }])
    expect(m.get('2026-02')).toEqual([{ kind: 'regular', amount: 1000 }])
    expect(m.get('2026-03')).toEqual([{ kind: 'regular', amount: 1000 }])
    expect(m.get('2026-12')).toEqual([{ kind: 'balloon', amount: 8000 }])
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- installment-utils`
Expected: FAIL.

- [ ] **Step 3: Implementar + DRY em `computeInstallmentsPerMonth`**

Adicionar:

```ts
export interface MonthlyCell {
  kind: InstallmentKind
  amount: number
}

/** Mapa YYYY-MM → parcelas daquele mês (tipo + valor por parcela). */
export function computeMonthlyBreakdown(
  schedules: SaleFormData['installment_schedules']
): Map<string, MonthlyCell[]> {
  const map = new Map<string, MonthlyCell[]>()
  const push = (dateStr: string, kind: InstallmentKind, amount: number) => {
    if (!dateStr) return
    const key = dateStr.slice(0, 7)
    const arr = map.get(key) ?? []
    arr.push({ kind, amount })
    map.set(key, arr)
  }
  for (const s of schedules) {
    const amount = s.amount ?? 0
    if (s.kind === 'entry' || s.kind === 'key_delivery' || s.recurrence_type == null) {
      if (s.specific_date) push(s.specific_date, s.kind, amount)
    } else if (s.recurrence_type === 'yearly') {
      if (!s.start_date) continue
      const start = new Date(`${s.start_date}T12:00:00`)
      for (let i = 0; i < (s.quantity ?? 1); i++) {
        const d = new Date(start)
        d.setFullYear(d.getFullYear() + i)
        push(formatDateISO(d.getFullYear(), d.getMonth() + 1, d.getDate()), s.kind, amount)
      }
    } else {
      const interval = intervalMap[s.recurrence_type] ?? 1
      if (!s.start_date) continue
      const start = new Date(`${s.start_date}T12:00:00`)
      for (let i = 0; i < (s.quantity ?? 1); i++) {
        const d = addMonthsClamped(start, i * interval, start.getDate())
        push(formatDateISO(d.getFullYear(), d.getMonth() + 1, d.getDate()), s.kind, amount)
      }
    }
  }
  return map
}
```

Refatorar `computeInstallmentsPerMonth` (DRY) para derivar contagens do breakdown — substituir o corpo por:

```ts
export function computeInstallmentsPerMonth(
  schedules: SaleFormData['installment_schedules']
): Map<string, number> {
  const out = new Map<string, number>()
  for (const [key, cells] of computeMonthlyBreakdown(schedules)) out.set(key, cells.length)
  return out
}
```

> Verificar que `InstallmentKind` e `SaleFormData` já estão importados no topo (estão: `import type { SaleFormData } ...` e `InstallmentKind` em `proposal-vitals`; aqui importar `InstallmentKind` de `@/schemas/sale.schema`).

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- installment-utils`
Expected: PASS (incluindo os testes existentes de `computeInstallmentsPerMonth`, se houver, e os novos).

- [ ] **Step 5: Commit**

```bash
git add src/lib/installment-utils.ts src/lib/installment-utils.test.ts
git commit -m "feat(proposta): breakdown mensal por tipo/valor (DRY com per-month)"
```

---

### Task 6: Vitais — saldo e ágio

**Files:**
- Modify: `src/lib/proposal-vitals.ts`
- Test: `src/lib/proposal-vitals.test.ts` (criar)

- [ ] **Step 1: Teste que falha**

Criar `src/lib/proposal-vitals.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { computeProposalVitals } from './proposal-vitals'
import type { SaleFormData } from '@/schemas/sale.schema'

const entry = (amount: number, date = '2026-01-10'): SaleFormData['installment_schedules'][number] => ({
  kind: 'entry', payment_method: 'pix', quantity: 1, amount, specific_date: date,
  recurrence_type: null, recurrence_day: null, recurrence_month: null, start_date: null, asset_proposal: null,
})

describe('computeProposalVitals — saldo e ágio', () => {
  it('saldo = valorProposta − total; ágio = valorProposta − tabela', () => {
    const v = computeProposalVitals([entry(50_000_00)], 480_000_00, undefined, undefined, 500_000_00)
    expect(v.total).toBe(50_000_00)
    expect(v.saldo).toBe(450_000_00) // 500k − 50k
    expect(v.agio).toBe(20_000_00) // 500k − 480k
  })
  it('valorProposta default = preço de tabela quando omitido', () => {
    const v = computeProposalVitals([entry(100_00)], 480_000_00)
    expect(v.valorPropostaCents).toBe(480_000_00)
    expect(v.saldo).toBe(480_000_00 - 100_00)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- proposal-vitals`
Expected: FAIL.

- [ ] **Step 3: Implementar**

Em `src/lib/proposal-vitals.ts`:

1. Acrescentar à interface `ProposalVitals`:

```ts
  /** Alvo negociado (default = preço de tabela), em centavos. */
  valorPropostaCents: number
  /** valorProposta − total (>0 falta distribuir; <0 sobra), em centavos. */
  saldo: number
  /** valorProposta − preço de tabela (ágio/desconto), em centavos. */
  agio: number
  /** Ágio sobre o preço de tabela, em %. */
  agioPercent: number
```

2. Adicionar o 5º parâmetro e o cálculo na função:

```ts
export function computeProposalVitals(
  schedules: Schedules | undefined,
  unitPriceCents: number,
  maxInstallmentsPerMonth?: number,
  commissionInput?: {
    brokerId?: number | null
    brokerRate?: number | null
    agencyRate?: number | null
    capPercent?: number
  },
  valorPropostaCents?: number
): ProposalVitals {
```

E, antes do `return`:

```ts
  const proposta = valorPropostaCents ?? unitPriceCents
  const saldo = proposta - total
  const agio = proposta - unitPriceCents
  const agioPercent = unitPriceCents > 0 ? (agio / unitPriceCents) * 100 : 0
```

3. Incluir no objeto retornado: `valorPropostaCents: proposta, saldo, agio, agioPercent,`.

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- proposal-vitals`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/proposal-vitals.ts src/lib/proposal-vitals.test.ts
git commit -m "feat(proposta): saldo e ágio nos vitais"
```

---

## Phase B — UI

### Task 7: Etapa 1 — layout 3 linhas (Cliente primeiro)

**Files:**
- Modify: `src/components/vendas/proposal/proposal-parties.tsx`

- [ ] **Step 1: Reescrever o corpo de `ProposalPartiesCreate`**

Substituir o `return (...)` de `ProposalPartiesCreate` (o `<div className="grid items-start gap-4 sm:grid-cols-12">…</div>`) por 3 linhas empilhadas, **Cliente → Empreendimento → Unidade**:

```tsx
  return (
    <div className="space-y-4">
      {/* 1 — Cliente */}
      <FormField
        control={form.control}
        name="customer_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Cliente *</FormLabel>
            <FormControl>
              <CustomerAutocomplete value={field.value} onChange={onCustomerChange} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* 2 — Empreendimento */}
      <div className="flex flex-col gap-1.5">
        <Label>Empreendimento *</Label>
        <ProjectAutocomplete value={selectedProject?.id ?? null} onChange={onProjectChange} />
      </div>

      {/* 3 — Unidade */}
      <FormField
        control={form.control}
        name="unit_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Unidade *</FormLabel>
            <FormControl>
              <UnitAutocomplete
                value={field.value}
                onChange={onUnitChange}
                projectId={selectedProject?.id}
                disabled={!selectedProject}
                placeholder={
                  selectedProject ? 'Selecione uma unidade…' : 'Selecione um empreendimento primeiro'
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
```

- [ ] **Step 2: Lint + type check**

Run: `npm run lint && npx tsc -b`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/components/vendas/proposal/proposal-parties.tsx
git commit -m "feat(proposta): etapa 1 em 3 linhas, cliente em primeiro"
```

---

### Task 8: Workbench — índice na mesma linha, "Valor da proposta" + ágio, remover divider

**Files:**
- Modify: `src/components/vendas/proposal/proposal-workbench.tsx`

- [ ] **Step 1: Adicionar estado de "Valor da proposta" e propagar aos vitais**

No corpo de `ProposalWorkbench`, após os `useWatch`, adicionar (default = preço de tabela; respeita edição manual):

```tsx
  const [valorPropostaCents, setValorPropostaCents] = React.useState<number | null>(null)
  // Default = preço de tabela enquanto o usuário não editar manualmente.
  React.useEffect(() => {
    setValorPropostaCents((prev) => (prev == null ? unitPriceCents : prev))
  }, [unitPriceCents])
  const effectiveProposta = valorPropostaCents ?? unitPriceCents
```

Passar para `computeProposalVitals` (5º argumento):

```tsx
  const vitals = React.useMemo(
    () =>
      computeProposalVitals(
        watchedSchedules,
        unitPriceCents,
        maxInstallmentsPerMonth,
        { brokerId: watchedBrokerId, brokerRate: watchedBrokerRate, agencyRate: watchedAgencyRate, capPercent: maxCommissionRate },
        effectiveProposta
      ),
    [watchedSchedules, unitPriceCents, maxInstallmentsPerMonth, watchedBrokerId, watchedBrokerRate, watchedAgencyRate, maxCommissionRate, effectiveProposta]
  )
```

- [ ] **Step 2: Campo "Valor da proposta" + ágio no card de índice (mesma linha do switch)**

Substituir o bloco do card de índice (atual `<div className="space-y-3 rounded-lg border border-border p-4 sm:p-5">…</div>`) por um card que: (a) tem o campo "Valor da proposta" + chip de ágio no topo; (b) switch e select **na mesma linha**:

```tsx
                <div className="space-y-4 rounded-lg border border-border p-4 sm:p-5">
                  {/* Valor da proposta + ágio vs tabela */}
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div className="space-y-1.5">
                      <label htmlFor="valor-proposta" className="text-sm font-medium leading-none">
                        Valor da proposta
                      </label>
                      <CurrencyInput
                        value={effectiveProposta}
                        onChange={(v) => setValorPropostaCents(v)}
                        disabled={disabled}
                        className="max-w-[180px]"
                      />
                    </div>
                    {unitPriceCents > 0 && (
                      <AgioChip agio={vitals.agio} agioPercent={vitals.agioPercent} />
                    )}
                  </div>

                  {/* Switch + índice na mesma linha */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-4">
                    <div className="flex items-center gap-2.5">
                      <Switch
                        id="same-index"
                        checked={sameIndexForAll}
                        onCheckedChange={handleToggleIndex}
                        disabled={disabled}
                      />
                      <label htmlFor="same-index" className="cursor-pointer text-sm font-medium leading-none">
                        Mesmo índice para toda a proposta
                      </label>
                    </div>
                    {sameIndexForAll ? (
                      <FormField
                        control={form.control}
                        name="index_type_code"
                        render={({ field }) => (
                          <FormItem className="w-[180px]">
                            <Select
                              value={field.value ?? ''}
                              onValueChange={field.onChange}
                              disabled={disabled || indexTypesLoading}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full font-mono">
                                  <SelectValue placeholder={indexTypesLoading ? 'Carregando…' : 'Índice *'} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {indexTypes.map((t) => (
                                  <SelectItem key={t.code} value={t.code} className="font-mono text-xs">
                                    {t.code}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <p className="text-xs text-muted-foreground">Índice por grupo, definido abaixo.</p>
                    )}
                  </div>
                </div>
```

Adicionar o import de `CurrencyInput` (já importado `formatCentsToDisplay` de `currency-input`; trocar para `import { CurrencyInput, formatCentsToDisplay } from '@/components/ui/currency-input'`).

Adicionar o componente `AgioChip` ao final do arquivo (junto de `pct`/`StepFooter`):

```tsx
function AgioChip({ agio, agioPercent }: { agio: number; agioPercent: number }) {
  if (agio === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-success/12 px-2 py-1 text-xs font-medium text-success">
        No preço de tabela
      </span>
    )
  }
  const below = agio < 0
  const tone = below ? 'bg-warning/12 text-warning' : 'bg-success/12 text-success'
  const sign = below ? '−' : '+'
  const label = below ? 'desconto' : 'ágio'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium tabular-nums ${tone}`}>
      {sign}
      {formatCentsToDisplay(Math.abs(agio))} · {pct(Math.abs(agioPercent))} {label}
      <span className="text-muted-foreground"> vs tabela</span>
    </span>
  )
}
```

- [ ] **Step 3: Remover o divider do `StepFooter`**

Trocar a classe do `StepFooter` removendo a borda superior:

```tsx
    <div
      className={`mt-6 flex items-center gap-3 ${back ? 'justify-between' : 'justify-end'}`}
    >
```

- [ ] **Step 4: Propagar `effectiveProposta`/`setValorPropostaCents` ao ledger e aos vitais**

No `<InstallmentLedger … />` adicionar props (consumidas na Task 11/13):

```tsx
                    valorPropostaCents={effectiveProposta}
                    saldo={vitals.saldo}
                    onDistribute={setValorPropostaCents}
```

E no `<ProposalVitals … />` (sidebar) adicionar:

```tsx
                <ProposalVitals
                  vitals={vitals}
                  hasUnit={unitPriceCents > 0}
                  schedules={watchedSchedules}
                  maxInstallmentsPerMonth={maxInstallmentsPerMonth}
                />
```

> As props novas só serão tipadas após Tasks 11 e 13; é esperado erro de tipo até lá. Marcar para validar no fim da fase.

- [ ] **Step 5: Lint**

Run: `npm run lint`
Expected: sem erros de formatação (erros de tipo das props novas são esperados até Tasks 11/13).

- [ ] **Step 6: Commit**

```bash
git add src/components/vendas/proposal/proposal-workbench.tsx
git commit -m "feat(proposta): valor da proposta + ágio, índice na mesma linha, sem divider"
```

---

### Task 9: Workbench — gate de avançar por saldo

**Files:**
- Modify: `src/components/vendas/proposal/proposal-workbench.tsx`

- [ ] **Step 1: Trocar a condição de divergência para o saldo**

Substituir `const hasDivergence = unitPriceCents > 0 && Math.abs(vitals.diff) > 0` por:

```tsx
  const hasSaldo = Math.abs(vitals.saldo) >= 1 // ≥ 1 centavo
```

Em `handleContinue`, trocar `if (currentStep === 1 && hasDivergence)` por `if (currentStep === 1 && hasSaldo)`, mantendo `setShowDivergence(true)`.

- [ ] **Step 2: Atualizar o texto do `AlertDialog`**

Substituir o conteúdo do `AlertDialogHeader`/`Description` por:

```tsx
            <AlertDialogTitle>Plano não fecha o valor da proposta</AlertDialogTitle>
            <AlertDialogDescription>
              O plano soma {money(vitals.total)}, {vitals.saldo > 0 ? 'faltam' : 'sobram'}{' '}
              {money(Math.abs(vitals.saldo))} para o valor da proposta ({money(effectiveProposta)}).
              Você pode distribuir o saldo em um grupo no painel à direita. Prosseguir assim mesmo?
            </AlertDialogDescription>
```

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: sem erros de formatação.

- [ ] **Step 4: Commit**

```bash
git add src/components/vendas/proposal/proposal-workbench.tsx
git commit -m "feat(proposta): gate de avançar confronta o saldo da proposta"
```

---

### Task 10: Ledger — linhas só com "Início" + indicador início→fim + aviso fixo

**Files:**
- Modify: `src/components/vendas/proposal/installment-ledger.tsx`

- [ ] **Step 1: Remover os campos "Dia"/"Mês" das linhas recorrentes**

No `InstallmentRow`, no ramo `else` (recorrentes), remover os dois `FormField` de `recurrence_day` e `recurrence_month`, deixando **apenas** o `FormField` de `start_date` (renomear label para "Início" e ampliar col-span):

```tsx
        ) : (
          <FormField
            control={form.control}
            name={`installment_schedules.${index}.start_date`}
            render={({ field: f }) => (
              <FormItem className="col-span-2 sm:col-span-6">
                <FormLabel className={CONSOLE_LABEL}>Início *</FormLabel>
                <FormControl>
                  <DatePicker value={f.value} onChange={f.onChange} disabled={disabled} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
```

> Como `recurrence_day`/`recurrence_month` deixam de ter input, eles passam a ser derivados de `start_date` ao mudar a data e no submit. Adicionar no `onChange` do DatePicker a derivação local para manter o form válido durante a edição:

Trocar o `onChange={f.onChange}` acima por:

```tsx
                  onChange={(v) => {
                    f.onChange(v)
                    if (v && recurrence) {
                      const { recurrence_day, recurrence_month } = deriveRecurrenceFields(v, recurrence)
                      form.setValue(`installment_schedules.${index}.recurrence_day`, recurrence_day)
                      form.setValue(`installment_schedules.${index}.recurrence_month`, recurrence_month)
                    }
                  }}
```

Adicionar import: `import { computeScheduleEnd, deriveRecurrenceFields, formatBRDate } from '@/lib/installment-utils'` (consolidar com o import existente de `installment-utils`).

Remover do `InstallmentRow` o cálculo agora não usado de `allowedDates`/`disabledDates`/`dateDisabled` ligado a day/month (a data de início passa a ser livre). Remover também `getDisabledDates` e o cache se não houver mais consumidores (verificar com grep).

- [ ] **Step 2: Indicador início→fim por grupo**

No `InstallmentLedger`, dentro do `map(NON_ENTRY_KINDS)`, abaixo do header do grupo, adicionar um indicador derivado do primeiro/último schedule do grupo. Implementar um helper local:

```tsx
  const groupRange = React.useCallback(
    (indices: number[]): string | null => {
      if (!watchedSchedules || !indices.length) return null
      let start: Date | null = null
      let end: Date | null = null
      for (const i of indices) {
        const s = watchedSchedules[i]
        if (!s?.start_date) continue
        const sd = new Date(`${s.start_date}T12:00:00`)
        const ed = computeScheduleEnd(s)
        if (!start || sd < start) start = sd
        if (ed && (!end || ed > end)) end = ed
      }
      if (!start || !end) return null
      return `${formatBRDate(start)} → ${formatBRDate(end)}`
    },
    [watchedSchedules]
  )
```

E renderizar abaixo do `<div className="flex items-baseline justify-between">` do grupo:

```tsx
                  {groupRange(indices) && (
                    <p className="text-[0.6875rem] tabular-nums text-muted-foreground">
                      {groupRange(indices)}
                    </p>
                  )}
```

- [ ] **Step 3: Aviso fixo de teto (mantido no rodapé das parcelas)**

O bloco de `violations` já existe (linhas ~350-365) e já cumpre o aviso fixo. Garantir que ele renderiza **apenas quando excede** (a fonte `perMonthViolations` já só inclui `monthCount > max`). Nenhuma mudança de lógica — confirmar que continua presente após as edições.

- [ ] **Step 4: Lint + type check**

Run: `npm run lint && npx tsc -b`
Expected: sem erros (exceto props novas pendentes da Task 11).

- [ ] **Step 5: Commit**

```bash
git add src/components/vendas/proposal/installment-ledger.tsx
git commit -m "feat(proposta): linhas só com início + indicador início→fim"
```

---

### Task 11: Ledger — adição inteligente + encadeamento travado + distribuição

**Files:**
- Modify: `src/components/vendas/proposal/installment-ledger.tsx`

- [ ] **Step 1: Estender props do ledger**

Em `InstallmentLedgerProps` adicionar:

```tsx
  valorPropostaCents?: number
  saldo?: number
  onDistribute?: (v: number | null) => void
```

E receber no componente: `valorPropostaCents = 0, saldo = 0,` (o `onDistribute` é usado pela sidebar; aqui só `saldo`/`valorPropostaCents`).

- [ ] **Step 2: `addRecurring` com quantidade derivada + auto-balanceamento**

Substituir `addRecurring` por uma versão que usa o span das mensais e distribui o saldo:

```tsx
  const periodMonthsOf = (rec: Recurrence): number =>
    ({ monthly: 1, bimonthly: 2, quarterly: 3, semestral: 6, yearly: 12 })[rec] ?? 1

  const addRecurring = React.useCallback(
    (kind: 'regular' | 'balloon' | 'extra', recurrence: Recurrence) => {
      const isYearly = recurrence === 'yearly'
      const day = isYearly ? 15 : 10

      // Mensais encadeiam (sem sobreposição) após o último grupo mensal.
      if (kind === 'regular' && recurrence === 'monthly') {
        const list = (watchedSchedules ?? []) as InstallmentScheduleFormData[]
        const lastMonthly = [...list].reverse().find((s) => s.kind === 'regular' && s.recurrence_type === 'monthly' && s.start_date)
        const startDate = lastMonthly ? computeChainedStart(lastMonthly, day) : computeDefaultStartDate('monthly', day, null)
        append({
          kind, payment_method: 'boleto', quantity: 1, amount: 0, specific_date: null,
          recurrence_type: 'monthly', recurrence_day: day, recurrence_month: null,
          start_date: startDate || null, asset_proposal: null,
        })
        return
      }

      // Balões/reforços: quantidade derivada do span das mensais + saldo distribuído.
      const span = computeMonthlySpan((watchedSchedules ?? []) as InstallmentScheduleFormData[])
      const period = periodMonthsOf(recurrence)
      const derived = span ? deriveRecurringFromSpan(span, period, day) : null
      const quantity = derived?.quantity ?? 1
      const startISO = derived?.startISO ?? computeDefaultStartDate(recurrence, day, isYearly ? 12 : null)
      const perAmount = quantity > 0 && saldo > 0 ? Math.max(0, Math.round(saldo / quantity)) : 0
      const { recurrence_day, recurrence_month } = startISO
        ? deriveRecurrenceFields(startISO, recurrence)
        : { recurrence_day: day, recurrence_month: isYearly ? 12 : null }
      append({
        kind, payment_method: 'boleto', quantity, amount: perAmount, specific_date: null,
        recurrence_type: recurrence, recurrence_day, recurrence_month,
        start_date: startISO || null, asset_proposal: null,
      })
    },
    [append, watchedSchedules, saldo]
  )
```

Adicionar imports: `computeChainedStart, computeMonthlySpan, deriveRecurringFromSpan` de `@/lib/installment-utils`.

- [ ] **Step 3: Encadeamento travado na linha (início read-only para mensais 2º+)**

No `InstallmentRow`, calcular se a linha é um grupo mensal encadeado (não é o primeiro grupo mensal) e travar o `DatePicker` com botão "destravar". Passar do ledger para a row uma flag `chainedLocked` e um `onUnlock`. Implementação mínima: no ledger, ao montar as rows mensais, marcar como travadas todas as mensais cujo índice não é o primeiro grupo mensal; manter um `Set<number>` de índices "destravados" em estado local:

```tsx
  const [unlocked, setUnlocked] = React.useState<Set<number>>(new Set())
```

No `DatePicker` de início (Task 10 Step 1), quando `recurrence === 'monthly'` e a linha for encadeada e não destravada, renderizar travado:

```tsx
                <FormItem className="col-span-2 sm:col-span-6">
                  <FormLabel className={CONSOLE_LABEL}>Início *</FormLabel>
                  {chainedLocked ? (
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 flex-1 items-center gap-2 rounded-md border border-dashed border-border px-3 text-sm text-muted-foreground">
                        <Lock className="size-3.5" />
                        <span className="tabular-nums">{f.value ? formatBRDate(new Date(`${f.value}T12:00:00`)) : '—'}</span>
                      </div>
                      <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={onUnlock}>
                        Destravar
                      </Button>
                    </div>
                  ) : (
                    <FormControl>
                      <DatePicker
                        value={f.value}
                        disabled={disabled}
                        onChange={(v) => {
                          f.onChange(v)
                          if (v && recurrence) {
                            const d = deriveRecurrenceFields(v, recurrence)
                            form.setValue(`installment_schedules.${index}.recurrence_day`, d.recurrence_day)
                            form.setValue(`installment_schedules.${index}.recurrence_month`, d.recurrence_month)
                          }
                        }}
                      />
                    </FormControl>
                  )}
                  <FormMessage />
                </FormItem>
```

Adicionar import `Lock` de `lucide-react` e `Button` (já importado).

> Decisão de granularidade: "grupo mensal" = sequência de schedules `regular/monthly`. A 1ª linha mensal fica editável; as demais começam travadas. O `onUnlock` adiciona o índice ao `Set` `unlocked`. Passar `chainedLocked={kind==='monthly-2+' && !unlocked.has(index)}` calculado no map do ledger (comparar o índice ao primeiro índice mensal de `groupedIndices.get('regular')`).

- [ ] **Step 4: Lint + type check**

Run: `npm run lint && npx tsc -b`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/components/vendas/proposal/installment-ledger.tsx
git commit -m "feat(proposta): adição inteligente de balão + encadeamento travado de mensais"
```

---

### Task 12: Componente do mapa mensal (novo)

**Files:**
- Create: `src/components/vendas/proposal/installment-calendar.tsx`

- [ ] **Step 1: Criar o componente**

```tsx
import * as React from 'react'
import { formatCentsToDisplay } from '@/components/ui/currency-input'
import { computeMonthlyBreakdown, type MonthlyCell } from '@/lib/installment-utils'
import { INSTALLMENT_KIND_LABELS, type InstallmentKind, type SaleFormData } from '@/schemas/sale.schema'
import { cn } from '@/lib/utils'
import { CONSOLE_LABEL, REVEAL } from './section'

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const ABBR = ['J','F','M','A','M','J','J','A','S','O','N','D']

// Cores de dado (não-ação): chaves em violeta para diferenciar.
const KIND_DOT: Record<InstallmentKind, string> = {
  entry: 'bg-sky-400',
  regular: 'bg-lime-400',
  balloon: 'bg-amber-400',
  key_delivery: 'bg-violet-400',
  extra: 'bg-muted-foreground',
}
const money = (c: number) => `R$ ${formatCentsToDisplay(c) || '0,00'}`

function dominantKind(cells: MonthlyCell[]): InstallmentKind {
  const ks = cells.map((c) => c.kind)
  if (ks.includes('key_delivery')) return 'key_delivery'
  if (ks.includes('balloon')) return 'balloon'
  if (ks.includes('entry')) return 'entry'
  if (ks.includes('regular')) return 'regular'
  return 'extra'
}

interface Props {
  schedules: SaleFormData['installment_schedules'] | undefined
  className?: string
}

export function InstallmentCalendar({ schedules, className }: Props) {
  const breakdown = React.useMemo(() => computeMonthlyBreakdown(schedules ?? []), [schedules])
  const years = React.useMemo(() => {
    const ys = new Set<number>()
    for (const key of breakdown.keys()) ys.add(Number(key.slice(0, 4)))
    return [...ys].sort((a, b) => a - b)
  }, [breakdown])

  // Conjunto de chaves que devem animar (entraram desde o último render).
  const prevKeys = React.useRef<Set<string>>(new Set())
  const animKeys = React.useMemo(() => {
    const current = new Set<string>()
    for (const [k, cells] of breakdown) current.add(`${k}:${cells.length}`)
    const fresh = new Set<string>()
    for (const k of current) if (!prevKeys.current.has(k)) fresh.add(k.split(':')[0])
    prevKeys.current = current
    return fresh
  }, [breakdown])

  const [hover, setHover] = React.useState<{ key: string; x: number; y: number } | null>(null)

  if (!years.length) return null

  return (
    <div className={cn('relative', className)}>
      <div className="grid grid-cols-[1.5rem_repeat(12,1fr)] gap-1 text-[0.6rem] text-muted-foreground">
        <span />
        {ABBR.map((a, i) => (
          <span key={i} className="text-center">{a}</span>
        ))}
      </div>
      {years.map((yr) => (
        <div key={yr} className="mt-1 grid grid-cols-[1.5rem_repeat(12,1fr)] items-center gap-1">
          <span className="text-[0.6rem] text-muted-foreground">{String(yr).slice(2)}</span>
          {Array.from({ length: 12 }, (_, m) => {
            const key = `${yr}-${String(m + 1).padStart(2, '0')}`
            const cells = breakdown.get(key)
            const filled = !!cells?.length
            return (
              <button
                type="button"
                key={m}
                aria-label={
                  filled
                    ? `${MONTHS[m]} ${yr}: ${cells.length} parcela(s)`
                    : `${MONTHS[m]} ${yr}: sem parcelas`
                }
                className={cn(
                  'aspect-square rounded-[3px] transition-transform hover:scale-110 focus-visible:scale-110 focus-visible:outline-none',
                  filled ? KIND_DOT[dominantKind(cells)] : 'bg-muted',
                  filled && animKeys.has(key) && REVEAL
                )}
                onMouseEnter={(e) => {
                  const r = e.currentTarget.getBoundingClientRect()
                  setHover({ key, x: r.left + r.width / 2, y: r.bottom })
                }}
                onFocus={(e) => {
                  const r = e.currentTarget.getBoundingClientRect()
                  setHover({ key, x: r.left + r.width / 2, y: r.bottom })
                }}
                onMouseLeave={() => setHover(null)}
                onBlur={() => setHover(null)}
              />
            )
          })}
        </div>
      ))}

      {hover && <CalendarPopover hover={hover} cells={breakdown.get(hover.key) ?? []} />}
    </div>
  )
}

function CalendarPopover({
  hover,
  cells,
}: {
  hover: { key: string; x: number; y: number }
  cells: MonthlyCell[]
}) {
  const [yr, mo] = hover.key.split('-')
  const total = cells.reduce((s, c) => s + c.amount, 0)
  const left = Math.max(8, Math.min(hover.x - 100, window.innerWidth - 208))
  return (
    <div
      role="tooltip"
      style={{ position: 'fixed', left, top: hover.y + 8, width: 200 }}
      className="z-50 rounded-lg border border-border bg-popover p-3 text-xs shadow-lg"
    >
      <p className="mb-2 font-semibold">{MONTHS[Number(mo) - 1]} {yr}</p>
      {cells.length === 0 ? (
        <p className="text-muted-foreground">Nenhuma parcela</p>
      ) : (
        <>
          {cells.map((c, i) => (
            <div key={i} className="mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className={cn('size-2 rounded-[2px]', KIND_DOT[c.kind])} />
                {INSTALLMENT_KIND_LABELS[c.kind]}
              </span>
              <span className="tabular-nums">{c.amount ? money(c.amount) : 'a definir'}</span>
            </div>
          ))}
          <div className="mt-1 flex justify-between border-t border-border pt-1.5 font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{money(total)}</span>
          </div>
          <p className="mt-1 text-[0.6rem] text-muted-foreground">
            {cells.length} parcela{cells.length > 1 ? 's' : ''} no mês
          </p>
        </>
      )}
    </div>
  )
}
```

> Cores: `bg-sky-400/lime-400/amber-400/violet-400` são utilitários Tailwind garantidos. Se o design system tiver tokens de data-viz dedicados, trocar aqui (polimento). `bg-popover`/`border-border` seguem o tema.

- [ ] **Step 2: Lint + type check**

Run: `npm run lint && npx tsc -b`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/components/vendas/proposal/installment-calendar.tsx
git commit -m "feat(proposta): mapa mensal com popover, animação e cor de chaves"
```

---

### Task 13: Vitals — card Saldo + Distribuir + embutir o calendário

**Files:**
- Modify: `src/components/vendas/proposal/proposal-vitals.tsx`

- [ ] **Step 1: Estender props**

```tsx
interface ProposalVitalsProps {
  vitals: Vitals
  hasUnit: boolean
  className?: string
  schedules?: import('@/schemas/sale.schema').SaleFormData['installment_schedules']
  /** Para o controle "Distribuir": ajusta o valor da proposta? Não — distribui no grupo. */
  onDistribute?: (groupKind: import('@/schemas/sale.schema').InstallmentKind) => void
}
```

> Implementação do distribuir: a ação altera o **valor de um grupo** no form. Como `ProposalVitals` não tem acesso ao `form`, o handler de distribuição vive no workbench/ledger. Aqui o card Saldo renderiza um `Select` de grupo (a partir de `vitals.groups`) + botão que chama `onDistribute(kind)`. O workbench passa um `onDistribute` que usa `balanceGroupAmount` para setar os valores do grupo no form (ver Step 3).

- [ ] **Step 2: Card "Saldo" no topo do painel**

Adicionar, logo após o header "Resumo", um card de saldo:

```tsx
      {hasPlan && (
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border bg-border">
          <div className="flex flex-col gap-2 bg-card p-4">
            <span className={CONSOLE_LABEL}>Saldo da proposta</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-muted-foreground">Valor da proposta</span>
              <span className="text-sm font-medium tabular-nums">{money(vitals.valorPropostaCents)}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-muted-foreground">Soma do plano</span>
              <span className="text-sm font-medium tabular-nums">{money(vitals.total)}</span>
            </div>
            <div className="flex items-baseline justify-between border-t border-border pt-2">
              <span className="text-xs font-medium">
                {vitals.saldo > 0 ? 'Falta distribuir' : vitals.saldo < 0 ? 'Sobra' : 'Saldo'}
              </span>
              <span className={cn('text-base font-semibold tabular-nums', Math.abs(vitals.saldo) < 1 ? 'text-success' : 'text-warning')}>
                {money(Math.abs(vitals.saldo))}
              </span>
            </div>
            {Math.abs(vitals.saldo) >= 1 && onDistribute && vitals.groups.length > 0 && (
              <DistributeControl groups={vitals.groups} onDistribute={onDistribute} />
            )}
          </div>
        </div>
      )}
```

Adicionar `DistributeControl` no final do arquivo:

```tsx
function DistributeControl({
  groups,
  onDistribute,
}: {
  groups: Vitals['groups']
  onDistribute: (kind: import('@/schemas/sale.schema').InstallmentKind) => void
}) {
  const targets = groups.filter((g) => g.kind !== 'entry')
  const [kind, setKind] = React.useState(targets[0]?.kind)
  if (!targets.length || !kind) return null
  return (
    <div className="mt-1 flex gap-2">
      <Select value={kind} onValueChange={(v) => setKind(v as typeof kind)}>
        <SelectTrigger className="h-8 flex-1 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {targets.map((g) => (
            <SelectItem key={g.kind} value={g.kind} className="text-xs">
              {GROUP_LABELS[g.kind]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="button" size="sm" className="h-8" onClick={() => onDistribute(kind)}>
        Distribuir
      </Button>
    </div>
  )
}
```

Adicionar imports em `proposal-vitals.tsx`: `import * as React from 'react'`, `Button`, `Select*`, e o `InstallmentCalendar`.

- [ ] **Step 3: Implementar `onDistribute` no workbench (Task 8 deixou o slot)**

Em `proposal-workbench.tsx`, definir o handler e passá-lo ao `<ProposalVitals>`:

```tsx
  const handleDistribute = React.useCallback(
    (kind: InstallmentKind) => {
      const schedules = form.getValues('installment_schedules') as InstallmentScheduleFormData[]
      const indices = schedules.map((s, i) => ({ s, i })).filter((x) => x.s.kind === kind)
      const qty = indices.reduce((sum, x) => sum + (x.s.quantity ?? 0), 0)
      if (qty <= 0) return
      const delta = Math.round(vitals.saldo / qty)
      for (const { i, s } of indices) {
        form.setValue(`installment_schedules.${i}.amount`, Math.max(0, (s.amount ?? 0) + delta))
      }
    },
    [form, vitals.saldo]
  )
```

> Distribui o mesmo `delta` por parcela do grupo (uniforme). Resíduo de centavos (< qtd) permanece como saldo — comportamento honesto do modelo de valor uniforme. Importar `InstallmentKind`, `InstallmentScheduleFormData` de `@/schemas/sale.schema`.

Passar `onDistribute={handleDistribute}` ao `<ProposalVitals>`.

- [ ] **Step 4: Embutir o calendário no painel**

No fim do `ProposalVitals`, após o "Detalhamento por grupo", adicionar:

```tsx
      {vitals.count > 0 && (
        <div className="space-y-2">
          <span className={CONSOLE_LABEL}>Calendário de parcelas</span>
          <InstallmentCalendar schedules={schedules} />
        </div>
      )}
```

- [ ] **Step 5: Build completo (integração das Tasks 8–13)**

Run: `npm run build`
Expected: build OK (tsc + vite) — resolve os tipos das props introduzidas nas Tasks 8/11/13.

- [ ] **Step 6: Lint + testes**

Run: `npm run lint && npm test`
Expected: lint limpo, testes verdes.

- [ ] **Step 7: Commit**

```bash
git add src/components/vendas/proposal/proposal-vitals.tsx src/components/vendas/proposal/proposal-workbench.tsx
git commit -m "feat(proposta): card de saldo + distribuir + calendário no resumo"
```

---

### Task 14: Submit — derivar recurrence_day/month de start_date (criar e editar)

**Files:**
- Modify: `pages/vendas/novo/+Page.tsx`
- Modify: `pages/vendas/@id/editar/+Page.tsx`

- [ ] **Step 1: Derivar no payload de criação**

Em `pages/vendas/novo/+Page.tsx`, no `mutationFn`, ao montar cada `schedule`, derivar `recurrence_day`/`recurrence_month` de `start_date` quando houver recorrência. Substituir os campos correspondentes do `.map(...)`:

```tsx
          installment_schedules: formData.installment_schedules.map((schedule) => {
            const derived =
              schedule.recurrence_type && schedule.start_date
                ? deriveRecurrenceFields(schedule.start_date, schedule.recurrence_type)
                : { recurrence_day: schedule.recurrence_day ?? undefined, recurrence_month: schedule.recurrence_month ?? undefined }
            return {
              kind: schedule.kind,
              payment_method: schedule.payment_method,
              quantity: schedule.quantity,
              amount: schedule.amount,
              specific_date: schedule.specific_date ?? undefined,
              recurrence_type: schedule.recurrence_type ?? undefined,
              recurrence_day: derived.recurrence_day ?? undefined,
              recurrence_month: derived.recurrence_month ?? undefined,
              start_date: schedule.start_date ?? undefined,
              ...(!formData.same_index_for_all && schedule.kind !== 'entry' && schedule.index_type_code
                ? { index_type_code: schedule.index_type_code }
                : {}),
              ...(schedule.payment_method === 'asset' && schedule.asset_proposal
                ? { asset_proposal: schedule.asset_proposal as { type: string; asset_metadata: Record<string, unknown> } }
                : {}),
            }
          }),
```

Adicionar `import { deriveRecurrenceFields } from '@/lib/installment-utils'`.

- [ ] **Step 2: Mesma derivação no submit de edição**

Em `pages/vendas/@id/editar/+Page.tsx`, localizar o `mutationFn` que monta `installment_schedules` e aplicar a mesma derivação (`deriveRecurrenceFields(schedule.start_date, schedule.recurrence_type)` quando `recurrence_type && start_date`).

- [ ] **Step 3: Build + lint**

Run: `npm run build && npm run lint`
Expected: OK.

- [ ] **Step 4: Commit**

```bash
git add pages/vendas/novo/+Page.tsx "pages/vendas/@id/editar/+Page.tsx"
git commit -m "feat(proposta): derivar recurrence_day/month de start_date no submit"
```

---

### Task 15: Edição — default de "Valor da proposta" = soma do plano

**Files:**
- Modify: `src/components/vendas/proposal/sale-edit-workbench.tsx`
- Modify: `src/components/vendas/proposal/proposal-workbench.tsx`

- [ ] **Step 1: Aceitar `initialValorPropostaCents` no workbench**

Em `ProposalWorkbench`, adicionar prop opcional `initialValorPropostaCents?: number` e usar como semente do estado:

```tsx
  const [valorPropostaCents, setValorPropostaCents] = React.useState<number | null>(
    initialValorPropostaCents ?? null
  )
```

(Manter o `useEffect` que aplica `unitPriceCents` apenas quando `prev == null` E `initialValorPropostaCents` não foi dado.)

Ajustar o effect:

```tsx
  React.useEffect(() => {
    if (initialValorPropostaCents != null) return
    setValorPropostaCents((prev) => (prev == null ? unitPriceCents : prev))
  }, [unitPriceCents, initialValorPropostaCents])
```

- [ ] **Step 2: Passar a soma do plano na edição**

Em `sale-edit-workbench.tsx`, calcular a soma e passar:

```tsx
  const planSum = (sale.installment_schedules ?? []).reduce(
    (s, x) => s + (x.quantity ?? 0) * (x.amount ?? 0),
    0
  )
```

E no `<ProposalWorkbench … initialValorPropostaCents={planSum} />`.

- [ ] **Step 3: Build + lint**

Run: `npm run build && npm run lint`
Expected: OK (saldo abre em 0 na edição).

- [ ] **Step 4: Commit**

```bash
git add src/components/vendas/proposal/sale-edit-workbench.tsx src/components/vendas/proposal/proposal-workbench.tsx
git commit -m "feat(proposta): edição abre com valor da proposta = soma do plano"
```

---

## Verificação final

- [ ] **Testes:** `npm test` — todos verdes.
- [ ] **Lint/format:** `npm run lint` — limpo.
- [ ] **Build:** `npm run build` — sem erros de tipo.
- [ ] **Manual (criar):** `/vendas/novo` — etapa 1 em 3 linhas (cliente 1º); índice na mesma linha; "Valor da proposta" default = tabela com ágio; adicionar mensal e ver início→fim; adicionar 2º grupo mensal e ver início travado; adicionar balão anual e ver qtd derivada + saldo distribuído; card Saldo + Distribuir zera (resíduo ≤ centavos); mapa mensal com popover, animação ao adicionar, chaves em cor própria; aviso de teto só quando excede; sem divider acima dos botões.
- [ ] **Manual (editar):** `/vendas/@id/editar` de uma proposta — abre balanceado (saldo 0); datas com só "Início".
- [ ] **(Opcional) e2e:** rodar `npm run test:e2e` se houver cobertura da proposta; ajustar factories ao novo layout se necessário.

---

## Self-review (cobertura do spec)

- Etapa 1 (3 linhas, cliente 1º) → Task 7 ✓
- Índice mesma linha → Task 8 ✓
- Valor da proposta + ágio → Tasks 6, 8 ✓
- Saldo + Distribuir (modelo C) → Tasks 6, 13 ✓
- Datas unificadas (só Início) → Tasks 1, 10, 14 ✓
- Início→fim → Tasks 1, 10 ✓
- Encadeamento travado → Tasks 4, 11 ✓
- Adição inteligente (qtd derivada + auto-balance) → Tasks 2, 3, 11 ✓
- Mapa mensal + popover + animação + chaves → Tasks 5, 12, 13 ✓
- Aviso fixo de teto (sem anel por célula) → Tasks 10, 12 ✓
- Remover divider → Task 8 ✓
