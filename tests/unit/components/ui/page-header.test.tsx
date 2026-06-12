import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'

describe('PageHeader', () => {
  it('renderiza o título como h1', () => {
    render(<PageHeader title="Corretores" />)
    const h1 = screen.getByRole('heading', { level: 1, name: 'Corretores' })
    expect(h1).toBeInTheDocument()
  })

  it('usa o token display (text-3xl semibold) por padrão', () => {
    render(<PageHeader title="Corretores" />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1.className).toContain('text-3xl')
    expect(h1.className).toContain('font-semibold')
  })

  it('renderiza a descrição quando fornecida', () => {
    render(<PageHeader title="Corretores" description="Gerencie os corretores parceiros." />)
    expect(screen.getByText('Gerencie os corretores parceiros.')).toBeInTheDocument()
  })

  it('não renderiza descrição quando ausente', () => {
    const { container } = render(<PageHeader title="Corretores" />)
    expect(container.querySelector('p')).toBeNull()
  })

  it('renderiza back-button como link "Voltar" quando há backHref', () => {
    render(<PageHeader title="Novo Cliente" backHref="/clientes" />)
    const link = screen.getByRole('link', { name: 'Voltar' })
    expect(link).toHaveAttribute('href', '/clientes')
  })

  it('não renderiza back-button sem backHref', () => {
    render(<PageHeader title="Corretores" />)
    expect(screen.queryByRole('link', { name: 'Voltar' })).toBeNull()
  })

  it('renderiza o slot de ação', () => {
    render(<PageHeader title="Corretores" action={<Button>Novo Corretor</Button>} />)
    expect(screen.getByRole('button', { name: 'Novo Corretor' })).toBeInTheDocument()
  })

  it('não renderiza ação quando ausente', () => {
    render(<PageHeader title="Corretores" />)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('encaminha className extra para o container raiz', () => {
    const { container } = render(<PageHeader title="Corretores" className="mb-6" />)
    expect(container.firstChild).toHaveClass('mb-6')
  })
})
