---
name: Costara
description: Console de operações dark-first para gestão imobiliária, grafite quente e accent verde-lima.
colors:
  lime-volt: "oklch(0.84 0.190 128)"
  lime-volt-hover: "oklch(0.87 0.155 128)"
  lime-volt-deep: "oklch(0.54 0.135 128)"
  lime-ink: "oklch(0.20 0.050 128)"
  graphite-canvas: "oklch(0.175 0.006 75)"
  graphite-surface: "oklch(0.215 0.007 75)"
  graphite-elevated: "oklch(0.255 0.008 75)"
  graphite-sunken: "oklch(0.145 0.005 75)"
  graphite-chrome: "oklch(0.150 0.005 75)"
  ivory-text: "oklch(0.95 0.006 80)"
  ash-muted: "oklch(0.72 0.008 78)"
  ash-faint: "oklch(0.56 0.008 78)"
  hairline: "oklch(1 0 0 / 0.10)"
  status-proposta: "oklch(0.85 0.130 70)"
  status-reservado: "oklch(0.74 0.140 240)"
  status-fechado: "oklch(0.80 0.130 160)"
  status-perdido: "oklch(0.68 0.190 22)"
typography:
  display:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.08em"
  value:
    fontFamily: "Inter, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  sm: "5px"
  md: "7px"
  lg: "9px"
  xl: "11px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "20px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.lime-volt}"
    textColor: "{colors.lime-ink}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.lime-volt-hover}"
    textColor: "{colors.lime-ink}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ivory-text}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "36px"
  card:
    backgroundColor: "{colors.graphite-surface}"
    rounded: "{rounded.lg}"
    padding: "20px"
  input:
    backgroundColor: "{colors.graphite-sunken}"
    textColor: "{colors.ivory-text}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "0 12px"
  badge-status:
    textColor: "{colors.status-proposta}"
    rounded: "{rounded.full}"
    padding: "0.3em 0.7em"
  kpi-value:
    textColor: "{colors.ivory-text}"
    typography: "{typography.value}"
---

# Design System: Costara

## 1. Overview

**Creative North Star: "A Sala de Controle"**

Costara é um console de operações, não um site institucional nem uma planilha. Corretores e diretores de incorporadora vivem dentro dele o dia inteiro, monitorando o funil de vendas e o caixa. O sistema parte de uma premissa física: alguém olhando severidade e status numa tela grande por horas. Por isso o tema é dark por padrão, em grafite quente (hue 75, nunca preto azul frio), que reduz fadiga em uso prolongado e dá aos status do funil o máximo de contraste para serem lidos em segundos.

A interface tem uma só voz cromática: o verde-lima `oklch(0.84 0.19 128)`. Ela carrega ação, foco, seleção e nav ativa, e nada mais. Tudo o resto é grafite, marfim quente e as quatro cores de status. A profundidade vem da luz, não da sombra: superfícies mais claras estão mais altas. Cards existem só quando agrupam de verdade; a regra geral é separar por hairline e por tom, não por caixa.

Este sistema rejeita explicitamente o reflexo de categoria do qual veio: o azul-tech genérico de dashboard SaaS, as fileiras de cards retangulares idênticos, o template de métrica-herói (número gigante com gradiente), o ERP corporativo cinza e pesado, e a planilha sem hierarquia. Se a tela pudesse ser confundida com um template Tailwind padrão, falhou.

**Key Characteristics:**
- Dark-first em grafite quente; light é variante diurna coerente, não o foco.
- Uma só voz: verde-lima em ≤10% da tela, sempre ação.
- Status do funil brilham (pílulas com tinte translúcido + halo no dot).
- Números financeiros tabulares; códigos técnicos em monoespaçada.
- Profundidade por tom (The Tonal Lift Rule), hairlines no lugar de cards.

## 2. Colors

Paleta de console: grafite quente carrega 90% da superfície, o lima é a única cor de marca, e o status faz todo o trabalho semântico.

### Primary
- **Lime Volt** (`oklch(0.84 0.19 128)`): a Voz. Botão primário, foco, item de nav ativo, logo, seleção de texto. No light mode escurece para **Lime Volt Deep** (`oklch(0.54 0.135 128)`) para manter contraste AA sobre superfícies claras. Texto sobre lima usa sempre **Lime Ink** (`oklch(0.20 0.05 128)`), nunca branco.

