---
baseline_commit: 2f9e267469983d93366d20a4224aff8f3d7b9f4f
---

# Story 2.3: Patient Profile Page

Status: done

## Story

As a neurologist,
I want to navigate to a patient's profile and see their information organized by tabs,
So that I can access session management and analytics from a single entry point.

## Acceptance Criteria

1. **Profile renders on `/patients/:id`** — Clicking a patient card in the list navigates to `/patients/:id`; `PatientProfilePage` renders with the patient's name, age, diagnosis, and baseline scores visible when `GET /patients/:id` returns data.

2. **Three tabs visible** — When `PatientProfilePage` loads, three tab buttons are rendered: "Resumen", "Historial", and "Sesión activa".

3. **"Resumen" tab content** — The active "Resumen" tab renders the patient info card and a `SessionOpenButton` placeholder.

4. **"Historial" tab content** — Switching to the "Historial" tab renders placeholder content (analytics components wired in Epic 4).

5. **"Sesión activa" tab hidden by default** — When `store.activeSession.sessionId` does not equal the patient's `id`, the "Sesión activa" tab button is **not** rendered. When it does match, the tab is visible.

6. **404 / 5xx API error** — `GET /patients/:id` returning 404 or 5xx causes `<ErrorMessage>` to render without crashing the page.

## Tasks / Subtasks

