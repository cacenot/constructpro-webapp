# Changelog

Todas as mudanças notáveis deste projeto são documentadas aqui.
O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e o projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [v0.3.0] - 2026-06-09

### ✨ Features

- **Redesign do formulário de proposta** (#43): balanceamento por saldo (modelo C), datas unificadas (só "Início"), encadeamento automático de mensais e adição inteligente de balões/reforços; "Valor da proposta" com ágio/desconto vs tabela; entrada e entrega das chaves com toggle R$/%; mapa mensal interativo com popover, índice de correção e números animados; etapa 1 reorganizada (cliente primeiro).
- **Financeiro v2** (#38): Tesouraria da carteira em camadas — Pulso, filtros e tabela; bloco de Aging + abas Resumo/Parcelas; fluxo de caixa mensal; carteira por empreendimento; painel da parcela em master-detail contextualizado.
- **Contratos — inadimplência derivada** (#38): `is_overdue` deixa de ser status e passa a condição derivada; pill `ContractOverdueBadge` na lista, detalhe e cockpit; filtro "Apenas inadimplentes" (`?overdue=true`); api-client 1.4.0.

### 🐛 Correções

- Proposta: post-review fixes — rastreio de unidade, tolerância de arredondamento, distribuição DRY e remoção de props mortas (#43).
- Financeiro: skeleton do Pulso reserva o 5º slot, evitando o salto 4→5 (#38).

### 🔧 Outros

- Cobertura unitária ampliada e correção de fixtures de schema da proposta; extração da lógica de grupo (distribuição/sazonalidade/adição) para funções puras testáveis.
- Bump do api-client (1.3.0 → 1.4.0).

**Comparação:** https://github.com/cacenot/constructpro-webapp/compare/v0.2.0...v0.3.0
**PRs:** #38, #43

## [v0.2.0] - 2026-06-09

### ✨ Features

- **Slash command `/release-bump`** — corte de release guiado: recomendação de bump (HITL), geração de CHANGELOG + release notes e gates automatizados, delegando commit/tag/push ao `release.sh` (#42)
- **Redesign v2 de autenticação** — novas telas de login, recuperação e redefinição de senha, com loading pós-login (ConsoleBoot) sobre o blueprint AuthShell (#40)

### 🔧 Outros

- **Migração de hosting para Cloudflare Workers** — remoção do Firebase Hosting (Firebase Auth permanece); deploy por tag + smoke test (#41)
- **Docs:** convenção de navegação Vike (`<a href>` para links, `navigate()` para handlers)

**Comparação:** https://github.com/cacenot/constructpro-webapp/compare/v0.1.0...v0.2.0
**PRs:** #40, #41, #42

