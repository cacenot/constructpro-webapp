# Construct Pro WebApp

Sistema de gerenciamento de construção desenvolvido em React com TypeScript.

## 🚀 Tech Stack

- **Framework:** React 19 + TypeScript
- **Build:** Vite 7
- **Roteamento:** Vike (SPA mode com file-based routing)
- **Estilização:** Tailwind CSS 4 + shadcn/ui
- **State Management:** Zustand + TanStack Query
- **Formulários:** react-hook-form + Zod
- **Tabelas:** TanStack Table
- **Autenticação:** Firebase Auth
- **HTTP Client:** Axios
- **Linting/Formatting:** BiomeJS
- **Git Hooks:** Husky + lint-staged

## 📁 Estrutura de Pastas

```
├── pages/                    # Vike filesystem routing
│   ├── +config.ts           # Configuração global (SPA mode)
│   ├── +Layout.tsx          # Layout raiz com providers
│   ├── +Head.tsx            # Meta tags globais
│   ├── index/               # Rota /
│   └── (auth)/              # Grupo de rotas de autenticação
│       ├── login/           # Rota /login
│       └── register/        # Rota /register
├── src/
│   ├── components/
│   │   └── ui/              # Componentes shadcn
│   ├── contexts/            # React Contexts
│   ├── hooks/               # Custom hooks
│   ├── lib/                 # Utilitários e configurações
│   ├── schemas/             # Schemas Zod
│   ├── services/            # Serviços de API
│   ├── stores/              # Zustand stores
│   ├── styles/              # CSS global
│   └── types/               # TypeScript types
└── public/                  # Assets estáticos
```

## 🛠️ Setup

### Pré-requisitos

- Node.js 20+
- npm ou pnpm

### Instalação

```bash
# Clonar repositório
git clone <repo-url>
cd construct-pro-webapp

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais do Firebase

# Iniciar servidor de desenvolvimento
npm run dev
```

### Scripts Disponíveis

```bash
npm run dev      # Inicia servidor de desenvolvimento
npm run build    # Build para produção
npm run preview  # Preview do build de produção
npm run lint     # Verifica lint e formatação
npm run lint:fix # Corrige problemas de lint automaticamente
npm run format   # Formata código
```

## 🔐 Configuração do Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
2. Ative Authentication e habilite os métodos desejados (Email/Password, etc.)
3. Copie as credenciais para o arquivo `.env`

## 📦 Adicionando Componentes shadcn

```bash
# Adicionar um componente
npx shadcn@latest add button

# Adicionar múltiplos componentes
npx shadcn@latest add card dialog dropdown-menu
```

## 🎨 Temas

O projeto suporta tema claro e escuro. O tema é controlado pelo Zustand store em `src/stores/app-store.ts`.

## 📝 Convenções

- **Commits:** Usar commits convencionais (feat:, fix:, docs:, etc.)
- **Arquivos:** Usar kebab-case para arquivos e PascalCase para componentes
- **Imports:** Usar alias `@/` para imports do src

## 📄 Licença

Privado - Todos os direitos reservados.
