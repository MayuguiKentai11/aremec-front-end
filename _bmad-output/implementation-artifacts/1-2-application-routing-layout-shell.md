---
baseline_commit: 62c71344be0f0746bbf28a9305bc2983b5dd9e37
---

# Story 1.2: Application Routing & Layout Shell

Status: done

## Story

As a neurologist,
I want to navigate the portal with protected routes and a consistent layout,
so that I can access my workspace securely and find navigation items in a predictable location.

## Acceptance Criteria

1. **Router with requireAuth** — `src/router/index.tsx` defines all routes. Any unauthenticated user navigating to `/patients`, `/patients/new`, `/patients/:id`, `/patients/:id/session`, or `/sessions/:id` is redirected to `/login`.

2. **Root redirect** — Navigating to `/` redirects to `/patients`.

3. **requireAuth loader logic** — When `auth.status` in Zustand is `'loading'`, the loader calls `auth.service.ts#getMe()`, awaits the result, and only redirects on error (401 or network). If `getMe()` succeeds, the user proceeds to the protected route.

4. **AppShell layout** — `AppShell.tsx` wraps all protected routes. The rendered output contains a sidebar with navigation links, a main content area with `<Outlet>`, and `<ActiveSessionBanner>` placeholder renders above the Outlet.

5. **Public login route** — `/login` is a public route where `AppShell` does NOT render; `LoginPage` renders alone.

## Tasks / Subtasks

