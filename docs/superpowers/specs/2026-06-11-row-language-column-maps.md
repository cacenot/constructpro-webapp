# Linguagem de Rows + Mapa de Colunas por Domínio

**Data:** 2026-06-11
**Branch:** `feat/padroniza-header-table`
**Status:** Artefato de design (Fase B) → guia das migrações C1–C8
**Escopo:** este documento define as receitas de célula (`src/components/ui/data-table-cells.tsx`)
e o mapa de colunas que cada migração de domínio deve seguir. É o artefato design-first
que satisfaz o `ux-gate` para a Fase C.

> Antecede e detalha a tabela "Componente 3 — Linguagem de rows" de
> `2026-06-11-padronizacao-header-table-design.md`.

---

## 1. Princípios da linguagem de rows

A linguagem nasce do financeiro (`installments-columns.tsx`), a referência já em produção,
e do DESIGN.md ("A Sala de Controle"): dark-first, marfim sobre grafite, **status em
segundos**, **confiança nos números**, densidade sem fadiga. As receitas preenchem **só o
conteúdo** da célula — padding (`px-2 py-3.5 sm:px-4`), altura, hairline (`border-b`),
alinhamento (`meta.align`) e o header sticky (`h-11`, `text-[0.6875rem] uppercase
tracking-[0.08em]`) já vêm do `DataTable` base.

### As receitas

| Receita | Quando usar | Forma canônica |
|---------|-------------|----------------|
| **`PrimaryCell`** | A coluna-âncora: o identificador humano de cada linha (1 por tabela). | `title` em `text-sm font-medium` (truncate, `min-w-0`) + `subtitle` muted `text-xs text-muted-foreground tabular-nums` (truncate). |
| **`MoneyCell`** | Todo valor monetário. | `formatCurrency(value)` em `text-sm font-medium tabular-nums` + `caption` muted opcional. **A coluna declara `meta.align: 'right'`.** |
| **`DateCell`** | Datas (vencimento, assinatura, cadastro). | `dd/MM/yyyy` em `text-sm tabular-nums` + `caption` opcional; `tone='danger'` deixa a legenda coral/medium (atraso). |
| **`MutedCell`** | Campo secundário que pode faltar (CRECI, e-mail, telefone, localização). | `text-sm text-muted-foreground`, `—` quando vazio. |
| **Badge de status** | Onde a linha tem estado de domínio (unidades, vendas, comissões, contratos). | Reusa o badge do domínio (`UnitStatusBadge`, `SaleStatusBadge`, etc.) — pílula tonal, "semáforo" onde aplicável (The Status Glow Rule). Coluna própria. |
| **Badge de metadado** | Tipo/categoria/permissão/ID curto. | `<Badge variant="secondary"|"outline">`; ID em `font-mono` (The Mono-for-Codes Rule). |
| **`SortableHeader`** | Coluna ordenável no servidor. | `ui/sortable-header.tsx`; passa `field` (campo do backend) + `currentSort` + `onSort` via `meta`. |
| **`RowActionsMenu`** | Coluna `...` de ações (última, sempre). | Trigger ghost `icon-sm` + tooltip "Ações" + `stopPropagation` (não dispara `onRowClick`). `DropdownMenuLabel "Ações"` no topo; itens **sem ícones**; `DropdownMenuSeparator` agrupa; destrutivo em `text-destructive focus:text-destructive`. |

### Regras de prioridade responsiva

A largura é orçamento. Em mobile cabe o mínimo de **triagem**; o resto entra por breakpoint.
Ocultação **sempre** via `meta.className` + `meta.headClassName` iguais (`hidden sm:table-cell`,
`hidden md:table-cell`, `hidden lg:table-cell`), nunca CSS solto na célula.

1. **Sempre visível (base):** a `PrimaryCell` (âncora) + o **status** (onde houver) + o
   **valor** mais decisivo + a coluna de **ações**. É o que permite agir sem rolar lateral.
2. **`sm` (≥640px):** segunda informação de contexto (empreendimento, telefone).
3. **`md` (≥768px):** metadados de classificação (tipo, categoria, localização, e-mail,
   nome fantasia, CPF).
4. **`lg` (≥1024px):** detalhe fino (taxas, datas de cadastro, valor principal secundário).

Informação que sai da viewport em mobile **não some do produto**: está a um toque no
detalhe (row click) ou no menu de ações. Princípio do financeiro — nunca esconder o que
decide a triagem (cliente, valor, status), só o que refina.

