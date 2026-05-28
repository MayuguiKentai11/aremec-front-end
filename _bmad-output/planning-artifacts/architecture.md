---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - "_bmad-output/planning-artifacts/prds/prd-aremec-front-end-2026-05-28/prd.md"
workflowType: 'architecture'
lastStep: 8
status: 'complete'
completedAt: '2026-05-28'
project_name: 'aremec-front-end'
user_name: 'Mauri'
date: '2026-05-28'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
25 FRs across 6 categories:
- Auth & Session Management (FR-1.x, 5 FRs): Cookie-based OAuth2 via Auth0 redirect, route guards on every protected route, 401 → redirect without token exposure.
- Patient Management (FR-2.x, 3 FRs): Registration form, searchable/filterable list, profile navigation.
- Session Lifecycle (FR-3.x, 3 FRs): Open/close session, persistent active-session indicator.
- Real-Time Session Monitoring (FR-4.x, 6 FRs): WebSocket connection post-session-open, live level_completed event rendering (<500ms), null-safe ML field display with pending indicator, session_completed notification, Cloudflare Stream player embed, disconnection handling with exponential backoff (max 3 retries) + polling fallback.
- Cognitive Metrics Display (FR-5.x, 3 FRs): 6-metric panel per level with domain labels, difficulty recommendation (read-only).
- Analytics & Clinical Follow-up (FR-6.x, 5 FRs): Per-patient dashboard with SPS trend sparkline, session history, trend chart (SPS over time), per-session metric detail, session filter.

**Non-Functional Requirements:**
- Performance: Metrics visible ≤5s after level completion; WS event rendered ≤500ms; dashboard loads ≤3s; Cloudflare stream latency <2s.
- Security: No token/JWT in any JS-accessible storage; HTTPS-only; no PII in client logs.
- Regulatory (Ley 29733): No PII persistence on client beyond active browser session (rules out IndexedDB and persistent localStorage for patient data).
- Reliability: Graceful 5xx handling; WS disconnect cannot crash session view; null ML fields must never cause render errors.
- Usability: Desktop-only (≥1280px), Spanish UI throughout, critical in-session actions reachable in ≤2 clicks.
- Maintainability: Explicit architecture pattern required; dedicated API service/adapter layer — no direct fetch in UI components.

**Scale & Complexity:**
- Primary domain: Browser-based SPA (desktop clinical portal)
- Complexity level: High
- Estimated architectural modules: 8–10 (auth, routing, API layer, WS manager, patient module, session module, metrics/analytics module, shared components)

### Technical Constraints & Dependencies

| Constraint | Detail |
|---|---|
| Auth mechanism | Cookie-only (HttpOnly, Secure, SameSite=Lax). No Authorization headers. No token in JS storage. |
| Backend REST | `https://aremec-ws-latest.onrender.com/api/v1/` — env-configurable |
| Backend WebSocket | `wss://aremec-ws-latest.onrender.com/api/v1/sessions/:id/stream` |
| ML async fields | `sps_class` and `recommendation` nullable on REST; resolve via subsequent WS event |
| WS rate limit | 60 messages/minute per connection |
| Session TTL | 1-hour cookie TTL managed by backend |
| Video streaming | Cloudflare Stream embedded player (Meta Quest 3S → Cloudflare → portal) |
| External IdP | Auth0 (backend-managed redirect; frontend has no direct Auth0 SDK calls) |
| CORS | Backend allows `https://portal.aremec.pe` |

### Cross-Cutting Concerns Identified

1. **Authentication & route protection** — every protected route must check session validity; 401 responses must be handled uniformly across all API calls.
2. **WebSocket lifecycle** — connect on session open, handle events, reconnect with exponential backoff, fall back to REST polling; must not crash view on disconnect.
3. **Pending/null state for async ML fields** — architectural pattern needed to differentiate "not yet arrived" from "error" or "empty".
4. **API service layer** — all backend communication (REST + WS) must be encapsulated; no fetch calls in UI components.
5. **Error handling strategy** — 5xx, 401, WS failure, Cloudflare stream unavailability all need consistent, non-crashing handling.
6. **Privacy compliance (Ley 29733)** — data flow and storage decisions must pass through this lens; any client-side persistence must be session-scoped only.

## Starter Template & Foundation

### Primary Technology Domain

Browser-based SPA (React + Vite), desktop clinical portal. Project is already bootstrapped — this section documents the existing foundation and the remaining library decisions needed before module implementation begins.

### Existing Foundation (Bootstrapped)

**Initialization command used (historical):**
```bash
npm create vite@latest aremec-front-end -- --template react-ts
```

**Architectural Decisions Already Established:**

