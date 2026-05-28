---
baseline_commit: 62c71344be0f0746bbf28a9305bc2983b5dd9e37
---

# Story 1.1: Project Foundation & Infrastructure

Status: done

## Story

As a neurologist,
I want the clinical portal to have a stable, well-structured foundation,
so that all features work reliably with consistent data-fetching and state management patterns.

## Acceptance Criteria

1. **Packages installed** — `react-router-dom`, `@tanstack/react-query`, `zustand`, `react-hook-form`, `@hookform/resolvers`, `zod` are present in `package.json` and installed in `node_modules`.

2. **main.tsx wired** — `QueryClientProvider` wraps the app and `RouterProvider` is the root rendered component. The existing `NeurologistDashboard` import is replaced.

3. **`src/services/api.ts` exists** — Every request includes `credentials: 'include'`, reads `VITE_API_BASE_URL` from `import.meta.env`, and throws a typed `ApiError` on non-2xx responses. On 401, it redirects the browser to `/login` (no throw). On 5xx / network errors, it throws `ApiError`.

4. **`src/store/app.store.ts` exists** — Zustand store has three slices with correct initial state:
   - `auth`: `{ neurologist: null, status: 'loading' }`
   - `activeSession`: `{ sessionId: null, startedAt: null, wsStatus: 'disconnected' }`
   - `notifications`: `{ pendingSessionComplete: false, items: [] }`

5. **Shared components exist** — `src/shared/components/ErrorMessage.tsx`, `EmptyState.tsx`, and `LoadingSpinner.tsx` are available and render correctly (no TypeScript errors).

6. **`.env.example` exists** — Documents `VITE_API_BASE_URL` and `VITE_WS_BASE_URL` variable names without values.

## Tasks / Subtasks

