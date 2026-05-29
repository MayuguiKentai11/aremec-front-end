---
baseline_commit: 2f9e267469983d93366d20a4224aff8f3d7b9f4f
---

# Story 3.1: Session Lifecycle — Open, Close & Active Banner

Status: done

## Story

As a neurologist,
I want to open and close VR therapy sessions and see a persistent indicator while a session is active,
So that I know at all times whether a session is in progress and can manage it from any screen.

## Acceptance Criteria

1. **Session opens via POST /sessions** — Clicking "Iniciar sesión" on the "Resumen" tab of `PatientProfilePage` calls `POST /sessions` with the patient's UUID; on success, `sessionId` and `startedAt` are stored in Zustand `activeSession`, and the neurologist is navigated to `/patients/:id/session` (`SessionMonitorPage`).

2. **ActiveSessionBanner shows elapsed time** — While `activeSession.sessionId` is non-null in Zustand, `ActiveSessionBanner` renders above the Outlet in AppShell, displaying session state and elapsed time since `startedAt` in `HH:mm:ss` format, updated every second.

3. **Session closes via PATCH /sessions/:id/complete** — Clicking "Cerrar sesión" on `SessionMonitorPage` calls `PATCH /sessions/:id/complete`; on 200, Zustand `activeSession` is fully reset (`sessionId = null`, `startedAt = null`, `wsStatus = 'disconnected'`) and the "Sesión activa" tab on `PatientProfilePage` becomes hidden automatically.

4. **5xx error on open** — `POST /sessions` returning 5xx renders `<ErrorMessage>` inline below the button; the neurologist remains on `PatientProfilePage`.

## Tasks / Subtasks

