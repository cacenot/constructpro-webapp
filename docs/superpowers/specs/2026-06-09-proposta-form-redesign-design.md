# Redesign do formulário de proposta (criar/editar venda)

**Data:** 2026-06-09
**Telas:** `/vendas/novo` e `/vendas/@id/editar`
**Mockups de referência:** `.superpowers/brainstorm/3896234-1781015466/content/` (`heatmap-interactive`, `payment-step`, `map-smart-add`, `map-clean-warning`)

---

## Contexto

O formulário de proposta é um acordeão de 3 etapas (`ProposalWorkbench`):
**1) Unidade e cliente** → **2) Plano de pagamento** → **3) Mediação**, com um painel
de vitais (`ProposalVitals`) sticky na coluna direita (≈340px). O coração da etapa 2 é o
`InstallmentLedger` (grupos: Entradas, Parcelas mensais, Balões/reforços, Entrega das chaves).

Criação e edição compartilham `ProposalWorkbench` + `InstallmentLedger` + `ProposalVitals`.
A edição (`sale-edit-workbench.tsx`) já **deriva `recurrence_day`/`recurrence_month` de
`start_date`** ao montar o form — ou seja, a unificação de datas proposta aqui é consistente
com o modelo de dados do backend (a data de início é a fonte da verdade).

Stack: React 19 + RHF + Zod + shadcn/ui + Tailwind. Valores monetários em **centavos** no
estado do form (`CurrencyInput`), `tabular-nums` na exibição. Limites do tenant
(`max_installments_per_month`, teto de comissão) vêm de `useProposalData` (app state via
`useTenantConfig`).

---

## Objetivo

Tornar a etapa de pagamento mais inteligente e legível: fechar a conta do plano de forma
determinística, simplificar a entrada de datas, encadear parcelas automaticamente e dar uma
leitura visual de como as parcelas se distribuem ao longo dos anos — mantendo a linguagem
"Sala de Controle" (dark-first, lima reservado à ação, hairlines, `tabular-nums`).

---

## Decisões (do brainstorm)

| # | Decisão | Escolha |
|---|---------|---------|
| 1 | Layout da etapa 1 | 3 linhas (1 input por linha), ordem **Cliente → Empreendimento → Unidade** |
| 2 | Índice de correção | Switch "mesmo índice" + select **na mesma linha** dentro do card |
| 3 | Balanceamento | **Modelo C** — indicador de **Saldo a distribuir** + distribuição manual/determinística sob demanda. Novo input **"Valor da proposta"** (default = preço de tabela) como alvo |
| 4 | Datas das recorrentes | **Unificar todas** (mensais e anuais/balões): só campo **"Início"**; `recurrence_day`/`recurrence_month` derivados da data de início |
| 5 | Encadeamento | Novo grupo mensal: início **auto-preenchido e travado** após o fim do grupo anterior; mensais **não se sobrepõem** (com "destravar" explícito como escape). Balões podem sobrepor, respeitando o teto |
| 6 | Adição inteligente | Ao adicionar balão/reforço, **quantidade derivada do período das mensais** + **auto-distribuição do saldo** nessas parcelas |
| 7 | Visualização | **Mapa mensal** (grade ano × mês) na coluna Resumo, com **popover por mês**, **animação** ao adicionar e **cor própria para entrega de chaves**. Sem indicador de teto por célula |
| 8 | Aviso de teto | Substituído por **um aviso fixo** que só aparece quando algum mês **excede** o teto |
| 9 | Divider | **Remover** o divider acima dos botões de avançar etapa |

---

## Design detalhado

### 1. Etapa "Unidade e cliente" — `proposal-parties.tsx` (`ProposalPartiesCreate`)

- Layout de **3 linhas empilhadas**, um input por linha, largura total.
- Ordem: **Cliente** (1º) → **Empreendimento** → **Unidade**.
- A dependência Empreendimento → Unidade permanece (Unidade desabilitada até escolher o
  empreendimento). Cliente é independente, por isso vem primeiro.
- Sem mudança nos autocompletes em si. A variante readonly (edição) permanece como está.

### 2. Card de índice — `proposal-workbench.tsx`

- O `Switch` "Mesmo índice para toda a proposta" e o `Select` de índice ficam **na mesma
  linha** (switch à esquerda, select à direita), dentro do mesmo card.
- Quando o toggle está OFF, manter o texto explicativo ("cada grupo terá seu próprio índice").

### 3. "Valor da proposta" + Saldo (modelo C)

**Novo campo "Valor da proposta"** no topo da etapa 2:
- Default = preço de tabela da unidade (`unitPriceCents`). Editável (negociação).
- Estado **client-side apenas** (não vai no payload) — alvo do balanceamento.
- Ao lado, chip de **ágio/desconto vs preço de tabela** (`valorProposta − unitPriceCents`),
  informativo (verde = ágio/no preço; âmbar = desconto). Substitui o papel do diff atual.

