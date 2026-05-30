---
baseline_commit: 3e5c4fab881da839d27dec8ad1049dfe47c13f2d
---

# Story 4.1: Patient Dashboard & SPS Trend

Status: done

## Story

As a neurologist,
I want to see an aggregated dashboard of my patient's cognitive performance across all sessions,
so that I can quickly assess their overall trajectory and identify sessions that need closer review.

## Acceptance Criteria

1. **Dashboard renders from API** — Given the neurologist is on the "Historial" tab of `PatientProfilePage`, when `PatientDashboard` renders, then `GET /patients/:id/dashboard` is called and the response renders: SPS per session as a sparkline (Recharts LineChart), a global trend indicator (`rising` / `stable` / `falling`), and a session list with date, SPS, classification, and recommendation per row.

2. **Dashboard loads within 3 seconds** — Given `GET /patients/:id/dashboard` resolves, when the page renders, then the dashboard loads within 3 seconds on a standard clinical workstation (satisfied by TanStack Query caching — no additional optimization required).

3. **Trend indicator labeled and visually prominent** — Given the global trend is `rising`, `stable`, or `falling`, when the trend indicator renders, then the label and visual direction are shown prominently alongside the sparkline.

4. **5xx error handled gracefully** — Given `GET /patients/:id/dashboard` returns a 5xx error, when TanStack Query sets the error state, then `<ErrorMessage>` is displayed without crashing the page.

## Tasks / Subtasks