- [x] Create `src/features/sessions/session.types.ts` (AC: #1, #3)
  - [x] Define and export `Session` type: `{ sessionId: string; startedAt: Date; patientId: string; status: string }`

- [x] Create `src/services/sessions.service.ts` (AC: #1, #3)
  - [x] Define file-private `SessionRaw`: `{ session_id: string; started_at: string; patient_id: string; status: string }`
  - [x] Define file-private `toSession(raw: SessionRaw): Session` transformer (snake_case → camelCase, parses `started_at` ISO string to `new Date(...)`)
  - [x] Export `createSession(patientId: string): Promise<Session>` — `api.post<SessionRaw>('/sessions', { patient_id: patientId })` then `toSession()`
  - [x] Export `completeSession(sessionId: string): Promise<void>` — `api.patch<void>(`/sessions/${encodeURIComponent(sessionId)}/complete`, {})`

- [x] Modify `src/features/sessions/components/SessionOpenButton.tsx` (AC: #1, #4)
  - [x] Remove `_patientId` rename; use `patientId` directly
  - [x] Add `useMutation({ mutationFn: () => createSession(patientId), onSuccess })` from TanStack Query v5
  - [x] In `onSuccess(session)`: call `setActiveSession({ sessionId: session.sessionId, startedAt: session.startedAt, wsStatus: 'disconnected' })`, then `navigate(`/patients/${patientId}/session`)`
  - [x] Read `setActiveSession` from store: `useAppStore(s => s.setActiveSession)`
  - [x] Use `useNavigate()` from react-router-dom for navigation
  - [x] Button: `disabled={isPending}` — label changes to `"Iniciando..."` when pending
  - [x] Render `{error && <ErrorMessage error={error} />}` below the button (fragment wrapper needed)

- [x] Create `src/features/sessions/components/SessionCloseButton.tsx` (AC: #3)
  - [x] Accept props: `{ sessionId: string; patientId: string }`
  - [x] `useMutation({ mutationFn: () => completeSession(sessionId), onSuccess })`
  - [x] In `onSuccess`: call `resetActiveSession()` from `useAppStore(s => s.resetActiveSession)`, then `navigate(`/patients/${patientId}`, { replace: true })`
  - [x] Button: `className="btn btn-danger"`, `disabled={isPending}`, label `"Cerrar sesión"` / `"Cerrando..."`
  - [x] Render `{error && <ErrorMessage error={error} />}` below the button

- [x] Modify `src/features/sessions/components/ActiveSessionBanner.tsx` (AC: #2)
  - [x] Also read `startedAt` from Zustand: `useAppStore(s => s.activeSession.startedAt)`
  - [x] Add `useState<number>(0)` for elapsed seconds
  - [x] Add `useEffect` that: (1) returns early if `!startedAt`, (2) sets initial elapsed immediately, (3) runs `setInterval` at 1000ms updating elapsed as `Math.floor((Date.now() - startedAt.getTime()) / 1000)`, (4) clears interval on cleanup and when `startedAt` changes
  - [x] Add `formatElapsed(s: number): string` helper: `[h, m, s]` using integer math, each padded to 2 digits with `padStart(2, '0')`, joined with `':'`
  - [x] Update render: `<div className="active-session-banner">Sesión activa — {formatElapsed(elapsed)}</div>`

- [x] Add `.active-session-banner` CSS to `src/index.css` (AC: #2)
  - [x] Add under `/* ── ACTIVE SESSION BANNER ── */` section after the topbar section
  - [x] Style: amber background (`var(--warn)`), white text, monospace font, `padding: 8px 32px`, `font-size: 12px`, `font-weight: 600`, `flex-shrink: 0`

- [x] Create `src/features/sessions/pages/SessionMonitorPage.tsx` (AC: #1, #3)
  - [x] `useParams<{ id: string }>()` to get `patientId`
  - [x] `useAppStore(s => s.activeSession.sessionId)` to get `sessionId`
  - [x] Guard: if `!sessionId` render `<Navigate to={`/patients/${patientId ?? ''}`} replace />` (import `Navigate` from react-router-dom)
  - [x] Render `.page` wrapper with `.section-header` containing `<h1 className="page-title">Monitor de sesión</h1>` and `<SessionCloseButton sessionId={sessionId} patientId={patientId!} />`
  - [x] Two placeholder `.card` elements below: one for metrics panel ("Panel de métricas — Story 3.3"), one for VR stream ("Stream VR en vivo — Story 3.4")
  - [x] Export as `default`

- [x] Modify `src/router/index.tsx` (AC: #1)
  - [x] Add import: `import SessionMonitorPage from '../features/sessions/pages/SessionMonitorPage'`
  - [x] Replace line 63 stub `{ path: 'patients/:id/session', element: <div ...> }` with `{ path: 'patients/:id/session', element: <SessionMonitorPage /> }`

- [x] Verify `npm run build` passes (0 TypeScript errors)

## Dev Notes

### Critical Constraints — Read Before Writing Any Code

**`erasableSyntaxOnly: true` in `tsconfig.app.json`.** No constructor parameter properties anywhere. Declare class fields explicitly. (Carried from Story 1.1 — applies to all stories.)

**No `fetch` in components or hooks.** All API calls go through `sessions.service.ts` → `api.post/patch`. Never call `api` or `fetch` directly from a component.

**TanStack Query v5 syntax only:**
- `isPending` not `isLoading` (v5 — `isLoading` is a runtime error)
- `useMutation` uses `mutationFn`, `onSuccess`, `onError` — NOT `mutate({ onSuccess })` inline callbacks (v5 moved callbacks to `useMutation` options)
- No second argument to `mutate()` for callbacks in v5

**Zustand selector pattern (performance).** Always use selector form:
```ts
const setActiveSession = useAppStore(s => s.setActiveSession)  // ✓
const resetActiveSession = useAppStore(s => s.resetActiveSession)  // ✓
const { setActiveSession } = useAppStore()  // ✗ — causes full store rerender
```

**`setActiveSession` is a partial merge, not replace.** The store action is:
```ts
setActiveSession: (patch) => set((s) => ({ activeSession: { ...s.activeSession, ...patch } }))
```
Pass only the fields being changed. The other fields are preserved automatically.

**`resetActiveSession` sets ALL fields to initial state** (`sessionId: null, startedAt: null, wsStatus: 'disconnected'`). Use this — do NOT manually reconstruct the reset object.

**`startedAt` stored as `Date`, not ISO string.** The service transforms `raw.started_at` with `new Date(raw.started_at)` before storing. The Zustand slice type is `Date | null`. The elapsed timer works with `startedAt.getTime()` directly.

**`wsStatus` on session open = `'disconnected'`.** The WebSocket is NOT established in Story 3.1 — that is Story 3.2. Set `wsStatus: 'disconnected'` when storing the opened session. Story 3.2 will update it to `'connected'`.

**`useNavigate` must not be called conditionally.** Call it at the top of the component, store the result, then call the returned function in callbacks.

**`Navigate` component for redirect guard.** In `SessionMonitorPage`, guard with `if (!sessionId) return <Navigate to={...} replace />` — NOT `useNavigate` in `useEffect`. The component-form redirect is synchronous and avoids a render cycle.

**No `useState + useEffect` for server data** (architecture rule). The elapsed timer is LOCAL UI state (counting seconds) — `useState + useEffect + setInterval` is the correct pattern here. This is not an API call.

**`active-session-banner` class does NOT exist in CSS yet.** The existing `ActiveSessionBanner.tsx` references it but no CSS rule defines it — it renders unstyled. Story 3.1 MUST add the CSS to `src/index.css`. Inline styles alone are insufficient because the banner is a persistent global element that needs consistent layout.

**`.btn-danger` CSS class DOES exist.** Confirmed in `src/index.css` (line 340): `background: var(--accent3); color: white`. Use it for "Cerrar sesión" without any modification.

**`api.patch<void>(...)` pattern.** The `api.ts` wrapper returns `undefined` when response has no JSON body. `completeSession` returns `Promise<void>` — the caller does not use the return value.

### Current State of Files Being Modified

| File | Status | Current State |
|---|---|---|
| `src/features/sessions/components/SessionOpenButton.tsx` | MODIFY | Disabled stub with `patientId: _patientId` (unused prop). Replace entire function body — keep the `Props` type definition but change `_patientId` to `patientId`. |
| `src/features/sessions/components/ActiveSessionBanner.tsx` | MODIFY | Reads `sessionId` only; renders unstyled `<div className="active-session-banner">Sesión activa</div>`. Add `startedAt` read + elapsed timer. |
| `src/router/index.tsx` | MODIFY | Line 63: `{ path: 'patients/:id/session', element: <div className="page"><p>Monitor de sesión — próximamente</p></div> }` — replace element only. |
| `src/index.css` | MODIFY | No `.active-session-banner` rule exists. Add CSS section for it. |

**Do NOT touch:** `src/services/api.ts`, `src/store/app.store.ts`, `src/services/auth.service.ts`, `src/services/patients.service.ts`, `src/shared/components/*`, `src/features/patients/*`, `src/router/index.tsx` loader functions (`requireAuth`, `redirectIfAuthenticated`).

### Existing Store Interface

```ts
// src/store/app.store.ts — complete interface for this story
activeSession: {
  sessionId: string | null
  startedAt: Date | null                // ← Date object, not ISO string
  wsStatus: 'connected' | 'reconnecting' | 'polling' | 'disconnected'
}

setActiveSession: (patch: Partial<ActiveSessionSlice>) => void  // partial merge
resetActiveSession: () => void  // sets sessionId=null, startedAt=null, wsStatus='disconnected'
```

### Existing API Methods (from api.ts)

```ts
api.get<T>(path)            // GET with credentials: 'include'
api.post<T>(path, body)     // POST with JSON body
api.patch<T>(path, body)    // PATCH with JSON body
```
All methods auto-include `credentials: 'include'` and `Content-Type: application/json`. 401 globally redirects to `/login`. 5xx throws `ApiError` — caught by TanStack Query `error` state.

### Existing Shared Components

```tsx
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
// <ErrorMessage error={error} /> accepts unknown, extracts .message from ApiError | Error
```

### Blueprints

**`src/features/sessions/session.types.ts`:**
```ts
export type Session = {
  sessionId: string
  startedAt: Date
  patientId: string
  status: string
}
```

**`src/services/sessions.service.ts`:**
```ts
import { api } from './api'
import type { Session } from '../features/sessions/session.types'

type SessionRaw = {
  session_id: string
  started_at: string
  patient_id: string
  status: string
}

function toSession(raw: SessionRaw): Session {
  return {
    sessionId: raw.session_id,
    startedAt: new Date(raw.started_at),
    patientId: raw.patient_id,
    status: raw.status,
  }
}

export async function createSession(patientId: string): Promise<Session> {
  const raw = await api.post<SessionRaw>('/sessions', { patient_id: patientId })
  return toSession(raw)
}

export async function completeSession(sessionId: string): Promise<void> {
  await api.patch<void>(`/sessions/${encodeURIComponent(sessionId)}/complete`, {})
}
```

**`src/features/sessions/components/SessionOpenButton.tsx` (full replacement):**
```tsx
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../../store/app.store'
import { createSession } from '../../../services/sessions.service'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'

type Props = {
  patientId: string
}

export function SessionOpenButton({ patientId }: Props) {
  const navigate = useNavigate()
  const setActiveSession = useAppStore((s) => s.setActiveSession)

  const { mutate, isPending, error } = useMutation({
    mutationFn: () => createSession(patientId),
    onSuccess: (session) => {
      setActiveSession({
        sessionId: session.sessionId,
        startedAt: session.startedAt,
        wsStatus: 'disconnected',
      })
      navigate(`/patients/${patientId}/session`)
    },
  })

  return (
    <>
      <button
        className="btn btn-primary"
        disabled={isPending}
        onClick={() => mutate()}
      >
        {isPending ? 'Iniciando...' : 'Iniciar sesión'}
      </button>
      {error && <ErrorMessage error={error} />}
    </>
  )
}
```

**`src/features/sessions/components/SessionCloseButton.tsx`:**
```tsx
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../../store/app.store'
import { completeSession } from '../../../services/sessions.service'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'

type Props = {
  sessionId: string
  patientId: string
}

export function SessionCloseButton({ sessionId, patientId }: Props) {
  const navigate = useNavigate()
  const resetActiveSession = useAppStore((s) => s.resetActiveSession)

  const { mutate, isPending, error } = useMutation({
    mutationFn: () => completeSession(sessionId),
    onSuccess: () => {
      resetActiveSession()
      navigate(`/patients/${patientId}`, { replace: true })
    },
  })

  return (
    <>
      <button
        className="btn btn-danger"
        disabled={isPending}
        onClick={() => mutate()}
      >
        {isPending ? 'Cerrando...' : 'Cerrar sesión'}
      </button>
      {error && <ErrorMessage error={error} />}
    </>
  )
}
```

**`src/features/sessions/components/ActiveSessionBanner.tsx` (full replacement):**
```tsx
import { useState, useEffect } from 'react'
import { useAppStore } from '../../../store/app.store'

function formatElapsed(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

export function ActiveSessionBanner() {
  const sessionId = useAppStore((s) => s.activeSession.sessionId)
  const startedAt = useAppStore((s) => s.activeSession.startedAt)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!startedAt) {
      setElapsed(0)
      return
    }
    setElapsed(Math.floor((Date.now() - startedAt.getTime()) / 1000))
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.getTime()) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [startedAt])

  if (!sessionId) return null
  return (
    <div className="active-session-banner">
      Sesión activa — {formatElapsed(elapsed)}
    </div>
  )
}
```

**CSS to add to `src/index.css`** (after `.topbar` section, before `.page` section):
```css
/* ── ACTIVE SESSION BANNER ── */
.active-session-banner {
  background: var(--warn);
  color: white;
  font-size: 12px;
  font-weight: 600;
  font-family: var(--mono);
  padding: 8px 32px;
  letter-spacing: 0.3px;
  flex-shrink: 0;
}
```

**`src/features/sessions/pages/SessionMonitorPage.tsx`:**
```tsx
import { useParams, Navigate } from 'react-router-dom'
import { useAppStore } from '../../../store/app.store'
import { SessionCloseButton } from '../components/SessionCloseButton'

export default function SessionMonitorPage() {
  const { id: patientId } = useParams<{ id: string }>()
  const sessionId = useAppStore((s) => s.activeSession.sessionId)

  if (!sessionId) return <Navigate to={`/patients/${patientId ?? ''}`} replace />

  return (
    <div className="page">
      <div className="section-header">
        <h1 className="page-title">Monitor de sesión</h1>
        <SessionCloseButton sessionId={sessionId} patientId={patientId!} />
      </div>
      <div className="card" style={{ marginBottom: 24 }}>
        <p style={{ color: 'var(--text2)', fontSize: 13 }}>
          Panel de métricas en tiempo real — disponible en Story 3.3
        </p>
      </div>
      <div className="card">
        <p style={{ color: 'var(--text2)', fontSize: 13 }}>
          Stream VR en vivo — disponible en Story 3.4
        </p>
      </div>
    </div>
  )
}
```

**`src/router/index.tsx` — change only the `/patients/:id/session` route:**
```tsx
// Add import at top with other page imports:
import SessionMonitorPage from '../features/sessions/pages/SessionMonitorPage'

// Replace stub (currently line 63):
// { path: 'patients/:id/session', element: <div className="page"><p>Monitor de sesión — próximamente</p></div> },
// With:
{ path: 'patients/:id/session', element: <SessionMonitorPage /> },
```

### Project Structure for This Story

```
src/
  features/
    sessions/                               ← exists (created in Story 2.3)
      components/
        SessionOpenButton.tsx               ← MODIFY: wire POST /sessions + navigate
        SessionCloseButton.tsx              ← NEW: wire PATCH /sessions/:id/complete + reset
        ActiveSessionBanner.tsx             ← MODIFY: add elapsed timer
      pages/
        SessionMonitorPage.tsx              ← NEW: monitor stub with close button + placeholders
      session.types.ts                      ← NEW: Session type
  services/
    sessions.service.ts                     ← NEW: createSession(), completeSession()
  router/
    index.tsx                               ← MODIFY: wire /patients/:id/session route
  index.css                                 ← MODIFY: add .active-session-banner CSS rule
```

**Do NOT create for this story:**
- `src/features/sessions/hooks/useSession.ts` — needed for Stories 3.2+, not 3.1
- `src/features/sessions/hooks/useSessionWebSocket.ts` — Story 3.2
- `src/features/sessions/components/MetricsPanel.tsx` — Story 3.3
- `src/features/sessions/components/CloudflareStreamPlayer.tsx` — Story 3.4
- `src/features/sessions/components/WsStatusIndicator.tsx` — Story 3.2
- `src/features/sessions/components/SessionCompletionToast.tsx` — Story 3.2
- `src/services/metrics.service.ts` — Epic 4
- Any new CSS classes beyond `.active-session-banner`

### Cross-Story Awareness

**What Story 3.2 will add to this story's files:**
- `SessionMonitorPage.tsx` will import `useSessionWebSocket` (not yet implemented)
- `SessionMonitorPage.tsx` will render `WsStatusIndicator` and `SessionCompletionToast`
- `sessions.service.ts` will gain `getSessionMetrics()` (for polling fallback)
- `session.types.ts` will gain `LevelMetrics`, `MLField<T>`, `WsEvent` types
- `ActiveSessionBanner` will get `wsStatus` display in Story 3.2+

**Placeholder panels in `SessionMonitorPage` are intentional.** Do NOT import or reference `MetricsPanel`, `CloudflareStreamPlayer`, or any Story 3.3/3.4 components — they don't exist yet and would cause build errors.

### Previous Story Intelligence (Story 2.3 / Epic 2)

- **TanStack Query v5:** `isPending` (not `isLoading`). `useMutation` takes `{ mutationFn, onSuccess }` — callbacks in hook options, NOT passed to `mutate()`.
- **Zustand selector pattern confirmed:** `useAppStore(s => s.slice.action)` — selector form only.
- **No snake_case in components.** All API responses transformed in the service layer before any React code sees them.
- **`useParams` returns strings.** Use `patientId!` (non-null assertion) — route guarantees the param is present. Never parse or coerce it.
- **Build must stay green at 0 TypeScript errors.** Run `npm run build` as final verification step.
- **No test infrastructure.** This project has no test files (MVP, single developer). Do not create test files.

### References

- Acceptance criteria: [epics.md — Story 3.1](_bmad-output/planning-artifacts/epics.md)
- FR-3.1: Session open spec; FR-3.2: Session close spec; FR-3.3: Active banner spec
- Architecture — Service layer: `sessions.service.ts` structure [architecture.md](_bmad-output/planning-artifacts/architecture.md)
- Architecture — Zustand `activeSession` slice: `sessionId`, `startedAt`, `wsStatus` [architecture.md](_bmad-output/planning-artifacts/architecture.md)
- Architecture — Route: `/patients/:id/session → SessionMonitorPage` [architecture.md](_bmad-output/planning-artifacts/architecture.md)
- Architecture — WebSocket boundary: `useSessionWebSocket` owns WS exclusively (Story 3.2)
- Previous story: [2-3-patient-profile-page.md](_bmad-output/implementation-artifacts/2-3-patient-profile-page.md)
- Deferred items: [deferred-work.md](_bmad-output/implementation-artifacts/deferred-work.md)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (PAI / bmad-create-story workflow)

### Debug Log References

None — implementation followed the story blueprints verbatim; `npm run build` passed first attempt (0 TypeScript errors).

### Completion Notes List

- **AC #1 (open via POST /sessions):** `SessionOpenButton` wires `useMutation` → `createSession(patientId)`, stores `sessionId`/`startedAt`/`wsStatus: 'disconnected'` via `setActiveSession` partial merge, then navigates to `/patients/:id/session`.
- **AC #2 (banner elapsed time):** `ActiveSessionBanner` reads `startedAt`, runs a 1s `setInterval` computing elapsed from `startedAt.getTime()`, formats `HH:mm:ss`. CSS `.active-session-banner` added to `src/index.css`. Banner renders in `AppShell` only while `sessionId` is non-null.
- **AC #3 (close via PATCH /sessions/:id/complete):** `SessionCloseButton` calls `completeSession(sessionId)`, then `resetActiveSession()` (clears all session fields) and navigates back to the patient profile with `replace: true`. The "Sesión activa" tab on `PatientProfilePage` is gated on `sessionId` and hides automatically on reset.
- **AC #4 (5xx on open):** TanStack Query `error` state renders `<ErrorMessage>` inline below the open button; no navigation occurs, neurologist stays on `PatientProfilePage`.
- `SessionMonitorPage` guards with `<Navigate replace />` when `sessionId` is null and renders intentional placeholder cards for Story 3.3 (metrics) and 3.4 (VR stream).
- Followed all critical constraints: TanStack Query v5 (`isPending`, callbacks in hook options), Zustand selector form, `startedAt` as `Date`, no `fetch` in components (all via `sessions.service.ts`), no parameter properties.
- No test files created — project has no test infrastructure per Dev Notes (MVP, single developer).

### File List

**New:**
- `src/features/sessions/session.types.ts`
- `src/services/sessions.service.ts`
- `src/features/sessions/components/SessionCloseButton.tsx`
- `src/features/sessions/pages/SessionMonitorPage.tsx`

**Modified:**
- `src/features/sessions/components/SessionOpenButton.tsx`
- `src/features/sessions/components/ActiveSessionBanner.tsx`
- `src/index.css`
- `src/router/index.tsx`

## Change Log

| Date | Change |
|---|---|
| 2026-05-29 | Implemented Story 3.1 — session open/close lifecycle, elapsed-time active banner, `SessionMonitorPage`, sessions service + types. All 4 ACs satisfied; `npm run build` passes (0 TS errors). Status → review. |
| 2026-05-29 | Code review completed. 1 decision-needed, 3 patches, 7 deferred, 11 dismissed. |

### Review Findings

- [x] [Review][Patch] Hide banner when `startedAt` is null — `if (!sessionId || !startedAt) return null` applied [ActiveSessionBanner.tsx]
- [x] [Review][Patch] Negative elapsed time when client clock behind server — `Math.max(0, ...)` clamp applied [ActiveSessionBanner.tsx:formatElapsed]
- [x] [Review][Patch] `Invalid Date` not guarded in `useEffect` — `isNaN(startedAt.getTime())` guard added [ActiveSessionBanner.tsx:useEffect]
- [x] [Review][Patch] CSS `color: white` hardcoded literal — replaced with `var(--surface)` [index.css:.active-session-banner]
- [x] [Review][Defer] `status` field is untyped `string` on `Session` type — no union type; deferred, pre-existing
- [x] [Review][Defer] `toSession` doesn't validate `raw.started_at` before `new Date()` — API contract assumption; deferred, pre-existing
- [x] [Review][Defer] Session state lost on browser refresh — no persistence layer; deferred, accepted MVP limitation
- [x] [Review][Defer] Initial `00:00:00` flicker on `ActiveSessionBanner` mount — inherent to useState(0) + useEffect pattern; deferred, pre-existing
- [x] [Review][Defer] `setInterval` clock drift over long sessions — visual only, timer recalculates from wall clock; deferred, pre-existing
- [x] [Review][Defer] `createSession` called while session already exists in store — API expected to enforce uniqueness; deferred, pre-existing
- [x] [Review][Defer] `completeSession` sends `{}` as PATCH body — intentional per api.ts contract; deferred, pre-existing
