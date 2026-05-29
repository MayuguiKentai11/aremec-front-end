---
baseline_commit: 2f9e267
---

# Story 2.2: Patient List & Search

Status: done

## Story

As a neurologist,
I want to view my patients, search by name, and filter by status,
so that I can quickly find the patient I need to work with.

## Acceptance Criteria

1. **List renders on `/patients`** — `PatientListPage` displays a grid of patient cards, each showing name, diagnosis, and status when `GET /patients` returns results.

2. **Debounced name search** — Typing in the search input fires `GET /patients?name=<query>` (after 300ms debounce); results update without a full-page reload. Empty search restores the full list.

3. **Status filter** — Selecting "Activo" or "Inactivo" fires `GET /patients?status=active` or `?status=inactive`; params combine with name search when both are set. Clearing filter restores all patients.

4. **Empty state** — When no patients match the search/filter criteria, `<EmptyState>` is displayed. Never a blank area.

5. **5xx API error** — `GET /patients` returning 5xx causes `<ErrorMessage>` to render without crashing the page.

6. **Loading state** — While fetching, `<LoadingSpinner>` is shown in place of the patient grid.

7. **Navigation to profile** — Clicking any patient card navigates to `/patients/:id`.

## Tasks / Subtasks

- [x] Extend `src/features/patients/patient.types.ts` (AC: #1, #7)
  - [x] Export `PatientStatus = 'active' | 'inactive'` union type
  - [x] Add `status: PatientStatus` field to `Patient` type

- [x] Extend `src/services/patients.service.ts` (AC: #1, #2, #3)
  - [x] Add `status: 'active' | 'inactive'` to `PatientRaw` type
  - [x] Update `toCamel()` to map `raw.status` → `patient.status` with `raw.status ?? 'active'` fallback
  - [x] Export `PatientListParams = { name?: string; status?: 'active' | 'inactive' }`
  - [x] Export `getPatients(params?: PatientListParams): Promise<Patient[]>` using `api.get`

- [x] Create `src/shared/hooks/useDebounce.ts` (AC: #2)
  - [x] Export `useDebounce<T>(value: T, delay: number): T` hook via `useState` + `useEffect`

- [x] Create `src/features/patients/hooks/usePatients.ts` (AC: #1, #2, #3, #5, #6)
  - [x] `useQuery({ queryKey: ['patients', params], queryFn: () => getPatients(params), staleTime: 30_000 })`
  - [x] Export `usePatients(params?: PatientListParams)` hook

- [x] Create `src/features/patients/components/PatientCard.tsx` (AC: #1, #7)
  - [x] Use `.patient-card`, `.patient-card-header`, `.patient-avatar`, `.patient-name`, `.patient-meta` CSS classes
  - [x] Avatar: first letter of `patient.name` uppercased
  - [x] Status badge: `.badge .badge-green` for `'active'`, `.badge .badge-gray` for `'inactive'`
  - [x] `onClick`: `navigate('/patients/${patient.id}')`

- [x] Create `src/features/patients/components/PatientList.tsx` (AC: #1, #4, #5, #6)
  - [x] `isPending` → `<LoadingSpinner />`
  - [x] `error` → `<ErrorMessage error={error} />`
  - [x] Empty/undefined data → `<EmptyState message="No se encontraron pacientes." />`
  - [x] Data → `.patients-grid` with `patients.map(p => <PatientCard key={p.id} patient={p} />)`

- [x] Create `src/features/patients/pages/PatientListPage.tsx` (AC: #1, #2, #3)
  - [x] `useState` for `searchInput` (string) and `statusFilter` (PatientListParams['status'])
  - [x] `debouncedSearch = useDebounce(searchInput, 300)`
  - [x] Pass `{ name: debouncedSearch || undefined, status: statusFilter }` to `usePatients`
  - [x] Render `.search-row` with search input and status `<select>` filter
  - [x] Section header: `.page-title` + `.btn .btn-primary` "Nuevo paciente" → `navigate('/patients/new')`
  - [x] Render `<PatientList>` below search row

- [x] Modify `src/router/index.tsx` (AC: #1)
  - [x] Replace stub `{ path: 'patients', element: <div...> }` with `<PatientListPage />`
  - [x] Add import for `PatientListPage`

- [x] Verify `npm run build` passes (0 TypeScript errors)

### Review Findings

- [x] [Review][Patch] PatientCard `<div>` navigation not keyboard-accessible — clicking works for mouse users but keyboard users (Tab + Enter/Space) cannot activate the card; WCAG 2.1 SC 2.1.1 violation in a medical app [src/features/patients/components/PatientCard.tsx:19]
- [x] [Review][Patch] Missing `aria-label` on status `<select>` — the filter select has no label association and no `aria-label`; screen readers cannot identify its purpose [src/features/patients/pages/PatientListPage.tsx:36]
- [x] [Review][Patch] Whitespace-only name search bypasses empty filter guard — `"   ".trim()` is falsy but `"   "` is truthy; `debouncedSearch = "   "` would send `?name=%20%20%20` to the API instead of fetching all patients [src/features/patients/pages/PatientListPage.tsx:16]
- [x] [Review][Defer] `gender` typed as unbounded `string` — pre-existing from Story 2.1; no union type enforcing valid values [src/features/patients/patient.types.ts]
- [x] [Review][Defer] `baseline_ravlt/sart` may be `null` from API — TypeScript types say `number` but API may omit these for new patients; would silently set `baselineRavlt: null` [src/services/patients.service.ts]
- [x] [Review][Defer] Cache invalidation in `useCreatePatient` fires only `onSuccess`, not `onSettled` — pre-existing from Story 2.1; if `toCamel` throws after successful POST, the patient list is not refreshed [src/features/patients/hooks/useCreatePatient.ts]
- [x] [Review][Defer] Stale results briefly visible during 300ms debounce window when clearing search — inherent debounce UX tradeoff; previous query results shown until debounce fires [src/shared/hooks/useDebounce.ts]

## Dev Notes

### Critical Constraints — Read Before Writing Any Code

**`erasableSyntaxOnly: true` in `tsconfig.app.json`.** No constructor parameter properties. Declare class fields explicitly. Carried from Story 1.1.

**No `fetch` in components or hooks.** All API calls must go through `patients.service.ts#getPatients()` → `api.get()`.

**TanStack Query v5 syntax only:**
- `isPending` not `isLoading` (v5 renamed it; `isLoading` is a runtime error)
- `invalidateQueries({ queryKey: [...] })` — object form, not bare array
- `staleTime: 30_000` (30 seconds) per architecture for patient list

**Query key prefix compatibility.** `useCreatePatient` (Story 2.1) invalidates `{ queryKey: ['patients'] }` which invalidates ALL queries starting with `['patients']`. Use `queryKey: ['patients', params]` in `usePatients` — the prefix invalidation will correctly refetch the list after patient registration. TanStack Query does deep equality comparison on query keys.

**Extend, do NOT replace, `patients.service.ts`.** `createPatient()` and `PatientRaw` already exist. Add `status` to `PatientRaw`, update `toCamel`, then add `PatientListParams` and `getPatients()` below `createPatient()`. The existing `createPatient` function must remain unchanged and working.

**`status` field fallback in `toCamel`.** Use `raw.status ?? 'active'` because `POST /patients` (used by `createPatient`) may not return a `status` field. `GET /patients` (used by `getPatients`) always returns `status`. The fallback keeps `createPatient` working without a type error after `Patient` gains the required `status` field.

**CSS classes: use EXISTING classes from `src/index.css`.** The file ALREADY defines dedicated patient card/list classes:

| Class | Purpose |
|---|---|
| `.patients-grid` | Auto-fill grid, 280px min columns, 16px gap |
| `.patient-card` | Card with hover: accent border + translateY(-2px) |
| `.patient-card-header` | Flex row for avatar + name/meta |
| `.patient-avatar` | 44px circle, accent text, flex-shrink: 0 |
| `.patient-name` | 14px bold |
| `.patient-meta` | 11px monospace, `--text2` color |
| `.search-row` | Flex row, 12px gap, 20px bottom margin |
| `.search-wrap` | `position: relative; flex: 1` |
| `.search-icon` | Absolutely positioned at left:12px, vertically centered |
| `.search-input` | `padding-left: 36px` for icon space (add alongside `.input`) |
| `.badge-green` | Active: teal text, green-tinted bg/border |
| `.badge-gray` | Inactive: `--text2` color, surface bg/border |
| `.section-header` | Flex row `justify-content: space-between` |

**Do NOT create new CSS classes.** Use `style=` inline only for layout with no CSS equivalent (e.g., `marginLeft: 'auto'` on badge, `width: 160` on status select).

**`useDebounce` location: `src/shared/hooks/`** (new directory). Architecture explicitly planned `shared/hooks/useDebounce.ts`. Create the `hooks/` subdirectory inside `shared/`.

**No navigation in hooks.** `navigate('/patients/:id')` is called inside `PatientCard` component only. `usePatients` hook does not navigate.

**Status filter is a `<select className="input">`** with options: `''` (Todos), `'active'` (Activo), `'inactive'` (Inactivo). Cast `e.target.value` to `PatientListParams['status']` when non-empty.

**Known stale-data flash (deferred — do NOT fix).** When navigating from `/patients/new` after registration, the patient list may briefly show stale data before `invalidateQueries` refetch resolves. This is a pre-existing deferred issue from Story 2.1 review. Do not attempt to fix with manual cache updates or `await queryClient.invalidateQueries(...)` before navigate — the architecture prohibits manual cache manipulation.

### Current State of Files Being Modified

| File | Status | Detail |
|---|---|---|
| `src/router/index.tsx` | MODIFY | Line 58: `/patients` renders `<div className="page"><p>Pacientes — próximamente</p></div>` — replace with `<PatientListPage />` |
| `src/services/patients.service.ts` | MODIFY | Has `PatientRaw`, `toCamel()`, `createPatient()`. Add `status` to `PatientRaw`, update `toCamel`, add `PatientListParams` + `getPatients()` at end of file. |
| `src/features/patients/patient.types.ts` | MODIFY | Has `Diagnosis`, `Patient` (7 fields, no status). Add `PatientStatus`, add `status: PatientStatus` to `Patient`. |
| `src/features/patients/hooks/` | ADD FILE | Dir exists (`useCreatePatient.ts`). Add `usePatients.ts`. |
| `src/features/patients/components/` | ADD FILES | Dir exists (`PatientRegistrationForm.tsx`). Add `PatientCard.tsx`, `PatientList.tsx`. |
| `src/features/patients/pages/` | ADD FILE | Dir exists (`PatientRegistrationPage.tsx`). Add `PatientListPage.tsx`. |
| `src/shared/hooks/` | NEW DIR | Does not exist. Create with `useDebounce.ts`. |

**Do NOT touch:** `src/services/api.ts`, `src/store/app.store.ts`, `src/services/auth.service.ts`, `src/shared/components/*`, `src/features/patients/patient.schema.ts`, `src/features/patients/hooks/useCreatePatient.ts`, `src/features/patients/components/PatientRegistrationForm.tsx`, `src/features/patients/pages/PatientRegistrationPage.tsx`.

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
import { EmptyState } from '../../../shared/components/EmptyState'
```

`<EmptyState message="..." />` renders in `.empty` + `.empty-text` classes.
`<ErrorMessage error={error} />` accepts `unknown`, extracts `.message` from `ApiError | Error`.

### Blueprints

**`src/features/patients/patient.types.ts` (complete file after modification):**
```ts
export type Diagnosis = 'EA' | 'MCI'
export type PatientStatus = 'active' | 'inactive'

export type Patient = {
  id: string
  name: string
  age: number
  gender: string
  diagnosis: Diagnosis
  status: PatientStatus
  baselineRavlt: number
  baselineSart: number
}
```

**`src/services/patients.service.ts` — additions to existing file:**
```ts
// Extend PatientRaw (add status field):
type PatientRaw = {
  id: string
  name: string
  age: number
  gender: string
  diagnosis: 'EA' | 'MCI'
  status: 'active' | 'inactive'  // ← ADD
  baseline_ravlt: number
  baseline_sart: number
}

// Update toCamel (add status with fallback):
function toCamel(raw: PatientRaw): Patient {
  return {
    id: raw.id,
    name: raw.name,
    age: raw.age,
    gender: raw.gender,
    diagnosis: raw.diagnosis,
    status: raw.status ?? 'active',  // ← ADD (fallback for POST /patients response)
    baselineRavlt: raw.baseline_ravlt,
    baselineSart: raw.baseline_sart,
  }
}

// ADD after createPatient() (at end of file):
export type PatientListParams = {
  name?: string
  status?: 'active' | 'inactive'
}

export async function getPatients(params?: PatientListParams): Promise<Patient[]> {
  const query = new URLSearchParams()
  if (params?.name) query.set('name', params.name)
  if (params?.status) query.set('status', params.status)
  const qs = query.toString()
  const raws = await api.get<PatientRaw[]>(`/patients${qs ? `?${qs}` : ''}`)
  return raws.map(toCamel)
}
```

**`src/shared/hooks/useDebounce.ts`:**
```ts
import { useEffect, useState } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
```

**`src/features/patients/hooks/usePatients.ts`:**
```ts
import { useQuery } from '@tanstack/react-query'
import { getPatients } from '../../../services/patients.service'
import type { PatientListParams } from '../../../services/patients.service'

export function usePatients(params?: PatientListParams) {
  return useQuery({
    queryKey: ['patients', params],
    queryFn: () => getPatients(params),
    staleTime: 30_000,
  })
}
```

**`src/features/patients/components/PatientCard.tsx`:**
```tsx
import { useNavigate } from 'react-router-dom'
import type { Patient } from '../patient.types'

type Props = {
  patient: Patient
}

const DIAGNOSIS_LABEL: Record<string, string> = {
  EA: 'Enfermedad de Alzheimer',
  MCI: 'Deterioro Cognitivo Leve',
}

export function PatientCard({ patient }: Props) {
  const navigate = useNavigate()
  const initial = patient.name.trim()[0]?.toUpperCase() ?? '?'

  return (
    <div className="patient-card" onClick={() => navigate(`/patients/${patient.id}`)}>
      <div className="patient-card-header">
        <div className="patient-avatar">{initial}</div>
        <div>
          <div className="patient-name">{patient.name}</div>
          <div className="patient-meta">{DIAGNOSIS_LABEL[patient.diagnosis] ?? patient.diagnosis}</div>
        </div>
        <span
          className={`badge ${patient.status === 'active' ? 'badge-green' : 'badge-gray'}`}
          style={{ marginLeft: 'auto' }}
        >
          {patient.status === 'active' ? 'Activo' : 'Inactivo'}
        </span>
      </div>
    </div>
  )
}
```

**`src/features/patients/components/PatientList.tsx`:**
```tsx
import type { Patient } from '../patient.types'
import { PatientCard } from './PatientCard'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'

type Props = {
  patients: Patient[] | undefined
  isPending: boolean
  error: unknown
}

export function PatientList({ patients, isPending, error }: Props) {
  if (isPending) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />
  if (!patients || patients.length === 0) {
    return <EmptyState message="No se encontraron pacientes." />
  }

  return (
    <div className="patients-grid">
      {patients.map((patient) => (
        <PatientCard key={patient.id} patient={patient} />
      ))}
    </div>
  )
}
```

**`src/features/patients/pages/PatientListPage.tsx`:**
```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePatients } from '../hooks/usePatients'
import { useDebounce } from '../../../shared/hooks/useDebounce'
import { PatientList } from '../components/PatientList'
import type { PatientListParams } from '../../../services/patients.service'

export default function PatientListPage() {
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState<PatientListParams['status']>(undefined)

  const debouncedSearch = useDebounce(searchInput, 300)

  const params: PatientListParams = {
    ...(debouncedSearch ? { name: debouncedSearch } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  }

  const { data, isPending, error } = usePatients(
    Object.keys(params).length > 0 ? params : undefined,
  )

  return (
    <div className="page">
      <div className="section-header">
        <div className="page-title">Pacientes</div>
        <button className="btn btn-primary" onClick={() => navigate('/patients/new')}>
          + Nuevo paciente
        </button>
      </div>

      <div className="search-row">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="input search-input"
            type="text"
            placeholder="Buscar por nombre..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <select
          className="input"
          style={{ width: 160 }}
          value={statusFilter ?? ''}
          onChange={(e) => {
            const val = e.target.value
            setStatusFilter(val === '' ? undefined : (val as PatientListParams['status']))
          }}
        >
          <option value="">Todos</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
        </select>
      </div>

      <PatientList patients={data} isPending={isPending} error={error} />
    </div>
  )
}
```

**`src/router/index.tsx` — change only the `/patients` route element:**
```tsx
// Add import at top with other page imports:
import PatientListPage from '../features/patients/pages/PatientListPage'

// Replace stub (currently line 58):
// { path: 'patients', element: <div className="page"><p>Pacientes — próximamente</p></div> },
// With:
{ path: 'patients', element: <PatientListPage /> },
```

### Project Structure for This Story

```
src/
  shared/
    hooks/                              ← NEW directory
      useDebounce.ts                    ← NEW
  features/
    patients/                           ← existing
      components/
        PatientCard.tsx                 ← NEW
        PatientList.tsx                 ← NEW
        PatientRegistrationForm.tsx     ← UNTOUCHED
      hooks/
        usePatients.ts                  ← NEW
        useCreatePatient.ts             ← UNTOUCHED
      pages/
        PatientListPage.tsx             ← NEW
        PatientRegistrationPage.tsx     ← UNTOUCHED
      patient.types.ts                  ← MODIFY: add PatientStatus + status field
      patient.schema.ts                 ← UNTOUCHED
  services/
    patients.service.ts                 ← MODIFY: add getPatients, extend PatientRaw + toCamel
  router/
    index.tsx                           ← MODIFY: replace /patients stub
```

**Do NOT create:**
- `PatientProfilePage.tsx` — Story 2.3
- `usePatient.ts` (single patient) — Story 2.3
- `SessionOpenButton` or any session components — Epic 3
- New CSS classes or stylesheets

### Story 2.3 Awareness (Do NOT implement)

Story 2.3 will add `getPatient(id)` to `patients.service.ts`, a `usePatient(id)` hook, and implement `PatientProfilePage` with 3 tabs. The `/patients/:id` route currently shows a stub — clicking a patient card navigating there is correct behavior for this story.

### References

- Acceptance criteria: [epics.md — Story 2.2](_bmad-output/planning-artifacts/epics.md)
- FR-2.2: Patient list, search, and filter spec
- Architecture — Query Keys & stale time: [architecture.md](_bmad-output/planning-artifacts/architecture.md)
- Architecture — `shared/hooks/useDebounce.ts` planned location: [architecture.md](_bmad-output/planning-artifacts/architecture.md)
- Architecture — Empty state pattern: always `<EmptyState>` [architecture.md](_bmad-output/planning-artifacts/architecture.md)
- Known stale-data flash (deferred): [deferred-work.md](_bmad-output/implementation-artifacts/deferred-work.md)
- Previous story: [2-1-patient-registration-form.md](_bmad-output/implementation-artifacts/2-1-patient-registration-form.md)

## Dev Agent Record

### Agent Model Used

claude-opus-4-7

### Debug Log References

- `npm run build` → ✅ 0 TypeScript errors, bundle compiles (425.91 kB / 131.32 kB gzip).

### Completion Notes List

- Implemented patient list page with debounced name search (300ms) and status filter, wired to `GET /patients` via TanStack Query v5 (`useQuery`, `isPending`, `staleTime: 30_000`).
- Extended `patient.types.ts` with `PatientStatus` union and required `status` field on `Patient`.
- Extended `patients.service.ts` non-destructively: added `status` to `PatientRaw`, fallback `raw.status ?? 'active'` in `toCamel` (keeps `createPatient` working when POST response omits `status`), and added `PatientListParams` + `getPatients()`. `createPatient` left unchanged.
- New `src/shared/hooks/` directory created with `useDebounce<T>(value, delay)` per architecture spec.
- `usePatients(params)` uses `queryKey: ['patients', params]` so prefix invalidation by `useCreatePatient` (Story 2.1) refetches correctly via TanStack Query's deep equality on query keys.
- `PatientCard` handles navigation via `navigate('/patients/:id')` directly; hook contains no navigation logic.
- `PatientList` renders the three required states: `<LoadingSpinner />` (isPending), `<ErrorMessage error={error} />` (error), `<EmptyState message="No se encontraron pacientes." />` (empty/undefined data) — never a blank area.
- Router stub for `/patients` replaced by `<PatientListPage />`. Stubs for `/patients/:id` and session routes left untouched (Stories 2.3 / Epic 3).
- All CSS classes used are pre-existing in `src/index.css` (`.patients-grid`, `.patient-card`, `.search-row`, `.search-wrap`, `.search-input`, `.badge-green`, `.badge-gray`, `.section-header`, etc.). No new CSS introduced. Inline styles limited to `marginLeft: 'auto'` on badge and `width: 160` on status select.
- Known stale-data flash after registration (Story 2.1 deferred item) intentionally not addressed here, per Dev Notes.
- No automated test suite exists in the project; verification per story spec = `npm run build` passes with 0 TypeScript errors.

### File List

- MODIFIED: `src/features/patients/patient.types.ts` — added `PatientStatus`; added `status` field on `Patient`.
- MODIFIED: `src/services/patients.service.ts` — added `status` to `PatientRaw`, mapped in `toCamel` with `'active'` fallback, added `PatientListParams` + `getPatients()`.
- ADDED:    `src/shared/hooks/useDebounce.ts` — generic debounce hook (new `shared/hooks/` directory).
- ADDED:    `src/features/patients/hooks/usePatients.ts` — TanStack Query hook for list endpoint.
- ADDED:    `src/features/patients/components/PatientCard.tsx` — card with avatar, name, diagnosis label, status badge, navigation.
- ADDED:    `src/features/patients/components/PatientList.tsx` — loading/error/empty/data state coordinator.
- ADDED:    `src/features/patients/pages/PatientListPage.tsx` — page with debounced search, status filter, "Nuevo paciente" CTA.
- MODIFIED: `src/router/index.tsx` — replaced `/patients` stub with `<PatientListPage />`; added import.

## Change Log

| Date       | Version | Description                                                                                          | Author |
|------------|---------|------------------------------------------------------------------------------------------------------|--------|
| 2026-05-29 | 0.1     | Implemented Story 2.2 — patient list, debounced name search, status filter, navigation to profile.   | Mauri  |
