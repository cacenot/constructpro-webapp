# Copilot Instructions for Construct Pro WebApp

## Project Overview
A React 19 SPA (Single Page Application) for construction management built with TypeScript, Vike for file-based routing, and Firebase authentication. The codebase emphasizes type safety, clean separation of concerns, and centralized state/API management.

## Architecture & Key Patterns

### 1. **Routing with Vike (File-Based)**
- Routes are defined in `pages/` directory using Vike's convention
- `+Page.tsx` = route component, `+title.ts` = page title, `(groupName)/` = non-URL groups
- Example structure: `pages/(auth)/login/+Page.tsx` → `/login`, `pages/dashboard/+Page.tsx` → `/dashboard`
- Global config in `pages/+config.ts` sets `ssr: false` for SPA mode
- **Key file:** `pages/+Layout.tsx` wraps all routes with providers
- **URL Convention (PT-BR):** New routes should use Portuguese paths (e.g., `/clientes`, `/clientes/novo`, `/clientes/@id/editar`)
- Use `@param` directory syntax for dynamic route segments (e.g., `pages/clientes/@id/+Page.tsx`)

### 2. **Authentication Architecture**
- **Firebase Auth** initialized in `src/lib/firebase.ts` (handles app singleton)
- **React Context** in `src/contexts/auth-context.tsx` provides user + auth methods
- **API Interceptor** in `src/lib/api.ts` auto-attaches Firebase ID tokens to requests
- 401 errors trigger automatic logout → redirect to `/login`
- Always use `useAuth()` hook to access auth state, not Firebase directly

### 3. **Data Management & API**
- **TanStack Query (v5)** for server state via `src/lib/query-client.ts` (initialized in +Layout)
- **Axios** client in `src/lib/api.ts` with request/response interceptors
- **@cacenot/construct-pro-api-client** provides type-safe API calls via OpenAPI schema:
  - Use `ApiClientProvider` context in +Layout to provide fully-typed client
  - Access via `useApiClient()` hook which wraps the OpenAPI fetch client
  - Includes domain-specific hooks like `useProjects()`, `useCustomers()`, `useSales()` with built-in Query integration
  - Client auto-handles auth token via `getToken` callback and X-Tenant-ID headers
- **Zustand** for UI state (sidebar, theme) in `src/stores/app-store.ts` with localStorage persistence
- Services in `src/services/` should use Query for fetching, never raw axios
- Example with API client: `const { data } = await useApiClient().client.GET("/api/v1/projects")`

### 4. **Forms & Validation**
- **react-hook-form** + **Zod** integration via `@hookform/resolvers`
- Define schemas in `src/schemas/` (e.g., `auth.schema.ts` exports `loginSchema`, `registerSchema`)
- Always infer types from schemas: `type LoginForm = z.infer<typeof loginSchema>`
- Form components use `<FormField>` from shadcn for accessibility and error display

### 5. **UI Components**
- **shadcn/ui** components in `src/components/ui/`
- Built on **Tailwind CSS v4** (uses `@tailwindcss/vite` plugin, no PostCSS needed)
- **lucide-react** for icons, **sonner** for toasts (auto-initialized in +Layout)
- Add new shadcn components: `npx shadcn@latest add <component>`
- Use `cn()` utility (clsx + tailwind-merge) for dynamic class composition

## Conventions & Patterns

### File Organization
- `src/lib/` = core utilities, Firebase, API config (shared across app)
- `src/schemas/` = Zod validation schemas organized by domain (auth.schema.ts, etc.)
- `src/contexts/` = React Contexts (currently only auth-context.tsx)
- `src/stores/` = Zustand stores (UI state, preferences)
- `src/services/` = API call wrappers that use Query + axios
- `src/hooks/` = custom React hooks (currently empty, extend as needed)
- `src/types/` = global TypeScript interfaces

### Code Style
- **BiomeJS** enforces all formatting/linting (replaces ESLint + Prettier)
- `npm run lint:fix` or `npm run format` to auto-fix
- Single quotes, no semicolons, import organization enabled
- Biome catches unused imports/variables at `warn` level
- Avoid non-null assertions (`!`) — use proper null checks
- **Icon buttons must always have tooltips** — wrap icon buttons with `<Tooltip>` component to provide accessible labels (use Portuguese labels)
- **Dropdown menus in tables** — use `DropdownMenuLabel` at top with action group label (e.g., "Ações"), wrap trigger button in `<Tooltip>`, remove icons from menu items, use `DropdownMenuSeparator` to group related actions

### Environment Variables
- Client-side env vars must have `VITE_` prefix (Vite requirement)
- Access via `import.meta.env.VITE_*`
- Firebase credentials and API base URL in `.env` (copy from `.env.example`)
- Never commit `.env` — it's in `.gitignore`

### Authentication Flow
1. User navigates to app → `onAuthStateChanged()` in AuthContext initializes
2. API requests auto-attach Firebase ID token via interceptor
3. If 401 → auto logout + redirect to `/login`
4. Protected routes should check `user` from `useAuth()` hook

## Common Workflows

### Adding a New Page
```bash
# Create route with filesystem structure
mkdir -p pages/feature-name/sub-route
touch pages/feature-name/sub-route/+Page.tsx
touch pages/feature-name/sub-route/+title.ts
```

### Adding a New API Service
1. Create `src/services/feature.service.ts`
2. Use Query hooks from `@cacenot/construct-pro-api-client` (e.g., `useProjects()`) or build custom hooks:
   ```ts
   // Using API client hook
   const { client } = useApiClient()
   useQuery({
     queryKey: ['projects'],
     queryFn: async () => {
       const { data } = await client.GET('/api/v1/projects')
       return data
     }
   })
   ```
3. Client auto-attaches auth token via `getToken` callback (no manual interceptor setup)
4. X-Tenant-ID header auto-set if `tenantId` provided to `ApiClientProvider`
5. Export query/mutation functions, not raw client

### Adding Form Validation
1. Define schema in `src/schemas/feature.schema.ts`
2. Infer type: `type FormData = z.infer<typeof featureSchema>`
3. Use with react-hook-form: `const form = useForm({ resolver: zodResolver(featureSchema) })`

### Adding UI Component
```bash
npx shadcn@latest add button dropdown-menu dialog
```

## External Dependencies to Know
- **@cacenot/construct-pro-api-client** (v0.1.1): 
  - Private GitHub package for type-safe API calls (requires GITHUB_TOKEN in `.npmrc`)
  - Exports `ApiClientProvider` context + `useApiClient()` hook
  - Includes pre-built hooks: `useProjects()`, `useCustomers()`, `useSales()` (all Query-integrated)
  - Enums for i18n (Portuguese/English): `ProjectStatus`, `CustomerType`, etc.
  - Utility functions: CPF/CNPJ validation, currency formatting
  - Types auto-generated from OpenAPI schema (fully typed API calls)
- **next-themes**: Provides theme context (imported but check if actively used)
- **nuqs**: Lightweight URL search params state library (available but not actively used yet)

## Common Gotchas
1. **Firebase must be initialized once** → checks `getApps()` in `src/lib/firebase.ts`
2. **Vike routes require `+Page.tsx`** → without it, page won't render
3. **Biome auto-fixes on pre-commit** → lint-staged runs before git commits
4. **Query keys must be stable** → use consistent arrays (avoid inline objects)
5. **Auth context requires Provider** → already in +Layout, no manual setup needed

## Build & Deploy
- `npm run build` → TypeScript check + Vite bundle to `dist/`
- `npm run preview` → local test of production build
- `npm run dev` → hot-reload development server on `localhost:5173`