**Language & Runtime:**
- TypeScript ~6.0, strict mode, ESM modules
- React 19 with concurrent features available

**Styling Solution:**
- Custom CSS variables design system (not Tailwind)
- Design tokens defined in `src/index.css`: color palette, typography, spacing, shadows
- Fonts: Inter (UI) + Fira Code (monospace/data display)
- CSS class utilities for layout, cards, buttons, badges, forms, tables, modals

**Build Tooling:**
- Vite 8 with `@vitejs/plugin-react`
- TypeScript compiler (tsc) for type checking before build

**Charts:**
- Recharts 2.x for trend charts and sparklines (satisfies FR-6.1, FR-6.3)

**Code Linting:**
- ESLint 10 with `typescript-eslint` + `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh`

**Existing Component:**
- `src/NeurologistDashboard/NeurologistDashboard.tsx` — monolithic dashboard prototype (will be broken down into proper modules during implementation)

### Remaining Library Decisions (Required Before Implementation)

These decisions are resolved in Step 4 (Architectural Decisions):

| Concern | Decision Needed |
|---|---|
| Client-side routing | Router library + route structure (OQ-1 from PRD) |
| Server state / async data | Data fetching and caching strategy |
| Client state | UI state management for session, auth, WS |
| HTTP client | API layer abstraction (NFR-6 requires service layer) |
| WebSocket management | WS lifecycle hook/manager approach |
| Form validation | Patient registration form (FR-2.1) |

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Client-side routing: React Router v7
- Server state management: TanStack Query v5
- Client state management: Zustand v5
- HTTP client: native fetch with custom wrapper
- WebSocket lifecycle: custom `useSessionWebSocket` hook
- Form validation: React Hook Form v7 + Zod v3

**Deferred Decisions (Post-MVP):**
- End-to-end testing framework (Playwright) — deferred until feature-complete
- Performance monitoring / error tracking (Sentry) — deferred to deployment phase

---

### Authentication & Security

**Decision:** Cookie-only authentication — no frontend token handling.

- All API calls include `credentials: 'include'` to send the HttpOnly session cookie automatically
- On any 401 response, the HTTP wrapper redirects to `/auth/login` (which triggers `GET /auth/login` on the backend)
- No JWT parsing, no token storage, no Auth0 SDK — the backend owns the entire auth flow
- Route protection implemented as a React Router loader: every protected route loader calls `GET /api/v1/me` (or checks cached auth state); a 401 redirects to login

**Rationale:** Mandated by PRD (FR-1.1–FR-1.3, NFR-2) and Ley 29733 (NFR-3). Cookie-only eliminates the entire class of XSS token-theft vulnerabilities.

---

### API & Communication Patterns

**HTTP Client — native fetch with custom wrapper**

A thin module `src/services/api.ts` that:
- Injects `VITE_API_BASE_URL` (env-configurable, satisfies Integration Constraint)
- Sets `credentials: 'include'` on every request
- Intercepts 401 responses globally and redirects to login (satisfies FR-1.2, FR-1.3)
- Returns typed responses; throws typed `ApiError` for non-2xx
- Never imported directly by UI components — only by service modules (NFR-6)

**Service Layer Structure:**
```
src/services/
  api.ts              ← fetch wrapper (base URL, credentials, 401 handler)
  auth.service.ts     ← POST /auth/logout, GET /auth/me
  patients.service.ts ← GET/POST /patients, GET /patients/:id/dashboard
  sessions.service.ts ← POST /sessions, PATCH /sessions/:id/complete
  metrics.service.ts  ← GET /sessions/:id/metrics, GET /patients/:id/trend
```

**WebSocket — custom `useSessionWebSocket` hook**

Lifecycle managed in `src/hooks/useSessionWebSocket.ts`:
1. Connects to `wss://.../sessions/:id/stream` after session open
2. Dispatches `level_completed` and `session_completed` events to Zustand store
3. On disconnect: shows reconnection indicator, retries with exponential backoff (delays: 1s → 2s → 4s, max 3 attempts)
4. After 3 failed retries: falls back to polling `GET /sessions/:id/metrics` at 5-second intervals
5. On `session_completed` event: sets a persistent notification flag in Zustand

**ML null/pending state pattern:** A discriminated union type for ML fields:
```ts
type MLField<T> = { status: 'pending' } | { status: 'resolved'; value: T } | { status: 'error' }
```
Rendered as a loading indicator when `pending`, value when `resolved`.

---

### Frontend Architecture

**Routing — React Router v7**

Route structure:
```
/                          → redirect to /patients
/login                     → LoginPage (public)
/patients                  → PatientListPage (protected)
/patients/new              → PatientRegistrationPage (protected)
/patients/:id              → PatientProfilePage (protected)
/patients/:id/session      → SessionMonitorPage (protected)
/sessions/:id              → SessionDetailPage (protected)
```

