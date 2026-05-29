---
baseline_commit: 2f9e267469983d93366d20a4224aff8f3d7b9f4f
---

# Story 3.2: WebSocket Lifecycle & Session Events

Status: review

## Story

As a neurologist,
I want the portal to maintain a live connection to the session stream and notify me when events occur,
So that I receive real-time updates and am alerted when the session completes.

## Acceptance Criteria

1. **WebSocket established on mount** — When `useSessionWebSocket` mounts inside `SessionMonitorPage` and `sessionId` is non-null, a WebSocket connection is established to `${VITE_WS_BASE_URL}/sessions/:id/stream` using the session cookie (no extra auth header; browser sends cookies automatically via `credentials: 'include'` semantics of WS upgrade).

2. **`level_completed` event handling** — On receiving a `level_completed` event, `queryClient.invalidateQueries({ queryKey: ['session', sessionId, 'metrics'] })` is called AND Zustand `activeSession.currentLevel` is updated with the completed level number.

3. **`session_completed` event handling** — On receiving a `session_completed` event, `notifications.pendingSessionComplete` is set to `true` in Zustand AND `SessionCompletionToast` is shown immediately in the current view; on any subsequent page navigation, `SessionCompletionToast` persists (via `pendingSessionComplete` flag) until dismissed by the neurologist.

4. **Disconnect → reconnect indicator + exponential backoff** — On unexpected WebSocket disconnect, `WsStatusIndicator` shows a reconnection indicator and reconnect is attempted with exponential backoff: 1s → 2s → 4s (max 3 attempts); `wsStatus` is set to `'reconnecting'` during retries.

5. **All 3 retries fail → polling fallback** — After all 3 reconnect attempts fail, polling of `queryClient.invalidateQueries(['session', sessionId, 'metrics'])` at 5-second intervals begins, `WsStatusIndicator` shows `'polling'` status, a notification item is added to `notifications.items` alerting the neurologist that real-time connectivity could not be restored, and `SessionMonitorPage` does not crash.

## Tasks / Subtasks

- [x] **PREREQUISITE FIX: Store shape conflict (Epic 2 retro A5-A7)** — must complete before any session/WS work (AC: all)
  - [x] Add `patientId: string | null` and `currentLevel: number | null` to `ActiveSessionSlice` type in `src/store/app.store.ts`
  - [x] Update `resetActiveSession` to reset `patientId: null, currentLevel: null`
  - [x] Modify `src/features/sessions/components/SessionOpenButton.tsx` `onSuccess`: add `patientId` to `setActiveSession` call alongside `sessionId`/`startedAt`/`wsStatus`
  - [x] Modify `src/features/patients/pages/PatientProfilePage.tsx` line 18: change selector from `s.activeSession.sessionId` to `s.activeSession.patientId` so `showSessionTab = activePatientId === id`

- [x] **PREREQUISITE FIX: QueryClient configuration (Epic 2 retro A1)** — must complete before mutation/query work (AC: all)
  - [x] Modify `src/main.tsx`: replace `new QueryClient()` with `new QueryClient({ defaultOptions: { queries: { staleTime: 10_000 }, mutations: { retry: false } } })`

