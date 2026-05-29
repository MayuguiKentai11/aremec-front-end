---
baseline_commit: 2a5593c
---

# Story 1.3: Login & Logout

Status: done

## Story

As a neurologist,
I want to log in with my institutional credentials and log out when I'm done,
so that I can access my patients' data securely and protect it when I leave the workstation.

## Acceptance Criteria

1. **Login button redirect** — On `/login`, clicking "Iniciar sesión" navigates the browser to `GET /auth/login` on the backend via `window.location.href`. No token handling, no SPA navigation, no form.

2. **Forgot password link** — On `/login`, clicking "¿Olvidaste tu contraseña?" navigates the browser to `VITE_API_BASE_URL + '/auth/forgot-password'` (backend initiates Auth0 recovery flow).

3. **Logout** — Clicking the logout button in `AppShell` calls `POST /auth/logout`. On **both success and error**, the Zustand store is fully reset (auth, activeSession, notifications slices), the TanStack Query cache is cleared, and the browser navigates to `/login`.

4. **401 session expiry** — Any protected API call returning 401 redirects to `/login` without exposing session internals. *(Already implemented in `api.ts` — verify no regression.)*

5. **Auth0 callback success** — After Auth0 redirects back to the portal, `requireAuth` calls `getMe()`, sets `auth.status = 'authenticated'`, and renders the protected route normally. *(Already implemented — verify no regression.)*

6. **Login route guard** — An already-authenticated user navigating to `/login` is redirected to `/patients`.

## Tasks / Subtasks