Route protection pattern: a `requireAuth` loader wraps every protected route. It reads cached auth state from Zustand; if absent, calls `GET /api/v1/me`; on 401, throws a redirect to `/login`.

**Server State — TanStack Query v5**

- All REST API data fetched and cached via `useQuery` / `useMutation`
- Query keys scoped by resource: `['patients']`, `['patient', id]`, `['session', id, 'metrics']`, etc.
- Stale time: 30s for patient list; 0 (always-fresh) for active session metrics
- On `level_completed` WebSocket event: `queryClient.invalidateQueries(['session', id, 'metrics'])` triggers a background refetch as a fallback consistency check

**Client State — Zustand v5**

Single store with slices:
```ts
type AppStore = {
  auth: { neurologist: Neurologist | null; status: 'loading' | 'authenticated' | 'unauthenticated' }
  activeSession: { sessionId: string | null; startedAt: Date | null; wsStatus: 'connected' | 'reconnecting' | 'polling' | 'disconnected' }
  notifications: { pendingSessionComplete: boolean; items: Notification[] }
}
```

**Form Validation — React Hook Form v7 + Zod v3**

Patient registration form (FR-2.1) uses a Zod schema as the single source of truth for field types and validation rules. The same schema types the `POST /patients` request body. `@hookform/resolvers/zod` bridges the two.

---

### Infrastructure & Deployment

- Frontend hosted at `https://portal.aremec.pe` (Vercel or equivalent static hosting)
- Backend at `https://aremec-ws-latest.onrender.com` (pre-existing, not in scope)
- Environment variables: `VITE_API_BASE_URL`, `VITE_WS_BASE_URL` — never hardcoded
- No client-side analytics or error tracking in scope for MVP

### Decision Impact Analysis

**Implementation Sequence (driven by dependencies):**
1. Project wiring: install React Router v7, TanStack Query v5, Zustand v5, RHF + Zod
2. `src/services/api.ts` wrapper + service modules (blocks all feature work)
3. Auth module: route guards, login redirect, 401 handling (blocks navigation)
4. Patient module: list, registration form, profile shell
5. Session lifecycle: open/close session, active indicator
6. WebSocket hook + Zustand session slice (blocks real-time monitoring)
7. Session monitoring view: metrics panel, Cloudflare Stream embed, ML pending state
8. Analytics module: patient dashboard, trend chart, session history

**Cross-Component Dependencies:**
- `api.ts` wrapper ← all service modules ← all TanStack Query hooks ← all pages
- Zustand `auth` slice ← React Router `requireAuth` loader ← all protected routes
- Zustand `activeSession` slice ← `useSessionWebSocket` hook ← SessionMonitorPage
- Zustand `notifications` slice ← `useSessionWebSocket` hook ← persistent banner component

## Implementation Patterns & Consistency Rules

### Naming Patterns

**File Naming:**
- React components: `PascalCase.tsx` — e.g., `PatientCard.tsx`, `SessionMonitorPage.tsx`
- Hooks: `camelCase.ts` prefixed with `use` — e.g., `useSessionWebSocket.ts`, `usePatients.ts`
- Services: `camelCase.service.ts` — e.g., `patients.service.ts`, `sessions.service.ts`
- Zustand stores: `camelCase.store.ts` — e.g., `app.store.ts`
- Zod schemas: `camelCase.schema.ts` — e.g., `patient.schema.ts`
- Types/interfaces: `camelCase.types.ts` — e.g., `patient.types.ts`
- Utilities: `camelCase.ts` — e.g., `formatDate.ts`

**TypeScript Naming:**
- Components: PascalCase — `PatientCard`, `SessionMonitorPage`
- Interfaces/Types: PascalCase — `Patient`, `Session`, `LevelMetrics`
- Hooks: camelCase prefixed with `use` — `usePatients`, `useSessionWebSocket`
- Store slices: camelCase — `authSlice`, `activeSessionSlice`
- Service functions: camelCase verbs — `getPatients`, `createSession`, `getSessionMetrics`
- Constants: SCREAMING_SNAKE_CASE — `WS_MAX_RETRIES`, `WS_BASE_DELAY_MS`
- CSS classes: kebab-case (existing convention in `index.css`) — `patient-card`, `metric-item`

**Query Keys (TanStack Query):**
Always arrays, snake_case strings:
```ts
['patients']
['patient', patientId]
['patient', patientId, 'dashboard']
['session', sessionId, 'metrics']
['patient', patientId, 'trend']
['patient', patientId, 'sessions']
```

---

### Structure Patterns