### Neutral
- **Graphite Canvas** (`oklch(0.175 0.006 75)`): fundo da página no dark.
- **Graphite Surface** (`oklch(0.215 0.007 75)`): cards e painéis.
- **Graphite Elevated** (`oklch(0.255 0.008 75)`): popovers, menus, hover de linhas.
- **Graphite Sunken** (`oklch(0.145 0.005 75)`): poços e trilhos (inputs, fundo de barra de progresso).
- **Graphite Chrome** (`oklch(0.150 0.005 75)`): a sidebar, a superfície mais escura, chrome recuado.
- **Ivory Text** (`oklch(0.95 0.006 80)`): texto primário, marfim quente, nunca branco puro.
- **Ash Muted** (`oklch(0.72 0.008 78)`) / **Ash Faint** (`oklch(0.56 0.008 78)`): texto secundário e terciário.
- **Hairline** (`oklch(1 0 0 / 0.10)`): bordas. Branco translúcido, finíssimo.

### Status do funil (a paleta semântica)
- **Proposta** (âmbar `oklch(0.85 0.13 70)`): precisa de ação.
- **Reservado** (azul-céu `oklch(0.74 0.14 240)`): em progresso.
- **Fechado** (esmeralda `oklch(0.80 0.13 160)`): sucesso. Note o hue 160, deliberadamente afastado do lima (128) para nunca competir com a Voz.
- **Perdido** (coral `oklch(0.68 0.19 22)`): alerta. Também serve de destructive.

### Named Rules
**The One Voice Rule.** O lima aparece em no máximo 10% de qualquer tela, e sempre em ação (botão primário, foco, seleção, nav ativa). Nunca como decoração, nunca em texto corrido, nunca como cor de status. Sua raridade é o que o faz funcionar.

**The Status Glow Rule.** Cor de status nunca é fundo chapado. É um tinte translúcido (12–16% de opacidade) com fg saturado e um dot de 6px com halo. Sobre o grafite, ela brilha em vez de manchar.

## 3. Typography

**Body Font:** Inter (com fallback `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`)
**Mono Font:** JetBrains Mono (com fallback `ui-monospace, monospace`)

**Character:** uma só família humanista para tudo (display, corpo, labels, dados), apoiada por uma monoespaçada reservada ao metadado técnico. A sensação é a de um instrumento bem calibrado: neutro, denso, legível por horas.

### Hierarchy
- **Display** (600, 1.875rem/30px, tracking -0.02em): saudação do header, títulos de página.
- **Title** (600, 0.875rem/14px): cabeçalho de painel ("Vendas recentes").
- **Body** (400, 0.875rem/14px, line-height 1.5): conteúdo. Prosa limitada a 65–75ch; tabelas podem correr mais densas.
- **Value** (600, 1.5rem/24px, tabular): KPIs e valores monetários de destaque.
- **Label** (500, 0.6875rem/11px, tracking 0.08em, MAIÚSCULAS): etiquetas de console (rótulos de KPI, grupos da sidebar).
- **Mono** (500, 0.75rem/12px): códigos de contrato, IDs de unidade, frações (`31/48`). Reforça o vibe console.

### Named Rules
**The Tabular Truth Rule.** Todo valor monetário e toda coluna numérica usa `font-variant-numeric: tabular-nums`. Números que dançam de largura entre linhas são proibidos: minam a confiança no caixa.

**The Mono-for-Codes Rule.** Códigos técnicos (contratos, unidades) vão sempre em JetBrains Mono. Nomes de pessoas e empreendimentos vão sempre em Inter. Não troque os papéis.

## 4. Elevation

Sistema dark, então sombra preta quase desaparece. A profundidade vem primeiro do tom: cada degrau de superfície (sunken → canvas → surface → elevated) sobe a lightness em ~0.04. Sombras existem, mas como reforço sutil, não como o mecanismo principal. Hairlines de 1px (`oklch(1 0 0 / 0.06–0.18)`) desenham as separações.

### Shadow Vocabulary (dark)
- **sm** (`0 1px 2px oklch(0 0 0 / 0.40)`): cards e painéis em repouso.
- **md** (`0 2px 8px oklch(0 0 0 / 0.45)`): dropdowns, popovers.
- **lg** (`0 10px 30px oklch(0 0 0 / 0.50)`): dialogs, sheets.

