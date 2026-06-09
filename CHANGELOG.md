# Changelog

Todas as mudanças notáveis deste projeto são documentadas aqui.
O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e o projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [v0.2.0] - 2026-06-09

### ✨ Features

- **Slash command `/release-bump`** — corte de release guiado: recomendação de bump (HITL), geração de CHANGELOG + release notes e gates automatizados, delegando commit/tag/push ao `release.sh` (#42)
- **Redesign v2 de autenticação** — novas telas de login, recuperação e redefinição de senha, com loading pós-login (ConsoleBoot) sobre o blueprint AuthShell (#40)

### 🔧 Outros

- **Migração de hosting para Cloudflare Workers** — remoção do Firebase Hosting (Firebase Auth permanece); deploy por tag + smoke test (#41)
- **Docs:** convenção de navegação Vike (`<a href>` para links, `navigate()` para handlers)

**Comparação:** https://github.com/cacenot/constructpro-webapp/compare/v0.1.0...v0.2.0
**PRs:** #40, #41, #42