### Decisão de âncora (`PrimaryCell`)

A coluna-âncora é o **identificador humano** da linha, não o id técnico. Pessoa → nome;
empresa → razão social; unidade → nome da unidade; venda/contrato → cliente (quem deve);
comissão → corretor (quem recebe). O `subtitle` é o **segundo dado mais identificador**
e desambiguador: documento (CPF/CNPJ), categoria, empreendimento, ou e-mail. IDs técnicos,
quando preservados, viram **badge mono** numa coluna própria — nunca a âncora.

---

## 2. Mapas de coluna por domínio

Legenda das colunas: **id** (ColumnDef.id) · **header** · **receita** · **subtitle/caption** ·
**responsivo** · **sort** (campo backend) · **align**.

---

### 2.1 Clientes — `customers-columns.tsx`

Âncora: **nome** (`full_name`); subtitle: **documento** (CPF/CNPJ). ID técnico preservado
como badge mono.

| id | header | receita | subtitle/caption | responsivo | sort (field) | align |
|----|--------|---------|------------------|-----------|--------------|-------|
| `id` | ID | Badge mono `secondary` (`formatId`) | — | sempre | sim (`id`) | left |
| `full_name` | Nome | `PrimaryCell` | `formatDocument(cpf_cnpj)` | sempre | sim (`full_name`) | left |
| `type` | Tipo | Badge `outline` (label do tipo) | — | `hidden md:table-cell` | não | left |
| `location` | Localização | `MutedCell` (`{city} - {state}`) | — | `hidden md:table-cell` | não | left |
| `phone` | Telefone | `MutedCell` (`formatPhone`) + ícone WhatsApp em `<Tooltip>` | — | `hidden sm:table-cell` | não | left |
| `actions` | (vazio) | `RowActionsMenu` | — | sempre | — | right |

**Ações:** Ver detalhes · Editar · `---` · Nova venda (navega `/vendas/novo?cliente=`).
**Empty state:** ícone `Users`. Sem filtros: "Nenhum cliente cadastrado" + ação "Cadastrar
cliente". Com filtros: "Nenhum cliente encontrado" + "Limpar filtros".
**Nota:** o ícone WhatsApp do telefone permanece (affordance útil); fica ao lado do número
dentro da mesma célula, não numa coluna própria.

---

### 2.2 Corretores — `broker-columns.tsx` (exemplar da Fase C)

Âncora: **nome** (`full_name`); subtitle: **CPF**. Já usa exatamente a `PrimaryCell` hoje.

| id | header | receita | subtitle/caption | responsivo | sort | align |
|----|--------|---------|------------------|-----------|------|-------|
| `full_name` | Nome | `PrimaryCell` | `formatDocument(cpf)` | sempre | não¹ | left |
| `creci` | CRECI | `MutedCell` | — | sempre | não | left |
| `email` | E-mail | `MutedCell` (truncate) | — | `hidden md:table-cell` | não | left |
| `phone` | Telefone | `MutedCell` (`formatPhone`) | — | `hidden md:table-cell` | não | left |
| `actions` | (vazio) | `RowActionsMenu` | — | sempre | — | right |

**Ações:** Ver detalhes · Editar · `---` · **Excluir** (destrutivo, abre `BrokerDeleteDialog`).
**Empty state:** ícone `UserCog` (ou `Contact`). Sem filtros: "Nenhum corretor cadastrado" +
"Cadastrar corretor". Com filtros: "Nenhum corretor encontrado" + "Limpar filtros".
¹ Não há sort hoje; se o hook expuser `name`/`created_at`, aplicar `SortableHeader` em `full_name`.

---

### 2.3 Imobiliárias — `agency-columns.tsx`

Âncora: **razão social** (`legal_name`); subtitle: **CNPJ**. CRECI-J é dado de
classificação, sempre visível (curto). Nome fantasia desambigua → `md`.

| id | header | receita | subtitle/caption | responsivo | sort | align |
|----|--------|---------|------------------|-----------|------|-------|
| `legal_name` | Razão Social | `PrimaryCell` | `formatDocument(cnpj)` | sempre | não | left |
| `trade_name` | Nome Fantasia | `MutedCell` (truncate) | — | `hidden md:table-cell` | não | left |
| `creci_j` | CRECI-J | `MutedCell` | — | sempre | não | left |
| `email` | E-mail | `MutedCell` (truncate) | — | `hidden md:table-cell` | não | left |
| `actions` | (vazio) | `RowActionsMenu` | — | sempre | — | right |