- [x] Install dependencies (AC: #1)
  - [x] Run: `npm install react-router-dom @tanstack/react-query zustand react-hook-form @hookform/resolvers zod`
  - [x] Verify all packages appear in `package.json` dependencies

- [x] Create router stub (AC: #2)
  - [x] Create `src/router/index.tsx` with a `createBrowserRouter` stub exporting `router` (one placeholder route for `/` rendering a `<div>` placeholder — Story 1.2 replaces this with full routes)

- [x] Wire `main.tsx` (AC: #2)
  - [x] Import `QueryClientProvider` and `QueryClient` from `@tanstack/react-query`
  - [x] Import `RouterProvider` from `react-router-dom`
  - [x] Import `router` from `./router/index`
  - [x] Replace the current `<App />` render with `<QueryClientProvider client={queryClient}><RouterProvider router={router} /></QueryClientProvider>`
  - [x] Remove the `NeurologistDashboard` import from `main.tsx` (the file itself stays untouched at `src/NeurologistDashboard/NeurologistDashboard.tsx`)

- [x] Create shared types (AC: #3)
  - [x] Create `src/shared/types/shared.types.ts` with `ApiError` class and `PaginatedResponse<T>` type

- [x] Create `src/services/api.ts` (AC: #3)
  - [x] `BASE_URL` read from `import.meta.env.VITE_API_BASE_URL`
  - [x] All requests use `credentials: 'include'`
  - [x] On 401: `window.location.href = '/login'` (no throw)
  - [x] On non-2xx (except 401): throw `new ApiError(status, code, message)`
  - [x] Export typed `get<T>`, `post<T>`, `patch<T>` helpers

- [x] Create `src/store/app.store.ts` (AC: #4)
  - [x] Use Zustand `create` with `combine` or explicit slice pattern
  - [x] `auth` slice: `neurologist: Neurologist | null`, `status: 'loading' | 'authenticated' | 'unauthenticated'`
  - [x] `activeSession` slice: `sessionId: string | null`, `startedAt: Date | null`, `wsStatus: 'connected' | 'reconnecting' | 'polling' | 'disconnected'`
  - [x] `notifications` slice: `pendingSessionComplete: boolean`, `items: Notification[]`
  - [x] All actions use `set(state => ({ ... }))` — never direct mutation

- [x] Create shared components (AC: #5)
  - [x] `src/shared/components/ErrorMessage.tsx` — accepts `error: unknown` prop, renders friendly error text
  - [x] `src/shared/components/EmptyState.tsx` — accepts `message: string` prop
  - [x] `src/shared/components/LoadingSpinner.tsx` — renders a loading indicator using existing CSS classes

- [x] Create `.env.example` (AC: #6)
  - [x] File at project root with variable names only, no values:
    ```
    VITE_API_BASE_URL=
    VITE_WS_BASE_URL=
    ```

- [x] Verify the app compiles with `npm run build` (no TypeScript errors)

### Review Findings

- [x] [Review][Patch] `resetActiveSession` uses direct `set({})` instead of mandatory functional form `set(() => ({}))` [src/store/app.store.ts:49]
- [x] [Review][Patch] Network errors (fetch rejection) propagate as `TypeError` instead of `ApiError` — wrap `fetch` in try/catch [src/services/api.ts:5-9]
- [x] [Review][Patch] Successful 204/empty response causes JSON parse failure — check content-type or status before calling `res.json()` [src/services/api.ts:22]
- [x] [Review][Patch] 401 redirect loops infinitely when already on `/login` — add `pathname` guard before redirecting [src/services/api.ts:11-13]
- [x] [Review][Patch] `BASE_URL` unchecked when `VITE_API_BASE_URL` is undefined — add startup assertion [src/services/api.ts:3]
- [x] [Review][Defer] No `/login` route in router stub — Story 1.3 will add it [src/router/index.tsx] — deferred, intentional stub per story spec
- [x] [Review][Defer] No DELETE/PUT methods on `api` object — future story requirement [src/services/api.ts] — deferred, pre-existing
- [x] [Review][Defer] `LoadingSpinner` has no visual animation — visual polish deferred [src/shared/components/LoadingSpinner.tsx] — deferred, AC-5 criterion is "no TS errors"
- [x] [Review][Defer] `startedAt: Date` won't survive if Zustand `persist` middleware is added [src/store/app.store.ts] — deferred, no persistence in this story
- [x] [Review][Defer] `QueryClient` has no `retry`/`staleTime` config — default retries may cause redundant API calls [src/main.tsx] — deferred, advisory
- [x] [Review][Defer] Store allows inconsistent slice state (e.g., `status='authenticated'` with `neurologist=null`) — no invariant enforcement [src/store/app.store.ts] — deferred, follows spec blueprint

## Dev Notes

### Critical constraints — read before writing any code

**DO NOT touch `src/NeurologistDashboard/NeurologistDashboard.tsx`.**
This prototype file must remain intact. Only `main.tsx` changes to stop rendering it directly.

**`fetch` is forbidden outside `src/services/api.ts`.**
`api.ts` is the only file in the project that calls `fetch`. All other code calls the typed helper functions exported by `api.ts` (and later, service modules). This is a hard project rule (NFR-6).

**No `localStorage` or `sessionStorage` for any data.**
The session cookie is HttpOnly and handled by the browser automatically via `credentials: 'include'`. Never attempt to read or write cookies in JavaScript (Ley 29733, NFR-2).

**Zustand state updates — always use `set(state => ({...}))`.**
Never mutate state directly (e.g., `state.auth.status = 'loading'` is forbidden). Always spread and return a new partial object.

**CSS: use existing custom CSS variables from `src/index.css`.**
The project uses a custom CSS variable design system (not Tailwind). Variables like `var(--accent)`, `var(--surface)`, `var(--text2)`, `var(--border)` are already defined. Use existing classes like `.card`, `.badge`, `.btn`, `.empty` where appropriate in the shared components.

**TanStack Query v5 API changes:**
- Use `isPending` instead of `isLoading` (v5 breaking change)
- `QueryClient` is instantiated once outside the component tree
- `useQuery` returns `{ data, isPending, error }` — not `{ data, isLoading, error }`

**Date formatting:** Always use `new Intl.DateTimeFormat('es-PE', { ... }).format(date)`. Never use `.toLocaleDateString()` without locale or store pre-formatted strings.

**No `console.error` with patient names, IDs, or clinical data** (Ley 29733 / NFR-2). Log only structural/technical messages if needed.

### Existing project state

| What exists | Location | Notes |
|---|---|---|
| React 19 + TypeScript ~6.0 + Vite 8 | `package.json` | Do NOT upgrade — use as-is |
| Recharts 2.x | `package.json` | Already installed, don't reinstall |
| Monolith prototype | `src/NeurologistDashboard/NeurologistDashboard.tsx` | Preserve — do not modify |
| Design system | `src/index.css` | CSS variables + utility classes |
| Entry point | `src/main.tsx` | Needs update to use RouterProvider |

### Project structure for this story

Only the following files are NEW in this story:

```
src/
  router/
    index.tsx                ← STUB: createBrowserRouter with placeholder route
  services/
    api.ts                   ← NEW: fetch wrapper
  store/
    app.store.ts             ← NEW: Zustand store
  shared/
    components/
      ErrorMessage.tsx       ← NEW
      EmptyState.tsx         ← NEW
      LoadingSpinner.tsx     ← NEW
    types/
      shared.types.ts        ← NEW: ApiError class, PaginatedResponse<T>
  main.tsx                   ← MODIFIED: RouterProvider + QueryClientProvider
.env.example                 ← NEW at project root
```

### Implementation blueprints

**`src/shared/types/shared.types.ts`:**
```ts
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export type PaginatedResponse<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}
```

**`src/services/api.ts` — key shape:**
```ts
const BASE_URL = import.meta.env.VITE_API_BASE_URL as string

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (res.status === 401) {
    window.location.href = '/login'
    return undefined as never
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body.code ?? 'UNKNOWN', body.message ?? res.statusText)
  }
  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
}
```

**`src/store/app.store.ts` — Zustand shape:**
```ts
import { create } from 'zustand'

type Neurologist = { id: string; name: string; email: string }
type Notification = { id: string; type: string; message: string; read: boolean }

type AppStore = {
  auth: { neurologist: Neurologist | null; status: 'loading' | 'authenticated' | 'unauthenticated' }
  activeSession: { sessionId: string | null; startedAt: Date | null; wsStatus: 'connected' | 'reconnecting' | 'polling' | 'disconnected' }
  notifications: { pendingSessionComplete: boolean; items: Notification[] }
  setAuth: (patch: Partial<AppStore['auth']>) => void
  setActiveSession: (patch: Partial<AppStore['activeSession']>) => void
  setNotifications: (patch: Partial<AppStore['notifications']>) => void
  resetActiveSession: () => void
}

export const useAppStore = create<AppStore>((set) => ({
  auth: { neurologist: null, status: 'loading' },
  activeSession: { sessionId: null, startedAt: null, wsStatus: 'disconnected' },
  notifications: { pendingSessionComplete: false, items: [] },
  setAuth: (patch) => set((s) => ({ auth: { ...s.auth, ...patch } })),
  setActiveSession: (patch) => set((s) => ({ activeSession: { ...s.activeSession, ...patch } })),
  setNotifications: (patch) => set((s) => ({ notifications: { ...s.notifications, ...patch } })),
  resetActiveSession: () => set({ activeSession: { sessionId: null, startedAt: null, wsStatus: 'disconnected' } }),
}))
```

**`src/router/index.tsx` — minimal stub:**
```tsx
import { createBrowserRouter } from 'react-router-dom'

// Placeholder — replaced in Story 1.2 with full route structure
const router = createBrowserRouter([
  { path: '/', element: <div>Cargando portal…</div> },
])

export default router
```

**`src/main.tsx` — updated wiring:**
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import router from './router/index'
import './index.css'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
)
```

### MLField<T> type — define now, use from Story 3 onwards

Define in `src/features/sessions/session.types.ts` during Story 3. Documented here as architecture context so later stories can reference it:

```ts
type MLField<T> =
  | { status: 'pending' }
  | { status: 'resolved'; value: T }
  | { status: 'error'; message: string }
```

A `null` API value maps to `{ status: 'pending' }`. Never render `null` directly.

### TanStack Query key convention (for reference in all stories)

```ts
['patients']                        // GET /patients list
['patient', patientId]              // GET /patients/:id
['patient', patientId, 'dashboard'] // GET /patients/:id/dashboard
['patient', patientId, 'trend']     // GET /patients/:id/trend
['patient', patientId, 'sessions']  // GET /patients/:id/sessions
['session', sessionId, 'metrics']   // GET /sessions/:id/metrics
```

### Environment variables (runtime)

```
VITE_API_BASE_URL=https://aremec-ws-latest.onrender.com/api/v1
VITE_WS_BASE_URL=wss://aremec-ws-latest.onrender.com/api/v1
```

These are read via `import.meta.env.VITE_API_BASE_URL` — ONLY in `src/services/api.ts` (REST) and `src/hooks/useSessionWebSocket.ts` (WS). Never in components.

### References

- Acceptance Criteria source: [epics.md — Story 1.1](../_bmad-output/planning-artifacts/epics.md#story-11-project-foundation--infrastructure)
- Architecture: [architecture.md — API & Communication Patterns](../_bmad-output/planning-artifacts/architecture.md#api--communication-patterns)
- Architecture: [architecture.md — Frontend Architecture](../_bmad-output/planning-artifacts/architecture.md#frontend-architecture)
- Architecture: [architecture.md — Project Structure](../_bmad-output/planning-artifacts/architecture.md#complete-project-directory-structure)
- Architecture: [architecture.md — Enforcement Guidelines](../_bmad-output/planning-artifacts/architecture.md#enforcement-guidelines)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Initial `npm run build` reported 4 TS errors: 2 introduced by this story (TS1294 in `shared.types.ts` — parameter-property syntax incompatible with `erasableSyntaxOnly: true`) and 2 pre-existing in `NeurologistDashboard.tsx` (TS6133 — `unread`, `DashboardPage` unused). Verified pre-existing by `git stash` + rebuild at baseline `62c7134`.
- Resolution for the 2 story-introduced errors: rewrote `ApiError` to use explicit field declarations + assignment in constructor body (no `public` parameter properties).
- Resolution for the 2 pre-existing errors (approved by user — option "parche mínimo"):
  - Line 213: renamed destructured prop `unread` → `unread: _unread` to satisfy `noUnusedLocals` for the unused binding.
  - Line 300: added `export` to `function DashboardPage(...)` so the declaration is no longer treated as an unused local. Function body and signature unchanged.
- Final `npm run build` output: `✓ 71 modules transformed`, no errors. Bundle: `dist/assets/index-C4AaATnY.js   308.71 kB`.

### Completion Notes List

- All 6 ACs satisfied. All 9 task groups marked complete.
- Dependencies installed at versions: `react-router-dom@^7.15.1`, `@tanstack/react-query@^5.100.14`, `zustand@^5.0.14`, `react-hook-form@^7.76.1`, `@hookform/resolvers@^5.4.0`, `zod@^4.4.3`.
- `main.tsx` no longer imports `NeurologistDashboard`; the prototype file remains in `src/NeurologistDashboard/` and is reachable via the exported `DashboardPage` symbol for future reference. Story 1.2 will replace the placeholder route with the real route tree.
- `tsconfig.app.json` has `erasableSyntaxOnly: true`. Future code must not use TS parameter properties (`constructor(public foo: T)`); declare fields explicitly and assign in the body.
- Shared components use existing `.empty` / `.empty-text` classes from `src/index.css` (no Tailwind, no new CSS).
- No tests added: project has no test framework configured and this story does not introduce business logic. Build success serves as the verification gate per the story's final task. Test framework setup is out of scope.

**Deviation from Dev Notes constraint** (user-approved): per Dev Notes, `NeurologistDashboard.tsx` must not be touched. The build-verification task could not pass without 2 minimal edits (one `_unread` rename, one `export` keyword added). Surface and approval recorded above. No behavior or rendering output changed.

### File List

**New files:**
- `src/router/index.tsx`
- `src/services/api.ts`
- `src/store/app.store.ts`
- `src/shared/types/shared.types.ts`
- `src/shared/components/ErrorMessage.tsx`
- `src/shared/components/EmptyState.tsx`
- `src/shared/components/LoadingSpinner.tsx`
- `.env.example`

**Modified files:**
- `src/main.tsx` — replaced direct `<App />` render with `QueryClientProvider` + `RouterProvider`
- `src/NeurologistDashboard/NeurologistDashboard.tsx` — 2 minimal edits (line 213 `_unread` rename, line 300 `export` added) to clear pre-existing TS6133 errors
- `package.json` / `package-lock.json` — 6 new runtime dependencies

## Change Log

| Date       | Author | Change                                                                                                                   |
| ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------ |
| 2026-05-28 | Amelia | Implemented Story 1.1: installed deps, added router stub, fetch wrapper, Zustand store, shared components, `.env.example`. Build verified green. |
