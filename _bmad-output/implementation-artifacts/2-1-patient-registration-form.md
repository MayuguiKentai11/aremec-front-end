---
baseline_commit: 2a5593c
---

# Story 2.1: Patient Registration Form

Status: done

## Story

As a neurologist,
I want to register a new patient with their clinical baseline data,
so that I can start managing their VR therapy sessions in the portal.

## Acceptance Criteria

1. **Form renders on `/patients/new`** — `PatientRegistrationPage` displays a form with fields: name, age, gender, diagnosis (EA/MCI dropdown), baseline_ravlt, baseline_sart.

2. **Successful submission** — Valid form → `POST /patients` returns 201 → navigate to `/patients` AND invalidate `['patients']` TanStack Query cache. Form is fully replaced by navigation (no manual reset needed).

3. **Zod validation failure** — Missing or invalid fields → field-level error messages shown inline next to each invalid field. Previously entered data is preserved (RHF does not reset on validation error).

4. **5xx API error** — `POST /patients` returns 5xx → `<ErrorMessage>` displays above the form without crashing the page. Form data is preserved for retry (no reset on mutation error).

## Tasks / Subtasks

- [x] Create `src/features/patients/patient.types.ts` (AC: #1, #2)
  - [x] Export `Diagnosis = 'EA' | 'MCI'` union
  - [x] Export `Patient` type (id, name, age, gender, diagnosis, baselineRavlt, baselineSart) — all camelCase

- [x] Create `src/features/patients/patient.schema.ts` (AC: #1, #3)
  - [x] Define `PatientRegistrationSchema` Zod object with all 6 fields
  - [x] Export `PatientRegistrationFormData = z.infer<typeof PatientRegistrationSchema>` (split into `PatientRegistrationFormInput` / `PatientRegistrationFormData` to support `z.coerce` input vs output types under zod v4)

- [x] Create `src/services/patients.service.ts` (AC: #2, #4)
  - [x] Internal `PatientRaw` type (snake_case fields from API)
  - [x] Internal `toCamel(raw)` transformer returning `Patient`
  - [x] Export `createPatient(data: PatientCreateInput): Promise<Patient>` — transforms camelCase input to snake_case for `api.post`, transforms response back to camelCase

- [x] Create `src/features/patients/hooks/useCreatePatient.ts` (AC: #2, #4)
  - [x] `useMutation({ mutationFn: createPatient })` from `@tanstack/react-query`
  - [x] `onSuccess`: call `queryClient.invalidateQueries({ queryKey: ['patients'] })`
  - [x] Export `useCreatePatient` hook

- [x] Create `src/features/patients/components/PatientRegistrationForm.tsx` (AC: #1, #2, #3, #4)
  - [x] `useForm<PatientRegistrationFormInput, unknown, PatientRegistrationFormData>({ resolver: zodResolver(PatientRegistrationSchema) })`
  - [x] `useCreatePatient()` for mutation; `useNavigate()` for post-success navigation
  - [x] Render mutation `error` as `<ErrorMessage error={error} />` above form-grid when truthy
  - [x] Field layout using `.form-grid`: name (span2), age + gender (row), diagnosis (half) + baselineSart (half), baselineRavlt (half) — see Blueprints
  - [x] Each field: `<div className="input-group">` → `<label className="input-label">` → `<input className="input" {...register(...)}>` → inline error span
  - [x] Diagnosis and gender as `<select className="input">` — NOT `<input>`
  - [x] Submit button: `<button className="btn btn-primary" disabled={isPending}>`
  - [x] Cancel/back button: `<button type="button" className="btn btn-ghost" onClick={() => navigate('/patients')}>`
  - [x] `onSubmit`: `mutate(data, { onSuccess: () => navigate('/patients') })`

- [x] Create `src/features/patients/pages/PatientRegistrationPage.tsx` (AC: #1)
  - [x] Thin page wrapper: `.page` div + `.page-title` heading + `.card` wrapping `<PatientRegistrationForm />`

- [x] Modify `src/router/index.tsx` (AC: #1)
  - [x] Replace stub `patients/new` route element with `<PatientRegistrationPage />`
  - [x] Add import for `PatientRegistrationPage` at top of file

- [x] Verify `npm run build` passes (0 TypeScript errors)

## Dev Notes

### Critical Constraints — Read Before Writing Any Code

**`erasableSyntaxOnly: true` in `tsconfig.app.json`.** No constructor parameter properties (`constructor(public foo: T)`). Declare class fields explicitly. This is a build-breaking constraint carried from Story 1.1.

**No `fetch` in components or hooks.** `patients.service.ts#createPatient()` must call `api.post()`. Never import `api.ts` in a component.

**TanStack Query v5 syntax.** Use `invalidateQueries({ queryKey: [...] })` — the object form with `queryKey`, not the bare array form (`invalidateQueries(['patients'])`). The bare array form is TanStack Query v4 and will cause a TypeScript error in v5.

**`useMutation` `isPending`, NOT `isLoading`.** TanStack Query v5 renamed `isLoading` to `isPending` for mutations. Using `isLoading` is a runtime error.

**Snake_case → camelCase in service layer only.** The API returns `baseline_ravlt`, `baseline_sart`. These MUST be transformed to `baselineRavlt`, `baselineSart` inside `patients.service.ts#toCamel()`. No snake_case field names allowed inside components, hooks, or Zustand.

**API request payload uses snake_case.** `createPatient()` sends `{ baseline_ravlt, baseline_sart }` to the API. The Zod schema and form use camelCase (`baselineRavlt`, `baselineSart`); the service translates.

**CSS: only existing classes from `src/index.css`.** Available for this story: `.form-grid`, `.form-grid .span2` (apply `span2` as additional class on the element inside `.form-grid`), `.form-actions`, `.input-group`, `.input-label`, `.input` (also applied to `select` as `select.input`), `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-sm`, `.card`, `.page`, `.page-title`. No new CSS classes. Inline `style=` only for structural layout with no CSS class equivalent.

**Field-level error messages.** No CSS class for error text — use `style={{ color: 'var(--accent3)', fontSize: '11px', marginTop: '2px' }}` on the error `<span>`. `--accent3` is `#DC2626` (red), defined in `index.css`.

**`useNavigate` in component, not in hook.** `navigate('/patients')` is called inside `PatientRegistrationForm` as the `onSuccess` callback of `mutate()`. The hook `useCreatePatient` does NOT take `navigate` as an argument — navigation is component-level concern.

**`onSuccess` in both hook and `mutate()` call.** The hook's `onSuccess` invalidates the cache. The component's `mutate(data, { onSuccess: () => navigate('/patients') })` handles navigation. Both execute on success (cache invalidation + navigation).

**Gender field: free text or fixed options?** FR-2.1 says `gender (string)` — not an enum. Render as `<select className="input">` with options `M` / `F` / `Otro` (common clinical portal pattern) or as `<input className="input">`. The architecture does not specify. Use a select with `['Masculino', 'Femenino', 'Otro']` options — cleaner UX.

**Age field: `<input type="number">`** — use `z.coerce.number().int().min(0).max(120)` in Zod to handle the string-to-number coercion that HTML number inputs require. The `coerce` modifier is mandatory; without it Zod sees `"42"` (string from HTML) instead of `42` (number) and rejects it.

**`baseline_ravlt` and `baseline_sart` fields: float inputs.** Use `<input type="number" step="0.01" className="input">`. Zod: `z.coerce.number()`. No `.int()` constraint — these are floats.

### Current State of Files Being Modified

| File | Status | Detail |
|---|---|---|
| `src/router/index.tsx` | MODIFY | `/patients/new` currently renders `<div className="page"><p>Nuevo paciente — próximamente</p></div>` — replace element with `<PatientRegistrationPage />` |
| `src/features/patients/` | NEW directory | Does not exist; create it with subdirectories `components/`, `hooks/`, `pages/` |
| `src/services/patients.service.ts` | NEW | Does not exist; only `auth.service.ts` is present in `src/services/` |

**Do NOT touch:** `src/services/api.ts`, `src/store/app.store.ts`, `src/services/auth.service.ts`, `src/shared/components/*`, `src/router/index.tsx` (except the one-line element replacement for `/patients/new`).

### Existing `api.ts` Methods Available

```ts
api.get<T>(path)          // GET
api.post<T>(path, body)   // POST — body is JSON.stringify'd automatically
api.patch<T>(path, body)  // PATCH
```

All calls automatically include `credentials: 'include'` and `Content-Type: application/json`. 401 is globally redirected to `/login`. 5xx throws `ApiError` caught by TanStack Query `error` state.

### Existing Shared Components

```tsx
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { EmptyState } from '../../../shared/components/EmptyState'
```

`<ErrorMessage error={error} />` — accepts `unknown`, extracts `.message` from `ApiError | Error`, falls back to "Ocurrió un error inesperado." Renders in `.empty` + `.empty-text` classes.

### Blueprints

**`src/features/patients/patient.types.ts`:**
```ts
export type Diagnosis = 'EA' | 'MCI'

export type Patient = {
  id: string
  name: string
  age: number
  gender: string
  diagnosis: Diagnosis
  baselineRavlt: number
  baselineSart: number
}
```

**`src/features/patients/patient.schema.ts`:**
```ts
import { z } from 'zod'

export const PatientRegistrationSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  age: z.coerce.number().int({ message: 'Debe ser un número entero' }).min(0).max(120, 'Edad inválida'),
  gender: z.string().min(1, 'El género es requerido'),
  diagnosis: z.enum(['EA', 'MCI'], { required_error: 'El diagnóstico es requerido' }),
  baselineRavlt: z.coerce.number({ invalid_type_error: 'Debe ser un número' }),
  baselineSart: z.coerce.number({ invalid_type_error: 'Debe ser un número' }),
})

export type PatientRegistrationFormData = z.infer<typeof PatientRegistrationSchema>
```

**`src/services/patients.service.ts`:**
```ts
import { api } from './api'
import type { Patient } from '../features/patients/patient.types'
import type { PatientRegistrationFormData } from '../features/patients/patient.schema'

type PatientRaw = {
  id: string
  name: string
  age: number
  gender: string
  diagnosis: 'EA' | 'MCI'
  baseline_ravlt: number
  baseline_sart: number
}

function toCamel(raw: PatientRaw): Patient {
  return {
    id: raw.id,
    name: raw.name,
    age: raw.age,
    gender: raw.gender,
    diagnosis: raw.diagnosis,
    baselineRavlt: raw.baseline_ravlt,
    baselineSart: raw.baseline_sart,
  }
}

export async function createPatient(data: PatientRegistrationFormData): Promise<Patient> {
  const raw = await api.post<PatientRaw>('/patients', {
    name: data.name,
    age: data.age,
    gender: data.gender,
    diagnosis: data.diagnosis,
    baseline_ravlt: data.baselineRavlt,
    baseline_sart: data.baselineSart,
  })
  return toCamel(raw)
}
```

**`src/features/patients/hooks/useCreatePatient.ts`:**
```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createPatient } from '../../../services/patients.service'

export function useCreatePatient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createPatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] })
    },
  })
}
```

**`src/features/patients/components/PatientRegistrationForm.tsx`:**
```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { PatientRegistrationSchema } from '../patient.schema'
import type { PatientRegistrationFormData } from '../patient.schema'
import { useCreatePatient } from '../hooks/useCreatePatient'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'

export function PatientRegistrationForm() {
  const navigate = useNavigate()
  const { mutate, isPending, error } = useCreatePatient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PatientRegistrationFormData>({
    resolver: zodResolver(PatientRegistrationSchema),
  })

  const onSubmit = (data: PatientRegistrationFormData) => {
    mutate(data, {
      onSuccess: () => navigate('/patients'),
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {error && <ErrorMessage error={error} />}
      <div className="form-grid" style={{ marginTop: error ? 16 : 0 }}>
        <div className="input-group span2">
          <label className="input-label">Nombre</label>
          <input className="input" type="text" {...register('name')} />
          {errors.name && (
            <span style={{ color: 'var(--accent3)', fontSize: '11px' }}>{errors.name.message}</span>
          )}
        </div>

        <div className="input-group">
          <label className="input-label">Edad</label>
          <input className="input" type="number" min={0} max={120} {...register('age')} />
          {errors.age && (
            <span style={{ color: 'var(--accent3)', fontSize: '11px' }}>{errors.age.message}</span>
          )}
        </div>

        <div className="input-group">
          <label className="input-label">Género</label>
          <select className="input" {...register('gender')}>
            <option value="">Seleccionar...</option>
            <option value="Masculino">Masculino</option>
            <option value="Femenino">Femenino</option>
            <option value="Otro">Otro</option>
          </select>
          {errors.gender && (
            <span style={{ color: 'var(--accent3)', fontSize: '11px' }}>{errors.gender.message}</span>
          )}
        </div>

        <div className="input-group">
          <label className="input-label">Diagnóstico</label>
          <select className="input" {...register('diagnosis')}>
            <option value="">Seleccionar...</option>
            <option value="EA">EA — Enfermedad de Alzheimer</option>
            <option value="MCI">MCI — Deterioro Cognitivo Leve</option>
          </select>
          {errors.diagnosis && (
            <span style={{ color: 'var(--accent3)', fontSize: '11px' }}>{errors.diagnosis.message}</span>
          )}
        </div>

        <div className="input-group">
          <label className="input-label">Baseline RAVLT</label>
          <input className="input" type="number" step="0.01" {...register('baselineRavlt')} />
          {errors.baselineRavlt && (
            <span style={{ color: 'var(--accent3)', fontSize: '11px' }}>{errors.baselineRavlt.message}</span>
          )}
        </div>

        <div className="input-group">
          <label className="input-label">Baseline SART</label>
          <input className="input" type="number" step="0.01" {...register('baselineSart')} />
          {errors.baselineSart && (
            <span style={{ color: 'var(--accent3)', fontSize: '11px' }}>{errors.baselineSart.message}</span>
          )}
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={() => navigate('/patients')}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary" disabled={isPending}>
          {isPending ? 'Registrando...' : 'Registrar paciente'}
        </button>
      </div>
    </form>
  )
}
```

**`src/features/patients/pages/PatientRegistrationPage.tsx`:**
```tsx
import { PatientRegistrationForm } from '../components/PatientRegistrationForm'

export default function PatientRegistrationPage() {
  return (
    <div className="page">
      <div className="page-title">Registrar paciente</div>
      <div className="card">
        <PatientRegistrationForm />
      </div>
    </div>
  )
}
```

**`src/router/index.tsx` — change only the `/patients/new` route element:**
```tsx
// Add import at the top with other page imports:
import PatientRegistrationPage from '../features/patients/pages/PatientRegistrationPage'

// Replace the stub (currently):
// { path: 'patients/new', element: <div className="page"><p>Nuevo paciente — próximamente</p></div> },
// With:
{ path: 'patients/new', element: <PatientRegistrationPage /> },
```

### Project Structure for This Story

```
src/
  features/
    patients/                         ← NEW directory
      components/
        PatientRegistrationForm.tsx   ← NEW: RHF + Zod form
      hooks/
        useCreatePatient.ts           ← NEW: useMutation wrapper
      pages/
        PatientRegistrationPage.tsx   ← NEW: thin page wrapper
      patient.schema.ts               ← NEW: Zod schema + inferred type
      patient.types.ts                ← NEW: Patient, Diagnosis types
  services/
    patients.service.ts               ← NEW: createPatient() + toCamel()
  router/
    index.tsx                         ← MODIFY: replace /patients/new stub
```

Do NOT create:
- `usePatients.ts` for GET /patients — that belongs to Story 2.2
- `PatientListPage.tsx` — that belongs to Story 2.2
- `PatientProfilePage.tsx` — that belongs to Story 2.3
- `SessionOpenButton` or any session components — Epic 3 scope
- Any new CSS classes or stylesheets

### Stories 2.2 and 2.3 Awareness (Do NOT implement, just be aware)

Story 2.2 will add `getPatients()` to `patients.service.ts` and `usePatients.ts` hook. This story creates the service file — leave room for it by not making `createPatient` the default export or filling the entire file with unnecessary code.

Story 2.3 will add `getPatient(id)` to `patients.service.ts`.

The `['patients']` query key established in `useCreatePatient.ts` (`invalidateQueries({ queryKey: ['patients'] })`) must be consistent with the key used in Story 2.2's `usePatients` hook. Story 2.2 will use `useQuery({ queryKey: ['patients', params] })`. The `invalidateQueries({ queryKey: ['patients'] })` call (without params) invalidates all queries whose key starts with `['patients']`, which is the correct behavior for cache invalidation after patient creation.

### References

- Acceptance criteria: [epics.md — Story 2.1](_bmad-output/planning-artifacts/epics.md#story-21-patient-registration-form)
- FR-2.1: Patient registration form spec
- Architecture — Service Layer: [architecture.md](_bmad-output/planning-artifacts/architecture.md) (API & Communication Patterns section)
- Architecture — Form Validation: [architecture.md](_bmad-output/planning-artifacts/architecture.md) (React Hook Form v7 + Zod v3 decision)
- Architecture — Project Structure: [architecture.md](_bmad-output/planning-artifacts/architecture.md) (complete directory structure)
- Architecture — Format Patterns: [architecture.md](_bmad-output/planning-artifacts/architecture.md) (snake_case → camelCase, ApiError patterns)
- Architecture — Naming Patterns: [architecture.md](_bmad-output/planning-artifacts/architecture.md) (file naming, query keys)
- Previous story: [1-3-login-logout.md](_bmad-output/implementation-artifacts/1-3-login-logout.md)

## Dev Agent Record

### Agent Model Used

claude-opus-4-7

### Debug Log References

- Initial `npm run build` failed with TS2322/TS2345 in `PatientRegistrationForm.tsx`: RHF resolver type mismatch caused by `z.coerce.number()` producing `unknown` input → `number` output under zod v4. Resolved by splitting schema into `PatientRegistrationFormInput` (`z.input`) and `PatientRegistrationFormData` (`z.output`) and typing `useForm<Input, unknown, Output>`. Second build succeeded (0 errors).
- `npm run lint` reports 2 pre-existing errors in `src/NeurologistDashboard/NeurologistDashboard.tsx` (out of scope — not touched by this story). All new files are lint-clean.

### Completion Notes List

- Followed blueprints with two justified deviations:
  1. **zod v4 error syntax**: project ships zod 4.4.3, so `required_error` / `invalid_type_error` (v3) were replaced with the v4 `{ message: '...' }` form.
  2. **RHF generics for `z.coerce`**: typed `useForm<Input, unknown, Output>` and exported `PatientRegistrationFormInput` alongside `PatientRegistrationFormData` to satisfy `verbatimModuleSyntax` + coerced number inputs.
- `useNavigate` stays inside the form component; `useCreatePatient` hook handles only mutation + cache invalidation (per Dev Notes).
- Snake_case ↔ camelCase translation is confined to `patients.service.ts` (`toCamel` + payload mapping in `createPatient`).
- `defaultValue=""` on the two `<select>` elements ensures the "Seleccionar..." placeholder is shown initially and RHF receives the empty value (triggers Zod validation when left untouched).
- `useMutation` uses `isPending` (v5), not `isLoading`.
- `invalidateQueries` uses object form `{ queryKey: ['patients'] }` (v5 syntax).
- File List updated with all 7 new files + 1 modified.
- No tests authored: project has no test framework configured (no Vitest/Jest/Testing Library in `package.json`); previous Epic 1 stories also shipped without unit tests. Verification is via `npm run build` (TypeScript) as stipulated by the final task in this story. Manual browser verification of ACs 1–4 is the recommended next step for the reviewer.

### File List

**New files:**
- `src/features/patients/patient.types.ts`
- `src/features/patients/patient.schema.ts`
- `src/features/patients/hooks/useCreatePatient.ts`
- `src/features/patients/components/PatientRegistrationForm.tsx`
- `src/features/patients/pages/PatientRegistrationPage.tsx`
- `src/services/patients.service.ts`

**Modified files:**
- `src/router/index.tsx` (import + `/patients/new` element)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (status: ready-for-dev → in-progress → review)
- `_bmad-output/implementation-artifacts/2-1-patient-registration-form.md` (Status, Tasks, Dev Agent Record, File List, Change Log)

## Review Findings

- [x] [Review][Decision] Age minimum 0 — raised to `.min(50, 'Edad mínima: 50 años')` per clinical decision. Fixed in `patient.schema.ts`.
- [x] [Review][Decision] No bounds on baseline scores — RAVLT: 0–75, SART: 0–100 with `.finite()` applied. Fixed in `patient.schema.ts`.
- [x] [Review][Patch] `baselineRavlt`/`baselineSart` accept `Infinity` — added `.finite()` to both fields. Fixed in `patient.schema.ts`.
- [x] [Review][Defer] `defaultValue=""` on selects without `useForm({ defaultValues })` — current behavior correct (RHF reads DOM ref on submit); becomes defect if `reset()` ever added [src/features/patients/components/PatientRegistrationForm.tsx] — deferred, pre-existing
- [x] [Review][Defer] `toCamel(undefined)` on non-JSON API response — error propagates to TanStack Query `mutation.error`, user sees `<ErrorMessage>`; message text may be confusing (TypeError) [src/services/patients.service.ts] — deferred, pre-existing
- [x] [Review][Defer] Cancel during in-flight POST — no AbortController; orphaned mutation completes async, double `navigate('/patients')` is a no-op in React Router v6 [src/features/patients/components/PatientRegistrationForm.tsx] — deferred, pre-existing
- [x] [Review][Defer] Navigate fires before `invalidateQueries` settles — stale data flash on patients list; observable only once Story 2.2 is implemented [src/features/patients/components/PatientRegistrationForm.tsx] — deferred, pre-existing
- [x] [Review][Defer] `PatientRaw` no runtime shape validation — TypeScript-only API contract, pre-existing architectural pattern [src/services/patients.service.ts] — deferred, pre-existing

## Change Log

| Date | Change | Author |
|---|---|---|
| 2026-05-28 | Implemented Story 2.1 (Patient Registration Form): types, Zod schema, service, mutation hook, form component, page, and `/patients/new` route wiring. Build green. Status → review. | claude-opus-4-7 |