### Named Rules
**The Tonal Lift Rule.** Mais claro é mais alto. Para elevar um elemento, suba o tom antes de pensar em sombra. Um hover de linha vira `graphite-elevated`, não um drop-shadow.

**The Flat-Until-Focus Rule.** O brilho (glow) é reservado para estado, não decoração. O único halo lima permitido aparece no foco de elementos de ação (ring) e no dot de status. Glassmorphism decorativo é proibido.

## 5. Components

### Buttons
- **Shape:** cantos discretos (7px, `rounded-md`). Console é preciso, não bubbly.
- **Primary:** fundo Lime Volt, texto Lime Ink, altura 36px, padding `0 14px`. Hover clareia o lima; active escurece. É o único elemento de marca cheia na tela.
- **Outline / Ghost:** fundo transparente, borda hairline, texto marfim. Usado para ações secundárias (Exportar, filtros). Hover ganha um tinte lima de 10%.
- **Focus:** ring lima de 2px com offset sobre a superfície. Nunca remova o ring.

### Status Pills
- **Style:** pílula (`rounded-full`), tinte translúcido da cor de status (12–16%), borda da mesma cor a 30%, texto saturado, dot de 6px com halo à esquerda.
- **Variants:** proposta (âmbar), reservado (azul), fechado (esmeralda), perdido (coral).

### Cards / Painéis
- **Corner Style:** 9px (`rounded-lg`).
- **Background:** Graphite Surface sobre o canvas; borda hairline.
- **Shadow Strategy:** `shadow-sm` em repouso (ver Elevation).
- **Internal Padding:** 20px (`lg`).
- **Regra:** card só quando agrupa de verdade. Cards aninhados são sempre erro.

### KPI Strip (componente de assinatura)
Substitui a grade de métric-cards. Uma única superfície (`bg-border`) com células `bg-card` separadas por `gap-px`, formando hairlines perfeitas em qualquer wrap. Cada célula: label em MAIÚSCULAS, valor tabular grande, delta com seta (verde sobe, coral desce). É um painel de instrumentos, não quatro cartões.

### Inputs / Fields
- **Style:** fundo Graphite Sunken (recuado), borda hairline, 7px de raio, altura 36px.
- **Focus:** borda vira lima + ring lima. Placeholder em Ash Faint.

### Navigation (sidebar)
- **Style:** Graphite Chrome (a superfície mais escura), recuada do conteúdo.
- **States:** item em repouso em Ash Muted; hover ganha tom `graphite-surface`; ativo ganha fundo tonal + texto e ícone em Lime Volt. Sem barra lateral colorida.

## 6. Do's and Don'ts

### Do:
- **Do** usar o verde-lima `oklch(0.84 0.19 128)` apenas em ação: botão primário, foco, seleção, nav ativa. The One Voice Rule.
- **Do** elevar por tom antes de sombra (sunken → canvas → surface → elevated). The Tonal Lift Rule.
- **Do** dar `tabular-nums` a todo valor monetário e numérico. The Tabular Truth Rule.
- **Do** usar JetBrains Mono em códigos técnicos (contratos, unidades) e Inter em nomes.
- **Do** renderizar status como pílula com tinte translúcido + dot com halo, nunca fundo chapado.
- **Do** separar por hairline e por tom; reserve cards para agrupamentos reais.

### Don't:
- **Don't** voltar ao azul-tech genérico de dashboard SaaS. Era o reflexo de categoria; foi rejeitado de propósito.
- **Don't** usar a grade de cards idênticos (ícone + título + texto repetidos) nem o template de métrica-herói (número gigante com gradiente).
- **Don't** usar `border-left` ou `border-right` acima de 1px como faixa colorida de acento em cards, linhas ou alertas. Use borda completa ou tinte de fundo.
- **Don't** aplicar `background-clip: text` com gradiente (gradient text). Ênfase vem de peso e tamanho.
- **Don't** usar branco puro `#fff` nem preto puro `#000`. Texto é marfim quente; fundo é grafite quente.
- **Don't** espalhar o lima como decoração, em texto corrido ou como cor de status. Sua raridade é o ponto.
- **Don't** usar glassmorphism decorativo nem sombras pesadas estilo Material; profundidade é tonal.
- **Don't** deixar empty states como "—" solto; ensine a interface ou esconda a métrica.