**Ações:** Ver detalhes · Editar · `---` · **Excluir** (destrutivo, `AgencyDeleteDialog`).
**Empty state:** ícone `Building2`. Sem filtros: "Nenhuma imobiliária cadastrada" +
"Cadastrar imobiliária". Com filtros: "Nenhuma imobiliária encontrada" + "Limpar filtros".

---

### 2.4 Unidades — `units-columns.tsx`

Âncora: **nome da unidade** (`name`); subtitle: **categoria** (`translateUnitCategory`).
ID técnico vira badge/mono. Status com semáforo imobiliário (`UnitStatusBadge`).

| id | header | receita | subtitle/caption | responsivo | sort (field) | align |
|----|--------|---------|------------------|-----------|--------------|-------|
| `id` | ID | Texto mono `text-xs tabular-nums` (`formatId`) | — | sempre | sim (`id`) | left |
| `name` | Nome | `PrimaryCell` | `translateUnitCategory(category)` | sempre | sim (`name`) | left |
| `project` | Empreendimento | `MutedCell` (truncate) | — | `hidden sm:table-cell` | não | left |
| `area` | Área | `MutedCell` (`formatArea`, tabular) | — | `hidden md:table-cell` | sim (`area`) | right |
| `price` | Preço | `MoneyCell` (`price.brl` / cents) | — | sempre | sim (`price_cents`) | right |
| `status` | Status | `UnitStatusBadge` (semáforo) | — | sempre | não | left |
| `actions` | (vazio) | `RowActionsMenu` | — | sempre | — | right |

**Ações:** Ver detalhes (`onRowClick`→drawer) · Editar · `---` · Nova venda
(`/vendas/novo?unidade=`) · `---` · **Excluir** (destrutivo, `UnitDeleteDialog`).
**Empty state:** ícone `Building` (ou `LayoutGrid`). Sem filtros: "Nenhuma unidade
cadastrada" + "Cadastrar unidade". Com filtros: "Nenhuma unidade encontrada" + "Limpar filtros".
**Nota:** `price` hoje usa `price.brl` (string formatada pelo backend). A `MoneyCell` recebe
`number` em reais → passar `price.cents / 100`. `onRowClick` abre o drawer (não navega).
`Área` é numérica → `meta.align: 'right'` mesmo sendo `MutedCell`.

---

### 2.5 Comissões — `commission-columns.tsx`

Âncora: **corretor** (quem recebe); subtitle: **imobiliária** (trade/legal name). Hoje a
tabela tem 8 colunas planas sem âncora forte; ao consolidar, corretor+imobiliária fundem na
âncora e a imobiliária deixa de ter coluna própria em telas estreitas. Sem status de
domínio próprio (comissão é derivada da venda fechada) — sem badge de status.

| id | header | receita | subtitle/caption | responsivo | sort | align |
|----|--------|---------|------------------|-----------|------|-------|
| `broker` | Corretor | `PrimaryCell` | imobiliária (`trade_name ?? legal_name`) | sempre | não | left |
| `sale` | Venda | Link mono `#XXXXXXXX` → `/vendas/:id` | — | `hidden sm:table-cell` | não | left |
| `sale_closed_at` | Data | `DateCell` | — | `hidden md:table-cell` | não | left |
| `sale_amount` | Valor Venda | `MoneyCell` (`sale_amount_at_approval`) | — | `hidden md:table-cell` | não | right |
| `broker_rate` | Taxa Corretor | `MutedCell` (`rate.formatted`, tabular) | — | `hidden lg:table-cell` | não | right |
| `agency_rate` | Taxa Imob. | `MutedCell` (`rate.formatted`, tabular) | — | `hidden lg:table-cell` | não | right |
| `total_amount` | Comissão Total | `MoneyCell` (peso forte) | — | sempre | não | right |

**Ações:** **sem coluna de ações** (a tabela é relatório; o link da venda navega).
**Empty state:** ícone `Percent` (ou `HandCoins`). Sem filtros: "Nenhuma comissão no período"
+ "Ajustar período/filtros". Com filtros: "Nenhuma comissão encontrada" + "Limpar filtros".
**Decisão (consolidação):** a imobiliária vira subtitle do corretor (não some); a coluna
`agency` dedicada é removida. `commission-summary-cards` permanece **acima** da tabela
(shrink-0). **Comissão Total** e **Valor Venda** sempre tabulares e `align:right`.

---