**Project Structure:**
```
src/
  features/
    auth/
      components/        ← LoginPage, PasswordRecoveryLink
      hooks/             ← useAuth.ts
      pages/             ← LoginPage.tsx
    patients/
      components/        ← PatientCard, PatientRegistrationForm, PatientList
      hooks/             ← usePatients.ts, usePatient.ts
      pages/             ← PatientListPage.tsx, PatientProfilePage.tsx, PatientRegistrationPage.tsx
      patient.schema.ts  ← Zod schema for registration form
      patient.types.ts   ← Patient, PatientDashboard, etc.
    sessions/
      components/        ← SessionMonitor, MetricsPanel, LiveStreamEmbed, ActiveSessionBanner
      hooks/             ← useSession.ts, useSessionWebSocket.ts
      pages/             ← SessionMonitorPage.tsx, SessionDetailPage.tsx
      session.types.ts   ← Session, LevelMetrics, MLField, etc.
    analytics/
      components/        ← TrendChart, SessionHistory, MetricDetailTable
      hooks/             ← usePatientTrend.ts, useSessionHistory.ts
  services/
    api.ts               ← fetch wrapper (base URL, credentials, 401 redirect)
    auth.service.ts
    patients.service.ts
    sessions.service.ts
    metrics.service.ts
  store/
    app.store.ts         ← Zustand store (auth + activeSession + notifications slices)
  shared/
    components/          ← Button, Badge, Card, EmptyState, LoadingSpinner, ErrorMessage
    hooks/               ← useDebounce.ts (if needed)
    types/               ← shared.types.ts (ApiError, PaginatedResponse, etc.)
  router/
    index.tsx            ← route definitions, requireAuth loader
  main.tsx
  index.css
```

No test files in this project (MVP phase; single developer).

---

### Format Patterns

**API Response Transformation — snake_case → camelCase**

All transformation happens exclusively in the service layer. UI components and hooks only ever see camelCase. Rule: if it comes from the API, it is transformed before leaving the service function.

```ts
// patients.service.ts
function toCamel(raw: PatientRaw): Patient {
  return {
    id: raw.id,
    name: raw.name,
    baselineRavlt: raw.baseline_ravlt,
    baselineSart: raw.baseline_sart,
    spsClass: raw.sps_class,
  }
}
```

**ML Pending State — discriminated union:**
```ts
type MLField<T> =
  | { status: 'pending' }
  | { status: 'resolved'; value: T }
  | { status: 'error'; message: string }
```
A null API value maps to `{ status: 'pending' }`. Never render null directly.

**API Error — typed error class:**
```ts
class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message)
  }
}
```
Service functions throw `ApiError`; TanStack Query catches it in `error`; UI reads `error instanceof ApiError` to decide what to show.

**Date display:** Always format with `Intl.DateTimeFormat` with locale `'es-PE'`. Never store formatted strings — store ISO strings, format at render time.

---

### Communication Patterns

**Zustand State Updates:**
Use Zustand's `set` with partial objects — never mutate state directly:
```ts
// correct
set(state => ({ activeSession: { ...state.activeSession, wsStatus: 'reconnecting' } }))
// wrong
state.activeSession.wsStatus = 'reconnecting'
```

**TanStack Query → Zustand flow for WebSocket events:**
WebSocket events do not write directly to TanStack Query cache. Flow is:
```
WS event → useSessionWebSocket hook → Zustand store update
                                    → queryClient.invalidateQueries(...)
```
Components subscribe to Zustand for immediate UI (e.g., connection status, notifications) and to TanStack Query for data (e.g., metric values after refetch).

**Mutation side effects:**
`onSuccess` callbacks on `useMutation` call `queryClient.invalidateQueries` for the affected resource. Never manually update the TanStack Query cache — always invalidate and let it refetch.

---

### Process Patterns

**Loading States:**
Use TanStack Query's `isPending` (not `isLoading` — deprecated in v5) for all server data loading. For UI-only loading (e.g., form submit), use a local `useState<boolean>`. Never use global loading spinners that block the entire page — show skeleton or inline loaders at the component level.

**Error Handling:**
- **401** — handled centrally in `api.ts` wrapper; redirects to login. Components never handle 401.
- **5xx / network errors** — `ApiError` is thrown; caught by TanStack Query `error` state; component renders `<ErrorMessage>` shared component.
- **Form validation errors** — React Hook Form + Zod surface field-level errors inline; never use `alert()`.
- **WebSocket errors** — handled entirely inside `useSessionWebSocket`; surfaces `wsStatus` to Zustand.
- No `console.error` with patient data (NFR-2 / Ley 29733).

**Empty States:**
Every list/table renders a `<EmptyState>` shared component when data is empty. Never render an empty `<div>` or `null` for empty lists — always inform the user.

