---
baseline_commit: 3e5c4fab881da839d27dec8ad1049dfe47c13f2d
---

# Story 4.3: Session History & Per-Session Detail

Status: review

## Story

As a neurologist,
I want to browse the chronological list of a patient's sessions and drill into the level-by-level detail of any session,
so that I can review the complete metric history and inform adaptive therapy decisions.

## Acceptance Criteria

1. **SessionHistory renders in descending chronological order** — Given the neurologist is on the "Historial" tab, when `SessionHistory` renders, then `GET /patients/:id/sessions` returns sessions in descending chronological order, each row showing date, SPS, classification, recommendation, and a status indicator for incomplete sessions.

2. **Clicking a session row navigates to SessionDetailPage** — Given the neurologist clicks on a session row, when the navigation occurs, then they are navigated to `/sessions/:id` and `SessionDetailPage` renders and calls `GET /sessions/:id/metrics`.

3. **MetricDetailTable shows full level-by-level breakdown** — Given `GET /sessions/:id/metrics` returns data, when `MetricDetailTable` renders, then every level is shown with all 6 metrics (ORS, ERS, SCS, RTA, ER, SPS), classification, recommendation, and domain tags.

4. **Incomplete sessions have a visible status indicator** — Given an incomplete session appears in the list, when `SessionHistory` renders that row, then a visible status badge distinguishes it from completed sessions.

5. **5xx error handled gracefully** — Given `GET /patients/:id/sessions` returns a 5xx error, when TanStack Query sets the error state, then `<ErrorMessage>` is displayed with a retry option (TanStack Query provides this automatically via the `error` state).

## Tasks / Subtasks

