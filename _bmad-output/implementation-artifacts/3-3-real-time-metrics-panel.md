---
baseline_commit: 64bfdf25810ef39fa7e5cd27b1a2b6429265cacd
---

# Story 3.3: Real-Time Metrics Panel

Status: done

## Story

As a neurologist,
I want to see the 6 cognitive metrics for each completed level with their domain labels and ML classification,
so that I can monitor the patient's cognitive performance as the session progresses.

## Acceptance Criteria

1. **6-metric grid on `level_completed`** — Given a `level_completed` event has been received and metrics are fetched via TanStack Query, when `MetricsPanel` renders for that level, then 6 metric cards are shown: ORS, ERS, SCS (Memoria episódica), RTA, ER (Atención sostenida), SPS (Composite); each card shows the metric label, numeric value, and its cognitive domain via `<DomainTag>`.

2. **`sps_class` pending indicator** — Given `sps_class` is `null` on the REST response (ML service has not yet responded), when `MLFieldDisplay` renders, then a visible pending/loading indicator is shown — not blank space, not an error message.

3. **`sps_class` resolved display** — Given a subsequent `level_completed` WebSocket event carries a resolved `sps_class` value, when `MLFieldDisplay` receives the resolved `{ status: 'resolved', value }` field, then the pending indicator is replaced with the actual classification label.

4. **Recommendation chip** — Given a difficulty recommendation is available (`increase_difficulty` / `maintain_difficulty` / `decrease_difficulty`), when `RecommendationDisplay` renders, then the recommendation is displayed prominently as a read-only chip; no edit controls are present.

5. **5xx error handling** — Given `GET /sessions/:id/metrics` returns a 5xx error, when TanStack Query sets the error state, then `<ErrorMessage>` is displayed in the metrics panel area without crashing the session view.

## Tasks / Subtasks