**Route Guard Pattern:**
Every protected route uses the `requireAuth` loader. The loader:
1. Reads `auth.status` from Zustand
2. If `'authenticated'` → returns null (allows route)
3. If `'unauthenticated'` → throws `redirect('/login')`
4. If `'loading'` → awaits `auth.service.ts#getMe()`, then evaluates

---

### Enforcement Guidelines

**All AI Agents MUST:**
- Import from service modules only — never call `fetch` directly in components or hooks
- Transform snake_case to camelCase in the service layer — never in components
- Use `MLField<T>` discriminated union for any nullable ML field (`sps_class`, `recommendation`)
- Use `requireAuth` loader on every route except `/login`
- Use TanStack Query for all server state — never `useState` + `useEffect` for API calls
- Update Zustand with `set(state => ...)` pattern — never mutate state
- Render `<EmptyState>` for empty lists — never return null silently
- Use `<ErrorMessage>` shared component for error display — never raw text or `alert()`

**Anti-Patterns (explicitly forbidden):**
- `fetch(...)` inside a React component or page
- `localStorage.setItem(...)` with patient data
- `JSON.parse(document.cookie)` or any token extraction from cookies
- `snake_case` field names inside React components or Zustand store
- Rendering `null` for `sps_class: null` — must render pending indicator

## Project Structure & Boundaries

### Complete Project Directory Structure

```
aremec-front-end/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── eslint.config.js
├── .env.local                         ← VITE_API_BASE_URL, VITE_WS_BASE_URL (git-ignored)
├── .env.example                       ← template with variable names, no values
├── public/
│   └── favicon.ico
└── src/
    ├── main.tsx                       ← React root, QueryClientProvider, RouterProvider
    ├── index.css                      ← design system (CSS variables, existing)
    │
    ├── router/
    │   └── index.tsx                  ← all routes + requireAuth loader
    │
    ├── store/
    │   └── app.store.ts               ← Zustand: auth + activeSession + notifications slices
    │
    ├── services/
    │   ├── api.ts                     ← fetch wrapper: base URL, credentials, 401 redirect
    │   ├── auth.service.ts            ← getMe(), logout()
    │   ├── patients.service.ts        ← getPatients(), createPatient(), getPatient(), getDashboard()
    │   ├── sessions.service.ts        ← createSession(), completeSession()
    │   └── metrics.service.ts         ← getSessionMetrics(), getPatientTrend(), getSessionHistory()
    │
    ├── shared/
    │   ├── components/
    │   │   ├── ErrorMessage.tsx       ← ApiError display component
    │   │   ├── EmptyState.tsx         ← empty list/no-data state
    │   │   └── LoadingSpinner.tsx     ← inline loading indicator
    │   └── types/
    │       └── shared.types.ts        ← ApiError class, PaginatedResponse<T>
    │
    └── features/
        │
        ├── auth/                      ← FR-1.x
        │   ├── pages/
        │   │   └── LoginPage.tsx      ← FR-1.1: renders login button → GET /auth/login
        │   └── components/
        │       └── LogoutButton.tsx   ← FR-1.4: POST /auth/logout + store reset
        │
        ├── patients/                  ← FR-2.x
        │   ├── pages/
        │   │   ├── PatientListPage.tsx          ← FR-2.2: list + search + filter
        │   │   ├── PatientRegistrationPage.tsx  ← FR-2.1: registration form page
        │   │   └── PatientProfilePage.tsx       ← FR-2.3: profile shell + tabs
        │   ├── components/
        │   │   ├── PatientList.tsx              ← FR-2.2: table/grid with search results
        │   │   ├── PatientCard.tsx              ← FR-2.3: clickable patient card
        │   │   └── PatientRegistrationForm.tsx  ← FR-2.1: RHF form with Zod validation
        │   ├── hooks/
        │   │   ├── usePatients.ts               ← TanStack Query: GET /patients (search, filter)
        │   │   └── usePatient.ts                ← TanStack Query: GET /patients/:id
        │   ├── patient.schema.ts                ← Zod schema: PatientRegistrationSchema
        │   └── patient.types.ts                 ← Patient, PatientDashboard, PatientStatus
        │
        ├── sessions/                  ← FR-3.x + FR-4.x + FR-5.x
        │   ├── pages/
        │   │   ├── SessionMonitorPage.tsx    ← FR-4.x: real-time monitoring view
        │   │   └── SessionDetailPage.tsx     ← FR-6.4: historical session detail
        │   ├── components/
        │   │   ├── SessionOpenButton.tsx     ← FR-3.1: POST /sessions
        │   │   ├── SessionCloseButton.tsx    ← FR-3.2: PATCH /sessions/:id/complete
        │   │   ├── ActiveSessionBanner.tsx   ← FR-3.3: persistent indicator in app shell
        │   │   ├── MetricsPanel.tsx          ← FR-5.1: 6-metric grid per level
        │   │   ├── LevelMetricCard.tsx       ← FR-5.1: individual metric card
        │   │   ├── MLFieldDisplay.tsx        ← FR-4.3: pending/resolved/error for sps_class
        │   │   ├── DomainTag.tsx             ← FR-5.2: cognitive domain badge
        │   │   ├── RecommendationDisplay.tsx ← FR-5.3: increase/maintain/decrease chip
        │   │   ├── CloudflareStreamPlayer.tsx ← FR-4.5: Cloudflare Stream embed
        │   │   ├── WsStatusIndicator.tsx     ← FR-4.6: reconnecting/polling/disconnected UI
        │   │   └── SessionCompletionToast.tsx ← FR-4.4: session_completed notification
        │   ├── hooks/
        │   │   ├── useSession.ts             ← TanStack Query: GET /sessions/:id
        │   │   └── useSessionWebSocket.ts    ← FR-4.1/4.2/4.6: WS lifecycle + reconnect + fallback
        │   └── session.types.ts              ← Session, LevelMetrics, MLField<T>, WsEvent
        │
        └── analytics/                 ← FR-6.x
            ├── components/
            │   ├── PatientDashboard.tsx      ← FR-6.1: SPS trend + sparkline + session list
            │   ├── TrendChart.tsx            ← FR-6.3: SPS over time (Recharts LineChart)
            │   ├── SessionHistory.tsx        ← FR-6.2: chronological session list
            │   ├── MetricDetailTable.tsx     ← FR-6.4: level-by-level breakdown table
            │   └── SessionFilter.tsx         ← FR-6.5: filter to single session
            └── hooks/
                ├── usePatientDashboard.ts    ← TanStack Query: GET /patients/:id/dashboard
                ├── usePatientTrend.ts        ← TanStack Query: GET /patients/:id/trend
                └── useSessionHistory.ts      ← TanStack Query: GET /patients/:id/sessions
```