- [x] **Add `SessionHistoryItem` type to `src/features/analytics/analytics.types.ts`** (AC: #1, #2, #4)
  - [x] Add `SessionHistoryItem` type: `sessionId: string`, `sessionDate: string` (ISO 8601), `sps: number`, `spsClass: string | null`, `recommendation: string | null`, `status: 'complete' | 'incomplete'`
  - [x] Export alongside existing types — do NOT modify `SessionSummary`, `PatientDashboardData`, `TrendSession`, `PatientTrendData`

- [x] **Add `getSessionHistory` to `src/services/patients.service.ts`** (AC: #1, #4)
  - [x] Add raw type `SessionHistoryItemRaw`: `session_id`, `session_date`, `sps`, `sps_class: string | null`, `recommendation: string | null`, `status: string`
  - [x] Export `async function getSessionHistory(patientId: string): Promise<SessionHistoryItem[]>` calling `api.get<SessionHistoryItemRaw[]>(\`/patients/${encodeURIComponent(patientId)}/sessions\`)`
  - [x] Map raw: `(raw ?? []).map(s => ({ sessionId: s.session_id, sessionDate: s.session_date, sps: s.sps, spsClass: s.sps_class, recommendation: s.recommendation, status: s.status === 'complete' ? 'complete' : 'incomplete' }))`
  - [x] Import `SessionHistoryItem` from `'../features/analytics/analytics.types'`
  - [x] **Do NOT modify `createPatient`, `getPatients`, `getPatient`, or `getDashboard`**

- [x] **Create `src/features/analytics/hooks/useSessionHistory.ts`** (AC: #1, #5)
  - [x] Import `useQuery` from `'@tanstack/react-query'`
  - [x] Import `getSessionHistory` from `'../../../services/patients.service'`
  - [x] Export `function useSessionHistory(patientId: string)` returning `useQuery({ queryKey: ['patient', patientId, 'sessions'], queryFn: () => getSessionHistory(patientId), enabled: !!patientId })`

- [x] **Create `src/features/analytics/components/SessionHistory.tsx`** (AC: #1, #2, #4, #5)
  - [x] Props: `{ patientId: string }`
  - [x] Import `useNavigate` from `'react-router-dom'`
  - [x] Call `useSessionHistory(patientId)` for `data`, `isPending`, `error`
  - [x] Show `<LoadingSpinner />` while `isPending`
  - [x] Show `<ErrorMessage error={error} />` if `error`
  - [x] If `!data || data.length === 0`: show `<EmptyState message="Sin sesiones registradas" />` (never return `null`)
  - [x] Render each row as a clickable element that calls `navigate(\`/sessions/${s.sessionId}\`)` on click
  - [x] Each row displays: formatted date, SPS value, spsClass (or `'—'` if null), formatted recommendation (or `'—'`), status badge
  - [x] Status badge: `badge-green` + "Completada" for `complete`; `badge-warn` + "Incompleta" for `incomplete`
  - [x] Card title: "HISTORIAL DE SESIONES" (card-label)
  - [x] Rows in descending order as returned by API — do NOT re-sort client-side

- [x] **Create `src/features/analytics/components/MetricDetailTable.tsx`** (AC: #3)
  - [x] Props: `{ sessionId: string }`
  - [x] Import `useSessionMetrics` from `'../../sessions/hooks/useSession'`
  - [x] Import `LevelMetricCard` from `'../../sessions/components/LevelMetricCard'`
  - [x] Import `RecommendationDisplay` from `'../../sessions/components/RecommendationDisplay'`
  - [x] Call `useSessionMetrics(sessionId)` for `data`, `isPending`, `error`
  - [x] Show `<LoadingSpinner />` while `isPending`
  - [x] Show `<ErrorMessage error={error} />` if `error`
  - [x] If `!data || data.levels.length === 0`: show `<EmptyState message="Sin datos de métricas para esta sesión" />`
  - [x] Render one section per level (sorted ascending by `level` number for detail view) with `LevelMetricCard` for each of the 6 metrics and `RecommendationDisplay` for the level recommendation
  - [x] Section heading: "NIVEL {n}"
  - [x] Reuse `METRIC_LABELS` and `METRIC_DOMAINS` from MetricsPanel — copy the constants (do NOT import from MetricsPanel as it's not exported)

- [x] **Create `src/features/sessions/pages/SessionDetailPage.tsx`** (AC: #2, #3)
  - [x] Import `useParams, useNavigate` from `'react-router-dom'`
  - [x] Get `id` from `useParams<{ id: string }>()`
  - [x] Guard: if `!id` return `<ErrorMessage error={new Error('Ruta inválida: falta el ID de sesión')} />`
  - [x] Render a back button ("← Volver") that calls `navigate(-1)` on click
  - [x] Render page title "Detalle de sesión"
  - [x] Render `<MetricDetailTable sessionId={id} />`
  - [x] Import `MetricDetailTable` from `'../../analytics/components/MetricDetailTable'`
  - [x] Wrap in `<div className="page">` as all other pages do

- [x] **Update `src/router/index.tsx`** (AC: #2)
  - [x] Import `SessionDetailPage` from `'../features/sessions/pages/SessionDetailPage'`
  - [x] Replace placeholder `{ path: 'sessions/:id', element: <div className="page"><p>Detalle de sesión — próximamente</p></div> }` with `{ path: 'sessions/:id', element: <SessionDetailPage /> }`

- [x] **Modify `src/features/patients/pages/PatientProfilePage.tsx`** (AC: #1, #2)
  - [x] Import `SessionHistory` from `'../../analytics/components/SessionHistory'`
  - [x] Add `<SessionHistory patientId={id} />` at the bottom of the historial tab layout (after `<PatientDashboard>`)
  - [x] Do NOT change `TrendChart`, `SessionFilter`, or `PatientDashboard` placement — just append `SessionHistory`

- [x] **Verify `npm run build` passes (0 TypeScript errors)**

### Review Findings

- [ ] [Review][Patch] `data.levels` null access crashes MetricDetailTable when API returns `null` for levels field [src/features/analytics/components/MetricDetailTable.tsx:33]
- [ ] [Review][Patch] `navigate(-1)` exits app entirely when SessionDetailPage accessed via direct URL or bookmark [src/features/sessions/pages/SessionDetailPage.tsx:10]
- [x] [Review][Defer] Status coercion maps any non-'complete' API value silently to 'incomplete' — deferred, by spec design; revisit if API adds new statuses [src/services/patients.service.ts]
- [x] [Review][Defer] Date-only ISO strings parse as UTC midnight, display previous day at UTC-5 — deferred, same class as 4.1/4.2 [src/features/analytics/components/SessionHistory.tsx]
- [x] [Review][Defer] Invalid `sessionDate` string crashes entire session list render — deferred, same class as 4.1/4.2 [src/features/analytics/components/SessionHistory.tsx]
- [x] [Review][Defer] `sps.toFixed(1)` throws/renders NaN if API returns null for sps — deferred, same class as 4.1 [src/features/analytics/components/SessionHistory.tsx]
- [x] [Review][Defer] `level[key]` undefined throws in LevelMetricCard if API omits a metric — deferred, backend data quality [src/features/analytics/components/MetricDetailTable.tsx]
- [x] [Review][Defer] Sort with undefined `level` field gives silent wrong order — deferred, backend data quality [src/features/analytics/components/MetricDetailTable.tsx]
- [x] [Review][Defer] Clickable session rows not keyboard-navigable (no role, tabIndex, onKeyDown) — deferred, MVP scope [src/features/analytics/components/SessionHistory.tsx]

## Dev Notes

### Critical Constraints — Read Before Writing Any Code

**`erasableSyntaxOnly: true` in `tsconfig.app.json`.** No constructor parameter properties. Declare class fields explicitly. (Mandatory carry-forward from all prior stories.)

**No `fetch` in components or hooks.** All data access flows through the service layer:
- `SessionHistory.tsx` → `useSessionHistory` → `getSessionHistory` in `patients.service.ts` → `api.get`
- `MetricDetailTable.tsx` → `useSessionMetrics` (from `sessions/hooks/useSession.ts`) → `getSessionMetrics` in `metrics.service.ts` → `api.get`
- Never call `fetch(...)` or `api.get(...)` inside a component or hook directly.

**snake_case → camelCase ONLY in service layer.** Add the raw type and transformer inside `patients.service.ts`. Components only ever see camelCase.

**TanStack Query for all server state — never `useState + useEffect` for API calls.** Use `useQuery` with `isPending` (NOT `isLoading` — deprecated in TanStack Query v5).

**`getSessionMetrics` already exists in `metrics.service.ts` — DO NOT recreate it.** `useSessionMetrics` already exists in `features/sessions/hooks/useSession.ts` — DO NOT recreate it. Both work for historical sessions (they take `sessionId` as a param — not tied to the active session).

**No test files** — project has no test infrastructure (MVP, single developer). Do not create test files.

**Build must stay green at 0 TypeScript errors.** Run `npm run build` as final verification.

**`(raw ?? []).map(...)` null guard.** Always guard array access on raw API responses (established pattern from `getDashboard` and `getSessionMetrics`).

---

### API Response Shape for `GET /patients/:id/sessions`

Expected raw response (snake_case from backend). **Verify actual field names against live API and adjust only the Raw type — keep `SessionHistoryItem` (camelCase) unchanged.**

```ts
type SessionHistoryItemRaw = {
  session_id: string
  session_date: string  // ISO 8601 e.g. "2026-05-01T10:00:00Z"
  sps: number
  sps_class: string | null
  recommendation: string | null
  status: string  // 'complete' | 'incomplete' (or backend's actual values)
}
```

Full `getSessionHistory` addition to `patients.service.ts`:

```ts
import type { SessionHistoryItem } from '../features/analytics/analytics.types'

type SessionHistoryItemRaw = {
  session_id: string
  session_date: string
  sps: number
  sps_class: string | null
  recommendation: string | null
  status: string
}

export async function getSessionHistory(patientId: string): Promise<SessionHistoryItem[]> {
  const raw = await api.get<SessionHistoryItemRaw[]>(
    `/patients/${encodeURIComponent(patientId)}/sessions`
  )
  return (raw ?? []).map(s => ({
    sessionId: s.session_id,
    sessionDate: s.session_date,
    sps: s.sps,
    spsClass: s.sps_class,
    recommendation: s.recommendation,
    status: s.status === 'complete' ? 'complete' : 'incomplete',
  }))
}
```

Add the `SessionHistoryItem` import alongside the existing `PatientDashboardData, SessionSummary` import at the top of `patients.service.ts`.

---

### SessionHistory Component Implementation

```tsx
import { useNavigate } from 'react-router-dom'
import { useSessionHistory } from '../hooks/useSessionHistory'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { EmptyState } from '../../../shared/components/EmptyState'

type Props = { patientId: string }

const RECOMMENDATION_LABEL: Record<string, string> = {
  increase_difficulty: 'Aumentar dificultad',
  maintain_difficulty: 'Mantener dificultad',
  decrease_difficulty: 'Reducir dificultad',
}

export function SessionHistory({ patientId }: Props) {
  const navigate = useNavigate()
  const { data, isPending, error } = useSessionHistory(patientId)

  if (isPending) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />
  if (!data || data.length === 0) {
    return <EmptyState message="Sin sesiones registradas" />
  }

  return (
    <div className="card">
      <div className="card-label" style={{ marginBottom: 12 }}>HISTORIAL DE SESIONES</div>
      {data.map(session => (
        <div
          key={session.sessionId}
          onClick={() => navigate(`/sessions/${session.sessionId}`)}
          style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 1fr 1fr 2fr auto',
            gap: 12,
            padding: '10px 0',
            borderBottom: '1px solid var(--border)',
            cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: 13 }}>
            {new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium' })
              .format(new Date(session.sessionDate))}
          </div>
          <div style={{ fontSize: 13, fontFamily: 'var(--font-mono, monospace)' }}>
            SPS {session.sps.toFixed(1)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>
            {session.spsClass ?? '—'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>
            {session.recommendation
              ? (RECOMMENDATION_LABEL[session.recommendation] ?? session.recommendation)
              : '—'}
          </div>
          <span className={`badge ${session.status === 'complete' ? 'badge-green' : 'badge-warn'}`}>
            {session.status === 'complete' ? 'Completada' : 'Incompleta'}
          </span>
        </div>
      ))}
    </div>
  )
}
```

---

### MetricDetailTable Component Implementation

**DO NOT reinvent `useSessionMetrics` or `getSessionMetrics`** — both already exist and work for historical session IDs:
- `useSessionMetrics(sessionId)` from `src/features/sessions/hooks/useSession.ts`
- `getSessionMetrics(sessionId)` from `src/services/metrics.service.ts`

**Copy `METRIC_LABELS` and `METRIC_DOMAINS` constants** from `MetricsPanel.tsx` — they are not exported so you must redeclare them. Do NOT import from `MetricsPanel`.

```tsx
import { useSessionMetrics } from '../../sessions/hooks/useSession'
import { LevelMetricCard } from '../../sessions/components/LevelMetricCard'
import { RecommendationDisplay } from '../../sessions/components/RecommendationDisplay'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { EmptyState } from '../../../shared/components/EmptyState'

const METRIC_DOMAINS: Record<string, string> = {
  ors: 'Memoria episódica',
  ers: 'Memoria episódica',
  scs: 'Memoria episódica',
  rta: 'Atención sostenida',
  er: 'Atención sostenida',
  sps: 'Composite',
}

const METRIC_LABELS: Record<string, string> = {
  ors: 'ORS',
  ers: 'ERS',
  scs: 'SCS',
  rta: 'RTA',
  er: 'ER',
  sps: 'SPS',
}

type Props = { sessionId: string }

export function MetricDetailTable({ sessionId }: Props) {
  const { data, isPending, error } = useSessionMetrics(sessionId)

  if (isPending) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />
  if (!data || data.levels.length === 0) {
    return <EmptyState message="Sin datos de métricas para esta sesión" />
  }

  // Sort ascending for detail view (chronological level progression)
  const levels = [...data.levels].sort((a, b) => a.level - b.level)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {levels.map(level => (
        <div key={level.level} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div className="card-label">NIVEL {level.level}</div>
            <div>
              <span className="card-label" style={{ display: 'block', marginBottom: 4 }}>Recomendación</span>
              <RecommendationDisplay recommendation={level.recommendation} />
            </div>
          </div>
          <div className="metrics-live">
            {(['ors', 'ers', 'scs', 'rta', 'er'] as const).map(key => (
              <LevelMetricCard
                key={key}
                label={METRIC_LABELS[key]}
                value={level[key]}
                domain={METRIC_DOMAINS[key]}
              />
            ))}
            <LevelMetricCard
              label={METRIC_LABELS.sps}
              value={level.sps}
              domain={METRIC_DOMAINS.sps}
              spsClass={level.spsClass}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
```

---

### SessionDetailPage Implementation

```tsx
import { useParams, useNavigate } from 'react-router-dom'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { MetricDetailTable } from '../../analytics/components/MetricDetailTable'

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  if (!id) return <ErrorMessage error={new Error('Ruta inválida: falta el ID de sesión')} />

  return (
    <div className="page">
      <div className="section-header">
        <button
          onClick={() => navigate(-1)}
          className="btn btn-secondary btn-sm"
          style={{ marginBottom: 12 }}
        >
          ← Volver
        </button>
        <h1 className="page-title">Detalle de sesión</h1>
      </div>
      <MetricDetailTable sessionId={id} />
    </div>
  )
}
```

---

### PatientProfilePage Historial Tab — New Layout

Current state (after 4.2):
```tsx
{activeTab === 'historial' && (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <TrendChart patientId={id} />
    <SessionFilter
      patientId={id}
      selectedSessionId={selectedSessionId}
      onSelect={setSelectedSessionId}
    />
    <PatientDashboard patientId={id} selectedSessionId={selectedSessionId} />
  </div>
)}
```

After this story (append `SessionHistory` at the bottom — do NOT reorder or remove existing components):
```tsx
{activeTab === 'historial' && (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <TrendChart patientId={id} />
    <SessionFilter
      patientId={id}
      selectedSessionId={selectedSessionId}
      onSelect={setSelectedSessionId}
    />
    <PatientDashboard patientId={id} selectedSessionId={selectedSessionId} />
    <SessionHistory patientId={id} />
  </div>
)}
```

Add import at top of `PatientProfilePage.tsx`:
```tsx
import { SessionHistory } from '../../analytics/components/SessionHistory'
```

---

### Router Update — Replace Placeholder

Current state (line 65 in `src/router/index.tsx`):
```tsx
{ path: 'sessions/:id', element: <div className="page"><p>Detalle de sesión — próximamente</p></div> },
```

After this story:
```tsx
{ path: 'sessions/:id', element: <SessionDetailPage /> },
```

Add import at the top of `src/router/index.tsx`:
```tsx
import SessionDetailPage from '../features/sessions/pages/SessionDetailPage'
```

---

### Current State of Files Being Modified

| File | Status | Current State |
|---|---|---|
| `src/features/analytics/analytics.types.ts` | MODIFY | Has `SessionSummary`, `PatientDashboardData`, `TrendSession`, `PatientTrendData`. Add `SessionHistoryItem` — do NOT modify existing types. |
| `src/services/patients.service.ts` | MODIFY | Has `createPatient`, `getPatients`, `getPatient`, `getDashboard`. Append `getSessionHistory` + `SessionHistoryItemRaw`. Import `SessionHistoryItem` from analytics types. Do NOT modify existing functions. |
| `src/features/patients/pages/PatientProfilePage.tsx` | MODIFY | Line 116–126: historial tab with TrendChart + SessionFilter + PatientDashboard. Add `SessionHistory` import and append to layout. Do NOT change existing layout, state, or effects. |
| `src/router/index.tsx` | MODIFY | Line 65: placeholder div for `sessions/:id`. Replace with `<SessionDetailPage />`. Add import. |

**What already exists (DO NOT recreate or modify in this story):**
- `src/features/sessions/hooks/useSession.ts` — exports `useSessionMetrics(sessionId)` — REUSE for `MetricDetailTable`
- `src/services/metrics.service.ts` — exports `getSessionMetrics(sessionId)` — DO NOT TOUCH
- `src/features/sessions/components/LevelMetricCard.tsx` — REUSE in `MetricDetailTable`
- `src/features/sessions/components/RecommendationDisplay.tsx` — REUSE in `MetricDetailTable`
- `src/features/sessions/components/MLFieldDisplay.tsx` — used by `LevelMetricCard` internally
- `src/features/sessions/components/DomainTag.tsx` — used by `LevelMetricCard` internally
- `src/features/analytics/components/PatientDashboard.tsx` — DO NOT MODIFY (story 4.2 complete)
- `src/features/analytics/components/TrendChart.tsx` — DO NOT MODIFY
- `src/features/analytics/components/SessionFilter.tsx` — DO NOT MODIFY
- `src/shared/components/LoadingSpinner.tsx`, `ErrorMessage.tsx`, `EmptyState.tsx` — import and use as-is

---

### Story 4.2 Learnings — Mandatory Carry-Forwards

- `erasableSyntaxOnly: true` — no constructor parameter properties
- No `fetch` in components — enforced through service layer
- Build must stay green — run `npm run build` at completion
- `isPending` not `isLoading` — TanStack Query v5 convention
- `(raw ?? []).map(...)` — always guard array access on raw API responses
- `EmptyState` accepts `message: string` prop, **not children**
- Named imports preferred for consistency (e.g., `import { SessionHistory } from '...'`)
- Inline style objects recreated every render is a known deferred issue — do not add memoization; keep current pattern
- Button classes from `index.css`: `.btn`, `.btn-sm`, `.btn-primary`, `.btn-secondary` — check before using
- Badge classes: `.badge`, `.badge-green`, `.badge-gray`, `.badge-blue`, `.badge-warn`
- `RECOMMENDATION_LABEL` mapping already exists in `PatientDashboard.tsx` — redeclare in `SessionHistory.tsx` (it is not exported, consistent with how `METRIC_LABELS`/`METRIC_DOMAINS` are declared in each component that needs them)
- `css class .metrics-live` exists and is used by `MetricsPanel` — REUSE in `MetricDetailTable` for the 6-metric grid layout

---

### Cross-Story Awareness

**This is the last story in Epic 4.** After completing it, the epic can be marked `done` and a retrospective scheduled.

**What Epic 4 covered:**
- 4.1: `PatientDashboard` — SPS sparkline + trend badge + session list from `/dashboard`
- 4.2: `TrendChart` + `SessionFilter` — SPS evolution chart + per-session filter
- 4.3 (this): `SessionHistory` (clickable list) + `SessionDetailPage` + `MetricDetailTable`

**Do NOT:**
- Pre-implement anything beyond FR-6.2 and FR-6.4
- Modify `PatientDashboard`, `TrendChart`, or `SessionFilter` — they are done
- Add client-side sorting to `SessionHistory` — the API returns descending order per the spec
- Add filtering or search to `SessionHistory` — not in scope

---

### Project Structure for This Story

```
src/
  features/
    analytics/
      analytics.types.ts                  ← MODIFY: add SessionHistoryItem
      hooks/
        useSessionHistory.ts              ← NEW: TanStack Query hook for /patients/:id/sessions
      components/
        SessionHistory.tsx                ← NEW: chronological session list (clickable rows)
        MetricDetailTable.tsx             ← NEW: level-by-level breakdown for detail view
        PatientDashboard.tsx              ← NO CHANGE (4.2 done)
        TrendChart.tsx                    ← NO CHANGE (4.2 done)
        SessionFilter.tsx                 ← NO CHANGE (4.2 done)
    sessions/
      pages/
        SessionDetailPage.tsx             ← NEW: /sessions/:id page
        SessionMonitorPage.tsx            ← NO CHANGE
    patients/
      pages/
        PatientProfilePage.tsx            ← MODIFY: add SessionHistory to Historial tab
  services/
    patients.service.ts                   ← MODIFY: add getSessionHistory + SessionHistoryItemRaw
    metrics.service.ts                    ← NO CHANGE
  router/
    index.tsx                             ← MODIFY: wire SessionDetailPage to sessions/:id
```

---

### References

- Acceptance criteria source: [epics.md — Story 4.3](_bmad-output/planning-artifacts/epics.md)
- FR-6.2: `SessionHistory` chronological list with status indicator [epics.md]
- FR-6.4: `SessionDetailPage` + `MetricDetailTable` using `getSessionMetrics` [epics.md]
- Architecture — service placement: `patients.service.ts ← getSessionHistory()` [architecture.md — API & Communication Patterns §Service Layer Structure]
- Architecture — query key: `['patient', patientId, 'sessions']` [architecture.md — Naming Patterns §Query Keys]
- Architecture — `SessionDetailPage` in `features/sessions/pages/` [architecture.md — Project Structure]
- Architecture — `MetricDetailTable` in `features/analytics/components/` [architecture.md — Project Structure]
- Architecture — transformation: service layer only [architecture.md — Format Patterns §API Response Transformation]
- Architecture — date format: `Intl.DateTimeFormat` locale `'es-PE'` [architecture.md — Format Patterns §Date display]
- Architecture — loading: `isPending` (TanStack Query v5) [architecture.md — Process Patterns §Loading States]
- Architecture — empty: `<EmptyState>` never return null [architecture.md — Process Patterns §Empty States]
- Router current state: [src/router/index.tsx](src/router/index.tsx) line 65 — placeholder for `sessions/:id`
- PatientProfilePage current state: [src/features/patients/pages/PatientProfilePage.tsx](src/features/patients/pages/PatientProfilePage.tsx) lines 116–126
- patients.service.ts current state: [src/services/patients.service.ts](src/services/patients.service.ts)
- analytics.types.ts current state: [src/features/analytics/analytics.types.ts](src/features/analytics/analytics.types.ts)
- useSessionMetrics hook (reuse): [src/features/sessions/hooks/useSession.ts](src/features/sessions/hooks/useSession.ts)
- LevelMetricCard (reuse): [src/features/sessions/components/LevelMetricCard.tsx](src/features/sessions/components/LevelMetricCard.tsx)
- RecommendationDisplay (reuse): [src/features/sessions/components/RecommendationDisplay.tsx](src/features/sessions/components/RecommendationDisplay.tsx)
- MetricsPanel (reference for constants METRIC_LABELS/METRIC_DOMAINS): [src/features/sessions/components/MetricsPanel.tsx](src/features/sessions/components/MetricsPanel.tsx)
- Previous story (4.2) learnings: [_bmad-output/implementation-artifacts/4-2-cognitive-trend-chart-session-filter.md](_bmad-output/implementation-artifacts/4-2-cognitive-trend-chart-session-filter.md)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None — implementation followed the story spec verbatim; no debugging required.

### Completion Notes List

- All 5 acceptance criteria implemented per spec. Implementation guidance in the story matched the live codebase exactly — no deviations needed.
- Verified integration points before writing code: `useSessionMetrics(sessionId)` (hook), `getSessionMetrics` (service), `LevelMetricCard` (`value: number`, `spsClass?: MLField<string>`), `RecommendationDisplay` (`recommendation: MLField<RecommendationValue>`), and `LevelMetrics` shape (`ors/ers/scs/rta/er/sps: number`, `spsClass: MLField<string>`, `recommendation: MLField<...>`). The `MetricDetailTable` mirrors the proven `MetricsPanel` pattern.
- Reused existing infrastructure with zero modification: `getSessionMetrics`, `useSessionMetrics`, `LevelMetricCard`, `RecommendationDisplay`, `LoadingSpinner`, `ErrorMessage`, `EmptyState`. `PatientDashboard`, `TrendChart`, `SessionFilter` left untouched.
- `SessionHistory` does NOT re-sort client-side (API returns descending order, per AC #1). `MetricDetailTable` sorts levels ascending for chronological detail view.
- AC #5 (5xx handling) satisfied via TanStack Query `error` state → `<ErrorMessage>`. Retry is provided automatically by TanStack Query refetch on the error boundary pattern used across the app.
- Carry-forward constraints honored: `isPending` (not `isLoading`), `(raw ?? []).map(...)` null guard, snake_case→camelCase transform isolated in service layer, no `fetch` in components/hooks, `EmptyState` uses `message` prop, `erasableSyntaxOnly` (no class param properties — none introduced).
- No test files created — project has no test infrastructure (MVP, single developer) per Dev Notes.
- Final verification: `npm run build` (`tsc -b && vite build`) passed with 0 TypeScript errors. Pre-existing chunk-size warning is unrelated to this story.
- **This is the last story in Epic 4** — epic can now be marked `done` and a retrospective scheduled after review.

### File List

**New:**
- `src/features/analytics/hooks/useSessionHistory.ts`
- `src/features/analytics/components/SessionHistory.tsx`
- `src/features/analytics/components/MetricDetailTable.tsx`
- `src/features/sessions/pages/SessionDetailPage.tsx`

**Modified:**
- `src/features/analytics/analytics.types.ts` — added `SessionHistoryItem` type
- `src/services/patients.service.ts` — added `SessionHistoryItemRaw` + `getSessionHistory`, imported `SessionHistoryItem`
- `src/router/index.tsx` — wired `SessionDetailPage` to `sessions/:id`, replaced placeholder
- `src/features/patients/pages/PatientProfilePage.tsx` — appended `<SessionHistory>` to Historial tab

## Change Log

| Date | Change |
|---|---|
| 2026-05-30 | Implemented Story 4.3 — `SessionHistory`, `SessionDetailPage`, `MetricDetailTable`, `useSessionHistory` hook, `getSessionHistory` service. Build green (0 TS errors). Status → review. |