- [x] Add `logout()` to `src/services/auth.service.ts` (AC: #3)
  - [x] Export `async function logout(): Promise<void>` calling `api.post<void>('/auth/logout', {})`

- [x] Create `src/features/auth/components/LogoutButton.tsx` (AC: #3)
  - [x] Named export `LogoutButton`
  - [x] `useMutation({ mutationFn: logout })` from `@tanstack/react-query`
  - [x] `useQueryClient()` and call `queryClient.clear()` inside `resetAndRedirect`
  - [x] Both `onSuccess` and `onError` call `resetAndRedirect` (always log out locally)
  - [x] `resetAndRedirect`: setAuth unauthenticated + resetActiveSession + setNotifications cleared + queryClient.clear() + navigate('/login')
  - [x] Render `<button className="btn btn-ghost btn-sm" disabled={isPending}>` — label "Cerrar sesión" or "Cerrando..." while pending

- [x] Modify `src/shared/components/AppShell.tsx` (AC: #3)
  - [x] Import `LogoutButton` from `../../features/auth/components/LogoutButton`
  - [x] Add `<LogoutButton />` inside `.sidebar-user` div, with `style={{ marginLeft: 'auto' }}` to push it to the right edge

- [x] Rewrite `src/features/auth/pages/LoginPage.tsx` (AC: #1, #2)
  - [x] Replace stub entirely — Story 1.2 stub renders "Portal AREMEC" + "Iniciando sesión..."
  - [x] Centered layout using `.page` + `.card` + existing classes; use inline styles only for structural layout (`height: 100vh`, `maxWidth`, `display: flex`)
  - [x] "Iniciar sesión": `<button className="btn btn-primary">` — `onClick: window.location.href = import.meta.env.VITE_API_BASE_URL + '/auth/login'`
  - [x] "¿Olvidaste tu contraseña?": `<button className="btn btn-ghost btn-sm">` — `onClick: window.location.href = import.meta.env.VITE_API_BASE_URL + '/auth/forgot-password'`
  - [x] No form, no input fields, no state, no hooks

- [x] Add login route guard to `src/router/index.tsx` (AC: #6)
  - [x] Add `redirectIfAuthenticated` loader function: reads `useAppStore.getState().auth.status`; returns `redirect('/patients')` only if `'authenticated'`; returns `null` otherwise
  - [x] Do NOT call `getMe()` in this loader — only check cached Zustand state to avoid double network call
  - [x] Attach loader to the `/login` route: `{ path: '/login', element: <LoginPage />, loader: redirectIfAuthenticated }`

- [x] Verify build passes with `npm run build` (no TypeScript errors)

### Review Findings

- [x] [Review][Patch] AC6 — converted `redirectIfAuthenticated` to async loader that calls `getMe()` on `'loading'` state; cold-load authenticated users now redirected to `/patients` [src/router/index.tsx]
- [x] [Review][Dismiss] AC3 — 401 on `POST /auth/logout` swallowed by `api.ts` hard redirect; accepted as equivalent since full page reload resets store and cache identically
- [x] [Review][Patch] `VITE_API_BASE_URL` undefined silently cast to string — changed to `string | undefined`, buttons disabled when `apiBase` falsy [src/features/auth/pages/LoginPage.tsx:2]
- [x] [Review][Patch] `queryClient.clear()` called before `navigate('/login')` — added `queryClient.cancelQueries()` before `clear()` to prevent observer re-fetches [src/features/auth/components/LogoutButton.tsx:17-18]
- [x] [Review][Defer] `authCheckInFlight` `.finally()` timing — race benign because Zustand `setAuth` is synchronous; new callers after settlement hit `status==='authenticated'` early return [src/router/index.tsx] — deferred, pre-existing
- [x] [Review][Defer] Open redirect via `apiBase` — build-time env var substitution; not a runtime injection risk in standard Vite builds [src/features/auth/pages/LoginPage.tsx] — deferred, pre-existing
- [x] [Review][Defer] `requireAuth` getMe/logout race — AppShell (with LogoutButton) only renders after `status==='authenticated'`; race is practically unreachable [src/router/index.tsx] — deferred, pre-existing
- [x] [Review][Defer] `initials` empty string when `neurologist.name` is `""` — cosmetic; fallback `'?'` only triggers on `null`/`undefined`, not empty string [src/shared/components/AppShell.tsx] — deferred, pre-existing

## Dev Notes

### Critical Constraints — Read Before Writing Any Code

**`erasableSyntaxOnly: true` in `tsconfig.app.json`.** No constructor parameter properties (`constructor(public foo: T)`). Declare fields explicitly. Pre-existing build-breaking constraint from Story 1.1.

**No `fetch` outside `src/services/api.ts`.** `auth.service.ts#logout()` must call `api.post()`.

**`useMutation` for logout.** Use TanStack Query's `useMutation` — not bare `try/catch` or bare `fetch` in the component.

**Login is `window.location.href`, NOT `useNavigate` or `<Link>`.** The backend handles the OAuth2 redirect. SPA routing would intercept it.

**Always reset local state on logout regardless of API result.** Both `onSuccess` and `onError` must call `resetAndRedirect`. If `POST /auth/logout` fails (5xx, network error), the user is still logged out locally. A failing logout API call must never leave the user stuck in an authenticated UI state.

**Clear TanStack Query cache on logout.** Use `queryClient.clear()` inside `resetAndRedirect`. This prevents stale patient/session data from appearing if the user logs back in as a different neurologist.

**CSS: use ONLY existing classes from `src/index.css`.** Available button classes: `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-sm`. No new CSS classes or stylesheets. Inline `style=` props are acceptable only for structural layout properties with no CSS class equivalent (e.g., `height: 100vh`, `marginLeft: 'auto'`, `maxWidth`).

**`useAppStore.getState()` in loader.** The `redirectIfAuthenticated` loader runs outside React. Access Zustand via `useAppStore.getState()`, not the hook.

**`navigate('/login')` in LogoutButton** uses `useNavigate()` from `react-router-dom` — this is a React component so the hook is available.

### Existing Project State

| File | State | Notes |
|---|---|---|
| `src/features/auth/pages/LoginPage.tsx` | **REWRITE** | Current stub: renders "Portal AREMEC" + "Iniciando sesión..." only |
| `src/services/auth.service.ts` | **MODIFY** | Only `getMe()` exists; add `logout()` |
| `src/shared/components/AppShell.tsx` | **MODIFY** | No LogoutButton currently; Story 1.2 deferred it |
| `src/router/index.tsx` | **MODIFY** | `/login` route has no loader; Story 1.2 deferred this guard |
| `src/features/auth/components/` | **NEW directory + file** | Does not exist yet — create it |
| `src/store/app.store.ts` | **NO CHANGE** | `setAuth`, `resetActiveSession`, `setNotifications` already exist |
| `src/services/api.ts` | **NO CHANGE** | Already handles 401 with `window.location.href = '/login'` globally |

### Blueprints

**`src/services/auth.service.ts` (add `logout` after `getMe`):**
```ts
export async function logout(): Promise<void> {
  return api.post<void>('/auth/logout', {})
}
```

**`src/features/auth/components/LogoutButton.tsx`:**
```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { logout } from '../../../services/auth.service'
import { useAppStore } from '../../../store/app.store'

export function LogoutButton() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const setAuth = useAppStore((s) => s.setAuth)
  const resetActiveSession = useAppStore((s) => s.resetActiveSession)
  const setNotifications = useAppStore((s) => s.setNotifications)

  const resetAndRedirect = () => {
    setAuth({ neurologist: null, status: 'unauthenticated' })
    resetActiveSession()
    setNotifications({ pendingSessionComplete: false, items: [] })
    queryClient.clear()
    navigate('/login')
  }

  const { mutate, isPending } = useMutation({
    mutationFn: logout,
    onSuccess: resetAndRedirect,
    onError: resetAndRedirect,
  })

  return (
    <button className="btn btn-ghost btn-sm" onClick={() => mutate()} disabled={isPending}>
      {isPending ? 'Cerrando...' : 'Cerrar sesión'}
    </button>
  )
}
```

**`src/shared/components/AppShell.tsx` — sidebar-user section (add LogoutButton):**
```tsx
// Add import at top:
import { LogoutButton } from '../../features/auth/components/LogoutButton'

// Modify .sidebar-user div:
<div className="sidebar-user">
  <div className="avatar">{initials}</div>
  <div>
    <div className="user-name">{neurologist?.name ?? 'Neurólogo'}</div>
    <div className="user-role">Neurólogo</div>
  </div>
  <LogoutButton style={{ marginLeft: 'auto' }} />
</div>
```
> `LogoutButton` doesn't accept a `style` prop — pass `marginLeft: 'auto'` via a wrapper or add the style directly to the button inside LogoutButton. Simplest: wrap in `<div style={{ marginLeft: 'auto' }}><LogoutButton /></div>`.

**`src/features/auth/pages/LoginPage.tsx` (full rewrite):**
```tsx
export default function LoginPage() {
  const apiBase = import.meta.env.VITE_API_BASE_URL as string

  return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="card" style={{ maxWidth: 360, width: '100%', textAlign: 'center' }}>
        <div className="logo-title" style={{ marginBottom: 4 }}>AREMEC</div>
        <div className="logo-sub" style={{ marginBottom: 28 }}>PORTAL CLÍNICO</div>
        <button
          className="btn btn-primary"
          style={{ width: '100%', marginBottom: 12 }}
          onClick={() => { window.location.href = `${apiBase}/auth/login` }}
        >
          Iniciar sesión
        </button>
        <button
          className="btn btn-ghost btn-sm"
          style={{ width: '100%' }}
          onClick={() => { window.location.href = `${apiBase}/auth/forgot-password` }}
        >
          ¿Olvidaste tu contraseña?
        </button>
      </div>
    </div>
  )
}
```

**`src/router/index.tsx` — add loader function + update `/login` route:**
```ts
// Add before the router definition:
function redirectIfAuthenticated() {
  const { auth } = useAppStore.getState()
  if (auth.status === 'authenticated') return redirect('/patients')
  return null
}

// Update /login route (was { path: '/login', element: <LoginPage /> }):
{ path: '/login', element: <LoginPage />, loader: redirectIfAuthenticated },
```
> `redirectIfAuthenticated` is synchronous (no await) — return type is `Response | null`, which React Router accepts from a loader.

### Deferred Items Resolved by This Story

From `deferred-work.md`:
- `/login` route not guarded for authenticated users → FIXED by `redirectIfAuthenticated` loader
- No `LogoutButton` in AppShell → FIXED

### Project Structure for This Story

```
src/
  features/
    auth/
      components/                ← NEW directory
        LogoutButton.tsx         ← NEW: mutation + store reset + navigate
      pages/
        LoginPage.tsx            ← REWRITE: login + forgot password buttons
  services/
    auth.service.ts              ← MODIFY: add logout()
  shared/
    components/
      AppShell.tsx               ← MODIFY: add LogoutButton to sidebar-user
  router/
    index.tsx                    ← MODIFY: add redirectIfAuthenticated to /login route
```

Do NOT create:
- Any form components — login has no form
- Any state management beyond what exists in `app.store.ts`
- Any new CSS classes

### References

- Acceptance Criteria source: [epics.md — Story 1.3](_bmad-output/planning-artifacts/epics.md)
- Architecture — Auth & Security: [architecture.md](_bmad-output/planning-artifacts/architecture.md) (Cookie-only auth section)
- Architecture — Service Layer: [architecture.md](_bmad-output/planning-artifacts/architecture.md) (`src/services/api.ts` and `auth.service.ts` patterns)
- Architecture — Route structure: [architecture.md](_bmad-output/planning-artifacts/architecture.md) (React Router v7 section)
- Previous story: [1-2-application-routing-layout-shell.md](_bmad-output/implementation-artifacts/1-2-application-routing-layout-shell.md)
- Deferred items resolved: [deferred-work.md](_bmad-output/implementation-artifacts/deferred-work.md)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `npm run build` → PASS (tsc -b + vite build, 82 modules, 0 errors)
- `npm run lint` → 2 pre-existing errors in `src/NeurologistDashboard/NeurologistDashboard.tsx` (unrelated to this story, present on baseline_commit 2a5593c)

### Completion Notes List

- AC #1 — `LoginPage` "Iniciar sesión" sets `window.location.href = ${VITE_API_BASE_URL}/auth/login`. No SPA navigation, no form.
- AC #2 — "¿Olvidaste tu contraseña?" sets `window.location.href = ${VITE_API_BASE_URL}/auth/forgot-password`.
- AC #3 — `LogoutButton` uses `useMutation` with `mutationFn: logout`. Both `onSuccess` and `onError` invoke `resetAndRedirect`, which: sets auth to `{ neurologist: null, status: 'unauthenticated' }`, calls `resetActiveSession()`, clears notifications, calls `queryClient.clear()`, and `navigate('/login')`. Button disabled while pending and labelled "Cerrando...".
- AC #4 — Verified no regression: `src/services/api.ts` still redirects on `res.status === 401` via `window.location.href = '/login'` (guarded by `pathname !== '/login'`). No changes made to `api.ts`.
- AC #5 — Verified no regression: `requireAuth` in `src/router/index.tsx` still calls `getMe()` on `auth.status === 'loading'`, dedupes via `authCheckInFlight`, sets `auth.status = 'authenticated'` on success. No changes made to `requireAuth`.
- AC #6 — Added `redirectIfAuthenticated` loader (synchronous, returns `Response | null`); reads Zustand via `useAppStore.getState()` and redirects to `/patients` only when `auth.status === 'authenticated'`. Does not call `getMe()`, so no extra network request.
- AppShell wraps `<LogoutButton />` in a `<div style={{ marginLeft: 'auto' }}>` per the blueprint note (LogoutButton doesn't accept a `style` prop).
- Only existing CSS classes used (`btn`, `btn-primary`, `btn-ghost`, `btn-sm`, `page`, `card`, `logo-title`, `logo-sub`, `sidebar-user`). Inline styles confined to structural layout.
- No new test files added; project has no test framework configured (verified in `package.json`). Story's verification gate is `npm run build`, which passes.

### File List

- `src/services/auth.service.ts` — MODIFIED (added `logout()`)
- `src/features/auth/components/LogoutButton.tsx` — NEW
- `src/shared/components/AppShell.tsx` — MODIFIED (imported and rendered `LogoutButton` in `.sidebar-user`)
- `src/features/auth/pages/LoginPage.tsx` — REWRITTEN (login + forgot password buttons)
- `src/router/index.tsx` — MODIFIED (added `redirectIfAuthenticated` loader, attached to `/login` route)

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-28 | Implemented Story 1.3 — Login & Logout: new `LogoutButton`, rewritten `LoginPage` (Auth0 redirect via `window.location.href`), `redirectIfAuthenticated` loader on `/login`, `logout()` service. All 6 ACs satisfied; `npm run build` passes. | Amelia (Dev Agent) |