- [x] Export `Neurologist` type from store (AC: #3)
  - [x] In `src/store/app.store.ts` line 3: change `type Neurologist` to `export type Neurologist`
  - [x] No other changes to the store

- [x] Create `src/services/auth.service.ts` (AC: #3)
  - [x] Import `api` from `./api` and `Neurologist` from `../store/app.store`
  - [x] Export `async function getMe(): Promise<Neurologist>` — calls `api.get<Neurologist>('/me')`
  - [x] Do NOT add `logout()` yet — that is Story 1.3

- [x] Create `src/features/sessions/components/ActiveSessionBanner.tsx` (AC: #4)
  - [x] Reads `activeSession.sessionId` from `useAppStore`
  - [x] Returns `null` when `sessionId === null` — renders nothing
  - [x] Returns a placeholder `<div className="active-session-banner">Sesión activa</div>` when sessionId is set
  - [x] This is a placeholder; Story 3.1 implements the full banner with elapsed time

- [x] Create `src/shared/components/AppShell.tsx` (AC: #4)
  - [x] Import `Outlet`, `NavLink` from `react-router-dom`
  - [x] Import `ActiveSessionBanner` from `../../features/sessions/components/ActiveSessionBanner`
  - [x] Import `useAppStore` from `../../store/app.store`
  - [x] Render structure: `<div className="app-shell">` containing sidebar + `<div className="main">`
  - [x] Sidebar must use `.sidebar`, `.sidebar-logo`, `.logo-title`, `.logo-sub`, `.nav`, `.nav-item`, `.sidebar-user` CSS classes from `src/index.css`
  - [x] Navigation links: "Pacientes" → `/patients` using `NavLink` with `className={({ isActive }) => \`nav-item\${isActive ? ' active' : ''}\`}`
  - [x] Main area: `<ActiveSessionBanner />` immediately above `<Outlet />`
  - [x] Read `auth.neurologist` from `useAppStore` for the sidebar-user section (display name initials in avatar, full name in user-name, "Neurólogo" in user-role)
  - [x] No LogoutButton yet — Story 1.3 wires logout

- [x] Create `src/features/auth/pages/LoginPage.tsx` (AC: #5)
  - [x] Minimal stub — renders a centered page with "Portal AREMEC" title and "Iniciando sesión..." text
  - [x] Uses `<div className="page">` for outer container
  - [x] Story 1.3 completely rewrites this component with the login button logic

- [x] Replace `src/router/index.tsx` with full route structure (AC: #1, #2, #5)
  - [x] Import `createBrowserRouter`, `redirect`, `Navigate` from `react-router-dom`
  - [x] Import `AppShell` from `../shared/components/AppShell`
  - [x] Import `LoginPage` from `../features/auth/pages/LoginPage`
  - [x] Import `useAppStore` from `../store/app.store`
  - [x] Import `getMe` from `../services/auth.service`
  - [x] Define `requireAuth` loader function (see Dev Notes for implementation)
  - [x] Public route: `{ path: '/login', element: <LoginPage /> }`
  - [x] Layout route: `{ path: '/', element: <AppShell />, loader: requireAuth, children: [...] }`
  - [x] Index route child: `{ index: true, element: <Navigate to="/patients" replace /> }`
  - [x] Protected route stubs for: `/patients`, `/patients/new`, `/patients/:id`, `/patients/:id/session`, `/sessions/:id` using inline placeholder `<div>` elements (Story 2+ replaces)
  - [x] Export `router` as default

- [x] Verify build passes with `npm run build` (no TypeScript errors)

### Review Findings

- [x] [Review][Patch] Concurrent `requireAuth` invocations race on shared Zustand state [`src/router/index.tsx:7-21`]
- [x] [Review][Patch] Initials crash on names with consecutive/leading/trailing spaces [`src/shared/components/AppShell.tsx:8`]
- [x] [Review][Defer] `/login` route not guarded for authenticated users [`src/router/index.tsx:22-25`] — deferred, pre-existing; Story 1.3 rewrites LoginPage and will add redirect
- [x] [Review][Defer] `setAuth(Partial<AuthSlice>)` allows incoherent auth state [`src/store/app.store.ts:24,36`] — deferred, pre-existing from Story 1.1 design

## Dev Notes

### Critical constraints — read before writing any code

**Only `src/store/app.store.ts` and `src/router/index.tsx` are MODIFIED. Everything else is NEW.**

**CSS: use ONLY existing classes from `src/index.css`.** No inline styles, no new CSS classes. The relevant classes are: `.app-shell`, `.sidebar`, `.sidebar-logo`, `.logo-title`, `.logo-sub`, `.nav`, `.nav-label`, `.nav-item`, `.nav-item.active`, `.nav-icon`, `.sidebar-user`, `.avatar`, `.user-name`, `.user-role`, `.main`. The `NeurologistDashboard.tsx` prototype uses all of these — read it as a visual reference but do NOT modify it.

**`erasableSyntaxOnly: true` in `tsconfig.app.json`.** TS parameter properties (`constructor(public foo: T)`) are forbidden. Declare fields explicitly and assign in the body. This is a build-breaking constraint from Story 1.1.

**`fetch` is forbidden outside `src/services/api.ts`.** `auth.service.ts` must use `api.get()`, not `fetch()` directly.

**No `localStorage`, no token handling.** `getMe()` relies on the session cookie sent automatically via `credentials: 'include'` (already baked into `api.ts`). No parsing of cookies or tokens.

**Zustand state access outside React components** — In the `requireAuth` loader, access the Zustand store via `useAppStore.getState()` (not the hook). This is the correct Zustand pattern for non-component contexts.

**React Router v7 redirect** — Use `return redirect('/login')` (not `throw redirect(...)`) in the loader for consistency. Import `redirect` from `react-router-dom`.

### Existing project state

| File | State | Notes |
|---|---|---|
| `src/router/index.tsx` | **REPLACE** — currently a 1-route stub | Story 1.2 replaces with full structure |
| `src/store/app.store.ts` | **MINOR EDIT** — add `export` to `Neurologist` type at line 3 | No other changes |
| `src/main.tsx` | unchanged | Already wired with `RouterProvider` + `QueryClientProvider` |
| `src/services/api.ts` | unchanged | Has `api.get()` ready for `auth.service.ts` |
| `src/shared/components/ErrorMessage.tsx` | unchanged | Available for use if needed |
| `src/NeurologistDashboard/NeurologistDashboard.tsx` | **DO NOT TOUCH** | Reference only |

### requireAuth loader blueprint

```ts
// src/router/index.tsx
import { createBrowserRouter, redirect, Navigate } from 'react-router-dom'
import { useAppStore } from '../store/app.store'
import { getMe } from '../services/auth.service'
import AppShell from '../shared/components/AppShell'
import LoginPage from '../features/auth/pages/LoginPage'

async function requireAuth() {
  const { auth, setAuth } = useAppStore.getState()

  if (auth.status === 'authenticated') return null
  if (auth.status === 'unauthenticated') return redirect('/login')

  // status === 'loading' — validate session against backend
  try {
    const neurologist = await getMe()
    setAuth({ neurologist, status: 'authenticated' })
    return null
  } catch {
    setAuth({ neurologist: null, status: 'unauthenticated' })
    return redirect('/login')
  }
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <AppShell />,
    loader: requireAuth,
    children: [
      { index: true, element: <Navigate to="/patients" replace /> },
      // Story 2.2 replaces this stub:
      { path: 'patients', element: <div className="page"><p>Pacientes — próximamente</p></div> },
      // Story 2.1 replaces this stub:
      { path: 'patients/new', element: <div className="page"><p>Nuevo paciente — próximamente</p></div> },
      // Story 2.3 replaces this stub:
      { path: 'patients/:id', element: <div className="page"><p>Perfil del paciente — próximamente</p></div> },
      // Story 3.x replaces this stub:
      { path: 'patients/:id/session', element: <div className="page"><p>Monitor de sesión — próximamente</p></div> },
      // Story 4.x replaces this stub:
      { path: 'sessions/:id', element: <div className="page"><p>Detalle de sesión — próximamente</p></div> },
    ],
  },
])

export default router
```

### auth.service.ts blueprint

```ts
// src/services/auth.service.ts
import { api } from './api'
import type { Neurologist } from '../store/app.store'

export async function getMe(): Promise<Neurologist> {
  return api.get<Neurologist>('/me')
}
```

Note: `api.ts` prepends `VITE_API_BASE_URL` (which is `https://aremec-ws-latest.onrender.com/api/v1`), so passing `'/me'` resolves to `GET /api/v1/me`. ✓

### AppShell.tsx blueprint

```tsx
// src/shared/components/AppShell.tsx
import { NavLink, Outlet } from 'react-router-dom'
import { useAppStore } from '../../store/app.store'
import { ActiveSessionBanner } from '../../features/sessions/components/ActiveSessionBanner'

export default function AppShell() {
  const neurologist = useAppStore((s) => s.auth.neurologist)
  const initials = neurologist?.name
    ? neurologist.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-title">AREMEC</div>
          <div className="logo-sub">PORTAL CLÍNICO</div>
        </div>
        <nav className="nav">
          <div className="nav-label">PRINCIPAL</div>
          <NavLink
            to="/patients"
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon">👥</span>
            Pacientes
          </NavLink>
        </nav>
        <div className="sidebar-user">
          <div className="avatar">{initials}</div>
          <div>
            <div className="user-name">{neurologist?.name ?? 'Neurólogo'}</div>
            <div className="user-role">Neurólogo</div>
          </div>
        </div>
      </aside>
      <div className="main">
        <ActiveSessionBanner />
        <Outlet />
      </div>
    </div>
  )
}
```

### ActiveSessionBanner.tsx blueprint

```tsx
// src/features/sessions/components/ActiveSessionBanner.tsx
import { useAppStore } from '../../../store/app.store'

export function ActiveSessionBanner() {
  const sessionId = useAppStore((s) => s.activeSession.sessionId)
  if (!sessionId) return null
  // Story 3.1 replaces this with elapsed time + session controls
  return <div style={{ padding: '8px 16px', background: 'var(--accent)', color: '#fff', fontSize: 13 }}>Sesión activa</div>
}
```

Note: Using an inline style here is acceptable since this is a placeholder component with no corresponding CSS class yet. Story 3.1 replaces the entire component.

### LoginPage.tsx blueprint (stub)

```tsx
// src/features/auth/pages/LoginPage.tsx
// Story 1.3 replaces this entirely with the real login implementation
export default function LoginPage() {
  return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="card">
        <h1 className="logo-title">AREMEC</h1>
        <p style={{ color: 'var(--text2)', marginTop: 8 }}>Portal Clínico</p>
      </div>
    </div>
  )
}
```

### Learnings from Story 1.1 (apply here)

- **`erasableSyntaxOnly: true`** — Already caught in Story 1.1. No constructor parameter properties in any new file.
- **Zustand `set(state => ({...}))`** — The `setAuth` action in the store already uses the correct functional form. The new `requireAuth` loader calls `setAuth(patch)` which delegates to the correct form. ✓
- **api.ts 401 guard** — When `getMe()` returns 401, `api.ts` redirects to `/login` by setting `window.location.href`. This happens BEFORE the `requireAuth` catch block fires. This creates a potential double-redirect on first page load if the session is already expired. This is acceptable — the behavior is correct (user ends up at `/login`).
- **No pre-existing TS errors** — Story 1.1 cleared all build errors. This story must also ship with a clean `npm run build`.

### Project structure for this story

```
src/
  router/
    index.tsx                 ← MODIFIED: full route structure (replaces stub)
  store/
    app.store.ts              ← MODIFIED: export Neurologist type (1 word change)
  services/
    auth.service.ts           ← NEW: getMe()
  shared/
    components/
      AppShell.tsx            ← NEW: sidebar + nav + ActiveSessionBanner + Outlet
  features/
    auth/
      pages/
        LoginPage.tsx         ← NEW: stub (Story 1.3 replaces)
    sessions/
      components/
        ActiveSessionBanner.tsx  ← NEW: placeholder (Story 3.1 replaces)
```

### File structure to NOT create

Do NOT create stub files for:
- `PatientListPage.tsx`, `PatientRegistrationPage.tsx`, `PatientProfilePage.tsx` — these are Story 2.x scope; use inline placeholder elements in the router instead
- `SessionMonitorPage.tsx`, `SessionDetailPage.tsx` — Story 3.x and 4.x scope
- `LogoutButton.tsx` — Story 1.3 scope

### References

- Acceptance Criteria: [epics.md — Story 1.2](../_bmad-output/planning-artifacts/epics.md#story-12-application-routing--layout-shell)
- Architecture — Routing: [architecture.md — Frontend Architecture](../_bmad-output/planning-artifacts/architecture.md#routing--react-router-v7)
- Architecture — AppShell gap: [architecture.md — Gap Analysis Results](../_bmad-output/planning-artifacts/architecture.md#gap-analysis-results)
- Architecture — Route guard pattern: [architecture.md — Process Patterns](../_bmad-output/planning-artifacts/architecture.md#process-patterns)
- Architecture — Project structure: [architecture.md — Complete Project Directory Structure](../_bmad-output/planning-artifacts/architecture.md#complete-project-directory-structure)
- Previous story: [1-1-project-foundation-infrastructure.md](./1-1-project-foundation-infrastructure.md)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None — clean run.

### Completion Notes List

- AC #1 satisfied: All 5 protected paths (`/patients`, `/patients/new`, `/patients/:id`, `/patients/:id/session`, `/sessions/:id`) are children of the `/` layout route guarded by `requireAuth`. Unauthenticated visitors land at `/login` via `redirect('/login')`.
- AC #2 satisfied: `{ index: true, element: <Navigate to="/patients" replace /> }` redirects `/` → `/patients`.
- AC #3 satisfied: `requireAuth` loader implements the three-branch logic exactly — `authenticated` → pass, `unauthenticated` → redirect, `loading` → `await getMe()` then `setAuth({ neurologist, status: 'authenticated' })` on success, `setAuth({ neurologist: null, status: 'unauthenticated' })` + redirect on error. Zustand store accessed via `useAppStore.getState()` (correct non-hook pattern).
- AC #4 satisfied: `AppShell` renders sidebar (logo + nav + sidebar-user with initials/name/role) + `<div className="main">` with `<ActiveSessionBanner />` rendered above `<Outlet />`. Uses only the existing CSS classes from `src/index.css` — no inline styles, no new classes.
- AC #5 satisfied: `/login` is a sibling top-level route — `AppShell` does NOT wrap it; `LoginPage` renders alone with `<div className="page">` and existing `.card`/`.logo-title`/`.card-sub` classes.
- Constraint compliance: No `fetch` outside `api.ts` (auth.service.ts uses `api.get`). No `localStorage`. No constructor parameter properties. No inline styles. No new CSS classes. `NeurologistDashboard.tsx` untouched.
- ActiveSessionBanner uses `className="active-session-banner"` per the subtask text rather than the inline-style variant in the Dev Notes blueprint; the class is currently unstyled (placeholder) and Story 3.1 will replace the component entirely.
- LoginPage uses existing `.page` / `.card` / `.logo-title` / `.card-sub` classes (no inline styles), satisfying the "only existing CSS classes" constraint while displaying the required "Portal AREMEC" title and "Iniciando sesión..." text.
- Build verification: `npm run build` → `tsc -b && vite build` completed cleanly. 81 modules transformed in 218 ms. Zero TypeScript errors. Output: `dist/assets/index-AXE6wE-o.js` 313.57 kB / `dist/assets/index-BhLidN0X.css` 14.91 kB.

### File List

**New**
- `src/services/auth.service.ts`
- `src/features/sessions/components/ActiveSessionBanner.tsx`
- `src/features/auth/pages/LoginPage.tsx`
- `src/shared/components/AppShell.tsx`

**Modified**
- `src/store/app.store.ts` — added `export` to `Neurologist` type
- `src/router/index.tsx` — replaced 1-route stub with full route structure + `requireAuth` loader
- `_bmad-output/implementation-artifacts/1-2-application-routing-layout-shell.md` — workflow tracking (frontmatter `baseline_commit`, Status, Tasks checkboxes, Dev Agent Record, File List, Change Log)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — status transitions for `1-2-application-routing-layout-shell`

## Change Log

| Date       | Version | Description                                                                                  | Author |
| ---------- | ------- | -------------------------------------------------------------------------------------------- | ------ |
| 2026-05-28 | 0.1.0   | Implemented full routing structure with `requireAuth` loader, AppShell layout, ActiveSessionBanner placeholder, LoginPage stub, and `getMe()` auth service. Build clean. | Dev    |

