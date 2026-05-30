---
baseline_commit: 3e5c4fab881da839d27dec8ad1049dfe47c13f2d
---

# Story 4.2: Cognitive Trend Chart & Session Filter

Status: done

## Story

As a neurologist,
I want to view a chart of the patient's SPS evolution over time and filter to a specific session,
so that I can analyze cognitive trends and isolate individual session data when needed.

## Acceptance Criteria

1. **TrendChart renders with 2+ sessions** — Given `GET /patients/:id/trend` returns data with 2 or more sessions, when `TrendChart` renders, then a Recharts `LineChart` displays SPS values over time with the trend direction labeled (`rising` / `stable` / `falling`) and slope shown as context alongside the chart title.

2. **TrendChart shows informational message with < 2 sessions** — Given `GET /patients/:id/trend` returns data with fewer than 2 sessions, when `TrendChart` renders, then an informational message is displayed instead of an empty chart (never a blank area, never `null`).

3. **SessionFilter applies single-session filter** — Given the neurologist selects a session in `SessionFilter`, when the filter is applied, then `PatientDashboard` updates its sparkline and session list to show only that session's data.

4. **SessionFilter clears to full view** — Given the neurologist clears the session filter (clicks "Ver todo"), when the filter is removed, then `PatientDashboard` restores the full multi-session consolidated view.

## Tasks / Subtasks