**Saldo (na coluna Resumo):** card "Saldo da proposta" com:
- `Valor da proposta`, `Soma do plano`, e a linha de destaque:
  - `saldo = valorProposta − somaDoPlano`.
  - `> 0` → **"Falta distribuir R$ X"** (âmbar); `< 0` → **"Sobra R$ X"** (âmbar);
    `= 0` → **"Saldo R$ 0"** (esmeralda).
- Controle **"Distribuir"**: `Select` de grupo/linha alvo + botão.
  - Distribui o saldo atual no grupo escolhido de forma **determinística**:
    cada parcela do grupo recebe `+= saldo / qtd` (a última absorve o arredondamento de
    centavos), de modo que `somaDoPlano` passe a igualar `valorProposta`.

**Gate de avançar:** o `AlertDialog` atual (total vs preço de tabela) passa a confrontar o
**saldo**: ao "Continuar" da etapa de pagamento com `saldo ≠ 0`, confirmar
("O plano não soma o valor da proposta — falta/sobra R$ X. Prosseguir?"). O ágio/desconto vs
tabela deixa de ser bloqueio (vira chip passivo).

### 4. Datas unificadas — `installment-ledger.tsx` + `installment-utils.ts`

- Remover os inputs **"Dia"** e **"Mês"** das linhas recorrentes (mensais e balões).
- Manter apenas **"Início"** (`DatePicker`) + **Qtd** + **Valor** + **Forma**.
- No **submit**, derivar antes de enviar (espelha o read do edit-workbench):
  - `recurrence_day = startDate.getDate()`
  - `recurrence_month = recurrence_type === 'yearly' ? startDate.getMonth()+1 : undefined`
- O select de periodicidade do balão (chip-select) permanece.
- A entrada (`entry`) e a entrega das chaves (`key_delivery`) continuam usando
  `specific_date` (parcela única), sem mudança.

### 5. Indicador início→fim + encadeamento

- Cada grupo recorrente exibe um indicador derivado **"Início → Fim · N parcelas"**
  (ex.: `01/02/2026 → 01/01/2029 · 36 mensais`). Fim calculado por `computeContractEndDate`
  (já existe) adaptado por grupo.
- **Encadeamento (mensais):** ao adicionar um 2º+ grupo mensal, o `start_date` vem
  **auto-preenchido e travado (read-only)** no mês seguinte ao fim do grupo mensal anterior.
  Mensais **não se sobrepõem** (regra rígida). Um botão **"destravar"** explícito libera a
  edição como escape.
  - Recalcular o início travado quando a quantidade/início de um grupo anterior muda.
- **Balões:** podem sobrepor; respeitam o teto do tenant (ver item 8).

### 6. Adição inteligente de balão/reforço — `installment-ledger.tsx` + `installment-utils.ts`

Ao escolher "Balão anual" / "Reforço semestral" (ou outra periodicidade) no menu Adicionar:
- **Quantidade derivada** do período coberto pelas mensais:
  `qtd = floor((fimMensaisIdx − inicioMensaisIdx) / periodoEmMeses)`, com as ocorrências em
  `inicioMensais + k·periodo`, `k = 1..qtd`. O `start_date` (Início) = primeira ocorrência
  (aniversário do início das mensais), editável depois.
  - Ex.: mensais 01/01/2026 → 01/12/2030 (59 meses) + anual (12) ⇒ `floor(59/12) = 4` ⇒ 4×.
  - Sem mensais lançadas, cair no default atual (1×, início computado).
- **Auto-distribuição do saldo:** valor por parcela = `max(0, saldoAtual) / qtd` (mesma regra
  determinística do botão "Distribuir"; última absorve arredondamento). Se não há saldo
  (`≤ 0`), valor inicia em 0 ("a definir"). Resultado: adicionar reforço "fecha a conta".

### 7. Mapa mensal — novo `installment-calendar.tsx` (na coluna Resumo)

- Grade **ano × mês** (linhas = só anos com parcelas; 12 colunas J…D). Célula colorida pelo
  tipo dominante: **Entrada** (sky), **Mensal** (lima), **Balão** (âmbar),
  **Entrega de chaves** (violeta — cor própria). Mês vazio = superfície apagada.
- **Popover por mês** (hover no desktop / toque no mobile / foco por teclado): título
  Mês/Ano, lista de parcelas (tipo + valor), **total do mês** e contagem
  ("N parcelas no mês"). Mês vazio → "Nenhuma parcela".
- **Animação** ao adicionar parcela/entrada/balão: as células afetadas entram com um *pop*
  (escala + fade, escalonado). Vocabulário de motion alinhado ao `REVEAL`; respeita
  `prefers-reduced-motion` (guard global em `globals.css`).
