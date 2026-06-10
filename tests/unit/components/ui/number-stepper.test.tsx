import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { NumberStepper } from '@/components/ui/number-stepper'
import { TooltipProvider } from '@/components/ui/tooltip'

function renderStepper(props: Partial<React.ComponentProps<typeof NumberStepper>>) {
  const onChange = props.onChange ?? vi.fn()
  render(
    <TooltipProvider>
      <NumberStepper
        value={1}
        onChange={onChange}
        bigStep={12}
        stepLabel="mês"
        bigStepLabel="ano"
        {...props}
      />
    </TooltipProvider>,
  )
  return { onChange }
}

const click = (name: string) => userEvent.click(screen.getByRole('button', { name }))

describe('NumberStepper — salto de ano (snap)', () => {
  it('de 1, "adicionar 1 ano" encaixa no múltiplo (→ 12, não 13)', async () => {
    const { onChange } = renderStepper({ value: 1 })
    await click('Adicionar 1 ano')
    expect(onChange).toHaveBeenCalledWith(12)
  })

  it('de 12, "adicionar 1 ano" vai para o próximo ano cheio (→ 24)', async () => {
    const { onChange } = renderStepper({ value: 12 })
    await click('Adicionar 1 ano')
    expect(onChange).toHaveBeenCalledWith(24)
  })

  it('de 5 (parcial), "adicionar 1 ano" encaixa no múltiplo superior (→ 12)', async () => {
    const { onChange } = renderStepper({ value: 5 })
    await click('Adicionar 1 ano')
    expect(onChange).toHaveBeenCalledWith(12)
  })

  it('de 13, "diminuir 1 ano" encaixa no múltiplo inferior (→ 12)', async () => {
    const { onChange } = renderStepper({ value: 13 })
    await click('Diminuir 1 ano')
    expect(onChange).toHaveBeenCalledWith(12)
  })

  it('de 12, "diminuir 1 ano" respeita o mínimo (snapDown 0 → clamp 1)', async () => {
    const { onChange } = renderStepper({ value: 12, min: 1 })
    await click('Diminuir 1 ano')
    expect(onChange).toHaveBeenCalledWith(1)
  })
})

describe('NumberStepper — passo simples e visibilidade do salto', () => {
  it('"adicionar 1 mês" soma exatamente o step', async () => {
    const { onChange } = renderStepper({ value: 3 })
    await click('Adicionar 1 mês')
    expect(onChange).toHaveBeenCalledWith(4)
  })

  it('sem bigStep, as setas de salto de ano não são renderizadas', () => {
    renderStepper({ value: 3, bigStep: undefined })
    expect(screen.queryByRole('button', { name: 'Adicionar 1 ano' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Diminuir 1 ano' })).toBeNull()
  })

  it('respeita o máximo: incremento além de max é travado', async () => {
    const { onChange } = renderStepper({ value: 11, max: 12, bigStep: 12 })
    await click('Adicionar 1 ano') // snapUp(12) = 12, dentro do max
    expect(onChange).toHaveBeenCalledWith(12)
  })
})