- [x] Add `getPatient(id)` to `src/services/patients.service.ts` (AC: #1, #6)
  - [x] Define and export `getPatient(id: string): Promise<Patient>` calling `api.get<PatientRaw>(\`/patients/${id}\`)` and transforming with `toCamel()`
  - [x] Place it after `getPatients()` at the end of the file; leave all existing functions unchanged

- [x] Create `src/features/patients/hooks/usePatient.ts` (AC: #1, #6)
  - [x] `useQuery({ queryKey: ['patient', id], queryFn: () => getPatient(id), staleTime: 30_000 })`
  - [x] Export `usePatient(id: string)` hook

- [x] Create `src/features/sessions/components/SessionOpenButton.tsx` (AC: #3)
  - [x] Create `src/features/sessions/` directory (does not exist yet)
  - [x] Create `src/features/sessions/components/` subdirectory
  - [x] Export `SessionOpenButton({ patientId }: { patientId: string })` — renders `<button className="btn btn-primary" disabled>Iniciar sesión</button>`
  - [x] The `patientId` prop is intentionally unused in this story; Story 3.1 will use it to call `POST /sessions`

- [x] Create `src/features/patients/pages/PatientProfilePage.tsx` (AC: #1, #2, #3, #4, #5, #6)
  - [x] `useParams<{ id: string }>()` to extract the route param
  - [x] `usePatient(id!)` — render `<LoadingSpinner />` when `isPending`, `<ErrorMessage error={error} />` when error or `!patient`
  - [x] `useState<'resumen' | 'historial' | 'sesion-activa'>('resumen')` for active tab
  - [x] `useAppStore(s => s.activeSession.sessionId)` to determine session tab visibility
  - [x] `.tabs` container with `.tab` / `.tab.active` buttons; "Sesión activa" tab only rendered when `activeSessionId === id`
  - [x] "Resumen" panel: patient info `.card` (name, age, diagnosis, status badge, baselineRavlt, baselineSart) + `<SessionOpenButton patientId={patient.id} />`
  - [x] "Historial" panel: placeholder `.card` with Spanish text
  - [x] "Sesión activa" panel: placeholder `.card` with Spanish text (only reachable when tab is visible)

- [x] Modify `src/router/index.tsx` (AC: #1)
  - [x] Replace line 61 stub `{ path: 'patients/:id', element: <div ...> }` with `{ path: 'patients/:id', element: <PatientProfilePage /> }`
  - [x] Add import: `import PatientProfilePage from '../features/patients/pages/PatientProfilePage'`

- [x] Verify `npm run build` passes (0 TypeScript errors)

### Review Findings

- [x] [Review][Patch] Background refetch error hides valid cached data — changed `if (error || !patient)` to `if (!patient)` with non-blocking inline error banner when stale data is available [`src/features/patients/pages/PatientProfilePage.tsx:26`]
- [x] [Review][Patch] `id` undefined can fire `GET /patients/undefined` — added `enabled: !!id` to `usePatient` + `id ?? ''` call + `if (!id)` guard [`src/features/patients/hooks/usePatient.ts:5`]
- [x] [Review][Patch] Orphaned `sesion-activa` panel persists when session ends — added `useEffect` to reset `activeTab` when `showSessionTab` flips false [`src/features/patients/pages/PatientProfilePage.tsx`]
- [x] [Review][Patch] Tab state not reset when navigating between patients — added `useEffect(() => setActiveTab('resumen'), [id])` [`src/features/patients/pages/PatientProfilePage.tsx`]
- [x] [Review][Patch] `getPatient` uses raw string interpolation without `encodeURIComponent` — fixed [`src/services/patients.service.ts:55`]
- [x] [Review][Defer] `status ?? 'active'` is dead code per `PatientRaw` type; empty string passes nullish check silently mis-classifying status [`src/services/patients.service.ts:21`] — deferred, pre-existing
- [x] [Review][Defer] 401 response in `api.get` resolves `undefined` instead of rejecting — TanStack Query never enters error state on auth expiry [`src/services/api.ts`] — deferred, pre-existing
- [x] [Review][Defer] `age` could be float from API, renders as "75.5 años" with no rounding [`src/services/patients.service.ts:17`] — deferred, pre-existing
- [x] [Review][Defer] `useAppStore(s => s.activeSession.sessionId)` has no optional chaining — throws TypeError if `activeSession` is undefined on store init [`src/features/patients/pages/PatientProfilePage.tsx:18`] — deferred, pre-existing

## Dev Notes

### Critical Constraints — Read Before Writing Any Code

**`erasableSyntaxOnly: true` in `tsconfig.app.json`.** No constructor parameter properties. Declare class fields explicitly. Carried from Story 1.1.

**No `fetch` in components or hooks.** All API calls must go through `patients.service.ts#getPatient()` → `api.get()`. Never call `fetch` or `api` directly from a component.

**TanStack Query v5 syntax only:**
- `isPending` not `isLoading` (v5 renamed it — `isLoading` is a runtime error in v5)
- `staleTime: 30_000` — same as patient list, consistent patient-data caching
- `queryKey: ['patient', id]` — follows architecture-defined key schema

**Zustand subscription via selector (performance).** Use `useAppStore(s => s.activeSession.sessionId)` — do NOT use `useAppStore()` and destructure. Selectors prevent unnecessary rerenders.

**`useParams` always returns strings.** Use `id!` (non-null assertion) — the router guarantees `id` is present for this route path. Never parse or coerce it.

**No new CSS classes.** All styling uses existing classes from `src/index.css`. Inline `style=` only for layout values with no CSS equivalent (font-size overrides for field values fall into this category — the design system has no "medium field value" text class).

**SessionOpenButton is a placeholder only.** Do NOT call `POST /sessions`, wire Zustand, or navigate inside `SessionOpenButton`. The stub accepts `patientId` as a prop (for Story 3.1 API compatibility) but renders a `disabled` button. Do NOT implement any session-opening logic.

**Do NOT implement "Historial" or "Sesión activa" tab content.** These tabs render placeholder text only. Do not import analytics components (Epic 4) or session monitor components (Epic 3) — those don't exist yet and would cause import errors.

**"Sesión activa" tab visibility is a runtime check, not a route guard.** The check `activeSessionId === id` runs on every render. No additional `useMemo` needed — Zustand selector is already efficient. The tab panel content is only reachable when the tab is rendered, so no special guard inside the panel is needed.

### Current State of Files Being Modified

| File | Status | Detail |
|---|---|---|
| `src/router/index.tsx` | MODIFY | Line 61: `{ path: 'patients/:id', element: <div className="page"><p>Perfil del paciente — próximamente</p></div> }` — replace element with `<PatientProfilePage />` |
| `src/services/patients.service.ts` | MODIFY | Has `PatientRaw`, `toCamel()`, `createPatient()`, `PatientListParams`, `getPatients()`. Add `getPatient(id)` after `getPatients()` at end of file. All existing functions UNTOUCHED. |
| `src/features/patients/patient.types.ts` | UNTOUCHED | Has `Diagnosis`, `PatientStatus`, `Patient` (8 fields including status). No changes needed. |
| `src/features/patients/hooks/` | ADD FILE | Dir exists with `useCreatePatient.ts`, `usePatients.ts`. Add `usePatient.ts`. |
| `src/features/patients/pages/` | ADD FILE | Dir exists with `PatientRegistrationPage.tsx`, `PatientListPage.tsx`. Add `PatientProfilePage.tsx`. |
| `src/features/sessions/` | NEW DIR | Does not exist. Create with `components/SessionOpenButton.tsx`. |

**Do NOT touch:** `src/services/api.ts`, `src/store/app.store.ts`, `src/services/auth.service.ts`, `src/shared/components/*`, `src/features/patients/patient.schema.ts`, `src/features/patients/hooks/useCreatePatient.ts`, `src/features/patients/hooks/usePatients.ts`, `src/features/patients/components/*`, `src/features/patients/pages/PatientListPage.tsx`, `src/features/patients/pages/PatientRegistrationPage.tsx`.

### Existing API Methods Available

```ts
api.get<T>(path)          // GET
api.post<T>(path, body)   // POST
api.patch<T>(path, body)  // PATCH
```
All calls auto-include `credentials: 'include'` and `Content-Type: application/json`. 401 globally redirects to `/login`. 5xx throws `ApiError` caught by TanStack Query `error` state.

### Existing Shared Components

```tsx
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
```

`<ErrorMessage error={error} />` accepts `unknown`, extracts `.message` from `ApiError | Error`.
`<LoadingSpinner />` renders an inline loading indicator.

### Existing Store Interface

```ts
// src/store/app.store.ts
const activeSessionId = useAppStore(s => s.activeSession.sessionId) // string | null
```

`activeSession.sessionId` is `null` when no session is active, or a UUID string when a session is open. This story only reads from the store — never writes.

### Existing CSS Classes for This Story

| Class | Purpose |
|---|---|
| `.page` | Page wrapper with padding |
| `.page-title` | Section heading (font-size ~18px, bold) |
| `.section-header` | Flex row `justify-content: space-between` |
| `.tabs` | Tab bar: flex row, border-bottom, 4px gap |
| `.tab` | Tab button: 10px 18px padding, 13px font, text2 color |
| `.tab.active` | Active tab: accent color, accent bottom-border |
| `.card` | White/surface card with border, radius, shadow, 20px padding |
| `.card-label` | Field label: 10px monospace, text3 color, uppercase-ish |
| `.card-value` | Large metric value: 28px bold — **do NOT use for field text** |
| `.card-sub` | Secondary text: 11px, text2 color — fine for technical values like scores |
| `.badge` | Base badge style |
| `.badge-green` | Active status: teal text, green-tinted bg/border |
| `.badge-gray` | Inactive status: text2 color, surface bg/border |
| `.btn` | Base button style |
| `.btn-primary` | Accent-colored primary button |

### Blueprints

**`src/services/patients.service.ts` — addition only (append after `getPatients`):**
```ts
export async function getPatient(id: string): Promise<Patient> {
  const raw = await api.get<PatientRaw>(`/patients/${id}`)
  return toCamel(raw)
}
```

**`src/features/patients/hooks/usePatient.ts`:**
```ts
import { useQuery } from '@tanstack/react-query'
import { getPatient } from '../../../services/patients.service'

export function usePatient(id: string) {
  return useQuery({
    queryKey: ['patient', id],
    queryFn: () => getPatient(id),
    staleTime: 30_000,
  })
}
```

**`src/features/sessions/components/SessionOpenButton.tsx`:**
```tsx
type Props = {
  patientId: string
}

export function SessionOpenButton({ patientId: _patientId }: Props) {
  return (
    <button className="btn btn-primary" disabled>
      Iniciar sesión
    </button>
  )
}
```

**`src/features/patients/pages/PatientProfilePage.tsx`:**
```tsx
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAppStore } from '../../../store/app.store'
import { usePatient } from '../hooks/usePatient'
import { SessionOpenButton } from '../../sessions/components/SessionOpenButton'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'

type Tab = 'resumen' | 'historial' | 'sesion-activa'

const DIAGNOSIS_LABEL: Record<string, string> = {
  EA: 'Enfermedad de Alzheimer',
  MCI: 'Deterioro Cognitivo Leve',
}

export default function PatientProfilePage() {
  const { id } = useParams<{ id: string }>()
  const activeSessionId = useAppStore(s => s.activeSession.sessionId)
  const showSessionTab = activeSessionId === id

  const [activeTab, setActiveTab] = useState<Tab>('resumen')

  const { data: patient, isPending, error } = usePatient(id!)

  if (isPending) return <LoadingSpinner />
  if (error || !patient) return <ErrorMessage error={error} />

  return (
    <div className="page">
      <div className="section-header">
        <h1 className="page-title">{patient.name}</h1>
      </div>

      <div className="tabs">
        <button
          className={`tab${activeTab === 'resumen' ? ' active' : ''}`}
          onClick={() => setActiveTab('resumen')}
        >
          Resumen
        </button>
        <button
          className={`tab${activeTab === 'historial' ? ' active' : ''}`}
          onClick={() => setActiveTab('historial')}
        >
          Historial
        </button>
        {showSessionTab && (
          <button
            className={`tab${activeTab === 'sesion-activa' ? ' active' : ''}`}
            onClick={() => setActiveTab('sesion-activa')}
          >
            Sesión activa
          </button>
        )}
      </div>

      {activeTab === 'resumen' && (
        <div>
          <div className="card" style={{ maxWidth: 520, marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <div className="card-label">NOMBRE</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{patient.name}</div>
              </div>
              <div>
                <div className="card-label">EDAD</div>
                <div style={{ fontSize: 15 }}>{patient.age} años</div>
              </div>
              <div>
                <div className="card-label">DIAGNÓSTICO</div>
                <div style={{ fontSize: 13 }}>
                  {DIAGNOSIS_LABEL[patient.diagnosis] ?? patient.diagnosis}
                </div>
              </div>
              <div>
                <div className="card-label">ESTADO</div>
                <span className={`badge ${patient.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                  {patient.status === 'active' ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div>
                <div className="card-label">RAVLT LÍNEA BASE</div>
                <div className="card-sub" style={{ fontSize: 13 }}>{patient.baselineRavlt}</div>
              </div>
              <div>
                <div className="card-label">SART LÍNEA BASE</div>
                <div className="card-sub" style={{ fontSize: 13 }}>{patient.baselineSart}</div>
              </div>
            </div>
          </div>
          <SessionOpenButton patientId={patient.id} />
        </div>
      )}

      {activeTab === 'historial' && (
        <div className="card">
          <p style={{ color: 'var(--text2)', fontSize: 13 }}>
            Historial de sesiones — disponible en Epic 4
          </p>
        </div>
      )}

      {activeTab === 'sesion-activa' && (
        <div className="card">
          <p style={{ color: 'var(--text2)', fontSize: 13 }}>
            Monitoreo de sesión activa — disponible en Epic 3
          </p>
        </div>
      )}
    </div>
  )
}
```

**`src/router/index.tsx` — change only the `/patients/:id` route element:**
```tsx
// Add import at top with other page imports:
import PatientProfilePage from '../features/patients/pages/PatientProfilePage'

// Replace stub (currently line 61):
// { path: 'patients/:id', element: <div className="page"><p>Perfil del paciente — próximamente</p></div> },
// With:
{ path: 'patients/:id', element: <PatientProfilePage /> },
```

### Project Structure for This Story

```
src/
  features/
    patients/                            ← existing
      hooks/
        usePatient.ts                    ← NEW
        usePatients.ts                   ← UNTOUCHED
        useCreatePatient.ts              ← UNTOUCHED
      pages/
        PatientProfilePage.tsx           ← NEW
        PatientListPage.tsx              ← UNTOUCHED
        PatientRegistrationPage.tsx      ← UNTOUCHED
      components/                        ← UNTOUCHED
      patient.types.ts                   ← UNTOUCHED
      patient.schema.ts                  ← UNTOUCHED
    sessions/                            ← NEW directory
      components/
        SessionOpenButton.tsx            ← NEW (placeholder stub)
  services/
    patients.service.ts                  ← MODIFY: append getPatient(id)
  router/
    index.tsx                            ← MODIFY: replace /patients/:id stub
```

**Do NOT create:**
- `src/features/sessions/pages/` — Story 3.1
- `src/features/sessions/hooks/` — Story 3.2
- `useSession.ts` or `useSessionWebSocket.ts` — Epic 3
- `PatientDashboard.tsx`, `TrendChart.tsx`, `SessionHistory.tsx` — Epic 4
- New CSS classes or stylesheets

### Story 2.3 Awareness (Do NOT implement)

Story 3.1 will replace `SessionOpenButton` internals: add `POST /sessions` call via `sessions.service.ts`, store `sessionId` in Zustand, and navigate to `/patients/:id/session`. The stub pattern (accepting `patientId` prop, returning disabled button) is designed so Story 3.1 only modifies the component body.

Epic 4 will implement the "Historial" tab content by importing `PatientDashboard`, `TrendChart`, and `SessionHistory` components into `PatientProfilePage`. The placeholder text approach means Story 4.1 modifies `PatientProfilePage` minimally.

### Previous Story Intelligence (Story 2.2)

- **TanStack Query v5:** `isPending` not `isLoading`. `invalidateQueries({ queryKey: [...] })` — object form.
- **CSS classes are already defined.** Never guess — check `src/index.css` before inventing a class name.
- **`useDebounce.ts` is in `src/shared/hooks/`** — already exists, no action needed.
- **`patients.service.ts` extend pattern:** always append new exports; never overwrite `toCamel`, `createPatient`, or `getPatients`. `PatientRaw` type is file-private (not exported) — `getPatient` reuses the existing `PatientRaw` type naturally.
- **Zustand selector pattern confirmed:** `useAppStore(s => s.slice.field)` — use selector form, not `useAppStore()` full store.

### References

- Acceptance criteria: [epics.md — Story 2.3](_bmad-output/planning-artifacts/epics.md)
- FR-2.3: Patient profile navigation spec
- Architecture — Query Keys: `['patient', patientId]` [architecture.md](_bmad-output/planning-artifacts/architecture.md)
- Architecture — PatientProfilePage tab structure: [architecture.md — Gap Analysis](_bmad-output/planning-artifacts/architecture.md)
- Architecture — Zustand selector pattern: [architecture.md](_bmad-output/planning-artifacts/architecture.md)
- Previous story: [2-2-patient-list-search.md](_bmad-output/implementation-artifacts/2-2-patient-list-search.md)
- Deferred items (do NOT fix): [deferred-work.md](_bmad-output/implementation-artifacts/deferred-work.md)

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (PAI / bmad-dev-story workflow)

### Debug Log References

- `npm run build` → ✓ built in 267ms, 0 TypeScript errors, 180 modules transformed

### Completion Notes List

- Implemented exactly per blueprints in Dev Notes — no deviations.
- `getPatient(id)` appended to `patients.service.ts` after `getPatients`; existing functions (toCamel, createPatient, getPatients, PatientRaw, PatientListParams) left untouched.
- `usePatient` hook follows TanStack Query v5 syntax (`isPending`, `staleTime: 30_000`, query key `['patient', id]`) and matches `usePatients` import pattern.
- `SessionOpenButton` is a true placeholder: accepts `patientId` prop (renamed `_patientId` to suppress unused-var lint), renders disabled `.btn .btn-primary`. No session-opening logic, no Zustand writes, no navigation.
- `PatientProfilePage` uses Zustand selector form (`useAppStore(s => s.activeSession.sessionId)`); "Sesión activa" tab visibility is a runtime check against route `id` — tab button is not rendered when `activeSessionId !== id`.
- All styling reuses existing CSS classes from `src/index.css` (`.page`, `.section-header`, `.page-title`, `.tabs`, `.tab`, `.tab.active`, `.card`, `.card-label`, `.card-sub`, `.badge`, `.badge-green`, `.badge-gray`, `.btn`, `.btn-primary`). Only inline styles used for layout values without a CSS equivalent (grid, font-size overrides for field values), per Dev Notes guidance.
- Router stub at `/patients/:id` replaced with `<PatientProfilePage />`; sibling stubs (`/patients/:id/session`, `/sessions/:id`) deliberately left untouched (out of scope).
- Loading and error states delegate to existing shared components (`LoadingSpinner`, `ErrorMessage`); 404/5xx from `api.get` surface as `error` via TanStack Query and render `<ErrorMessage>` without crashing.
- No tests added — project has no test infrastructure yet; story tasks did not include test creation; consistent with completed stories 1.x, 2.1, 2.2.

### File List

- **Modified:** `src/services/patients.service.ts` — appended `getPatient(id)` after `getPatients`.
- **Modified:** `src/router/index.tsx` — added `PatientProfilePage` import; replaced `/patients/:id` stub element with `<PatientProfilePage />`.
- **Added:** `src/features/patients/hooks/usePatient.ts` — TanStack Query hook for single patient.
- **Added:** `src/features/patients/pages/PatientProfilePage.tsx` — profile page with three tabs (Resumen, Historial, Sesión activa).
- **Added:** `src/features/sessions/components/SessionOpenButton.tsx` — disabled placeholder button (new `src/features/sessions/` directory tree).

## Change Log

| Date       | Version | Description                                                              | Author |
|------------|---------|--------------------------------------------------------------------------|--------|
| 2026-05-29 | 0.1     | Story created — ready for dev.                                           | Mauri  |
| 2026-05-29 | 1.0     | Implemented profile page, getPatient service, usePatient hook, SessionOpenButton placeholder; router wired; build green. | Dev Agent |
