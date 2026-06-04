# Product

## Register

product

## Users

Equipes **internas de incorporadoras e construtoras** que vendem imóveis na planta e financiam direto ao cliente (sem banco intermediário). O Costara é a ferramenta de trabalho primária dessas equipes: ficam dentro dele o expediente inteiro. É multi-tenant (uma instância isolada por incorporadora, com configuração própria de índices, regras de pagamento e automações).

Perfis em **ordem de prioridade de design** (papéis atribuídos por tenant):

1. **Diretor (usuário primário).** Dono ou diretor da incorporadora. Lê a saúde do negócio (funil, carteira, inadimplência, recebimentos), aprova propostas e decide sobre descontos e fechamentos. Quer visão consolidada e gargalos visíveis em segundos, sem garimpar dados.
2. **Financeiro.** Administra a carteira de recebíveis: parcelas, boletos, correção monetária, baixa de pagamentos, inadimplência e comissões a pagar. Precisa de números à prova de erro.
3. **Gestor de vendas / vendedor da construtora.** Funcionário interno que monta propostas (imóvel, plano de parcelas, mediação) e acompanha o funil. Quer montar a proposta sem erro e enxergar o estado de cada venda.

O **administrador** é um papel transversal de configuração (índices permitidos, mínimos de sinal/entrada, regras de pagamento parcial, automação de perda de venda, membros e papéis).

> **Corretores e imobiliárias não são usuários do sistema.** Entram apenas como cadastro, para vincular à venda e controlar comissão (o corretor tem `creci`; a imobiliária tem `cnpj`/`creci_j`). Dar acesso de login a corretores externos é uma possibilidade futura, hoje fora de escopo.

## Product Purpose

Costara gerencia, de ponta a ponta, a **venda de imóveis na planta e o financiamento direto** de uma incorporadora.

O sistema separa deliberadamente dois domínios:

- **Comercial (a venda):** funil de proposta → reserva → contrato assinado. Quem vendeu, para quem, qual unidade, com qual desconto.
- **Financeiro (o contrato):** ciclo de vida do financiamento. Parcelas (entrada em N parcelas, mensais, reforços anuais), correção monetária por índice econômico (CUB, IGP-M, IPCA), emissão e baixa de boletos, pagamentos (PIX, transferência, dinheiro, cartão, boleto, ou ativo como veículo/imóvel dado em entrada), inadimplência, quitação e rescisão. Cada contrato tem um livro-razão (ledger) imutável.

O produto cobre ainda comissões de corretores e imobiliárias, e relatórios comerciais e financeiros (conversão do funil, inadimplência, saldo devedor, recebimentos).

**Sucesso** é a equipe fechar vendas mais rápido e administrar a carteira de recebíveis sem erro, enxergando gargalos do funil e atrasos de pagamento em tempo real. É um produto específico do mercado imobiliário brasileiro: opera com CPF/CNPJ, CUB por estado, boleto e PIX, SPE por empreendimento, e registros de cartório de imóveis.

## Brand Personality

Voz de **console de operações**: direta, precisa, sem firula. O produto respeita o tempo de quem vive nele o dia inteiro e transmite segurança em operações que mexem com dinheiro de longo prazo.

Três palavras: **Eficiente. Confiável. Focado.**

Materializada na direção visual "Sala de Controle" (dark-first, grafite quente, accent verde-lima reservado à ação, status do funil que saltam aos olhos). Ver `DESIGN.md`.

## Anti-references

O Costara explicitamente NÃO deve parecer:

- **ERP corporativo pesado** (SAP, TOTVS, Senior): burocrático, denso, cinza, abas aninhadas sem fim.
- **Planilha Excel:** grades infinitas sem hierarquia, tudo com o mesmo peso visual.
- **Banco / fintech formal:** navy e ouro, tom institucional sério, pesado, "cofre".
- **Dashboard SaaS genérico:** azul-tech de template, cards idênticos, métrica-herói com gradiente. Foi exatamente o que o redesign matou.

## Design Principles

1. **Status em segundos.** O trabalho central é ler o estado do funil e da carteira rápido. Cor de status e hierarquia servem o scan, nunca a decoração.
2. **Confiança nos números.** É dinheiro de terceiros e financiamento de anos. Valores são tabulares, formatados e sem ambiguidade; um erro de leitura é inaceitável.
3. **Prevenir o passo errado.** Aprovar proposta, assinar contrato, baixar pagamento e rescindir são ações de peso (muitas irreversíveis). Pedem clareza e confirmação à prova de engano.
4. **Densidade sem fadiga.** Muita informação por tela (carteira, parcelas, funil), mas com respiro e hierarquia que sustentam horas de uso.
5. **O domínio é a verdade.** A UI espelha o modelo real do negócio (venda separada do contrato, estados de cada um, índices, multi-entrada). Fluência no negócio imobiliário é uma feature, não algo a esconder atrás de simplificações que mentem.

## Accessibility & Inclusion

WCAG 2.1 nível **AA** como base, com cuidado extra para uso prolongado: contraste confortável no tema escuro (texto marfim sobre grafite, nunca branco puro sobre preto puro), dark mode sólido como padrão, áreas de toque generosas e `tabular-nums` em todo valor monetário para leitura segura. Status nunca comunicado só por cor: sempre acompanhado de rótulo e ícone/dot.