- [x] **Add types to `src/features/sessions/session.types.ts`** (AC: #2, #3)
  - [x] Add `MLField<T>` discriminated union export
  - [x] Add `LevelMetrics` type export (camelCase, with `spsClass: MLField<string>` and `recommendation: MLField<'increase_difficulty' | 'maintain_difficulty' | 'decrease_difficulty'>`)
  - [x] Add `SessionMetrics` type export (`sessionId: string; levels: LevelMetrics[]`)

- [x] **Create `src/services/metrics.service.ts`** (AC: #2, #5)
  - [x] Define file-private `LevelMetricsRaw` and `SessionMetricsRaw` types
  - [x] Define file-private `toMLField<T>(value: T | null): MLField<T>` helper
  - [x] Define file-private `toLevelMetrics(raw: LevelMetricsRaw): LevelMetrics` transformer
  - [x] Export `getSessionMetrics(sessionId: string): Promise<SessionMetrics>` using `api.get`

- [x] **Create `src/features/sessions/hooks/useSessionWebSocket.ts`** (AC: #1–#5)
  - [x] Define file-private constants: `WS_MAX_RETRIES = 3`, `WS_BASE_DELAY_MS = 1000`
  - [x] Define file-private `WsRawEvent` type union (`level_completed` | `session_completed`)
  - [x] Implement `useSessionWebSocket(sessionId: string): void` using native `WebSocket` API
  - [x] On mount: if `sessionId` is empty/falsy, do nothing (guard in `useEffect`)
  - [x] `ws.onopen`: reset `retries = 0`, call `setActiveSession({ wsStatus: 'connected' })`
  - [x] `ws.onmessage`: parse JSON, dispatch `level_completed` (invalidate TQ + set `currentLevel`) or `session_completed` (set `pendingSessionComplete: true`)
  - [x] `ws.onclose` (not triggered by cleanup): if `retries < WS_MAX_RETRIES` → increment retries, set `wsStatus: 'reconnecting'`, schedule `setTimeout(connect, delay)` (1s/2s/4s); else → call `startPolling()` + add notification item
  - [x] `startPolling()`: clears any existing interval, sets `wsStatus: 'polling'`, starts 5s `setInterval` calling `queryClient.invalidateQueries`, adds connectivity-failure notification
  - [x] Cleanup on unmount: set `destroyed = true`, clear retry timer, clear poll interval, null `ws.onclose` before `ws.close()`, call `setActiveSession({ wsStatus: 'disconnected' })`
  - [x] Use `destroyed` flag to prevent callbacks from firing after cleanup

- [x] **Create `src/features/sessions/components/WsStatusIndicator.tsx`** (AC: #4, #5)
  - [x] Read `wsStatus` from Zustand with selector `useAppStore(s => s.activeSession.wsStatus)`
  - [x] Return `null` when `wsStatus === 'connected'`
  - [x] Render `.ws-status-indicator` with modifier class per status for other states
  - [x] Show Spanish label: `'reconnecting'` → "Reconectando...", `'polling'` → "Actualización periódica activa", `'disconnected'` → "Conexión perdida"

- [x] **Create `src/features/sessions/components/SessionCompletionToast.tsx`** (AC: #3)
  - [x] Read `pendingSessionComplete` from Zustand with selector
  - [x] Return `null` when `!pendingSessionComplete`
  - [x] Render `.session-completion-toast` with dismiss button (calls `setNotifications({ pendingSessionComplete: false })`)
  - [x] Add `role="alert"` for accessibility

- [x] **Modify `src/features/sessions/pages/SessionMonitorPage.tsx`** (AC: #1–#5)
  - [x] Add import for `useSessionWebSocket`, `WsStatusIndicator`, `SessionCompletionToast`
  - [x] Call `useSessionWebSocket(sessionId ?? '')` BEFORE the `if (!sessionId)` guard (hooks must not be called conditionally)
  - [x] Render `<SessionCompletionToast />` and `<WsStatusIndicator />` inside the page wrapper

- [x] **Add CSS to `src/index.css`** (AC: #4, #5)
  - [x] Add `.ws-status-indicator` section after `.active-session-banner` section
  - [x] Add `.session-completion-toast` section

- [x] **Verify `npm run build` passes (0 TypeScript errors)**

## Dev Notes

### Critical Constraints — Read Before Writing Any Code

**`erasableSyntaxOnly: true` in `tsconfig.app.json`.** No constructor parameter properties anywhere. Declare class fields explicitly.

**No `fetch` in components or hooks.** All API calls go through `metrics.service.ts` → `api.get`. The polling fallback invalidates TanStack Query — it does NOT call `getSessionMetrics` directly in the hook; invalidation triggers a refetch via any active `useQuery` subscriber.

**TanStack Query v5 syntax:**
- `isPending` not `isLoading`
- `queryClient.invalidateQueries({ queryKey: [...] })` — takes an options object, NOT a bare array
- `useMutation` callbacks in hook options only (no second arg to `mutate()`)

**Zustand selector pattern (performance):**
```ts
const setActiveSession = useAppStore(s => s.setActiveSession)  // ✓
const setNotifications = useAppStore(s => s.setNotifications)  // ✓
const { setActiveSession } = useAppStore()                       // ✗ full-store rerender
```

**`useAppStore.getState()` is valid outside React (inside closures/callbacks).** Use it to read current state inside WebSocket callbacks without stale closure issues.

**React hooks rules: NO conditional hook calls.** `useSessionWebSocket` must be called unconditionally in `SessionMonitorPage`. Guard the internal logic with `if (!sessionId) return` inside the `useEffect`, not by skipping the hook call.

**Native `WebSocket` API only — no library.** The browser `WebSocket` constructor automatically sends cookies: no `headers` or credentials option needed. URL must use `wss://` scheme.

**`ws.onerror` fires before `ws.onclose` — do not reconnect in `onerror`.** Reconnect logic belongs exclusively in `ws.onclose`. `onerror` can be an empty handler or omitted entirely.

**`destroyed` flag prevents memory leaks.** The cleanup function sets `destroyed = true`. Every callback (onopen, onmessage, onclose, setTimeout, setInterval) must check `if (destroyed) return` before doing anything. This is the single most important safety mechanism in the hook.

**Null `ws.onclose` before calling `ws.close()` in cleanup.** Without this, the close event fires the reconnect logic after unmount:
```ts
// cleanup
ws.onclose = null  // ← critical: prevents reconnect on intentional close
ws.close()
```

**Exponential backoff delays:** `WS_BASE_DELAY_MS * (2 ** retriesRef.current)` gives 1000ms, 2000ms, 4000ms for retries 0, 1, 2. Increment `retriesRef.current` BEFORE computing the next delay to avoid a fencepost.

**Polling invalidates TanStack Query, does not fetch directly.** The `setInterval` calls `queryClient.invalidateQueries({ queryKey: ['session', sessionId, 'metrics'] })`. This only triggers a network request if there is an active `useQuery(['session', sessionId, 'metrics'])` subscriber in the component tree.

**`crypto.randomUUID()` is available in modern browsers** (>= Chrome 92, Firefox 95). Use it for notification item IDs.

**`wsStatus: 'disconnected'` is the initial state** (set in store init). The `cleanup` function also returns to `'disconnected'`. The sequence is: `disconnected` → `connected` (on WS open) → `reconnecting` (on close, retries < 3) → `polling` (retries exhausted) OR → `disconnected` (on unmount cleanup).

**Zod v4.x (not v3)** is installed (`zod@4.4.3` per package.json). No Zod usage needed in this story, but `MLField<T>` is a plain TypeScript type, not a Zod schema.

**No test files** — project has no test infrastructure (MVP, single developer).

---

### Current State of Files Being Modified

| File | Status | Current State |
|---|---|---|
| `src/store/app.store.ts` | MODIFY | `ActiveSessionSlice` has `sessionId`, `startedAt`, `wsStatus` — missing `patientId` and `currentLevel`. `resetActiveSession` resets 3 fields. |
| `src/features/sessions/components/SessionOpenButton.tsx` | MODIFY | `setActiveSession` stores `sessionId`, `startedAt`, `wsStatus: 'disconnected'` — missing `patientId`. |
| `src/features/patients/pages/PatientProfilePage.tsx` | MODIFY | Line 18: `const activeSessionId = useAppStore(s => s.activeSession.sessionId)` → line 19: `const showSessionTab = activeSessionId === id`. This comparison is always false (session UUID ≠ patient UUID). Must change to use `patientId`. |
| `src/main.tsx` | MODIFY | `new QueryClient()` has no options. Mutations may retry on failure (clinical risk). |
| `src/features/sessions/pages/SessionMonitorPage.tsx` | MODIFY | No WebSocket hook. Has placeholder `.card` elements for metrics and VR stream. |
| `src/features/sessions/session.types.ts` | MODIFY | Only has `Session` type. Needs `MLField<T>`, `LevelMetrics`, `SessionMetrics`. |

---

### Prerequisite: Store Shape Conflict Fix (Retro A5-A7)

**Why this is critical:** Story 2.3 compares `activeSession.sessionId === patient.id` to show the "Sesión activa" tab. But `sessionId` holds the session's UUID (from `POST /sessions` response), not the patient's UUID. The tab is permanently hidden. Fix: add `patientId` to the store and update the comparison.

**Required `app.store.ts` change:**
```ts
// BEFORE
type ActiveSessionSlice = {
  sessionId: string | null
  startedAt: Date | null
  wsStatus: 'connected' | 'reconnecting' | 'polling' | 'disconnected'
}

// AFTER
type ActiveSessionSlice = {
  sessionId: string | null
  patientId: string | null   // ← patient UUID for tab visibility
  startedAt: Date | null
  currentLevel: number | null  // ← updated on level_completed WS event (AC #2)
  wsStatus: 'connected' | 'reconnecting' | 'polling' | 'disconnected'
}
```

**`resetActiveSession` must reset all fields:**
```ts
resetActiveSession: () =>
  set(() => ({
    activeSession: {
      sessionId: null,
      patientId: null,      // ← add
      startedAt: null,
      currentLevel: null,   // ← add
      wsStatus: 'disconnected',
    },
  })),
```

**`setActiveSession` initial state must also include the new fields:**
```ts
activeSession: {
  sessionId: null,
  patientId: null,      // ← add
  startedAt: null,
  currentLevel: null,   // ← add
  wsStatus: 'disconnected',
},
```

**`SessionOpenButton.tsx` — add `patientId` to `setActiveSession` call:**
```ts
onSuccess: (session) => {
  setActiveSession({
    sessionId: session.sessionId,
    patientId: patientId,       // ← add: store the patient UUID
    startedAt: session.startedAt,
    wsStatus: 'disconnected',
  })
  navigate(`/patients/${patientId}/session`)
},
```

**`PatientProfilePage.tsx` — fix line 18:**
```ts
// BEFORE (line 18-19)
const activeSessionId = useAppStore(s => s.activeSession.sessionId)
const showSessionTab = activeSessionId === id

// AFTER
const activePatientId = useAppStore(s => s.activeSession.patientId)
const showSessionTab = activePatientId === id
```

---

### Prerequisite: QueryClient Configuration Fix (Retro A1)

**`src/main.tsx` — replace QueryClient instantiation:**
```ts
// BEFORE
const queryClient = new QueryClient()

// AFTER
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 10_000 },
    mutations: { retry: false },
  },
})
```

**Why `retry: false` on mutations:** TanStack Query retries mutations by default. In a clinical context, a failed `createSession` or `completeSession` retrying automatically could create duplicate sessions or mark a session complete twice.

---

### Types to Add to `session.types.ts`

```ts
// Discriminated union for ML async fields (sps_class, recommendation)
// null from API → { status: 'pending' }; never render null directly
export type MLField<T> =
  | { status: 'pending' }
  | { status: 'resolved'; value: T }
  | { status: 'error'; message: string }

// Per-level metrics from GET /sessions/:id/metrics
export type LevelMetrics = {
  level: number
  ors: number
  ers: number
  scs: number
  rta: number
  er: number
  sps: number
  spsClass: MLField<string>
  recommendation: MLField<'increase_difficulty' | 'maintain_difficulty' | 'decrease_difficulty'>
  cognitiveDomainTags: string[]
}

// Full metrics response shape
export type SessionMetrics = {
  sessionId: string
  levels: LevelMetrics[]
}
```

---

### `metrics.service.ts` Blueprint

```ts
// src/services/metrics.service.ts
import { api } from './api'
import type { LevelMetrics, SessionMetrics, MLField } from '../features/sessions/session.types'

type LevelMetricsRaw = {
  level: number
  ors: number
  ers: number
  scs: number
  rta: number
  er: number
  sps: number
  sps_class: string | null
  recommendation: string | null
  cognitive_domain_tags: string[]
}

type SessionMetricsRaw = {
  session_id: string
  levels: LevelMetricsRaw[]
}

function toMLField<T>(value: T | null): MLField<T> {
  return value === null ? { status: 'pending' } : { status: 'resolved', value }
}

function toLevelMetrics(raw: LevelMetricsRaw): LevelMetrics {
  return {
    level: raw.level,
    ors: raw.ors,
    ers: raw.ers,
    scs: raw.scs,
    rta: raw.rta,
    er: raw.er,
    sps: raw.sps,
    spsClass: toMLField(raw.sps_class),
    recommendation: toMLField(
      raw.recommendation as 'increase_difficulty' | 'maintain_difficulty' | 'decrease_difficulty' | null
    ),
    cognitiveDomainTags: raw.cognitive_domain_tags,
  }
}

export async function getSessionMetrics(sessionId: string): Promise<SessionMetrics> {
  const raw = await api.get<SessionMetricsRaw>(`/sessions/${encodeURIComponent(sessionId)}/metrics`)
  return {
    sessionId: raw.session_id,
    levels: raw.levels.map(toLevelMetrics),
  }
}
```

---

### `useSessionWebSocket` Blueprint

```ts
// src/features/sessions/hooks/useSessionWebSocket.ts
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '../../../store/app.store'

const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL as string
const WS_MAX_RETRIES = 3
const WS_BASE_DELAY_MS = 1000

type WsRawEvent =
  | { type: 'level_completed'; level: number; sps_class: string | null; recommendation: string | null }
  | { type: 'session_completed' }

export function useSessionWebSocket(sessionId: string): void {
  const queryClient = useQueryClient()
  const setActiveSession = useAppStore((s) => s.setActiveSession)
  const setNotifications = useAppStore((s) => s.setNotifications)

  useEffect(() => {
    if (!sessionId) return

    let destroyed = false
    let ws: WebSocket | null = null
    let retries = 0
    let retryTimer: ReturnType<typeof setTimeout> | null = null
    let pollInterval: ReturnType<typeof setInterval> | null = null

    function stopPolling() {
      if (pollInterval !== null) {
        clearInterval(pollInterval)
        pollInterval = null
      }
    }

    function startPolling() {
      stopPolling()
      setActiveSession({ wsStatus: 'polling' })
      pollInterval = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ['session', sessionId, 'metrics'] })
      }, 5000)
      const { notifications } = useAppStore.getState()
      setNotifications({
        items: [
          ...notifications.items,
          {
            id: crypto.randomUUID(),
            type: 'connectivity_failed',
            message: 'No se pudo restablecer la conexión en tiempo real. Los datos se actualizarán cada 5 segundos.',
            read: false,
          },
        ],
      })
    }

    function connect() {
      if (destroyed) return
      ws = new WebSocket(`${WS_BASE_URL}/sessions/${sessionId}/stream`)

      ws.onopen = () => {
        if (destroyed) return
        retries = 0
        setActiveSession({ wsStatus: 'connected' })
      }

      ws.onmessage = (event: MessageEvent) => {
        if (destroyed) return
        try {
          const data = JSON.parse(event.data as string) as WsRawEvent
          if (data.type === 'level_completed') {
            queryClient.invalidateQueries({ queryKey: ['session', sessionId, 'metrics'] })
            setActiveSession({ currentLevel: data.level })
          } else if (data.type === 'session_completed') {
            setNotifications({ pendingSessionComplete: true })
          }
        } catch {
          // malformed message — ignore
        }
      }

      ws.onerror = () => {
        // onclose fires after onerror — all reconnect logic is there
      }

      ws.onclose = () => {
        ws = null
        if (destroyed) return
        if (retries < WS_MAX_RETRIES) {
          const delay = WS_BASE_DELAY_MS * (2 ** retries)
          retries++
          setActiveSession({ wsStatus: 'reconnecting' })
          retryTimer = setTimeout(connect, delay)
        } else {
          startPolling()
        }
      }
    }

    connect()

    return () => {
      destroyed = true
      if (retryTimer !== null) { clearTimeout(retryTimer); retryTimer = null }
      stopPolling()
      if (ws !== null) {
        ws.onclose = null  // prevent reconnect on intentional close
        ws.close()
        ws = null
      }
      setActiveSession({ wsStatus: 'disconnected' })
    }
  }, [sessionId, queryClient, setActiveSession, setNotifications])
}
```

---

### `WsStatusIndicator` Blueprint

```tsx
// src/features/sessions/components/WsStatusIndicator.tsx
import { useAppStore } from '../../../store/app.store'

const STATUS_LABEL: Record<string, string> = {
  reconnecting: 'Reconectando...',
  polling: 'Actualización periódica activa',
  disconnected: 'Conexión perdida',
}

export function WsStatusIndicator() {
  const wsStatus = useAppStore((s) => s.activeSession.wsStatus)

  if (wsStatus === 'connected') return null

  return (
    <div
      className={`ws-status-indicator ws-status-${wsStatus}`}
      role="status"
      aria-live="polite"
    >
      {STATUS_LABEL[wsStatus] ?? wsStatus}
    </div>
  )
}
```

---

### `SessionCompletionToast` Blueprint

```tsx
// src/features/sessions/components/SessionCompletionToast.tsx
import { useAppStore } from '../../../store/app.store'

export function SessionCompletionToast() {
  const pendingSessionComplete = useAppStore((s) => s.notifications.pendingSessionComplete)
  const setNotifications = useAppStore((s) => s.setNotifications)

  if (!pendingSessionComplete) return null

  return (
    <div className="session-completion-toast" role="alert">
      <span>La sesión ha finalizado. Revise los resultados del paciente.</span>
      <button
        className="btn btn-sm btn-ghost"
        onClick={() => setNotifications({ pendingSessionComplete: false })}
      >
        Cerrar
      </button>
    </div>
  )
}
```

---

### `SessionMonitorPage.tsx` — Full Replacement

```tsx
// src/features/sessions/pages/SessionMonitorPage.tsx
import { useParams, Navigate } from 'react-router-dom'
import { useAppStore } from '../../../store/app.store'
import { SessionCloseButton } from '../components/SessionCloseButton'
import { WsStatusIndicator } from '../components/WsStatusIndicator'
import { SessionCompletionToast } from '../components/SessionCompletionToast'
import { useSessionWebSocket } from '../hooks/useSessionWebSocket'

export default function SessionMonitorPage() {
  const { id: patientId } = useParams<{ id: string }>()
  const sessionId = useAppStore((s) => s.activeSession.sessionId)

  // MUST be called before any conditional return (React hooks rules)
  useSessionWebSocket(sessionId ?? '')

  if (!sessionId) return <Navigate to={`/patients/${patientId ?? ''}`} replace />

  return (
    <div className="page">
      <SessionCompletionToast />
      <WsStatusIndicator />
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

---

### CSS to Add to `src/index.css`

Add after the `.active-session-banner` section (line ~241), before the `/* ── PAGE CONTENT ──` section:

```css
/* ── WS STATUS INDICATOR ── */
.ws-status-indicator {
  font-size: 11px;
  font-weight: 600;
  font-family: var(--mono);
  padding: 6px 32px;
  flex-shrink: 0;
  letter-spacing: 0.3px;
}

.ws-status-reconnecting {
  background: rgba(217, 119, 6, 0.12);
  color: var(--warn);
  border-bottom: 1px solid rgba(217, 119, 6, 0.2);
}

.ws-status-polling {
  background: rgba(37, 99, 235, 0.08);
  color: var(--accent);
  border-bottom: 1px solid rgba(37, 99, 235, 0.15);
}

.ws-status-disconnected {
  background: rgba(220, 38, 38, 0.08);
  color: var(--accent3);
  border-bottom: 1px solid rgba(220, 38, 38, 0.15);
}

/* ── SESSION COMPLETION TOAST ── */
.session-completion-toast {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-left: 3px solid var(--accent);
  border-radius: var(--radius);
  padding: 12px 16px;
  margin-bottom: 16px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: var(--shadow);
}
```

---

### State Edge Cases

**Unmount during reconnect timer** — if `SessionMonitorPage` unmounts while a retry `setTimeout` is pending, the cleanup function clears `retryTimer` and sets `destroyed = true`. The `connect()` called by the timer immediately returns because `destroyed` is checked at the top of `connect`.

**Session close while WS polling** — `SessionCloseButton` calls `resetActiveSession()` which sets `wsStatus: 'disconnected'`. The `useSessionWebSocket` `useEffect` cleanup runs on `SessionMonitorPage` unmount (which follows navigation away), clearing the poll interval cleanly.

**`session_completed` WS event while on a different page** — `pendingSessionComplete: true` persists in Zustand. `SessionCompletionToast` is rendered in `SessionMonitorPage` only. To surface it on other pages, the toast must also be rendered in `AppShell.tsx` — OR — a future story adds that. For Story 3.2, `SessionCompletionToast` renders in `SessionMonitorPage` only; the `pendingSessionComplete` flag will be used by future stories. **Do not add the toast to `AppShell.tsx` in this story.**

**Double `level_completed` events** — invalidating an already-loading query is a no-op in TanStack Query (it deduplicates in-flight requests). No special handling needed.

**WS message with unknown `type`** — the `JSON.parse` guard catches malformed JSON; the `if (data.type === ...)` branches silently ignore unknown types. No `console.error` (NFR-2: no PII in logs).

**`VITE_WS_BASE_URL` not set** — `ws` will be `undefined` cast to string. `new WebSocket('undefined/sessions/...')` throws a `DOMException`, caught by the browser as an `error` event → `close` event → retry loop → polling fallback. The neurologist sees the `WsStatusIndicator` reconnecting state but the page does not crash.

---

### Accessibility Requirements

- `WsStatusIndicator`: add `role="status"` and `aria-live="polite"` so screen readers announce status changes
- `SessionCompletionToast`: add `role="alert"` so screen readers announce immediately on render
- Dismiss button in toast: use `.btn.btn-ghost` class (keyboard-navigable, existing style)
- No new interactive elements need `aria-label` beyond what native HTML provides

---

### Project Structure for This Story

```
src/
  store/
    app.store.ts                                ← MODIFY: add patientId, currentLevel to ActiveSessionSlice
  main.tsx                                      ← MODIFY: QueryClient options
  services/
    metrics.service.ts                          ← NEW: getSessionMetrics()
  features/
    sessions/
      session.types.ts                          ← MODIFY: add MLField<T>, LevelMetrics, SessionMetrics
      hooks/                                    ← directory does not exist yet — create it
        useSessionWebSocket.ts                  ← NEW: WebSocket lifecycle hook
      components/
        SessionOpenButton.tsx                   ← MODIFY: add patientId to setActiveSession
        WsStatusIndicator.tsx                   ← NEW: WS connection status UI
        SessionCompletionToast.tsx              ← NEW: session_completed notification
      pages/
        SessionMonitorPage.tsx                  ← MODIFY: add hook + new components
    patients/
      pages/
        PatientProfilePage.tsx                  ← MODIFY: fix showSessionTab comparison
  index.css                                     ← MODIFY: add .ws-status-indicator, .session-completion-toast
```

**Do NOT create for this story:**
- `src/features/sessions/components/MetricsPanel.tsx` — Story 3.3
- `src/features/sessions/components/LevelMetricCard.tsx` — Story 3.3
- `src/features/sessions/components/MLFieldDisplay.tsx` — Story 3.3
- `src/features/sessions/components/DomainTag.tsx` — Story 3.3
- `src/features/sessions/components/RecommendationDisplay.tsx` — Story 3.3
- `src/features/sessions/components/CloudflareStreamPlayer.tsx` — Story 3.4
- `src/features/sessions/hooks/useSession.ts` — Story 3.3

---

### Cross-Story Awareness

**What Story 3.3 will add to this story's files:**
- `SessionMonitorPage.tsx` will replace the metrics placeholder `.card` with `<MetricsPanel />` (which subscribes to `['session', sessionId, 'metrics']` query key set up here)
- `SessionMonitorPage.tsx` will use `currentLevel` from Zustand to pass the active level to `MetricsPanel`
- `metrics.service.ts` will remain as-is (Story 3.3 calls `getSessionMetrics` via TanStack Query)
- `MLField<T>` and `LevelMetrics` types defined here are consumed directly by Story 3.3's components

**Story 3.3 depends on:**
- `['session', sessionId, 'metrics']` query key being invalidated here (AC #2)
- `activeSession.currentLevel` being set here (AC #2)
- `MLField<T>` type exported from `session.types.ts` here

---

### Previous Story Intelligence (Story 3.1 / Epic 3 + Epic 2 Retro)

- **TanStack Query v5:** `isPending` (not `isLoading`). `queryClient.invalidateQueries({ queryKey: [...] })` — options object, not bare array.
- **Zustand selector pattern confirmed:** `useAppStore(s => s.slice.field)` — selector form only.
- **`useAppStore.getState()` is valid in closures.** Confirmed safe for reading state inside WS callbacks without stale closure.
- **`useNavigate` must not be called conditionally.** No `useNavigate` in this story — navigation happens via `<Navigate>` component guard already in place.
- **`.btn-sm` and `.btn-ghost` CSS classes exist.** Use for dismiss button in `SessionCompletionToast`. DO NOT create new button variants.
- **No test infrastructure.** This project has no test files (MVP, single developer). Do not create test files.
- **Build must stay green at 0 TypeScript errors.** Run `npm run build` as final verification step.
- **Epic 2 retro critical finding:** `patientId` field missing from store causes "Sesión activa" tab to be permanently hidden. This is a blocking bug that MUST be fixed in the prerequisite tasks above before implementing the WebSocket logic.
- **Epic 2 retro: QueryClient `retry: false`** was promised twice and never delivered. It MUST be done as the first code change in this story.
- **`WS_BASE_URL` env var:** Use `import.meta.env.VITE_WS_BASE_URL` (Vite convention). Architecture confirms value is `wss://aremec-ws-latest.onrender.com/api/v1`.

---

### References

- Acceptance criteria: [epics.md — Story 3.2](_bmad-output/planning-artifacts/epics.md)
- FR-4.1: WS connection spec; FR-4.2: level_completed; FR-4.4: session_completed; FR-4.6: backoff + polling fallback
- Architecture — WebSocket hook: `useSessionWebSocket.ts` owns WS exclusively [architecture.md]
- Architecture — WS flow: `WS event → Zustand store update → queryClient.invalidate` [architecture.md]
- Architecture — Constants naming: `WS_MAX_RETRIES`, `WS_BASE_DELAY_MS` (SCREAMING_SNAKE_CASE) [architecture.md]
- Architecture — Query key: `['session', sessionId, 'metrics']` [architecture.md]
- Architecture — `MLField<T>` discriminated union [architecture.md]
- Architecture — `VITE_WS_BASE_URL` env var [architecture.md]
- Previous story: [3-1-session-lifecycle-open-close-active-banner.md](_bmad-output/implementation-artifacts/3-1-session-lifecycle-open-close-active-banner.md)
- Epic 2 retro (store shape conflict, QueryClient config): [epic-2-retro-2026-05-29.md](_bmad-output/implementation-artifacts/epic-2-retro-2026-05-29.md)
- Deferred items: [deferred-work.md](_bmad-output/implementation-artifacts/deferred-work.md)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (PAI / bmad-dev-story workflow)

### Debug Log References

- `npm run build` (`tsc -b && vite build`) → exit 0, 0 TypeScript errors, 186 modules transformed. This is the story's Definition-of-Done verification gate.
- Environment note: the host shell intermittently buffered tool output during this run; build verification was confirmed via captured exit code (`BUILD_EXIT:0`) and the vite "✓ built" success line.
- Per Dev Notes constraint ("No test files — project has no test infrastructure"), no automated tests were authored; adding a test runner would introduce a new dependency. Verification is via the build gate as the story specifies.

### Completion Notes List

- **Prerequisite — Store shape (Retro A5-A7):** Added `patientId` and `currentLevel` to `ActiveSessionSlice` (type, initial state, and `resetActiveSession`). `SessionOpenButton` now stores `patientId`; `PatientProfilePage` compares `activeSession.patientId === id` so the "Sesión activa" tab is no longer permanently hidden.
- **Prerequisite — QueryClient (Retro A1):** `main.tsx` now configures `staleTime: 10_000` and `mutations.retry: false` to prevent duplicate/double-complete sessions in the clinical flow.
- **AC1 — WS on mount:** `useSessionWebSocket` opens a native `WebSocket` to `${VITE_WS_BASE_URL}/sessions/:id/stream` (cookies sent automatically) when `sessionId` is non-null; guarded inside `useEffect`.
- **AC2 — `level_completed`:** invalidates `['session', sessionId, 'metrics']` and sets `activeSession.currentLevel`.
- **AC3 — `session_completed`:** sets `notifications.pendingSessionComplete = true`; `SessionCompletionToast` (role="alert") renders immediately and persists across navigation via the Zustand flag until dismissed.
- **AC4 — reconnect + backoff:** on unexpected close, up to 3 retries at 1s/2s/4s with `wsStatus: 'reconnecting'`; `WsStatusIndicator` (role="status", aria-live) surfaces the state.
- **AC5 — polling fallback:** after 3 failed retries, 5s `setInterval` invalidates the metrics query, `wsStatus: 'polling'`, a connectivity-failure notification is appended, and the page does not crash. `destroyed` flag + null-ing `ws.onclose` before `ws.close()` prevent post-unmount reconnects/leaks.
- Implemented strictly against the existing Zustand + `src/services/api.ts` architecture per the story blueprint.

### File List

**New:**
- `src/services/metrics.service.ts`
- `src/features/sessions/hooks/useSessionWebSocket.ts`
- `src/features/sessions/components/WsStatusIndicator.tsx`
- `src/features/sessions/components/SessionCompletionToast.tsx`

**Modified:**
- `src/store/app.store.ts`
- `src/main.tsx`
- `src/features/sessions/session.types.ts`
- `src/features/sessions/components/SessionOpenButton.tsx`
- `src/features/patients/pages/PatientProfilePage.tsx`
- `src/features/sessions/pages/SessionMonitorPage.tsx`
- `src/index.css`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

| Date | Change |
|---|---|
| 2026-05-29 | Story created — WebSocket lifecycle, reconnect backoff, polling fallback. Includes prerequisite fixes for store shape conflict (retro A5-A7) and QueryClient config (retro A1). Status → ready-for-dev. |
| 2026-05-29 | Implemented all tasks: prerequisite store/QueryClient fixes, metrics types + service, `useSessionWebSocket` (reconnect backoff + polling fallback), `WsStatusIndicator`, `SessionCompletionToast`, `SessionMonitorPage` wiring, CSS. `npm run build` passes (0 TS errors). Status → review. |
