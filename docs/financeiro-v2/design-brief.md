# Design Brief — Financeiro v2: Tesouraria da carteira

> Artefato de `impeccable shape`. Guia o `craft`. Confirmado com o dono em 2026-06-06:
> direção (Tesouraria em camadas), escopo (completo), drawer (painel lateral largo).

## 1. Feature Summary

`/financeiro` deixa de ser uma lista plana de parcelas e passa a ser o **console da carteira
de recebíveis** da incorporadora: o topo da hierarquia do domínio
(**Carteira → Empreendimento → Contrato → Parcela → Pagamento/Ledger**). O Diretor lê a saúde
do caixa em segundos; o Financeiro trabalha a inadimplência, os boletos e as baixas. Não
duplica `/contratos/:id` (mergulho de um contrato) — é a visão **transversal** de toda a base.

## 2. Primary User Action

Duas, por perfil, na mesma tela:
- **Diretor (ler):** "quanto vou receber, quando, e o que está furando o caixa" em um olhar.
- **Financeiro (agir):** localizar a parcela/empreendimento em risco e agir (emitir boleto,
  dar baixa, abrir o PDF do boleto).

## 3. Design Direction

- **Sistema:** `DESIGN.md` ("Sala de Controle"). Sem desvio.
- **Color strategy:** Restrained — grafite + marfim, lima só na ação. As **cores de status do
  funil/financeiro** carregam o significado (coral = atraso/gargalo, âmbar = a vencer/atenção,
  esmeralda = recebido, azul = em curso). Aging usa essa paleta semântica, nunca o lima.
- **Theme:** dark. Cena: Diretor e Financeiro olhando a saúde da carteira numa tela grande,
  por horas, num escritório — o grafite quente reduz fadiga e faz o atraso saltar.
- **Anchors:** o próprio deal console de `/vendas/:id` (precedente interno de console
  adaptativo), Stripe Dashboard (recebíveis/payments), Linear (densidade product sem fadiga).
- **Anti-reference (PRODUCT.md):** dashboard SaaS genérico (azul-tech, cards idênticos,
  métrica-herói com gradiente). A v2 é um instrumento, não um template.

## 4. Scope

Fidelidade production-ready. Superfície inteira (`/financeiro` + painel de detalhe da parcela).
Implementação **faseada** (ver §11): Fase 1 roda só com a API atual; Fases 2-4 entram conforme
os endpoints de backend (ver `backend-issues.md`) saem. Enquanto um endpoint não existe, o bloco
correspondente fica **oculto** (feature flag) — nunca placeholder "em breve" nem dado falso.

## 5. Layout Strategy

**Pulso persistente + duas visões** (precedente: `ProjectVitalsStrip` acima das abas no
empreendimento).

```
┌ Header: "Financeiro" + (período global / exportar — futuro) ──────────────┐
├ PULSO (KPI strip persistente): Recebido · A receber · Em atraso · Correção ┤
├ [ Resumo ] [ Parcelas ] ─ abas ──────────────────────────────────────────┤
│                                                                            │
│  RESUMO:                              PARCELAS:                             │
│   • Inadimplência por idade (aging)    • Filtros (empreendimento, forma,    │
│   • Fluxo de caixa (timeline mensal)     recebido em, status, tipo, venc.)  │
│   • Carteira por empreendimento        • Tabela (realce de atraso) + ações  │
│                                          de linha + paginação               │
└────────────────────────────────────────────────────────────────────────────┘
```

- **Pulso** acima das abas, sempre visível: o caixa nunca sai de vista.
- **Resumo** = ler (Diretor). **Parcelas** = agir/garimpar (Financeiro). Os blocos do Resumo
  são **clicáveis** e cruzam para a aba Parcelas com o filtro aplicado (faixa de aging →
  parcelas daquela faixa; empreendimento → parcelas daquele projeto).
- Hairlines e tom separam; cards só onde agrupam de verdade (KPI strip, painéis de gráfico).

## 6. Key States

Por bloco — default, loading (skeleton que espelha a casca), empty, error:

| Bloco | Empty honesto |
|---|---|
| Pulso | carteira zerada → valores R$ 0,00 com sub "sem parcelas no período" |
| Aging | sem atraso → estado positivo "carteira em dia", não faixa vazia |
| Cash-flow | sem histórico → esconde o gráfico, mostra nota curta |
| Por empreendimento | nenhum projeto com contrato → oculto |
| Parcelas | filtro sem resultado → mensagem + limpar; base vazia → onboarding curto |
| Painel parcela | erro 404 → estado de erro com voltar; loading → skeleton |

Backend pendente (Fases 2-4): bloco **oculto via flag**, não placeholder.

## 7. Interaction Model

- **Cross-filter:** clicar numa faixa de aging, num mês do cash-flow ou num empreendimento
  troca para a aba Parcelas já filtrada (estado na URL via nuqs, deep-linkável).
- **Ações de linha** (Parcelas): emitir boleto, registrar pagamento, **abrir PDF do boleto**
  (`boleto.boleto_url`), ver detalhe. Confirmação à prova de engano nas de peso (baixa).
- **Painel de detalhe (parcela):** abre da linha; deep-link `?parcela=` já existe. Painel
  lateral **largo** (~`max-w-xl`/`2xl`), contextualizado: parcela + mini-resumo do contrato
  (saldo, % pago, link "ver contrato" → `/contratos/:id`) + navegação entre as parcelas do
  mesmo contrato + pagamentos + movimentações (ledger) com respiro. Mantém o "ainda estou
  dentro do financeiro" (não vira página cheia).
- **Motion:** 150-250ms, ease-out; transições de estado, nunca decoração.

## 8. Content Requirements

PT-BR. `tabular-nums` em todo valor; `formatCurrency`; mono em códigos (#contrato, unidade).
Rótulos de KPI em label-console (maiúsculas, tracking). Faixas de aging: "A vencer", "1-30
dias", "31-60", "61-90", "90+ dias". Cash-flow: "Recebido", "A receber", "Correção". Copy
sem em dash; cada palavra ganha o lugar.

## 9. Recommended References

`product.md` (register), `DESIGN.md`, `polish.md` (ao fechar cada fase). Para os gráficos:
checar se há lib de chart no projeto antes de introduzir uma (verificar `package.json`).

## 10. Open Questions (com default assumido)

- **Lib de gráfico para o cash-flow:** verificar `recharts`/similar no projeto; se ausente,
  decidir entre adicionar uma leve ou desenhar barras/SVG próprias. *Default:* reusar o que
  existir; se nada, SVG/CSS próprio para a timeline (evita dependência pesada).
- **Abas vs console único:** *Default:* abas (Resumo/Parcelas) com Pulso persistente.
- **Período global no header:** *Default:* fora da Fase 1; o filtro de vencimento já cobre.

## 11. Faseamento da implementação (craft)

| Fase | Conteúdo | Depende de |
|---|---|---|
| **1** | Pulso evoluído (+ correção acumulada) · Parcelas evoluídas (filtros empreendimento/forma/recebido-em + ações de linha + PDF boleto) · **painel de detalhe largo** repensado · esqueleto das abas Resumo/Parcelas | **só API atual** |
| **2** | Bloco **Aging** (Resumo) + cross-filter | issue #1 (estende summary) |
| **3** | Bloco **Cash-flow** (Resumo) | issue #2 |
| **4** | Bloco **Carteira por empreendimento** (Resumo) + KPI ledger no Pulso | issues #3, #4 |

A Fase 1 entrega valor sozinha e não bloqueia no backend. Cada fase fecha com `polish`.