- [x] **Create `src/features/analytics/analytics.types.ts`** (AC: #1)
  - [x] Define `SessionSummary` type: `sessionId: string`, `sessionDate: string` (ISO 8601), `sps: number`, `spsClass: string | null`, `recommendation: string | null`
  - [x] Define `PatientDashboardData` type: `globalTrend: 'rising' | 'stable' | 'falling'`, `trendSlope: number`, `sessions: SessionSummary[]`

- [x] **Add `getDashboard` to `src/services/patients.service.ts`** (AC: #1, #2)
  - [x] Add raw type `SessionSummaryRaw`: `session_id`, `session_date`, `sps`, `sps_class`, `recommendation` (all snake_case)
  - [x] Add raw type `PatientDashboardRaw`: `global_trend`, `trend_slope`, `sessions: SessionSummaryRaw[]`
  - [x] Add `toSessionSummary(raw: SessionSummaryRaw): SessionSummary` transformer
  - [x] Export `async function getDashboard(patientId: string): Promise<PatientDashboardData>` calling `api.get<PatientDashboardRaw>(\`/patients/${encodeURIComponent(patientId)}/dashboard\`)` and mapping sessions through `toSessionSummary`
  - [x] Import `PatientDashboardData, SessionSummary` from `../features/analytics/analytics.types`

- [x] **Create `src/features/analytics/hooks/usePatientDashboard.ts`** (AC: #1, #2, #4)
  - [x] Import `useQuery` from `'@tanstack/react-query'`
  - [x] Import `getDashboard` from `'../../../services/patients.service'`
  - [x] Export `function usePatientDashboard(patientId: string)` returning `useQuery({ queryKey: ['patient', patientId, 'dashboard'], queryFn: () => getDashboard(patientId), enabled: !!patientId })`

- [x] **Create `src/features/analytics/components/PatientDashboard.tsx`** (AC: #1, #2, #3, #4)
  - [x] Props: `{ patientId: string }`
  - [x] Call `usePatientDashboard(patientId)` for data, `isPending`, `error`
  - [x] Show `<LoadingSpinner />` while `isPending`
  - [x] Show `<ErrorMessage error={error} />` if `error`
  - [x] Show `<EmptyState>` if `data.sessions.length === 0` (used `<EmptyState message="..." />` — confirmed prop-based API, not children)
  - [x] Render trend indicator badge (see Dev Notes for badge mapping)
  - [x] Render Recharts `<LineChart>` sparkline (see Dev Notes for implementation)
  - [x] Render session list table with date (Intl), SPS (`toFixed(1)`), spsClass, recommendation (see Dev Notes for null handling)
  - [x] Format dates: `new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium' }).format(new Date(row.sessionDate))`

- [x] **Modify `src/features/patients/pages/PatientProfilePage.tsx`** (AC: #1)
  - [x] Add import: `import { PatientDashboard } from '../../analytics/components/PatientDashboard'`
  - [x] In the `{activeTab === 'historial'}` block, replace the entire `<div className="card"><p>...</p></div>` placeholder with `<PatientDashboard patientId={id} />`
  - [x] **Do NOT add a wrapping `.card` div** — `PatientDashboard` manages its own card layout

- [x] **Verify `npm run build` passes (0 TypeScript errors)**

## Dev Notes

### Critical Constraints — Read Before Writing Any Code

**`erasableSyntaxOnly: true` in `tsconfig.app.json`.** No constructor parameter properties. Declare class fields explicitly. (Carry-forward from all prior stories.)

**No `fetch` in components or hooks.** All data access flows through the service layer:
- `PatientDashboard.tsx` → `usePatientDashboard` → `getDashboard` in `patients.service.ts` → `api.get` in `api.ts`
- Never call `fetch(...)` or `api.get(...)` inside a component or hook directly.

**snake_case → camelCase ONLY in service layer.** Add `toSessionSummary` to `patients.service.ts`. Components and hooks only ever see camelCase field names.

**TanStack Query for all server state — never `useState + useEffect` for API calls.** Use `useQuery` with `isPending` (NOT `isLoading` — deprecated in TanStack Query v5).

**Recharts 2.x is already installed.** Import from `'recharts'`. Do NOT install any new charting library.

**Date formatting.** `new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium' }).format(new Date(row.sessionDate))`. Never store or pass formatted date strings — store ISO, format at render.

**`spsClass` and `recommendation` here are `string | null` — NOT `MLField<T>`.** The `MLField<T>` discriminated union (`{ status: 'pending' }` etc.) is only for live session metrics where null means "ML service hasn't responded yet". In historical dashboard data, null simply means "not computed" — render as `'—'`.

**No test files** — project has no test infrastructure (MVP, single developer). Do not create test files.

**Build must stay green at 0 TypeScript errors.** Run `npm run build` as final verification.

---

### Current State of Files Being Modified

| File | Status | Current State |
|---|---|---|
| `src/features/patients/pages/PatientProfilePage.tsx` | MODIFY | Historial tab at line 107–113: `<div className="card"><p style={{...}}>Historial de sesiones — disponible en Epic 4</p></div>`. Replace this entire block with `<PatientDashboard patientId={id} />`. After the `if (!id) return` guard at line 35, TypeScript narrows `id` to `string` — no `!` assertion needed. |
| `src/services/patients.service.ts` | MODIFY | Has `createPatient`, `getPatients`, `getPatient`. Add `getDashboard` at the bottom with its raw types and `toSessionSummary` transformer. Do NOT modify existing functions. |
| `src/features/analytics/` | CREATE | Directory does not exist. Create `analytics.types.ts`, `hooks/usePatientDashboard.ts`, `components/PatientDashboard.tsx`. |

**What already exists (DO NOT recreate or modify in this story):**
- `src/shared/components/LoadingSpinner.tsx`, `ErrorMessage.tsx`, `EmptyState.tsx` — import and use as-is
- `src/features/sessions/components/` — all session components (MetricsPanel, LevelMetricCard, etc.) — will be reused in Story 4.3, not this story
- `src/router/index.tsx` — already has `/sessions/:id` route; no changes in this story
- `src/store/app.store.ts` — no changes needed in this story

---

### API Response Shape

Expected raw response from `GET /patients/:id/dashboard` (snake_case from backend):

```ts
type PatientDashboardRaw = {
  global_trend: 'rising' | 'stable' | 'falling'
  trend_slope: number
  sessions: Array<{
    session_id: string
    session_date: string   // ISO 8601 e.g. "2026-05-01T10:00:00Z"
    sps: number
    sps_class: string | null
    recommendation: string | null
  }>
}
```

If the actual backend field names differ (e.g., `date` instead of `session_date`), adjust only the Raw type and `toSessionSummary` transformer — keep `SessionSummary` (camelCase) unchanged.

---

### Recharts Sparkline Implementation

```tsx
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'

// Derive chart data from sessions
const chartData = data.sessions.map(s => ({
  label: new Intl.DateTimeFormat('es-PE', { month: 'short', day: 'numeric' })
           .format(new Date(s.sessionDate)),
  sps: s.sps,
}))

// Render inside the component
<ResponsiveContainer width="100%" height={180}>
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
```

Use the short date format (`month: 'short', day: 'numeric'`) for X-axis labels to keep them compact. Use `dateStyle: 'medium'` for the session list table rows.

---

### Trend Indicator Badge

```tsx
const TREND_CONFIG: Record<
  'rising' | 'stable' | 'falling',
  { label: string; className: string }
> = {
  rising:  { label: 'Tendencia positiva ↑', className: 'badge-green' },
  stable:  { label: 'Tendencia estable →',  className: 'badge-gray' },
  falling: { label: 'Tendencia negativa ↓', className: 'badge-gray' },
}

// Usage
const trend = TREND_CONFIG[data.globalTrend]
<span className={`badge ${trend.className}`}>{trend.label}</span>
```

**Note on `badge-red`:** Do NOT assume `badge-red` exists in `src/index.css`. The project uses `badge-green` and `badge-gray` (confirmed in PatientProfilePage). Use `badge-gray` for falling and optionally override color via inline `style={{ backgroundColor: 'var(--red, #ef4444)', color: '#fff' }}` if a red badge is visually important. Do not add new CSS classes to `index.css` for this story.

---

### Recommendation Label Mapping

```ts
const RECOMMENDATION_LABEL: Record<string, string> = {
  increase_difficulty: 'Aumentar dificultad',
  maintain_difficulty: 'Mantener dificultad',
  decrease_difficulty: 'Reducir dificultad',
}

// Usage in session list
function formatRecommendation(value: string | null): string {
  if (!value) return '—'
  return RECOMMENDATION_LABEL[value] ?? value
}
```

---

### Session List Layout

Render as a table-like structure using `.card` and existing CSS utilities:

```tsx
<div className="card">
  <div className="card-label" style={{ marginBottom: 12 }}>SESIONES</div>
  {data.sessions.map(session => (
    <div key={session.sessionId} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 2fr', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ fontSize: 13 }}>
        {new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium' }).format(new Date(session.sessionDate))}
      </div>
      <div style={{ fontSize: 13, fontFamily: 'var(--font-mono, monospace)' }}>
        SPS {session.sps.toFixed(1)}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text2)' }}>
        {session.spsClass ?? '—'}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text2)' }}>
        {formatRecommendation(session.recommendation)}
      </div>
    </div>
  ))}
</div>
```

**No click navigation** on session rows in this story. Story 4.3 adds `<Link to={/sessions/${session.sessionId}>` navigation.

---

### Full PatientDashboard Component Structure

```tsx
import { usePatientDashboard } from '../hooks/usePatientDashboard'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { EmptyState } from '../../../shared/components/EmptyState'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

type Props = { patientId: string }

export function PatientDashboard({ patientId }: Props) {
  const { data, isPending, error } = usePatientDashboard(patientId)

  if (isPending) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />
  if (!data || data.sessions.length === 0) return <EmptyState>Sin sesiones registradas</EmptyState>

  // ... sparkline, trend badge, session list
}
```

**`EmptyState` usage:** Check how `EmptyState` accepts children/props by reading `src/shared/components/EmptyState.tsx` before implementing. Do not assume its API.

---

### patients.service.ts — getDashboard Addition

Add to the bottom of `src/services/patients.service.ts`, after the existing `getPatient` function:

```ts
import type { PatientDashboardData, SessionSummary } from '../features/analytics/analytics.types'

type SessionSummaryRaw = {
  session_id: string
  session_date: string
  sps: number
  sps_class: string | null
  recommendation: string | null
}

type PatientDashboardRaw = {
  global_trend: 'rising' | 'stable' | 'falling'
  trend_slope: number
  sessions: SessionSummaryRaw[]
}

function toSessionSummary(raw: SessionSummaryRaw): SessionSummary {
  return {
    sessionId: raw.session_id,
    sessionDate: raw.session_date,
    sps: raw.sps,
    spsClass: raw.sps_class,
    recommendation: raw.recommendation,
  }
}

export async function getDashboard(patientId: string): Promise<PatientDashboardData> {
  const raw = await api.get<PatientDashboardRaw>(
    `/patients/${encodeURIComponent(patientId)}/dashboard`
  )
  return {
    globalTrend: raw.global_trend,
    trendSlope: raw.trend_slope,
    sessions: (raw.sessions ?? []).map(toSessionSummary),
  }
}
```

Import `PatientDashboardData` and `SessionSummary` at the top of the file alongside the existing import.

---

### Project Structure for This Story

```
src/
  features/
    analytics/                        ← NEW directory
      analytics.types.ts              ← NEW: PatientDashboardData, SessionSummary
      hooks/
        usePatientDashboard.ts        ← NEW: TanStack Query hook
      components/
        PatientDashboard.tsx          ← NEW: sparkline + trend badge + session list
    patients/
      pages/
        PatientProfilePage.tsx        ← MODIFY: wire Historial tab to PatientDashboard
  services/
    patients.service.ts               ← MODIFY: add getDashboard + raw types
```

---

### Cross-Story Awareness

**What Story 4.2 and 4.3 will add to the same "Historial" tab:**
- Story 4.2 adds `TrendChart` (full SPS chart with slope) and `SessionFilter` (filter dashboard to single session)
- Story 4.3 adds `SessionHistory` (navigable session rows → `/sessions/:id`) and `SessionDetailPage` + `MetricDetailTable`

**Do NOT pre-implement any of those.** Keep this story focused on: PatientDashboard + sparkline + trend badge + read-only session list.

**Components from Epic 3 available for future reuse (Story 4.3):**
- `src/features/sessions/components/LevelMetricCard.tsx` — can be reused in `MetricDetailTable`
- `src/features/sessions/components/MLFieldDisplay.tsx` — for MetricDetailTable's live metric fields
- `src/features/sessions/components/DomainTag.tsx` — cognitive domain tags in detail table
- `src/features/sessions/components/RecommendationDisplay.tsx` — recommendation chip in detail table

**Previous story learnings (from Stories 3.1–3.4):**
- `erasableSyntaxOnly: true` — no constructor parameter properties (mandatory carry-forward)
- No `fetch` in components — enforced through service layer (mandatory carry-forward)
- Build must stay green — run `npm run build` at completion (mandatory carry-forward)
- `isPending` not `isLoading` — TanStack Query v5 convention (mandatory carry-forward)
- `(raw.sessions ?? []).map(...)` — always guard array access with `?? []` to prevent crashes on missing backend fields (pattern from `metrics.service.ts` line 58)
- Session `spsClass`/`recommendation` in this context are historical — use `string | null`, NOT `MLField<T>` (do not apply Epic 3 ML pending pattern here)

---

### References

- Acceptance criteria: [epics.md — Story 4.1](_bmad-output/planning-artifacts/epics.md)
- FR-6.1: Patient dashboard with SPS sparkline [epics.md — Functional Requirements]
- FR Coverage Map: `FR-6.1: Epic 4 — PatientDashboard con SPS sparkline y trend indicator` [epics.md]
- Architecture — component: `PatientDashboard.tsx ← FR-6.1` [architecture.md — Project Structure §analytics/]
- Architecture — Recharts 2.x installed: [architecture.md — Existing Foundation §Charts]
- Architecture — query key: `['patient', patientId, 'dashboard']` [architecture.md — Naming Patterns §Query Keys]
- Architecture — transformation: service layer only [architecture.md — Format Patterns §API Response Transformation]
- Architecture — date format: `Intl.DateTimeFormat` locale `'es-PE'` [architecture.md — Format Patterns §Date display]
- Architecture — loading: `isPending` (TanStack Query v5) [architecture.md — Process Patterns §Loading States]
- Architecture — error: `<ErrorMessage>` for 5xx [architecture.md — Process Patterns §Error Handling]
- Architecture — empty: `<EmptyState>` never return null [architecture.md — Process Patterns §Empty States]
- Architecture — anti-patterns: no `fetch` in components, no snake_case in Zustand [architecture.md — Enforcement Guidelines]
- PatientProfilePage current state (Historial tab): [src/features/patients/pages/PatientProfilePage.tsx](src/features/patients/pages/PatientProfilePage.tsx) lines 107–113
- patients.service.ts current state: [src/services/patients.service.ts](src/services/patients.service.ts)
- Array null guard pattern: [src/services/metrics.service.ts](src/services/metrics.service.ts) line 58
- Previous story (3.4) learnings: [_bmad-output/implementation-artifacts/3-4-live-vr-stream-embed.md](_bmad-output/implementation-artifacts/3-4-live-vr-stream-embed.md)

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Opus 4.8)

### Debug Log References

- `npm run build` → `tsc -b && vite build` passed with 0 TypeScript errors (775 modules transformed, built in ~5s). Only a pre-existing chunk-size advisory warning (>500 kB) and plugin-timing notice — neither is a TS error nor introduced by this story.

### Completion Notes List

- Implemented the full analytics vertical slice: `analytics.types.ts` (camelCase domain types) → `getDashboard` + `toSessionSummary` snake→camel transformer in `patients.service.ts` → `usePatientDashboard` TanStack Query v5 hook (`isPending`, query key `['patient', patientId, 'dashboard']`, `enabled: !!patientId`) → `PatientDashboard.tsx` (Recharts sparkline + trend badge + read-only session list) → wired into `PatientProfilePage` Historial tab.
- **AC #1** satisfied: dashboard calls `GET /patients/:id/dashboard` via the service layer, renders the Recharts `LineChart` sparkline, the global trend indicator, and a session list with date/SPS/classification/recommendation per row.
- **AC #2** satisfied: server state handled exclusively by TanStack Query caching (query key includes patientId); no `useState + useEffect` for data fetching.
- **AC #3** satisfied: trend badge rendered prominently in the chart card header, labeled in Spanish with directional glyph (↑ / → / ↓) alongside the sparkline.
- **AC #4** satisfied: `error` branch renders `<ErrorMessage error={error} />` without crashing; `ApiError` from `api.ts` (5xx) flows into Query's error state.
- **Deviation from story sketch (verified, intentional):** `EmptyState` exposes a `message: string` prop, not children. The story sketch showed `<EmptyState>Sin sesiones…</EmptyState>` but explicitly instructed to read the real API first — used `<EmptyState message="Sin sesiones registradas" />`.
- Followed all mandatory carry-forwards: no `fetch` in component/hook (service layer only), snake→camel only in service, `(raw.sessions ?? [])` null guard, `isPending` (not `isLoading`), no test files (no test infra), `erasableSyntaxOnly`-safe (no class/param-property syntax).
- No new dependencies added; Recharts 2.15.4 and TanStack Query 5.x already installed.

### File List

- `src/features/analytics/analytics.types.ts` (new)
- `src/features/analytics/hooks/usePatientDashboard.ts` (new)
- `src/features/analytics/components/PatientDashboard.tsx` (new)
- `src/services/patients.service.ts` (modified — added `getDashboard`, raw types, `toSessionSummary`, type import)
- `src/features/patients/pages/PatientProfilePage.tsx` (modified — import + Historial tab wiring)

## Change Log

| Date | Change |
|---|---|
| 2026-05-29 | Implemented Story 4.1 — Patient Dashboard & SPS Trend: analytics types, `getDashboard` service, `usePatientDashboard` hook, `PatientDashboard` component (Recharts sparkline + trend badge + session list), wired into PatientProfilePage Historial tab. Build green (0 TS errors). Status → review. |
| 2026-05-30 | Code review completed. 1 decision-needed, 1 patch, 9 deferred, 5 dismissed. Status → in-progress pending resolution. |

### Review Findings

- [x] [Review][Decision→Patch→Fixed] `falling` badge rojo — applied `badgeStyle: { backgroundColor: 'var(--red, #ef4444)', color: '#fff' }` to `TREND_CONFIG.falling` and `style={trend.badgeStyle}` on the badge render. AC #3 fully satisfied. [`src/features/analytics/components/PatientDashboard.tsx`]

- [x] [Review][Patch→Fixed] Unknown `globalTrend` value crash — added `FALLBACK_TREND = TREND_CONFIG['stable']` constant and `?? FALLBACK_TREND` fallback on trend lookup. [`src/features/analytics/components/PatientDashboard.tsx`]

- [x] [Review][Defer] Date timezone risk — bare `YYYY-MM-DD` strings display one day prior at UTC-5 (Peru); mitigated by spec guaranteeing full datetime strings (`"2026-05-01T10:00:00Z"`); revisit if API contract changes [`src/features/analytics/components/PatientDashboard.tsx`] — deferred, pre-existing risk
- [x] [Review][Defer] Invalid sessionDate crashes render — `new Date(invalid)` → `Intl.DateTimeFormat.format()` throws `RangeError`; backend contract specifies valid ISO 8601 [`src/features/analytics/components/PatientDashboard.tsx`] — deferred, pre-existing
- [x] [Review][Defer] `sps` null/NaN from API — `.toFixed(1)` throws or renders `"NaN"`; type declares `number` as non-nullable; backend contract issue [`src/features/analytics/components/PatientDashboard.tsx`] — deferred, pre-existing
- [x] [Review][Defer] Empty/whitespace `patientId` → query disabled → spinner forever — currently protected by `PatientProfilePage` null guard; latent risk if component reused [`src/features/analytics/hooks/usePatientDashboard.ts`] — deferred, pre-existing
- [x] [Review][Defer] `sps` outside [0,100] — chart clips silently at YAxis bounds while table shows raw value; backend data quality issue [`src/features/analytics/components/PatientDashboard.tsx`] — deferred, pre-existing
- [x] [Review][Defer] Chart X-axis label collisions on dense session lists — Story 4.2 session filter addresses this [`src/features/analytics/components/PatientDashboard.tsx`] — deferred, pre-existing
- [x] [Review][Defer] `api.get` returns undefined for non-JSON response — pre-existing service-layer issue affecting all API calls [`src/services/patients.service.ts`] — deferred, pre-existing
- [x] [Review][Defer] Inline style objects recreated every render — performance optimization; future work [`src/features/analytics/components/PatientDashboard.tsx`] — deferred, pre-existing
- [x] [Review][Defer] No `staleTime`/`gcTime` on dashboard query — default refetch-on-focus may be desirable for clinical freshness [`src/features/analytics/hooks/usePatientDashboard.ts`] — deferred, pre-existing
