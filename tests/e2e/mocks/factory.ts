/**
 * Factories de dados realistas para testes E2E.
 *
 * Cada factory aceita overrides parciais para customizar o objeto
 * sem precisar definir todos os campos em cada teste.
 */

// ─── Contadores para IDs sequenciais ──────────────────────────────────────────
let seq = 1
const nextId = () => seq++

// ─── WireMoney ──────────────────────────────────────────────────────────────
// Formato Money das respostas da API (`{ cents, decimal, brl }`). Os componentes
// (ex.: deal console) leem `.cents` direto; o mock precisa entregar o objeto, não
// o inteiro flat — senão `sale.amount.cents` quebra a página. Ver wire-money-rate.
export interface Money {
  cents: number
  decimal: string
  brl: string
}

export const money = (cents: number): Money => ({
  cents,
  decimal: (cents / 100).toFixed(2),
  brl: (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
})

// ─── Customer ─────────────────────────────────────────────────────────────────

export interface CustomerFactory {
  id: number
  type: 'individual' | 'company'
  full_name: string
  legal_name: string | null
  cpf_cnpj: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  country: string
  created_at: string
  updated_at: string
}

export function customer(overrides: Partial<CustomerFactory> = {}): CustomerFactory {
  const id = nextId()
  return {
    id,
    type: 'individual',
    full_name: `Cliente Teste ${id}`,
    legal_name: null,
    cpf_cnpj: '52998224725',
    email: `cliente${id}@teste.com`,
    phone: '+5511987654321',
    address: 'Rua das Flores, 100',
    city: 'São Paulo',
    state: 'SP',
    postal_code: '01310100',
    country: 'BR',
    created_at: '2026-01-10T10:00:00Z',
    updated_at: '2026-01-10T10:00:00Z',
    ...overrides,
  }
}

// ─── Project ──────────────────────────────────────────────────────────────────

export interface ProjectFactory {
  id: number
  name: string
  status: 'construction' | 'finished'
  description: string | null
  address: string
  number: string
  district: string
  city: string
  state: string
  postal_code: string
  total_units: number
  available_units: number
  created_at: string
  updated_at: string
}

export function project(overrides: Partial<ProjectFactory> = {}): ProjectFactory {
  const id = nextId()
  return {
    id,
    name: `Residencial Teste ${id}`,
    status: 'construction',
    description: null,
    address: 'Av. Paulista',
    number: '1000',
    district: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    postal_code: '01310100',
    total_units: 10,
    available_units: 8,
    created_at: '2026-01-05T09:00:00Z',
    updated_at: '2026-01-05T09:00:00Z',
    ...overrides,
  }
}

// ─── Unit ─────────────────────────────────────────────────────────────────────

export interface UnitFactory {
  id: number
  name: string
  category: string
  project_id: number
  area: string
  price_cents: number
  price: Money
  price_per_sqm: Money
  status: 'available' | 'reserved' | 'sold'
  bedrooms: number | null
  bathrooms: number | null
  garages: number | null
  floor: number | null
  description: string | null
  created_at: string
  updated_at: string
}

export function unit(overrides: Partial<UnitFactory> = {}): UnitFactory {
  const id = nextId()
  return {
    id,
    name: `Apto ${id < 10 ? '0' : ''}${id}01`,
    category: 'apartment',
    project_id: 1,
    area: '72.50',
    price_cents: 50000000,
    // Contrato WireMoney: a UI lê price.brl/price_per_sqm.brl direto do response.
    price: money(50000000),
    price_per_sqm: money(689655), // 500.000,00 / 72,5 m²
    status: 'available',
    bedrooms: 2,
    bathrooms: 1,
    garages: 1,
    floor: 1,
    description: null,
    created_at: '2026-01-08T08:00:00Z',
    updated_at: '2026-01-08T08:00:00Z',
    ...overrides,
  }
}

// ─── Sale ─────────────────────────────────────────────────────────────────────

export interface SaleFactory {
  id: number
  unit_id: number
  customer_id: number
  user_id: string
  amount: Money
  unit_price: Money
  status: 'proposal' | 'pending_signature' | 'pending_payment' | 'closed' | 'lost'
  index_type_code: string
  created_at: string
  updated_at: string
}

export function sale(overrides: Partial<SaleFactory> = {}): SaleFactory {
  const id = nextId()
  return {
    id,
    unit_id: 1,
    customer_id: 1,
    user_id: 'test-user-uid-001',
    amount: money(50000000),
    unit_price: money(50000000),
    status: 'proposal',
    index_type_code: 'IGPM',
    created_at: '2026-02-01T10:00:00Z',
    updated_at: '2026-02-01T10:00:00Z',
    ...overrides,
  }
}

// ─── Contract ─────────────────────────────────────────────────────────────────

export interface ContractFactory {
  id: number
  sale_id: number
  principal_amount_cents: number
  index_type_code: string
  status: 'pending' | 'active' | 'in_default' | 'settled' | 'canceled' | 'terminated'
  signed_at: string | null
  document_url: string | null
  created_at: string
  updated_at: string
}

export function contract(overrides: Partial<ContractFactory> = {}): ContractFactory {
  const id = nextId()
  return {
    id,
    sale_id: 1,
    principal_amount_cents: 50000000,
    index_type_code: 'IGPM',
    status: 'active',
    signed_at: '2026-03-01T10:00:00Z',
    document_url: null,
    created_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-03-01T10:00:00Z',
    ...overrides,
  }
}

// ─── Installment ──────────────────────────────────────────────────────────────

export interface InstallmentFactory {
  id: number
  contract_id: number
  kind: 'entry' | 'monthly' | 'yearly' | 'extra'
  payment_method: 'boleto' | 'pix' | 'cash' | 'transfer' | 'card'
  due_date: string
  base_amount_cents: number
  current_amount_cents: number
  status: 'scheduled' | 'invoiced' | 'partial' | 'paid' | 'canceled' | 'overdue'
  paid_at: string | null
  paid_amount_cents: number | null
  created_at: string
  updated_at: string
}

export function installment(overrides: Partial<InstallmentFactory> = {}): InstallmentFactory {
  const id = nextId()
  return {
    id,
    contract_id: 1,
    kind: 'monthly',
    payment_method: 'boleto',
    due_date: '2026-06-10',
    base_amount_cents: 500000,
    current_amount_cents: 500000,
    status: 'scheduled',
    paid_at: null,
    paid_amount_cents: null,
    created_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-03-01T10:00:00Z',
    ...overrides,
  }
}

// ─── User (membro) ────────────────────────────────────────────────────────────

export interface UserFactory {
  id: string
  email: string
  full_name: string
  display_name: string
  cpf: string
  is_superuser: boolean
  roles: Array<{ name: string; id: string }>
  created_at: string
}

export function user(overrides: Partial<UserFactory> = {}): UserFactory {
  const id = nextId()
  return {
    id: `user-${id}`,
    email: `membro${id}@constructpro.dev`,
    full_name: `Membro Teste ${id}`,
    display_name: `Membro ${id}`,
    cpf: '52998224725',
    is_superuser: false,
    roles: [{ name: 'viewer', id: `role-${id}` }],
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

// ─── Broker ───────────────────────────────────────────────────────────────────

export interface BrokerFactory {
  id: number
  cpf: string
  full_name: string
  creci: string
  email: string | null
  phone: string | null
  created_at: string
  updated_at: string | null
}

export function broker(overrides: Partial<BrokerFactory> = {}): BrokerFactory {
  const id = nextId()
  return {
    id,
    cpf: '52998224725',
    full_name: `Corretor Teste ${id}`,
    creci: `CRECI-SP ${String(id).padStart(5, '0')}`,
    email: `corretor${id}@teste.com`,
    phone: '+5511987654321',
    created_at: '2026-01-15T10:00:00Z',
    updated_at: null,
    ...overrides,
  }
}

// ─── Paginação genérica ───────────────────────────────────────────────────────

export function paginated<T>(items: T[], total?: number) {
  return {
    items,
    total: total ?? items.length,
    page: 1,
    page_size: 10,
    pages: 1,
  }
}