---

### Architectural Boundaries

**API Boundary — single entry point:**
All external communication flows through `src/services/api.ts`. This file is the only place where `fetch` is called. Everything above it (service modules, hooks, components) is isolated from HTTP mechanics.

```
UI Component
    → TanStack Query hook (useQuery / useMutation)
        → service function (patients.service.ts, etc.)
            → api.ts wrapper
                → backend REST API / WebSocket
```

**WebSocket Boundary:**
`useSessionWebSocket.ts` owns the WebSocket connection exclusively. No other file creates or manages WebSocket connections. It publishes events to Zustand and invalidates TanStack Query cache — components never read from the raw WS stream.

**State Boundary:**
- **Server data** (patient records, session metrics, trends) → TanStack Query cache only
- **UI/session state** (auth status, active session, WS status, notifications) → Zustand only
- **Form state** → React Hook Form local state only
- No cross-contamination: TanStack Query never writes to Zustand; Zustand never caches server data

**Route Boundary:**
`src/router/index.tsx` is the single source of truth for route definitions. The `requireAuth` loader is the only mechanism for route protection — no per-component auth checks.

---

### Requirements to Structure Mapping

| FR | File(s) |
|---|---|
| FR-1.1 Login flow | `features/auth/pages/LoginPage.tsx` |
| FR-1.2 Route protection | `router/index.tsx` (requireAuth loader) |
| FR-1.3 Session expiry | `services/api.ts` (401 intercept) |
| FR-1.4 Logout | `features/auth/components/LogoutButton.tsx` + `services/auth.service.ts` |
| FR-1.5 Password recovery | `features/auth/pages/LoginPage.tsx` (external link) |
| FR-2.1 Patient registration | `features/patients/pages/PatientRegistrationPage.tsx` + `patient.schema.ts` |
| FR-2.2 Patient list & search | `features/patients/pages/PatientListPage.tsx` + `hooks/usePatients.ts` |
| FR-2.3 Patient profile nav | `features/patients/pages/PatientProfilePage.tsx` + `PatientCard.tsx` |
| FR-3.1 Open session | `features/sessions/components/SessionOpenButton.tsx` |
| FR-3.2 Close session | `features/sessions/components/SessionCloseButton.tsx` |
| FR-3.3 Active session indicator | `features/sessions/components/ActiveSessionBanner.tsx` |
| FR-4.1 WebSocket connection | `features/sessions/hooks/useSessionWebSocket.ts` |
| FR-4.2 Level completion events | `useSessionWebSocket.ts` → `store/app.store.ts` → `MetricsPanel.tsx` |
| FR-4.3 Null-safe ML rendering | `features/sessions/components/MLFieldDisplay.tsx` + `session.types.ts` |
| FR-4.4 Session completion notif | `SessionCompletionToast.tsx` + `store/app.store.ts` |
| FR-4.5 VR view display | `features/sessions/components/CloudflareStreamPlayer.tsx` |
| FR-4.6 WS disconnection handling | `useSessionWebSocket.ts` (backoff + polling fallback) |
| FR-5.1 Per-level metrics panel | `features/sessions/components/MetricsPanel.tsx` + `LevelMetricCard.tsx` |
| FR-5.2 Domain tagging | `features/sessions/components/DomainTag.tsx` |
| FR-5.3 Difficulty recommendation | `features/sessions/components/RecommendationDisplay.tsx` |
| FR-6.1 Patient dashboard | `features/analytics/components/PatientDashboard.tsx` |
| FR-6.2 Session history | `features/analytics/components/SessionHistory.tsx` |
| FR-6.3 Trend visualization | `features/analytics/components/TrendChart.tsx` |
| FR-6.4 Per-session metric detail | `features/sessions/pages/SessionDetailPage.tsx` + `MetricDetailTable.tsx` |
| FR-6.5 Session filter | `features/analytics/components/SessionFilter.tsx` |