- **Sem** anel/indicador de teto por célula (decisão #8).
- Fonte de dados: derivar de `computeInstallmentsPerMonth` (já existe), estendida para
  carregar o detalhamento por tipo/valor de cada mês (hoje só conta).

### 8. Aviso fixo de teto

- Remover o destaque por célula. Manter **um aviso fixo** (faixa âmbar, padrão do alert atual)
  que só aparece quando **algum mês excede** `max_installments_per_month` (`> teto`, não `=`).
- Lista os meses afetados e a contagem; orienta ajustar datas/quantidades.
- **Local:** no rodapé do grupo de parcelas (etapa de pagamento), onde a ação corretiva
  acontece — reaproveitando o `perMonthViolations` já calculado em `proposal-vitals.ts`.
  (O popover do mapa também sinaliza meses acima do teto, sob demanda.)

### 9. Remover divider

- Em `StepFooter` (`proposal-workbench.tsx`), remover `border-t border-border pt-5`;
  manter o espaçamento (`mt-6`) sem a linha.

---

## Modelo de dados / contrato

- **Sem mudança de backend.** A API já dirige o cronograma por `start_date` +
  `recurrence_type` (a edição re-deriva dia/mês de `start_date`). O create passa a derivar
  `recurrence_day`/`recurrence_month` de `start_date` no submit.
- **"Valor da proposta"** é estado **client-side** (não entra no payload). Default:
  - Criação: `unitPriceCents` (atualiza ao trocar de unidade, se o usuário não o editou).
  - Edição: soma atual do plano (abre **balanceado**, `saldo = 0`).
- **Schema (`sale.schema.ts`):** `recurrence_day`/`recurrence_month` continuam exigidos pelo
  `superRefine`; serão preenchidos por derivação antes da validação/submit, então o contrato
  do schema não muda. "Valor da proposta" fica **fora** do schema (UI-only).

---

## Componentes afetados (File List)

| Arquivo | Mudança |
|---------|---------|
| `proposal-parties.tsx` | `ProposalPartiesCreate`: 3 linhas, ordem Cliente→Empreendimento→Unidade |
| `proposal-workbench.tsx` | Card índice na mesma linha; campo "Valor da proposta" + ágio chip; gate por saldo; remover divider do `StepFooter`; propagar `valorProposta` p/ vitais e ledger |
| `installment-ledger.tsx` | Linhas só com "Início"; indicador início→fim; encadeamento travado; menu Adicionar com qtd derivada + auto-distribuição |
| `installment-utils.ts` | `deriveRecurrenceFromStart`, `computeBalloonQuantity(span, period)`, `distributeSaldo`, `computeChainedStart` (próximo início sem sobreposição); estender detalhamento por mês |
| `proposal-vitals.ts` | Adicionar `valorProposta`, `saldo`, `agio`; expor mapa mensal detalhado por tipo/valor |
| `proposal-vitals.tsx` | Card "Saldo" + controle "Distribuir"; embutir `InstallmentCalendar` |
| `installment-calendar.tsx` | **Novo** — mapa mensal (heatmap) + popover + animação + cor de chaves |
| `sale-edit-workbench.tsx` | Default de "Valor da proposta" = soma do plano; reuso do restante |
| `pages/vendas/novo/+Page.tsx` | Submit: derivar `recurrence_day`/`month` de `start_date`; estado de `valorProposta` |
| `pages/vendas/@id/editar/+Page.tsx` | Idem no submit de edição |

---

## Estados da UI

- **Loading:** índices (`indexTypesLoading`) — select "Carregando…". Mapa só renderiza com
  parcelas.
- **Empty:** sem parcelas → estado vazio atual do ledger; mapa não aparece (ou placeholder
  discreto).
- **Error:** mensagens de validação inline (RHF/Zod) inalteradas; saldo ≠ 0 confirma no gate.
- **Success:** saldo = 0 (esmeralda); toast de criação/edição inalterado.

## Acessibilidade

- Células do mapa como `button` com `aria-label` (mês + resumo); popover acessível por
  teclado (foco) além de hover/toque.
- Cor nunca é o único sinal — o popover dá o detalhe textual; teto vira aviso textual.
- `tabular-nums` em todos os valores; animação respeita `prefers-reduced-motion`.

---

## Fora de escopo / non-goals

- Sem mudanças em mediação/comissão, asset proposal, ou linhas de entrada/entrega das chaves
  (além da cor da chave no mapa).
- Sem mudanças de backend/contrato da API.
- Sem refactor do acordeão de etapas em si.

## A confirmar na revisão

1. **Fórmula da quantidade** do balão derivado: `floor((fim − início)/período)`, ancorado no
   aniversário do início das mensais (editável depois). OK?
2. **Local do aviso de teto:** rodapé do grupo de parcelas (e não na coluna Resumo). OK?
3. **Default de "Valor da proposta" na edição:** soma atual do plano (abre balanceado). OK?
4. **Distribuir/arredondamento:** última parcela do grupo absorve os centavos. OK?