- [x] **Add `PatientTrendData` and `TrendSession` types to `src/features/analytics/analytics.types.ts`** (AC: #1, #2)
  - [x] Add `TrendSession` type: `sessionDate: string` (ISO 8601), `sps: number`
  - [x] Add `PatientTrendData` type: `trend: 'rising' | 'stable' | 'falling'`, `slope: number`, `sessions: TrendSession[]`
  - [x] Export both types alongside existing `SessionSummary` and `PatientDashboardData`

- [x] **Add `getPatientTrend` to `src/services/metrics.service.ts`** (AC: #1, #2)
  - [x] Add raw type `PatientTrendRaw`: `trend`, `slope`, `sessions: Array<{ session_date: string; sps: number }>`
  - [x] Export `async function getPatientTrend(patientId: string): Promise<PatientTrendData>` calling `api.get<PatientTrendRaw>(\`/patients/${encodeURIComponent(patientId)}/trend\`)`
  - [x] Map raw sessions: `(raw.sessions ?? []).map(s => ({ sessionDate: s.session_date, sps: s.sps }))`
  - [x] Import `PatientTrendData` from `'../features/analytics/analytics.types'`
  - [x] **Do NOT modify `getSessionMetrics` or any existing function**

- [x] **Create `src/features/analytics/hooks/usePatientTrend.ts`** (AC: #1, #2)
  - [x] Import `useQuery` from `'@tanstack/react-query'`
  - [x] Import `getPatientTrend` from `'../../../services/metrics.service'`
  - [x] Export `function usePatientTrend(patientId: string)` returning `useQuery({ queryKey: ['patient', patientId, 'trend'], queryFn: () => getPatientTrend(patientId), enabled: !!patientId })`

- [x] **Create `src/features/analytics/components/TrendChart.tsx`** (AC: #1, #2)
  - [x] Props: `{ patientId: string }`
  - [x] Call `usePatientTrend(patientId)` for `data`, `isPending`, `error`
  - [x] Show `<LoadingSpinner />` while `isPending`
  - [x] Show `<ErrorMessage error={error} />` if `error`
  - [x] If `!data || data.sessions.length < 2`: show `<EmptyState message="Se necesitan al menos 2 sesiones para mostrar la evolución" />` (never return `null`, never render empty chart)
  - [x] Derive `chartData` from `data.sessions` with short date format for X-axis labels (see Dev Notes)
  - [x] Render Recharts `<LineChart>` at height 220 with `YAxis domain={[0, 100]}` (see Dev Notes for full implementation)
  - [x] Show trend direction and slope as text context in card header (see Dev Notes for `TREND_LABEL` mapping)
  - [x] Card title: "EVOLUCIÓN SPS"

- [x] **Create `src/features/analytics/components/SessionFilter.tsx`** (AC: #3, #4)
  - [x] Props: `{ patientId: string; selectedSessionId: string | null; onSelect: (id: string | null) => void }`
  - [x] Call `usePatientDashboard(patientId)` for `data`, `isPending` — TanStack Query deduplicates with `PatientDashboard`'s identical query; no extra network call
  - [x] If `isPending || !data || data.sessions.length === 0`: return `null` (no filter shown when no sessions)
  - [x] Render a card with label "FILTRAR POR SESIÓN"
  - [x] Render "Ver todo" button — active when `selectedSessionId === null`; calls `onSelect(null)` on click
  - [x] Render one button per session with short date label; active when `selectedSessionId === s.sessionId`; calls `onSelect(s.sessionId)` on click
  - [x] Use `dateStyle: 'short'` (not `'medium'`) for session filter button labels to keep them compact

- [x] **Modify `src/features/analytics/components/PatientDashboard.tsx`** (AC: #3, #4)
  - [x] Change `Props` type to: `{ patientId: string; selectedSessionId?: string | null }`
  - [x] Derive `displayedSessions` from `selectedSessionId` (see Dev Notes for filter logic including fallback)
  - [x] Replace all uses of `data.sessions` with `displayedSessions` in both `chartData` and the session list
  - [x] The `EmptyState` guard (`data.sessions.length === 0`) remains on the **full** `data.sessions` — not `displayedSessions` — since `displayedSessions` is always a filtered subset of non-empty data

- [x] **Modify `src/features/patients/pages/PatientProfilePage.tsx`** (AC: #3, #4)
  - [x] Add `useState<string | null>(null)` for `selectedSessionId`
  - [x] Add `useEffect` to reset `selectedSessionId` to `null` when `id` changes (patient navigation)
  - [x] Import `TrendChart` from `'../../analytics/components/TrendChart'`
  - [x] Import `SessionFilter` from `'../../analytics/components/SessionFilter'`
  - [x] Replace `{activeTab === 'historial' && (<PatientDashboard patientId={id} />)}` with the full layout (see Dev Notes for exact JSX)
  - [x] Pass `selectedSessionId` to `PatientDashboard` and `SessionFilter`

- [x] **Verify `npm run build` passes (0 TypeScript errors)**

## Dev Notes

### Critical Constraints — Read Before Writing Any Code

**`erasableSyntaxOnly: true` in `tsconfig.app.json`.** No constructor parameter properties. Declare class fields explicitly. (Mandatory carry-forward from all prior stories.)

**No `fetch` in components or hooks.** All data access flows through the service layer:
- `TrendChart.tsx` → `usePatientTrend` → `getPatientTrend` in `metrics.service.ts` → `api.get` in `api.ts`
- `SessionFilter.tsx` → `usePatientDashboard` → `getDashboard` in `patients.service.ts` → `api.get`
- Never call `fetch(...)` or `api.get(...)` inside a component or hook directly.

**snake_case → camelCase ONLY in service layer.** Add the raw type and transformer inside `metrics.service.ts`. Components and hooks only ever see camelCase.

**TanStack Query for all server state — never `useState + useEffect` for API calls.** Use `useQuery` with `isPending` (NOT `isLoading` — deprecated in TanStack Query v5).

**Recharts 2.x is already installed.** Import from `'recharts'`. Do NOT install any new charting library.

**Date formatting.** `new Intl.DateTimeFormat('es-PE', ...)`. Never store or pass formatted date strings — store ISO, format at render.

**No test files** — project has no test infrastructure (MVP, single developer). Do not create test files.

**Build must stay green at 0 TypeScript errors.** Run `npm run build` as final verification.

**`(raw.sessions ?? []).map(...)` null guard.** Always guard array access on raw API responses (established pattern from `getDashboard` and `getSessionMetrics`).

---

### `getPatientTrend` API Response Shape

Expected raw response from `GET /patients/:id/trend` (snake_case from backend). **Verify actual field names against live API and adjust only the Raw type — keep `PatientTrendData` (camelCase) unchanged.**

```ts
type PatientTrendRaw = {
  trend: 'rising' | 'stable' | 'falling'
  slope: number
  sessions: Array<{
    session_date: string  // ISO 8601 e.g. "2026-05-01T10:00:00Z"
    sps: number
  }>
}
```

Full `getPatientTrend` addition to `metrics.service.ts`:

```ts
import type { PatientTrendData } from '../features/analytics/analytics.types'

type PatientTrendRaw = {
  trend: 'rising' | 'stable' | 'falling'
  slope: number
  sessions: Array<{ session_date: string; sps: number }>
}

export async function getPatientTrend(patientId: string): Promise<PatientTrendData> {
  const raw = await api.get<PatientTrendRaw>(
    `/patients/${encodeURIComponent(patientId)}/trend`
  )
  return {
    trend: raw.trend,
    slope: raw.slope,
    sessions: (raw.sessions ?? []).map(s => ({
      sessionDate: s.session_date,
      sps: s.sps,
    })),
  }
}
```

Add the import alongside the existing `import type { LevelMetrics, SessionMetrics, MLField }` at the top of `metrics.service.ts`. Do NOT modify `getSessionMetrics`.

---

### TrendChart Component Implementation

```tsx
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { usePatientTrend } from '../hooks/usePatientTrend'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { EmptyState } from '../../../shared/components/EmptyState'

type Props = { patientId: string }

const TREND_LABEL: Record<'rising' | 'stable' | 'falling', string> = {
  rising:  'Tendencia positiva ↑',
  stable:  'Tendencia estable →',
  falling: 'Tendencia negativa ↓',
}

export function TrendChart({ patientId }: Props) {
  const { data, isPending, error } = usePatientTrend(patientId)

  if (isPending) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />
  if (!data || data.sessions.length < 2) {
    return <EmptyState message="Se necesitan al menos 2 sesiones para mostrar la evolución" />
  }

  const chartData = data.sessions.map(s => ({
    label: new Intl.DateTimeFormat('es-PE', { month: 'short', day: 'numeric' })
             .format(new Date(s.sessionDate)),
    sps: s.sps,
  }))

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div className="card-label">EVOLUCIÓN SPS</div>
        <div style={{ fontSize: 12, color: 'var(--text2)', display: 'flex', gap: 16 }}>
          <span>{TREND_LABEL[data.trend]}</span>
          <span>Pendiente: {data.slope.toFixed(2)}</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text2)' }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--text2)' }} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="sps"
            stroke="var(--accent)"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

---

### SessionFilter Component Implementation

`SessionFilter` calls `usePatientDashboard` internally. TanStack Query deduplicates: since `PatientDashboard` (rendered in the same tab) uses the identical query key `['patient', patientId, 'dashboard']`, **no second network request is made**. This is the established pattern for shared server state.

**Read `src/shared/components/EmptyState.tsx` before assuming its API.** (From 4.1 learnings: `EmptyState` uses `message` prop, not children.) Applies here too.

**Button styling:** Check `src/index.css` for available button classes (e.g., `.btn`, `.btn-primary`, `.tab`, `.tab.active`) before choosing. Do not invent class names. Use `style=` inline overrides if needed.

```tsx
import { usePatientDashboard } from '../hooks/usePatientDashboard'

type Props = {
  patientId: string
  selectedSessionId: string | null
  onSelect: (sessionId: string | null) => void
}

export function SessionFilter({ patientId, selectedSessionId, onSelect }: Props) {
  const { data, isPending } = usePatientDashboard(patientId)

  if (isPending || !data || data.sessions.length === 0) return null

  return (
    <div className="card">
      <div className="card-label" style={{ marginBottom: 8 }}>FILTRAR POR SESIÓN</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={() => onSelect(null)}
          // Apply active/inactive styling based on selectedSessionId === null
          // Check index.css for available button classes
        >
          Ver todo
        </button>
        {data.sessions.map(s => (
          <button
            key={s.sessionId}
            onClick={() => onSelect(s.sessionId)}
            // Apply active/inactive styling based on selectedSessionId === s.sessionId
          >
            {new Intl.DateTimeFormat('es-PE', { dateStyle: 'short' })
              .format(new Date(s.sessionDate))}
          </button>
        ))}
      </div>
    </div>
  )
}
```

---

### PatientDashboard Filter Logic

Add `selectedSessionId?: string | null` to props. Derive `displayedSessions` with a fallback to prevent empty display when the selected session isn't found in data:

```tsx
type Props = { patientId: string; selectedSessionId?: string | null }

// Inside PatientDashboard, after the isPending/error/empty guards:
const filteredSessions = selectedSessionId
  ? data.sessions.filter(s => s.sessionId === selectedSessionId)
  : data.sessions

// Fallback: if filter yields nothing (stale selectedSessionId), show all
const displayedSessions = filteredSessions.length > 0 ? filteredSessions : data.sessions

// Replace all data.sessions usages with displayedSessions:
const chartData = displayedSessions.map(s => ({...}))

// Session list:
{displayedSessions.map(session => (...))}
```

**Keep the `EmptyState` guard on `data.sessions` (the full unfiltered list)**, not `displayedSessions`:
```tsx
// CORRECT:
if (!data || data.sessions.length === 0) return <EmptyState message="Sin sesiones registradas" />
// Then derive displayedSessions below...
```

**Do NOT change the `EmptyState` message** — it was corrected in the 4.1 review to use `message` prop.

---

### PatientProfilePage Historial Tab — New Layout

Current state (after 4.1):
```tsx
{activeTab === 'historial' && (
  <PatientDashboard patientId={id} />
)}
```

After this story:
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

Add state and effect alongside existing state declarations at the top of `PatientProfilePage`:
```tsx
const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)

// Reset filter when navigating between patients:
useEffect(() => {
  setSelectedSessionId(null)
}, [id])
```

**Do NOT add a wrapping `.card` div** around the historial content — `TrendChart`, `SessionFilter`, and `PatientDashboard` each manage their own card layout.

---

### Current State of Files Being Modified

| File | Status | Current State |
|---|---|---|
| `src/features/analytics/analytics.types.ts` | MODIFY | Has `SessionSummary` and `PatientDashboardData`. Add `TrendSession` and `PatientTrendData` — do NOT modify existing types. |
| `src/services/metrics.service.ts` | MODIFY | Has `getSessionMetrics` + raw types + `toLevelMetrics` + `toMLField`. Add `getPatientTrend` + `PatientTrendRaw` at the bottom. Do NOT modify existing functions. |
| `src/features/analytics/components/PatientDashboard.tsx` | MODIFY | Has `Props = { patientId: string }`, calls `usePatientDashboard`, renders sparkline + trend badge + session list. Add optional `selectedSessionId` prop and filter logic. Preserve all existing behavior when `selectedSessionId` is `null` or `undefined`. |
| `src/features/patients/pages/PatientProfilePage.tsx` | MODIFY | Line 108–110: `{activeTab === 'historial' && (<PatientDashboard patientId={id} />)}`. Add state + effect + new layout. |

**What already exists (DO NOT recreate or modify in this story):**
- `src/features/analytics/hooks/usePatientDashboard.ts` — used by both `PatientDashboard` and `SessionFilter` (TQ deduplication)
- `src/features/analytics/components/PatientDashboard.tsx` — modify only to add filter prop; preserve all AC #1–#4 from Story 4.1
- `src/shared/components/LoadingSpinner.tsx`, `ErrorMessage.tsx`, `EmptyState.tsx` — import and use as-is
- `src/services/metrics.service.ts` — append `getPatientTrend` at bottom; do NOT modify `getSessionMetrics`

---

### Story 4.1 Learnings — Mandatory Carry-Forwards

- `erasableSyntaxOnly: true` — no constructor parameter properties (enforced by all prior stories)
- No `fetch` in components — enforced through service layer
- Build must stay green — run `npm run build` at completion
- `isPending` not `isLoading` — TanStack Query v5 convention
- `(raw.sessions ?? []).map(...)` — always guard array access on raw API responses
- `EmptyState` accepts `message: string` prop, **not children** — the review in 4.1 confirmed this; do not assume children-based API
- `PatientDashboard` exports as both named (`export function PatientDashboard`) and default (`export default PatientDashboard`) — use the named import in `PatientProfilePage` (consistent with current import style)
- Inline style objects recreated every render is a known deferred issue — do not add memoization; keep current pattern
- `TREND_CONFIG.falling` badge has `badgeStyle: { backgroundColor: 'var(--red, #ef4444)', color: '#fff' }` and `FALLBACK_TREND = TREND_CONFIG['stable']` — these were added in the 4.1 review patch; preserve them

---

### Cross-Story Awareness

**What Story 4.3 will add to the same "Historial" tab:**
- `SessionHistory` component: clickable session rows → `/sessions/:id`, `GET /patients/:id/sessions`
- `SessionDetailPage` at `/sessions/:id` + `MetricDetailTable` using `getSessionMetrics` from `metrics.service.ts`

**Do NOT pre-implement any of those.** Keep this story focused on `TrendChart` + `SessionFilter` + filter prop on `PatientDashboard`.

**Components from Epic 3 available for future reuse (Story 4.3):**
- `src/features/sessions/components/LevelMetricCard.tsx`
- `src/features/sessions/components/MLFieldDisplay.tsx`
- `src/features/sessions/components/DomainTag.tsx`
- `src/features/sessions/components/RecommendationDisplay.tsx`

**`SessionFilter` sessions list vs `SessionHistory` list (Story 4.3):** These are different data sources:
- `SessionFilter` uses sessions from `/patients/:id/dashboard` (already cached, TQ dedup)
- `SessionHistory` (4.3) will use `/patients/:id/sessions` (separate endpoint, different query key)
- Do NOT pre-fetch `/patients/:id/sessions` in this story

---

### Project Structure for This Story

```
src/
  features/
    analytics/
      analytics.types.ts              ← MODIFY: add TrendSession, PatientTrendData
      hooks/
        usePatientDashboard.ts        ← NO CHANGE (reused by SessionFilter via TQ dedup)
        usePatientTrend.ts            ← NEW: TanStack Query hook for /patients/:id/trend
      components/
        PatientDashboard.tsx          ← MODIFY: add selectedSessionId prop + filter logic
        TrendChart.tsx                ← NEW: Recharts LineChart for SPS evolution
        SessionFilter.tsx             ← NEW: session picker buttons
    patients/
      pages/
        PatientProfilePage.tsx        ← MODIFY: add state + new Historial tab layout
  services/
    metrics.service.ts                ← MODIFY: add getPatientTrend + PatientTrendRaw
```

---

### References

- Acceptance criteria source: [epics.md — Story 4.2](_bmad-output/planning-artifacts/epics.md)
- FR-6.3: TrendChart with Recharts; informational message if < 2 sessions [epics.md]
- FR-6.5: SessionFilter — filter to single session [epics.md]
- Architecture — service placement: `metrics.service.ts ← getPatientTrend()` [architecture.md — API & Communication Patterns §Service Layer Structure]
- Architecture — query key: `['patient', patientId, 'trend']` [architecture.md — Naming Patterns §Query Keys]
- Architecture — TQ deduplication pattern: same query key → single network request [architecture.md — State Boundary]
- Architecture — transformation: service layer only [architecture.md — Format Patterns §API Response Transformation]
- Architecture — date format: `Intl.DateTimeFormat` locale `'es-PE'` [architecture.md — Format Patterns §Date display]
- Architecture — loading: `isPending` (TanStack Query v5) [architecture.md — Process Patterns §Loading States]
- Architecture — empty: `<EmptyState>` never return null [architecture.md — Process Patterns §Empty States]
- PatientDashboard current state: [src/features/analytics/components/PatientDashboard.tsx](src/features/analytics/components/PatientDashboard.tsx)
- PatientProfilePage current state (Historial tab): [src/features/patients/pages/PatientProfilePage.tsx](src/features/patients/pages/PatientProfilePage.tsx) lines 108–110
- metrics.service.ts current state: [src/services/metrics.service.ts](src/services/metrics.service.ts)
- analytics.types.ts current state: [src/features/analytics/analytics.types.ts](src/features/analytics/analytics.types.ts)
- Array null guard pattern: [src/services/patients.service.ts](src/services/patients.service.ts) line 92 — `(raw.sessions ?? []).map(...)`
- Previous story (4.1) learnings: [_bmad-output/implementation-artifacts/4-1-patient-dashboard-sps-trend.md](_bmad-output/implementation-artifacts/4-1-patient-dashboard-sps-trend.md)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8

### Debug Log References

- `npm run build` → `tsc -b && vite build` passed with 0 TypeScript errors (778 modules transformed). Pre-existing chunk-size warning (>500 kB) is unrelated to this story.

### Completion Notes List

- AC #1 — `TrendChart` renders a Recharts `LineChart` (height 220, `YAxis domain={[0,100]}`) when ≥2 sessions, with trend direction (`TREND_LABEL`) and slope shown in the card header. Title "EVOLUCIÓN SPS".
- AC #2 — `TrendChart` returns `<EmptyState message="Se necesitan al menos 2 sesiones para mostrar la evolución" />` when `!data` or `< 2` sessions; never `null`, never an empty chart.
- AC #3 — `SessionFilter` buttons call `onSelect(sessionId)`; `PatientProfilePage` lifts `selectedSessionId` state and passes it to `PatientDashboard`, which filters `displayedSessions` for the sparkline and session list.
- AC #4 — "Ver todo" button calls `onSelect(null)`, restoring the full consolidated view.
- Data flow respects service-layer rule: `TrendChart → usePatientTrend → getPatientTrend (metrics.service) → api.get`; `SessionFilter → usePatientDashboard` (TanStack Query dedup with `PatientDashboard`, query key `['patient', patientId, 'dashboard']` — no extra network call).
- snake_case→camelCase mapping (`session_date`→`sessionDate`) isolated in `metrics.service.ts` via `PatientTrendRaw`; `(raw.sessions ?? []).map(...)` null guard applied. `getSessionMetrics` untouched.
- `EmptyState` guard in `PatientDashboard` kept on full `data.sessions`; `displayedSessions` fallback shows all when a stale `selectedSessionId` filters to nothing.
- `selectedSessionId` resets to `null` via `useEffect([id])` on patient navigation.
- `SessionFilter` buttons use existing `btn btn-sm btn-primary` (active) / `btn btn-sm btn-secondary` (inactive) classes from `src/index.css` — no invented class names.
- No test files created (project has no test infrastructure per Dev Notes / MVP).

### File List

- `src/features/analytics/analytics.types.ts` (modified — added `TrendSession`, `PatientTrendData`)
- `src/services/metrics.service.ts` (modified — added `PatientTrendRaw`, `getPatientTrend`, `PatientTrendData` import)
- `src/features/analytics/hooks/usePatientTrend.ts` (new)
- `src/features/analytics/components/TrendChart.tsx` (new)
- `src/features/analytics/components/SessionFilter.tsx` (new)
- `src/features/analytics/components/PatientDashboard.tsx` (modified — `selectedSessionId` prop + `displayedSessions` filter logic)
- `src/features/patients/pages/PatientProfilePage.tsx` (modified — `selectedSessionId` state/effect + new Historial tab layout)

## Review Findings

- [x] [Review][Patch] `TREND_LABEL[data.trend]` has no fallback — renders `undefined` if API returns unexpected trend value; `PatientDashboard` uses `?? FALLBACK_TREND` but `TrendChart` does not [src/features/analytics/components/TrendChart.tsx:38]
- [x] [Review][Defer] UTC date off-by-one on date-only ISO strings in TrendChart/SessionFilter [src/features/analytics/components/TrendChart.tsx:28, src/features/analytics/components/SessionFilter.tsx:30] — deferred, pre-existing (aligns with 4-1 defer)
- [x] [Review][Defer] Invalid `sessionDate` crashes TrendChart/SessionFilter render via `Intl.DateTimeFormat.format()` RangeError [src/features/analytics/components/TrendChart.tsx:28-29, src/features/analytics/components/SessionFilter.tsx:30] — deferred, pre-existing (aligns with 4-1 defer)
- [x] [Review][Defer] `data.slope.toFixed(2)` crashes if slope is null/NaN/non-finite [src/features/analytics/components/TrendChart.tsx:39] — deferred, same class as 4-1 `sps` null/NaN defer
- [x] [Review][Defer] `TrendChart` (`/trend`) and `PatientDashboard` (`/dashboard`) can show contradictory trend directions for the same patient — deferred, by spec architecture (two intentionally separate endpoints)
- [x] [Review][Defer] `metrics.service.ts` imports `PatientTrendData` from the analytics feature module — deferred, by spec design (known layering compromise)
- [x] [Review][Defer] Stale `selectedSessionId` causes filter chip to appear active while dashboard silently shows all sessions — deferred, by spec design (explicit fallback documented in Dev Notes)
- [x] [Review][Defer] Filtering to a single session renders `PatientDashboard` sparkline with 1 point (dot, no line) — deferred, acceptable MVP sparkline behavior

## Change Log

| Date | Change |
|---|---|
| 2026-05-30 | Implemented Story 4.2 — TrendChart (Recharts SPS evolution), SessionFilter, and `selectedSessionId` filter prop on PatientDashboard. Build green (0 TS errors). Status → review. |