---

### Data Flow

```
Backend REST  →  service layer (+ camelCase transform)  →  TanStack Query cache  →  React components
Backend WS    →  useSessionWebSocket  →  Zustand store  →  React components
                                      →  queryClient.invalidate  →  TanStack Query refetch
```

**Environment variables (Vite):**
```
VITE_API_BASE_URL=https://aremec-ws-latest.onrender.com/api/v1
VITE_WS_BASE_URL=wss://aremec-ws-latest.onrender.com/api/v1
```
Accessed via `import.meta.env.VITE_API_BASE_URL` in `api.ts` only.

## Architecture Validation Results

### Coherence Validation

**Decision Compatibility:**
All technology choices are mutually compatible on the selected versions:
- React 19 + React Router v7 + TanStack Query v5 + Zustand v5: all support React 19 concurrent model
- React Hook Form v7 + Zod v3 + `@hookform/resolvers`: standard pairing, no conflicts
- Vite 8 + TypeScript ~6.0 + `@vitejs/plugin-react`: fully supported
- Recharts 2.x + React 19: compatible

**Pattern Consistency:**
- Feature-based structure aligns with the 4 clearly bounded feature domains
- snake_case → camelCase in service layer is consistent end-to-end; no boundary leaks
- TanStack Query for server state + Zustand for client state is a well-established, non-overlapping split
- The `requireAuth` loader pattern maps naturally to React Router v7's loader API

**Structure Alignment:**
- All 3 state boundaries (server/TanStack Query, client/Zustand, form/RHF) are non-overlapping
- WebSocket boundary (single hook) aligns with the single-connection-per-session constraint
- Service layer boundary enforces NFR-6 without needing additional tooling

---

### Requirements Coverage Validation

**Functional Requirements — all 25 FRs covered:**

| Category | FRs | Coverage |
|---|---|---|
| Auth & Session Management | FR-1.1–1.5 (5) | LoginPage, requireAuth loader, api.ts 401 handler, LogoutButton |
| Patient Management | FR-2.1–2.3 (3) | PatientRegistrationPage, PatientListPage, PatientProfilePage |
| Session Lifecycle | FR-3.1–3.3 (3) | SessionOpenButton, SessionCloseButton, ActiveSessionBanner |
| Real-Time Monitoring | FR-4.1–4.6 (6) | useSessionWebSocket, MetricsPanel, MLFieldDisplay, SessionCompletionToast, CloudflareStreamPlayer, WsStatusIndicator |
| Cognitive Metrics Display | FR-5.1–5.3 (3) | MetricsPanel, LevelMetricCard, DomainTag, RecommendationDisplay |
| Analytics | FR-6.1–6.5 (5) | PatientDashboard, SessionHistory, TrendChart, MetricDetailTable, SessionFilter |

**Non-Functional Requirements:**

| NFR | Architectural Support |
|---|---|
| NFR-1 Performance | TanStack Query caching (≤3s dashboard); Zustand sync update (≤500ms WS event render); Cloudflare Stream handles video latency |
| NFR-2 Security | Cookie-only via `credentials: 'include'`; no token storage enforced by api.ts pattern; PII-in-logs anti-pattern documented |
| NFR-3 Ley 29733 | No localStorage/IndexedDB for patient data documented as explicit anti-pattern |
| NFR-4 Reliability | WsStatusIndicator + reconnect + polling fallback; MLFieldDisplay null-safety; ErrorMessage for 5xx |
| NFR-5 Usability | Desktop CSS (≥1280px); Spanish UI; critical actions reachable from PatientProfilePage in ≤2 clicks |
| NFR-6 Maintainability | Service layer fully enforced; feature structure established |