### 2.6 Vendas — `sales-columns.tsx`

Âncora: a venda é da **unidade/empreendimento** (o que está sendo vendido) — mantenho a
escolha atual, que prioriza o imóvel; cliente é o subtitle natural mas o backend separa em
coluna própria (com documento). **Decisão:** âncora = unidade/empreendimento; cliente vira
coluna `md+`. ID vira badge mono. Status com `SaleStatusBadge` (status do funil — brilha).

| id | header | receita | subtitle/caption | responsivo | sort | align |
|----|--------|---------|------------------|-----------|------|-------|
| `id` | ID | Badge mono `secondary` (`formatId`) | — | sempre | não | left |
| `unit` | Unidade / Empreend. | `PrimaryCell` | `unit.project.name` | sempre | não | left |
| `customer` | Cliente | `PrimaryCell` (sub: doc) | `formatDocument(cpf_cnpj)` | `hidden md:table-cell` | não | left |
| `status` | Status | `SaleStatusBadge` (funil) | — | sempre | não | left |
| `created_at` | Vendedor / Data | `PrimaryCell` (sub: distância relativa) | `formatDistanceToNow(created_at)` | `hidden md:table-cell` | não | left |
| `actions` | (vazio) | `RowActionsMenu` | — | sempre | — | right |

**Ações (condicionais ao status — preservar a lógica atual):** Ver detalhes · Editar
(só `proposal`) · `---` · Aprovar proposta (só `proposal`) · `---` · Assinar contrato
(`pending_signature`) · Confirmar sinal (`pending_signature`/`pending_payment`). Os handlers
`onApproveSale`/`onSignContract`/`onPayEntry` e seus dialogs permanecem (estado no
`sales-table`).
**Empty state:** ícone `Handshake` (ou `Receipt`). Sem filtros: "Nenhuma venda registrada" +
"Nova venda". Com filtros: "Nenhuma venda encontrada" + "Limpar filtros".
**Nota de decisão:** "Vendedor / Data" usa `PrimaryCell` (vendedor em título, data como
caption) por já ser nome+meta — reuso direto da receita de identidade. Não há valor monetário
na lista hoje; mantém-se assim (o valor mora no detalhe da venda).

---

### 2.7 Membros — `members-columns.tsx` (`DataTable` base, finito)

Âncora: **nome** com **avatar** (foto do usuário); subtitle: **e-mail**. Vive no
`SettingsLayout`; usa `DataTable` base (sem infinite/fill-height). Mantém o avatar na âncora.

| id | header | receita | subtitle/caption | responsivo | sort (field) | align |
|----|--------|---------|------------------|-----------|--------------|-------|
| `full_name` | Nome | `PrimaryCell` **com avatar** (variante) | `email` | sempre | sim (`full_name`) | left |
| `cpf` | CPF | `MutedCell` (`formatDocument`, tabular) | — | `hidden md:table-cell` | não | left |
| `phone_number` | Telefone | `MutedCell` (`formatPhone`) | — | `hidden lg:table-cell` | não | left |
| `roles` | Permissões | Badges `secondary` (1 por role) ou "Sem permissão" | — | sempre | não | left |
| `created_at` | Cadastro | `DateCell` (`toLocaleDateString`) | — | `hidden lg:table-cell` | sim (`created_at`) | left |
| `actions` | (vazio) | `RowActionsMenu` | — | sempre | — | right |

**Ações:** Gerenciar Permissões (`onEditRoles`) · `---` · **Remover da Organização**
(destrutivo, `onRemove`).
**Empty state:** ícone `Users` (raro — sempre há ao menos o admin). "Nenhum membro
encontrado".
**Decisão de âncora com avatar:** a `PrimaryCell` base não tem avatar. Duas opções para C7:
(a) renderizar inline na coluna `[<Avatar/> <PrimaryCell/>]` num `flex items-center gap-3`
(preserva exatamente o atual, **recomendado**); ou (b) estender `PrimaryCell` com prop
opcional `leading?: ReactNode`. Recomendo (a) para não inflar a receita base; a célula
compõe avatar + `PrimaryCell` lado a lado.

---

### 2.8 Contratos — derivado de `contract-row.tsx` (NÃO há columns file)

Hoje é uma `<div>` row custom (sem TanStack). Derivo as colunas do layout atual. Âncora:
**cliente** (quem deve); subtitle: a linha de venda+empreendimento+unidade já mostrada.
ID vira badge mono. Dois badges (status + inadimplência) convivem numa coluna de status.

