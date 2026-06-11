import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TestWrapper } from '../../../helpers/wrapper'

import { MembersTable } from '@/components/configuracoes/members/members-table'
import type { UserResponse } from '@/hooks/use-members-table'

const makeMember = (overrides: Partial<UserResponse> = {}): UserResponse => ({
  id: 'user-1',
  email: 'ana.souza@costara.app',
  full_name: 'Ana Souza',
  cpf: '12345678909',
  phone_number: '5547999998888',
  photo_url: null,
  display_name: null,
  created_at: '2026-01-15T12:00:00Z',
  updated_at: '2026-01-15T12:00:00Z',
  roles: [
    { id: 'role-admin', name: 'admin', display_name: 'Administrador' },
    { id: 'role-financial', name: 'financial', display_name: 'Financeiro' },
  ],
  ...overrides,
})

const defaultProps = {
  data: [] as UserResponse[],
  isLoading: false,
  isError: false,
  onRetry: vi.fn(),
  hasActiveFilters: false,
  onClearFilters: vi.fn(),
  sort: { sort: 'created_at:desc', setSort: vi.fn() },
  onEditRoles: vi.fn(),
  onRemove: vi.fn(),
}

function renderTable(props: Partial<typeof defaultProps> = {}) {
  return render(
    <TestWrapper>
      <MembersTable {...defaultProps} {...props} />
    </TestWrapper>
  )
}

describe('MembersTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('estado de carregamento', () => {
    it('exibe linhas skeleton quando isLoading=true', () => {
      const { container } = renderTable({ isLoading: true })
      const skeletons = container.querySelectorAll('[data-slot="skeleton"]')
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })

  describe('estado vazio', () => {
    it('exibe ícone Users e "Nenhum membro encontrado."', () => {
      renderTable({ data: [] })
      expect(screen.getByText('Nenhum membro encontrado.')).toBeDefined()
    })
  })

  describe('linguagem de rows (§2.7)', () => {
    it('âncora: avatar (iniciais), nome e e-mail como subtítulo', () => {
      renderTable({ data: [makeMember()] })
      // Avatar fallback com iniciais quando não há foto
      expect(screen.getByText('AS')).toBeDefined()
      expect(screen.getByText('Ana Souza')).toBeDefined()
      expect(screen.getByText('ana.souza@costara.app')).toBeDefined()
    })

    it('exibe CPF e telefone formatados', () => {
      renderTable({ data: [makeMember()] })
      expect(screen.getByText('123.456.789-09')).toBeDefined()
      expect(screen.getByText('(47) 99999-8888')).toBeDefined()
    })

    it('exibe um badge por permissão (label traduzido)', () => {
      renderTable({ data: [makeMember()] })
      expect(screen.getByText('Administrador')).toBeDefined()
      expect(screen.getByText('Financeiro')).toBeDefined()
    })

    it('exibe "Sem permissão" quando não há roles', () => {
      renderTable({ data: [makeMember({ roles: [] })] })
      expect(screen.getByText('Sem permissão')).toBeDefined()
    })

    it('telefone vazio cai no — do MutedCell', () => {
      renderTable({ data: [makeMember({ phone_number: null })] })
      expect(screen.getAllByText('—').length).toBeGreaterThan(0)
    })
  })

  describe('menu de ações', () => {
    it('mostra "Gerenciar Permissões" e "Remover da Organização"', async () => {
      const onEditRoles = vi.fn()
      const onRemove = vi.fn()
      renderTable({ data: [makeMember()], onEditRoles, onRemove })

      await userEvent.click(screen.getByRole('button', { name: 'Ações' }))
      expect(await screen.findByText('Gerenciar Permissões')).toBeDefined()
      expect(screen.getByText('Remover da Organização')).toBeDefined()

      await userEvent.click(screen.getByText('Gerenciar Permissões'))
      expect(onEditRoles).toHaveBeenCalledOnce()
    })
  })
})
