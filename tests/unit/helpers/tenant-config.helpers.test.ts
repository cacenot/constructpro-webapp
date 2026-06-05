import { describe, expect, it } from 'vitest'
import {
  CONFIG_IDS,
  ORGANIZACAO_SECTIONS,
  bpsToPercent,
  clampDays,
  percentToBps,
} from '@/components/configuracoes/tenant-config/helpers'

describe('bpsToPercent()', () => {
  it('converte 500 bps para 5', () => {
    expect(bpsToPercent(500, 0)).toBe(5)
  })

  it('converte 0 bps para 0', () => {
    expect(bpsToPercent(0, 0)).toBe(0)
  })

  it('usa fallback quando valor é null', () => {
    expect(bpsToPercent(null, 500)).toBe(5)
  })

  it('usa fallback quando valor é undefined', () => {
    expect(bpsToPercent(undefined, 1000)).toBe(10)
  })

  it('round-trip: bpsToPercent(percentToBps(7.5), 0) === 7.5', () => {
    expect(bpsToPercent(percentToBps(7.5), 0)).toBe(7.5)
  })
})

describe('percentToBps()', () => {
  it('converte 5.0% para 500 bps', () => {
    expect(percentToBps(5.0)).toBe(500)
  })

  it('converte 0.01% para 1 bps', () => {
    expect(percentToBps(0.01)).toBe(1)
  })

  it('converte 100% para 10000 bps', () => {
    expect(percentToBps(100)).toBe(10000)
  })

  it('arredonda 0.005% para 1 bps (não 0)', () => {
    expect(percentToBps(0.005)).toBe(1)
  })
})

describe('clampDays()', () => {
  it('retorna null para string vazia', () => {
    expect(clampDays('', 90)).toBeNull()
  })

  it('retorna null para entrada não-numérica', () => {
    expect(clampDays('abc', 90)).toBeNull()
  })

  it('clampeia 0 para mínimo 1', () => {
    expect(clampDays('0', 90)).toBe(1)
  })

  it('clampeia negativos para mínimo 1', () => {
    expect(clampDays('-5', 90)).toBe(1)
  })

  it('clampeia acima do máximo para o máximo', () => {
    expect(clampDays('91', 90)).toBe(90)
  })

  it('aplica floor em valores decimais (7.9 → 7)', () => {
    expect(clampDays('7.9', 90)).toBe(7)
  })

  it('retorna 1 para valor válido mínimo', () => {
    expect(clampDays('1', 90)).toBe(1)
  })

  it('retorna 90 para valor no limite máximo', () => {
    expect(clampDays('90', 90)).toBe(90)
  })

  it('retorna 45 para valor normal dentro do intervalo', () => {
    expect(clampDays('45', 90)).toBe(45)
  })
})

describe('CONFIG_IDS', () => {
  it('não contém "membros"', () => {
    expect(CONFIG_IDS).not.toContain('membros')
  })

  it('contém todos os ids de ORGANIZACAO_SECTIONS exceto "membros"', () => {
    expect(CONFIG_IDS).toEqual(['indices', 'boletos', 'pagamentos', 'parcelas', 'automacao', 'correcao'])
  })

  it('tem comprimento igual a ORGANIZACAO_SECTIONS.length - 1', () => {
    expect(CONFIG_IDS.length).toBe(ORGANIZACAO_SECTIONS.length - 1)
  })
})

describe('ORGANIZACAO_SECTIONS', () => {
  it('tem exatamente 7 itens', () => {
    expect(ORGANIZACAO_SECTIONS).toHaveLength(7)
  })

  it('primeiro item é "membros"', () => {
    expect(ORGANIZACAO_SECTIONS[0]).toMatchObject({ id: 'membros' })
  })

  it('todos os itens têm id e label como strings não-vazias', () => {
    for (const item of ORGANIZACAO_SECTIONS) {
      expect(typeof item.id).toBe('string')
      expect(item.id.length).toBeGreaterThan(0)
      expect(typeof item.label).toBe('string')
      expect(item.label.length).toBeGreaterThan(0)
    }
  })
})