| id | header | receita | subtitle/caption | responsivo | sort | align |
|----|--------|---------|------------------|-----------|------|-------|
| `id` | ID | Badge mono `secondary` (`formatId(contract.id)`) | — | sempre | não | left |
| `customer` | Cliente | `PrimaryCell` | `Venda {formatId(sale_id)} · {project} - {unit}` | sempre | não | left |
| `principal` | Valor Principal | `MoneyCell` (`principal_amount`) | — | `hidden lg:table-cell` | não | right |
| `status` | Status | `ContractStatusBadge` **+** `ContractOverdueBadge` (mesma célula, `flex gap-1.5`) | — | sempre | não | left |
| `signed_at` | Assinatura | `DateCell` ou `MutedCell` "Aguardando" (itálico) | — | `hidden xl:table-cell` | não | left |
| `actions` | (vazio) | `RowActionsMenu` | — | sempre | — | right |

**Ações (condicionais — preservar):** Ver detalhes · Editar · `---` · Ver venda relacionada
(`/vendas/:sale_id`) · `---` Registrar assinatura (só `status==='pending'`) · `---` Baixar
documento (só se `document_url`).
**Empty state:** ícone `FileText` (ou `ScrollText`). Sem filtros: "Nenhum contrato" + (sem
ação primária — contrato nasce de venda assinada). Com filtros: "Nenhum contrato encontrado"
+ "Limpar filtros".
**Decisão:** preservar os **dois** badges (status + inadimplência) lado a lado numa coluna
"Status" — a inadimplência é condição derivada (`is_overdue`), não substitui o status. Mantém
o `xl:` para a data de assinatura (era `hidden xl:block`); valor principal sobe a `lg`. A
maior conversão da Fase C: `<div>` → `<table>` via `DataTableInfinite`.

---

## 3. Síntese das decisões (sanity-check)

- **`MoneyCell` recebe `number` em reais.** Domínios que carregam `{ cents }` (comissões,
  contratos) ou `{ brl }` (unidades) convertem na coluna (`cents / 100`). A receita não
  conhece `WireMoney`.
- **Âncoras escolhidas:** clientes→nome, corretores→nome, imobiliárias→razão social,
  unidades→nome, comissões→corretor, vendas→unidade/empreendimento, membros→nome (com
  avatar), contratos→cliente. Subtitles desambiguam (documento/categoria/empreendimento/
  e-mail). Nenhuma coluna foi descartada — IDs viram badge mono, imobiliária da comissão
  vira subtitle.
- **Status preservado** onde existe (unidades, vendas, comissões¹, contratos) reusando o
  badge do domínio. ¹Comissão **não** tem status próprio; não ganha badge.
- **Ações:** todas as tabelas mantêm o menu `...` atual, exceto **comissões** (relatório,
  sem ações). Itens, condicionais e dialogs preservados 1:1.
- **Responsividade:** base = âncora + status + valor decisivo + ações; o resto entra por
  `sm`/`md`/`lg`/`xl` conforme a prioridade de triagem. Nada some do produto (detalhe/ações).
- **Empty states:** cada domínio tem ícone lucide + copy condicional (com/sem filtros) +
  ação primária quando faz sentido (contratos não têm criação direta).

### Decisões em aberto / pontos de atenção para a Fase C

1. **Membros com avatar** (§2.7): compor `Avatar` + `PrimaryCell` na coluna (recomendado),
   não inflar a receita base. Se mais domínios pedirem avatar, então extrair `leading?`.
2. **Vendas — âncora unidade vs cliente** (§2.6): mantive **unidade** (o que se vende) como
   âncora, fiel ao layout atual; cliente é coluna `md+`. Se o produto preferir "quem compra"
   como âncora, é uma troca de uma linha — anotado como decisão reversível.
3. **Sort por domínio:** só clientes (`id`,`full_name`), unidades (`id`,`name`,`area`,
   `price_cents`) e membros (`full_name`,`created_at`) ordenam hoje. Corretores, imobiliárias,
   comissões, vendas e contratos **não** têm sort — não inventar campos; aplicar
   `SortableHeader` só se o hook do domínio já expuser o campo no backend.
4. **Comissões — `agency` como subtitle** (§2.5): consolida 8 colunas planas numa âncora
   corretor+imobiliária. É a maior mudança de layout entre os domínios "fáceis"; validar com
   o time se a imobiliária precisa de coluna própria em desktop (poderia voltar como `lg:`).
