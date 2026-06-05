import { describe, expect, it } from 'vitest'
import {
  automacaoSchema,
  boletosSchema,
  correcaoSchema,
  indicesSchema,
  pagamentosSchema,
  parcelasSchema,
} from '@/schemas/tenant-config.schema'

// ─── boletosSchema ────────────────────────────────────────────────────────────

describe('boletosSchema', () => {
  describe('superRefine: days_before_due exige invoice_days_before_due', () => {
    it('rejeita timing=days_before_due com days=null', () => {
      const result = boletosSchema.safeParse({
        invoice_generation_timing: 'days_before_due',
        invoice_days_before_due: null,
      })
      expect(result.success).toBe(false)
      const issue = result.error?.issues.find((i) =>
        i.path.includes('invoice_days_before_due'),
      )
      expect(issue).toBeDefined()
    })

    it('rejeita timing=days_before_due com days=undefined', () => {
      const result = boletosSchema.safeParse({
        invoice_generation_timing: 'days_before_due',
      })
      expect(result.success).toBe(false)
    })

    it('aceita timing=days_before_due com days=30', () => {
      const result = boletosSchema.safeParse({
        invoice_generation_timing: 'days_before_due',
        invoice_days_before_due: 30,
      })
      expect(result.success).toBe(true)
    })

    it('aceita timing=immediate com days=null', () => {
      const result = boletosSchema.safeParse({
        invoice_generation_timing: 'immediate',
        invoice_days_before_due: null,
      })
      expect(result.success).toBe(true)
    })

    it('aceita timing=immediate sem days', () => {
      const result = boletosSchema.safeParse({
        invoice_generation_timing: 'immediate',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('validações de invoice_days_before_due', () => {
    it('rejeita days=0 (abaixo do mínimo de 1)', () => {
      const result = boletosSchema.safeParse({
        invoice_generation_timing: 'days_before_due',
        invoice_days_before_due: 0,
      })
      expect(result.success).toBe(false)
    })

    it('rejeita days=91 (acima do máximo de 90)', () => {
      const result = boletosSchema.safeParse({
        invoice_generation_timing: 'days_before_due',
        invoice_days_before_due: 91,
      })
      expect(result.success).toBe(false)
    })

    it('rejeita days=1.5 (não inteiro)', () => {
      const result = boletosSchema.safeParse({
        invoice_generation_timing: 'days_before_due',
        invoice_days_before_due: 1.5,
      })
      expect(result.success).toBe(false)
    })

    it('aceita days=1 (limite mínimo)', () => {
      const result = boletosSchema.safeParse({
        invoice_generation_timing: 'days_before_due',
        invoice_days_before_due: 1,
      })
      expect(result.success).toBe(true)
    })

    it('aceita days=90 (limite máximo)', () => {
      const result = boletosSchema.safeParse({
        invoice_generation_timing: 'days_before_due',
        invoice_days_before_due: 90,
      })
      expect(result.success).toBe(true)
    })
  })
})

// ─── automacaoSchema ──────────────────────────────────────────────────────────

describe('automacaoSchema', () => {
  describe('superRefine: days_in_pending_signature exige sale_lost_days_threshold', () => {
    it('rejeita rule=days_in_pending_signature com threshold=null', () => {
      const result = automacaoSchema.safeParse({
        sale_lost_rule: 'days_in_pending_signature',
        sale_lost_days_threshold: null,
      })
      expect(result.success).toBe(false)
      const issue = result.error?.issues.find((i) =>
        i.path.includes('sale_lost_days_threshold'),
      )
      expect(issue).toBeDefined()
    })

    it('aceita rule=days_in_pending_signature com threshold=30', () => {
      const result = automacaoSchema.safeParse({
        sale_lost_rule: 'days_in_pending_signature',
        sale_lost_days_threshold: 30,
      })
      expect(result.success).toBe(true)
    })

    it('aceita rule=disabled com threshold=null', () => {
      const result = automacaoSchema.safeParse({
        sale_lost_rule: 'disabled',
        sale_lost_days_threshold: null,
      })
      expect(result.success).toBe(true)
    })

    it('aceita rule=disabled sem threshold', () => {
      const result = automacaoSchema.safeParse({
        sale_lost_rule: 'disabled',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('validações de sale_lost_days_threshold', () => {
    it('rejeita threshold=0 (abaixo do mínimo de 1)', () => {
      const result = automacaoSchema.safeParse({
        sale_lost_rule: 'days_in_pending_signature',
        sale_lost_days_threshold: 0,
      })
      expect(result.success).toBe(false)
    })

    it('rejeita threshold=366 (acima do máximo de 365)', () => {
      const result = automacaoSchema.safeParse({
        sale_lost_rule: 'days_in_pending_signature',
        sale_lost_days_threshold: 366,
      })
      expect(result.success).toBe(false)
    })

    it('aceita threshold=1 (limite mínimo)', () => {
      const result = automacaoSchema.safeParse({
        sale_lost_rule: 'days_in_pending_signature',
        sale_lost_days_threshold: 1,
      })
      expect(result.success).toBe(true)
    })

    it('aceita threshold=365 (limite máximo)', () => {
      const result = automacaoSchema.safeParse({
        sale_lost_rule: 'days_in_pending_signature',
        sale_lost_days_threshold: 365,
      })
      expect(result.success).toBe(true)
    })
  })
})

// ─── pagamentosSchema ─────────────────────────────────────────────────────────

describe('pagamentosSchema', () => {
  const validPagamentos = {
    minimum_signal_percentage: 10,
    minimum_entry_percentage: 20,
    allow_partial_payments: false,
    allow_partial_payments_for_entry: false,
    require_entry_payment_for_close: true,
  }

  it('aceita dados válidos completos', () => {
    expect(pagamentosSchema.safeParse(validPagamentos).success).toBe(true)
  })

  describe('minimum_signal_percentage', () => {
    it('rejeita valor=-1 (abaixo de 0%)', () => {
      const result = pagamentosSchema.safeParse({
        ...validPagamentos,
        minimum_signal_percentage: -1,
      })
      expect(result.success).toBe(false)
    })

    it('rejeita valor=101 (acima de 100%)', () => {
      const result = pagamentosSchema.safeParse({
        ...validPagamentos,
        minimum_signal_percentage: 101,
      })
      expect(result.success).toBe(false)
    })

    it('aceita valor=0 (limite mínimo)', () => {
      const result = pagamentosSchema.safeParse({
        ...validPagamentos,
        minimum_signal_percentage: 0,
      })
      expect(result.success).toBe(true)
    })

    it('aceita valor=100 (limite máximo)', () => {
      const result = pagamentosSchema.safeParse({
        ...validPagamentos,
        minimum_signal_percentage: 100,
      })
      expect(result.success).toBe(true)
    })
  })

  describe('minimum_entry_percentage', () => {
    it('rejeita valor=-1 (abaixo de 0%)', () => {
      const result = pagamentosSchema.safeParse({
        ...validPagamentos,
        minimum_entry_percentage: -1,
      })
      expect(result.success).toBe(false)
    })

    it('rejeita valor=101 (acima de 100%)', () => {
      const result = pagamentosSchema.safeParse({
        ...validPagamentos,
        minimum_entry_percentage: 101,
      })
      expect(result.success).toBe(false)
    })

    it('aceita valor=0 (limite mínimo)', () => {
      const result = pagamentosSchema.safeParse({
        ...validPagamentos,
        minimum_entry_percentage: 0,
      })
      expect(result.success).toBe(true)
    })

    it('aceita valor=100 (limite máximo)', () => {
      const result = pagamentosSchema.safeParse({
        ...validPagamentos,
        minimum_entry_percentage: 100,
      })
      expect(result.success).toBe(true)
    })
  })
})

// ─── parcelasSchema ───────────────────────────────────────────────────────────

describe('parcelasSchema', () => {
  it('rejeita max_installments_per_month=0 (abaixo do mínimo de 1)', () => {
    const result = parcelasSchema.safeParse({ max_installments_per_month: 0 })
    expect(result.success).toBe(false)
  })

  it('rejeita max_installments_per_month=6 (acima do máximo de 5)', () => {
    const result = parcelasSchema.safeParse({ max_installments_per_month: 6 })
    expect(result.success).toBe(false)
  })

  it('rejeita max_installments_per_month=1.5 (não inteiro)', () => {
    const result = parcelasSchema.safeParse({ max_installments_per_month: 1.5 })
    expect(result.success).toBe(false)
  })

  it('aceita max_installments_per_month=1 (limite mínimo)', () => {
    const result = parcelasSchema.safeParse({ max_installments_per_month: 1 })
    expect(result.success).toBe(true)
  })

  it('aceita max_installments_per_month=3 (valor intermediário)', () => {
    const result = parcelasSchema.safeParse({ max_installments_per_month: 3 })
    expect(result.success).toBe(true)
  })

  it('aceita max_installments_per_month=5 (limite máximo)', () => {
    const result = parcelasSchema.safeParse({ max_installments_per_month: 5 })
    expect(result.success).toBe(true)
  })

  it('aceita todos os valores válidos de 1 a 5', () => {
    for (const v of [1, 2, 3, 4, 5]) {
      expect(parcelasSchema.safeParse({ max_installments_per_month: v }).success).toBe(true)
    }
  })
})

// ─── indicesSchema ────────────────────────────────────────────────────────────

describe('indicesSchema', () => {
  it('aceita restrict_index_types=true com available_index_types=["IPCA"]', () => {
    const result = indicesSchema.safeParse({
      restrict_index_types: true,
      available_index_types: ['IPCA'],
    })
    expect(result.success).toBe(true)
  })

  it('aceita restrict_index_types=false com array vazio', () => {
    const result = indicesSchema.safeParse({
      restrict_index_types: false,
      available_index_types: [],
    })
    expect(result.success).toBe(true)
  })

  it('rejeita available_index_types com número no array', () => {
    const result = indicesSchema.safeParse({
      restrict_index_types: true,
      available_index_types: [123],
    })
    expect(result.success).toBe(false)
  })
})

// ─── correcaoSchema ───────────────────────────────────────────────────────────

describe('correcaoSchema', () => {
  it('aceita apply_index_on_overdue_installments=true', () => {
    const result = correcaoSchema.safeParse({
      apply_index_on_overdue_installments: true,
    })
    expect(result.success).toBe(true)
  })

  it('aceita apply_index_on_overdue_installments=false', () => {
    const result = correcaoSchema.safeParse({
      apply_index_on_overdue_installments: false,
    })
    expect(result.success).toBe(true)
  })

  it('rejeita apply_index_on_overdue_installments="true" (string)', () => {
    const result = correcaoSchema.safeParse({
      apply_index_on_overdue_installments: 'true',
    })
    expect(result.success).toBe(false)
  })
})