- [x] **Create `src/features/sessions/hooks/useSession.ts`** (AC: #1–#5)
  - [x] Import `useQuery` from `@tanstack/react-query` and `getSessionMetrics` from `metrics.service`
  - [x] Export `useSessionMetrics(sessionId: string)` wrapping `useQuery` with key `['session', sessionId, 'metrics']`, `queryFn: () => getSessionMetrics(sessionId)`, and `enabled: !!sessionId`

- [x] **Create `src/features/sessions/components/MLFieldDisplay.tsx`** (AC: #2, #3)
  - [x] Import `MLField<T>` type from `../session.types`
  - [x] Export generic `MLFieldDisplay<T>({ field, render }: { field: MLField<T>; render: (value: T) => React.ReactNode })` component
  - [x] Render `.ml-field-pending` span ("Calculando…") when `field.status === 'pending'`; add `aria-label="Calculando resultado ML"` for accessibility
  - [x] Render `.ml-field-error` span with `field.message` when `field.status === 'error'`
  - [x] Render `render(field.value)` when `field.status === 'resolved'`

- [x] **Create `src/features/sessions/components/DomainTag.tsx`** (AC: #1)
  - [x] Define file-private `DOMAIN_CLASS` map: `'Memoria episódica' → 'badge-blue'`, `'Atención sostenida' → 'badge-green'`, `'Composite' → 'badge-gray'`
  - [x] Export `DomainTag({ domain }: { domain: string })` rendering `<span className={`badge ${DOMAIN_CLASS[domain] ?? 'badge-gray'}`}>{domain}</span>`

- [x] **Create `src/features/sessions/components/LevelMetricCard.tsx`** (AC: #1, #2, #3)
  - [x] Import `DomainTag` and `MLFieldDisplay`; import `MLField` type from `../session.types`
  - [x] Define `Props = { label: string; value: number; domain: string; spsClass?: MLField<string> }`
  - [x] Export `LevelMetricCard`: renders `.metric-item` div with `.metric-val` (value to 2 decimal places), `.metric-abbr` (label), domain tag div, and — when `spsClass` prop is provided — a `.metric-sps-class` section with `MLFieldDisplay` rendering `spsClass` as a `badge badge-blue`

- [x] **Create `src/features/sessions/components/RecommendationDisplay.tsx`** (AC: #4)
  - [x] Import `MLFieldDisplay` and `MLField` type
  - [x] Define `RecommendationValue = 'increase_difficulty' | 'maintain_difficulty' | 'decrease_difficulty'`
  - [x] Define file-private `RECOMMENDATION_LABEL` map: `increase → '↑ Aumentar dificultad'`, `maintain → '= Mantener dificultad'`, `decrease → '↓ Reducir dificultad'`
  - [x] Define file-private `RECOMMENDATION_BADGE` map: `increase → 'badge-green'`, `maintain → 'badge-blue'`, `decrease → 'badge-warn'`
  - [x] Export `RecommendationDisplay({ recommendation }: { recommendation: MLField<RecommendationValue> })` using `MLFieldDisplay` to render the chip

- [x] **Create `src/features/sessions/components/MetricsPanel.tsx`** (AC: #1–#5)
  - [x] Import `useSessionMetrics`, `LevelMetricCard`, `RecommendationDisplay`, `LoadingSpinner`, `ErrorMessage`, `EmptyState`
  - [x] Define file-private `METRIC_DOMAINS` constant mapping each key to its domain string
  - [x] Define file-private `METRIC_LABELS` constant mapping each key to its display abbreviation
  - [x] Export `MetricsPanel({ sessionId }: { sessionId: string })`
  - [x] Return `<LoadingSpinner />` when `isPending`; return `<ErrorMessage error={error} />` when `isError`
  - [x] When `levels.length === 0`, render panel wrapper with `<EmptyState message="Esperando primer nivel completado…" />`
  - [x] Display the level with the highest `level` number from the sorted `data.levels` array
  - [x] Render header with section title ("Métricas en tiempo real"), subtitle ("Nivel completado: N"), and `<RecommendationDisplay>` on the right
  - [x] Render `.metrics-live` grid with 5 `<LevelMetricCard>` instances (ors, ers, scs, rta, er) + 1 SPS `<LevelMetricCard>` with `spsClass={level.spsClass}` prop

- [x] **Modify `src/features/sessions/pages/SessionMonitorPage.tsx`** (AC: #1–#5)
  - [x] Add import for `MetricsPanel` from `../components/MetricsPanel`
  - [x] Replace the metrics placeholder `.card` div with `<div className="card" style={{ marginBottom: 24 }}><MetricsPanel sessionId={sessionId} /></div>`
  - [x] Preserve all existing imports and the VR stream placeholder card

- [x] **Add CSS to `src/index.css`** (AC: #2, #1, #4)
  - [x] Add `.ml-field-pending` and `.ml-field-error` classes after the existing `/* ── METRIC PANEL ──` section
  - [x] Add `.metric-domain`, `.metric-sps-class`, `.recommendation-badge` helpers

- [x] **Verify `npm run build` passes (0 TypeScript errors)**

### Review Findings

- [x] [Review][Patch] SessionCompletionToast double mount — added to AppShell without removing from SessionMonitorPage; two toast instances render simultaneously on the session monitor screen [src/shared/components/AppShell.tsx:43, src/features/sessions/pages/SessionMonitorPage.tsx:20]
- [x] [Review][Defer] `patientId ?? ''` passes empty string to SessionCloseButton — spec-conformant but fragile; add early return guard when patientId is undefined [src/features/sessions/pages/SessionMonitorPage.tsx:24] — deferred, pre-existing
- [x] [Review][Defer] MLFieldDisplay fallthrough to `render(field.value)` without explicit `'resolved'` guard — TypeScript-safe for current MLField union, but risks rendering undefined if API sends unexpected status [src/features/sessions/components/MLFieldDisplay.tsx:18] — deferred
- [x] [Review][Defer] RecommendationDisplay no fallback for unknown API recommendation values — unknown value renders as empty badge with `className="... undefined"` [src/features/sessions/components/RecommendationDisplay.tsx:28-35] — deferred
- [x] [Review][Defer] LevelMetricCard `value.toFixed(2)` has no NaN/Infinity/undefined guard — malformed API metric field would throw or render "NaN" [src/features/sessions/components/LevelMetricCard.tsx:10] — deferred
- [x] [Review][Defer] useSessionMetrics missing staleTime/refetchOnWindowFocus:false — window focus triggers redundant refetch alongside WS-driven invalidations [src/features/sessions/hooks/useSession.ts:4-9] — deferred
- [x] [Review][Defer] WS_BASE_URL undefined falls back silently to polling — config error indistinguishable from connectivity failure in user notifications [src/features/sessions/hooks/useSessionWebSocket.ts:74] — deferred
- [x] [Review][Defer] encodeURIComponent applied to sessionId but not to patientId in navigation paths — inconsistent encoding pattern [src/features/sessions/hooks/useSessionWebSocket.ts:80] — deferred
- [x] [Review][Defer] DomainTag DOMAIN_CLASS and MetricsPanel METRIC_DOMAINS share Spanish domain strings as keys with no shared constant — silent fallback to badge-gray on rename/i18n drift [src/features/sessions/components/DomainTag.tsx:1-5] — deferred

## Dev Notes

### Critical Constraints — Read Before Writing Any Code

**`erasableSyntaxOnly: true` in `tsconfig.app.json`.** No constructor parameter properties. Declare class fields explicitly.

**No `fetch` in components or hooks.** All data access via `useSessionMetrics` → `getSessionMetrics` → `api.get`. Never import `api` or call `fetch` inside a component.

**TanStack Query v5 syntax:**
- `isPending` not `isLoading` (deprecated in v5)
- `useQuery({ queryKey: [...], queryFn: ..., enabled: ... })` — options object form only
- `queryClient.invalidateQueries({ queryKey: [...] })` — takes options object, NOT a bare array

**No Zod usage needed in this story.** All types are already defined in `session.types.ts`.

**Zustand v5 selector pattern (performance):**
```ts
const sessionId = useAppStore((s) => s.activeSession.sessionId)   // ✓
const { sessionId } = useAppStore()                                 // ✗ full-store rerender
```

**Generic component TypeScript note:** `MLFieldDisplay` is a generic component. TypeScript requires the generic constraint to avoid JSX parsing ambiguity:
```tsx
// Correct
function MLFieldDisplay<T>({ field, render }: { field: MLField<T>; render: (value: T) => React.ReactNode }) { ... }

// If the compiler complains about <T> in TSX, add trailing comma:
function MLFieldDisplay<T,>({ ... })
```

**No test files** — project has no test infrastructure (MVP, single developer). Do not create test files.

**Build must stay green at 0 TypeScript errors.** Run `npm run build` as final verification step.

---

### Current State of Files Being Modified

| File | Status | Current State |
|---|---|---|
| `src/features/sessions/pages/SessionMonitorPage.tsx` | MODIFY | Has placeholder `.card` with text "Panel de métricas en tiempo real — disponible en Story 3.3". Replace this card's content with `<MetricsPanel sessionId={sessionId} />`. Keep VR stream placeholder card untouched. |
| `src/index.css` | MODIFY | Has `.metrics-live`, `.metric-item`, `.metric-val`, `.metric-abbr`, `.metric-label`, `.metric-tooltip` from the legacy monolith. Reuse these existing classes. Add only what is missing: `.ml-field-pending`, `.ml-field-error`, `.metric-domain`, `.metric-sps-class`, `.recommendation-badge`. |
| `src/features/sessions/hooks/` | CREATE | Directory exists (created in Story 3.2 for `useSessionWebSocket.ts`). Add `useSession.ts` here. |
| `src/features/sessions/components/` | CREATE | Directory exists. Add `MLFieldDisplay.tsx`, `DomainTag.tsx`, `LevelMetricCard.tsx`, `RecommendationDisplay.tsx`, `MetricsPanel.tsx`. |

**What already exists (DO NOT recreate or modify in this story):**
- `src/services/metrics.service.ts` — `getSessionMetrics(sessionId)` is implemented and tested (Story 3.2)
- `src/features/sessions/session.types.ts` — `MLField<T>`, `LevelMetrics`, `SessionMetrics` are defined (Story 3.2)
- `src/features/sessions/hooks/useSessionWebSocket.ts` — WS lifecycle + query invalidation wired (Story 3.2)
- `src/features/sessions/components/WsStatusIndicator.tsx` — already in SessionMonitorPage
- `src/features/sessions/components/SessionCompletionToast.tsx` — already in SessionMonitorPage

---

### Component Blueprints

#### `src/features/sessions/hooks/useSession.ts`

```ts
import { useQuery } from '@tanstack/react-query'
import { getSessionMetrics } from '../../../services/metrics.service'

export function useSessionMetrics(sessionId: string) {
  return useQuery({
    queryKey: ['session', sessionId, 'metrics'],
    queryFn: () => getSessionMetrics(sessionId),
    enabled: !!sessionId,
  })
}
```

**Query key note:** This is the SAME key `['session', sessionId, 'metrics']` that `useSessionWebSocket` invalidates on every `level_completed` event. The two are coupled by design — invalidation in the WS hook triggers the refetch in this hook's subscriber.

---

#### `src/features/sessions/components/MLFieldDisplay.tsx`

```tsx
import type { MLField } from '../session.types'

type Props<T> = {
  field: MLField<T>
  render: (value: T) => React.ReactNode
}

export function MLFieldDisplay<T>({ field, render }: Props<T>) {
  if (field.status === 'pending') {
    return (
      <span className="ml-field-pending" aria-label="Calculando resultado ML">
        Calculando…
      </span>
    )
  }
  if (field.status === 'error') {
    return <span className="ml-field-error">{field.message}</span>
  }
  return <>{render(field.value)}</>
}
```

**Why inline span instead of `<LoadingSpinner>`:** `LoadingSpinner` uses the `.empty` class with 60px padding — it is a full-section spinner. `sps_class` is an inline field within a metric card; it needs an inline indicator, not a section-level one.

---

#### `src/features/sessions/components/DomainTag.tsx`

```tsx
const DOMAIN_CLASS: Record<string, string> = {
  'Memoria episódica': 'badge-blue',
  'Atención sostenida': 'badge-green',
  Composite: 'badge-gray',
}

type Props = {
  domain: string
}

export function DomainTag({ domain }: Props) {
  return (
    <span className={`badge ${DOMAIN_CLASS[domain] ?? 'badge-gray'}`}>
      {domain}
    </span>
  )
}
```

---

#### `src/features/sessions/components/LevelMetricCard.tsx`

```tsx
import type { MLField } from '../session.types'
import { DomainTag } from './DomainTag'
import { MLFieldDisplay } from './MLFieldDisplay'

type Props = {
  label: string
  value: number
  domain: string
  spsClass?: MLField<string>
}

export function LevelMetricCard({ label, value, domain, spsClass }: Props) {
  return (
    <div className="metric-item">
      <div className="metric-val">{value.toFixed(2)}</div>
      <div className="metric-abbr">{label}</div>
      <div className="metric-domain">
        <DomainTag domain={domain} />
      </div>
      {spsClass !== undefined && (
        <div className="metric-sps-class">
          <span className="card-label">Clasificación</span>
          <MLFieldDisplay
            field={spsClass}
            render={(v) => <span className="badge badge-blue">{v}</span>}
          />
        </div>
      )}
    </div>
  )
}
```

**`spsClass` is only passed to the SPS card.** The other 5 metric cards receive no `spsClass` prop. TypeScript enforces this because `spsClass` is optional.

---

#### `src/features/sessions/components/RecommendationDisplay.tsx`

```tsx
import type { MLField } from '../session.types'
import { MLFieldDisplay } from './MLFieldDisplay'

type RecommendationValue =
  | 'increase_difficulty'
  | 'maintain_difficulty'
  | 'decrease_difficulty'

const RECOMMENDATION_LABEL: Record<RecommendationValue, string> = {
  increase_difficulty: '↑ Aumentar dificultad',
  maintain_difficulty: '= Mantener dificultad',
  decrease_difficulty: '↓ Reducir dificultad',
}

const RECOMMENDATION_BADGE: Record<RecommendationValue, string> = {
  increase_difficulty: 'badge-green',
  maintain_difficulty: 'badge-blue',
  decrease_difficulty: 'badge-warn',
}

type Props = {
  recommendation: MLField<RecommendationValue>
}

export function RecommendationDisplay({ recommendation }: Props) {
  return (
    <MLFieldDisplay
      field={recommendation}
      render={(value) => (
        <span className={`badge recommendation-badge ${RECOMMENDATION_BADGE[value]}`}>
          {RECOMMENDATION_LABEL[value]}
        </span>
      )}
    />
  )
}
```

**Read-only enforcement:** There are no `onClick`, `onChange`, or form elements. The chip is purely informational. This satisfies FR-5.3's "read-only" requirement.

---

#### `src/features/sessions/components/MetricsPanel.tsx`

```tsx
import { useSessionMetrics } from '../hooks/useSession'
import { LevelMetricCard } from './LevelMetricCard'
import { RecommendationDisplay } from './RecommendationDisplay'
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

type Props = {
  sessionId: string
}

export function MetricsPanel({ sessionId }: Props) {
  const { data, isPending, isError, error } = useSessionMetrics(sessionId)

  if (isPending) return <LoadingSpinner />
  if (isError) return <ErrorMessage error={error} />

  const levels = data?.levels ?? []

  if (levels.length === 0) {
    return (
      <div className="metrics-panel">
        <div className="section-header">
          <div className="section-title">Métricas en tiempo real</div>
        </div>
        <EmptyState message="Esperando primer nivel completado…" />
      </div>
    )
  }

  const level = [...levels].sort((a, b) => b.level - a.level)[0]

  return (
    <div className="metrics-panel">
      <div className="section-header">
        <div>
          <div className="section-title">Métricas en tiempo real</div>
          <div className="section-sub">Nivel completado: {level.level}</div>
        </div>
        <div className="metrics-recommendation">
          <span className="card-label" style={{ display: 'block', marginBottom: 4 }}>
            Recomendación
          </span>
          <RecommendationDisplay recommendation={level.recommendation} />
        </div>
      </div>

      <div className="metrics-live">
        {(['ors', 'ers', 'scs', 'rta', 'er'] as const).map((key) => (
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
  )
}
```

---

#### `src/features/sessions/pages/SessionMonitorPage.tsx` — Modified

Replace the metrics placeholder card content only. Full file after modification:

```tsx
import { useParams, Navigate } from 'react-router-dom'
import { useAppStore } from '../../../store/app.store'
import { SessionCloseButton } from '../components/SessionCloseButton'
import { WsStatusIndicator } from '../components/WsStatusIndicator'
import { SessionCompletionToast } from '../components/SessionCompletionToast'
import { MetricsPanel } from '../components/MetricsPanel'
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
        <SessionCloseButton sessionId={sessionId} patientId={patientId ?? ''} />
      </div>
      <div className="card" style={{ marginBottom: 24 }}>
        <MetricsPanel sessionId={sessionId} />
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

#### CSS to Add to `src/index.css`

Add the following after the existing `/* ── METRIC PANEL ──` section (after `.metric-label:hover .metric-tooltip` rule, approximately line 843):

```css
/* ── ML FIELD DISPLAY ── */
.ml-field-pending {
  font-size: 10px;
  font-family: var(--mono);
  color: var(--text3);
  font-style: italic;
}

.ml-field-error {
  font-size: 10px;
  font-family: var(--mono);
  color: var(--accent3);
}

/* ── METRIC CARD EXTRAS ── */
.metric-domain {
  margin-top: 6px;
  display: flex;
  justify-content: center;
}

.metric-sps-class {
  margin-top: 10px;
  border-top: 1px solid var(--border);
  padding-top: 8px;
  text-align: left;
}

.recommendation-badge {
  font-size: 11px;
  padding: 4px 12px;
}
```

---

### Existing CSS Classes to Reuse (DO NOT redefine)

These classes already exist in `src/index.css` and are the primary visual structure for the metrics grid:

| Class | Purpose |
|---|---|
| `.metrics-live` | Responsive grid: `repeat(auto-fit, minmax(140px, 1fr))`, gap 16px |
| `.metric-item` | Individual metric card: surface2 bg, border, radius, padding 16px 12px, centered text |
| `.metric-val` | Large number: 28px, 700, mono font |
| `.metric-abbr` | Metric label pill: 12px, surface3 bg, rounded |
| `.badge`, `.badge-blue`, `.badge-green`, `.badge-gray`, `.badge-warn` | Existing badge variants for DomainTag and chips |
| `.section-header`, `.section-title`, `.section-sub` | Header layout |
| `.card-label` | Small mono label above values |

---

### State & Data Flow

**Initial load (no levels completed yet):**
1. `SessionMonitorPage` mounts → `useSessionWebSocket` connects WS
2. `MetricsPanel` calls `useSessionMetrics(sessionId)` → `GET /sessions/:id/metrics` → response: `{ session_id: "...", levels: [] }`
3. `MetricsPanel` renders `<EmptyState message="Esperando primer nivel completado…" />`

**After `level_completed` WS event:**
1. `useSessionWebSocket.onmessage` fires → `queryClient.invalidateQueries({ queryKey: ['session', sessionId, 'metrics'] })` → marks the metrics query stale
2. TanStack Query background-refetches → `GET /sessions/:id/metrics` returns levels with latest data
3. `MetricsPanel` re-renders with the highest-level entry — 6 `LevelMetricCard` components appear
4. If `sps_class` was null in the REST response (ML not yet resolved), `level.spsClass` is `{ status: 'pending' }` → `MLFieldDisplay` shows "Calculando…"

**After second `level_completed` event (ML resolved on previous level):**
1. Same flow as above
2. The new response for the previous level now has `sps_class` populated → `spsClass` becomes `{ status: 'resolved', value: '...' }` → classification badge replaces the pending indicator

**Recommendation pending:**
`recommendation` follows identical logic via `MLFieldDisplay` inside `RecommendationDisplay`. The `RecommendationDisplay` header shows "Calculando…" until the ML field resolves.

---

### Edge Cases

**`data` is `undefined` on first render** — TanStack Query `data` can be `undefined` while `isPending` is false if the query was never enabled. The `data?.levels ?? []` guard handles this: MetricsPanel renders the empty state instead of crashing.

**Multiple levels in the response** — MetricsPanel always sorts by `level` descending and shows the highest. This is the most recent level. If a user wants to review historical levels within the session, that is a future feature (not in scope for this story).

**`spsClass` or `recommendation` with `status: 'error'`** — `MLFieldDisplay` renders the error message inline. This path is not triggered by the current `toMLField` transformer (which only maps `null → 'pending'`, non-null → `'resolved'`), but the component handles it defensively.

**`MetricsPanel` mounted with no `sessionId`** — `useSessionMetrics` is called with an empty string; `enabled: !!sessionId` is `false`, so no network request is made. `isPending` remains `false`, `data` is `undefined`, `levels` is `[]` → EmptyState renders. This is a safe fallback.

**Rapid successive WS events** — TanStack Query deduplicates in-flight requests; a second `level_completed` event while the first refetch is in progress is a no-op. The MetricsPanel will always show the freshest data once the active request settles.

---

### Project Structure for This Story

```
src/
  features/
    sessions/
      hooks/
        useSession.ts                        ← NEW: useSessionMetrics()
        useSessionWebSocket.ts               ← no change
      components/
        MLFieldDisplay.tsx                   ← NEW: MLField<T> pending/resolved/error render
        DomainTag.tsx                        ← NEW: cognitive domain badge
        LevelMetricCard.tsx                  ← NEW: individual metric card
        RecommendationDisplay.tsx            ← NEW: difficulty recommendation chip
        MetricsPanel.tsx                     ← NEW: orchestrator (TanStack Query + 6 cards)
        WsStatusIndicator.tsx               ← no change
        SessionCompletionToast.tsx          ← no change
      pages/
        SessionMonitorPage.tsx              ← MODIFY: replace metrics placeholder with MetricsPanel
  index.css                                 ← MODIFY: add ml-field-pending/error, metric extras
```

**Do NOT create for this story:**
- `src/features/sessions/components/CloudflareStreamPlayer.tsx` — Story 3.4
- Any test files — project has no test infrastructure

---

### Cross-Story Awareness

**What Story 3.4 will touch:**
- `SessionMonitorPage.tsx` will replace the VR stream placeholder `.card` with `<CloudflareStreamPlayer />`
- `MetricsPanel` and all its child components are complete and unchanged by Story 3.4

**What this story inherits from Story 3.2:**
- `useSessionWebSocket` already invalidates `['session', sessionId, 'metrics']` on every `level_completed` event — this is the trigger that keeps `MetricsPanel` live
- `activeSession.currentLevel` is set in Zustand on every `level_completed` event — MetricsPanel does not need to read it (it sorts the `levels` array from the fetched data), but it is available if needed
- All ML types (`MLField<T>`, `LevelMetrics`, `SessionMetrics`) are in `session.types.ts`
- `getSessionMetrics` is fully implemented in `metrics.service.ts`

---

### References

- Acceptance criteria: [epics.md — Story 3.3](_bmad-output/planning-artifacts/epics.md)
- FR-4.2: `level_completed` → metrics panel update; FR-4.3: null-safe ML field rendering; FR-5.1: 6-metric grid; FR-5.2: domain tags; FR-5.3: recommendation chip
- Architecture — component list: `MetricsPanel`, `LevelMetricCard`, `MLFieldDisplay`, `DomainTag`, `RecommendationDisplay` [architecture.md — Project Structure]
- Architecture — query key: `['session', sessionId, 'metrics']` [architecture.md — Naming Patterns]
- Architecture — `MLField<T>` discriminated union [architecture.md — Format Patterns]
- Architecture — anti-pattern: "Rendering `null` for `sps_class: null` — must render pending indicator" [architecture.md — Enforcement Guidelines]
- Architecture — empty states: "Every list renders `<EmptyState>` — never null" [architecture.md — Process Patterns]
- Previous story: [3-2-websocket-lifecycle-session-events.md](_bmad-output/implementation-artifacts/3-2-websocket-lifecycle-session-events.md)
- Existing metrics service: `src/services/metrics.service.ts`
- Existing types: `src/features/sessions/session.types.ts`

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (PAI / bmad-dev-story workflow)

### Debug Log References

- `npm run build` (`tsc -b && vite build`) → exit 0, 0 TypeScript errors, build emitted `dist/assets/index-CBjFi9ej.js` (405.97 kB) + `index-DGdF2vRz.css`. This is the story's Definition-of-Done verification gate (`BUILD_EXIT:0`).
- Per Dev Notes constraint ("No test files — project has no test infrastructure"), no automated tests were authored; verification is via the build gate as the story specifies.

### Completion Notes List

- **AC1 — 6-metric grid:** `MetricsPanel` fetches via `useSessionMetrics` (TanStack Query, key `['session', sessionId, 'metrics']`) and renders the highest-`level` entry as 6 `LevelMetricCard`s — ORS/ERS/SCS (Memoria episódica), RTA/ER (Atención sostenida), SPS (Composite) — each showing label, value (2 decimals), and a `<DomainTag>` badge.
- **AC2 — `sps_class` pending:** `MLFieldDisplay` renders the inline `.ml-field-pending` "Calculando…" span (with `aria-label`) when the `MLField` status is `pending` — never blank, never an error.
- **AC3 — `sps_class` resolved:** when a later `level_completed` event resolves the field to `{ status: 'resolved', value }`, `MLFieldDisplay` swaps the pending indicator for the `badge badge-blue` classification label. Liveness is driven by the Story 3.2 WS hook invalidating the shared query key.
- **AC4 — recommendation chip:** `RecommendationDisplay` renders a read-only `badge recommendation-badge` chip (increase=green, maintain=blue, decrease=warn) with Spanish labels; no `onClick`/`onChange`/form controls.
- **AC5 — 5xx handling:** `MetricsPanel` returns `<ErrorMessage error={error} />` on `isError` and `<LoadingSpinner />` on `isPending`, so a failed `GET /sessions/:id/metrics` shows the error in-panel without crashing the session view; empty `levels` renders `<EmptyState>`.
- Followed the story blueprints verbatim; reused existing `.metrics-live`/`.metric-item`/`.metric-val`/`.metric-abbr`/badge/`section-*`/`card-label` classes and added only `.ml-field-pending`, `.ml-field-error`, `.metric-domain`, `.metric-sps-class`, `.recommendation-badge`. No `fetch` in components/hooks; all data access via `useSessionMetrics` → `getSessionMetrics` → `api.get`.

### File List

**New:**
- `src/features/sessions/hooks/useSession.ts`
- `src/features/sessions/components/MLFieldDisplay.tsx`
- `src/features/sessions/components/DomainTag.tsx`
- `src/features/sessions/components/LevelMetricCard.tsx`
- `src/features/sessions/components/RecommendationDisplay.tsx`
- `src/features/sessions/components/MetricsPanel.tsx`

**Modified:**
- `src/features/sessions/pages/SessionMonitorPage.tsx`
- `src/index.css`
- `_bmad-output/implementation-artifacts/3-3-real-time-metrics-panel.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

| Date | Change |
|---|---|
| 2026-05-29 | Implemented all tasks: `useSessionMetrics` hook, `MLFieldDisplay`/`DomainTag`/`LevelMetricCard`/`RecommendationDisplay`/`MetricsPanel` components, `SessionMonitorPage` wiring, and CSS additions. `npm run build` passes (0 TS errors). Status → review. |