---

### Gap Analysis Results

**Important Gap — App Shell component missing from structure:**
The existing `index.css` defines `.app-shell`, `.sidebar`, `.main` layout classes, and `NeurologistDashboard.tsx` currently implements all of it as a monolith. When the project is restructured, a dedicated `AppShell.tsx` layout component is needed to wrap all protected routes. Without naming this file explicitly, agents will implement the sidebar differently in each page.

**Resolution:** Add `src/shared/components/AppShell.tsx` to the structure — a layout component that renders the sidebar (with navigation and LogoutButton) and the `<Outlet />` for the main content area. The `ActiveSessionBanner.tsx` renders inside AppShell, above the Outlet, so it persists across page transitions (FR-3.3, FR-4.4).

**Minor Gap — PatientProfilePage tab structure unspecified:**
PatientProfilePage hosts both FR-3.1 (session open) and FR-6.x (analytics). Without defining the tab structure, agents may put these in different places.

**Resolution:** PatientProfilePage has 3 tabs: "Resumen" (patient info + SessionOpenButton), "Historial" (SessionHistory + TrendChart + SessionFilter), and "Sesión activa" (visible only when `store.activeSession.sessionId === patient.id`; shows session monitoring content inline).

---

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed (High — real-time WS, regulatory compliance)
- [x] Technical constraints identified (cookie-auth, Ley 29733, WS rate limit, ML async)
- [x] Cross-cutting concerns mapped (6 concerns documented)

**Architectural Decisions**
- [x] Critical decisions documented with versions (6 decisions, all versioned)
- [x] Technology stack fully specified
- [x] Integration patterns defined (REST, WS, Cloudflare Stream, Auth0 redirect)
- [x] Performance considerations addressed (caching strategy, WS event render, stream latency)

**Implementation Patterns**
- [x] Naming conventions established (PascalCase files, camelCase hooks/services)
- [x] Structure patterns defined (feature-based, service layer, transformation boundary)
- [x] Communication patterns specified (WS→Zustand→TQ, mutation→invalidate)
- [x] Process patterns documented (error handling, loading states, empty states, route guards)

**Project Structure**
- [x] Complete directory structure defined (38+ files explicitly named)
- [x] Component boundaries established (3 state boundaries, 1 API boundary, 1 WS boundary)
- [x] Integration points mapped (FR → file mapping table, data flow diagram)
- [x] Requirements to structure mapping complete (all 25 FRs mapped)

---

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High — all 25 FRs are mapped to specific files, all critical library decisions are documented with versions, all 6 cross-cutting concerns have explicit patterns, and the two gaps found are additive (AppShell + tab structure) and resolvable within the first implementation story.

**Key Strengths:**
- Clear, non-overlapping state boundaries eliminate an entire class of state management bugs
- Explicit service layer with snake_case transformation enforced at the boundary
- MLField discriminated union prevents null rendering errors before they can occur
- `requireAuth` loader pattern centralizes auth — no per-component guard logic scattered across pages

**Areas for Future Enhancement:**
- E2E testing with Playwright (deferred post-MVP)
- Error tracking with Sentry (deferred to deployment phase)
- Accessibility audit (WCAG 2.1 AA) once feature-complete

---

### Implementation Handoff

**Amended Structure (gap resolutions applied):**

```
src/shared/components/
  AppShell.tsx     ← sidebar + nav + LogoutButton + ActiveSessionBanner + <Outlet>
  ErrorMessage.tsx
  EmptyState.tsx
  LoadingSpinner.tsx
```

**PatientProfilePage tab structure:**
- Tab 1 "Resumen": patient info card + SessionOpenButton
- Tab 2 "Historial": SessionHistory list + TrendChart + SessionFilter
- Tab 3 "Sesión activa": visible only when `store.activeSession.sessionId === patient.id`; shows session monitoring content inline

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and boundaries — no `fetch` in components, no snake_case in Zustand
- Refer to this document for all architectural questions before making independent decisions

**First Implementation Priority:**
```bash
# 1. Install dependencies
npm install react-router-dom @tanstack/react-query zustand react-hook-form @hookform/resolvers zod

# 2. Wire main.tsx with QueryClientProvider + RouterProvider
# 3. Create src/services/api.ts (fetch wrapper)
# 4. Create src/store/app.store.ts (Zustand slices)
# 5. Create src/router/index.tsx (routes + requireAuth loader)
# 6. Implement AppShell.tsx
```
