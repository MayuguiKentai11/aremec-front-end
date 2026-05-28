---
stepsCompleted: [1, 2, 3]
inputDocuments:
  - "_bmad-output/planning-artifacts/prds/prd-aremec-front-end-2026-05-28/prd.md"
  - "_bmad-output/planning-artifacts/architecture.md"
---

# aremec-front-end - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for aremec-front-end, decomposing the requirements from the PRD and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR-1.1: The portal initiates authentication by navigating the browser to `GET /auth/login`. The backend manages the full OAuth2 Authorization Code exchange with Auth0, sets an HttpOnly session cookie on success, and redirects to `https://portal.aremec.pe`. The frontend must not implement any token handling or storage logic.

FR-1.2: All portal routes except the login entry point are protected. If the session cookie is absent or the backend returns 401, the frontend redirects to the login flow via a client-side route guard applied to every protected route.

FR-1.3: On receiving any 401 response, the frontend clears local UI state and redirects to login without exposing session internals to the user. No inactivity idle timer or prior warning is implemented on the frontend.

FR-1.4: `POST /auth/logout` clears the server-side session and cookie. After logout the frontend resets all local state and navigates to the login screen.

FR-1.5: A "¿Olvidaste tu contraseña?" link on the login screen invokes the Auth0-managed recovery flow. No additional frontend implementation beyond this entry point.

FR-2.1: The neurologist can register a new patient via a form that submits to `POST /patients`. Required fields: name (string), age (integer), gender (string), diagnosis (enum: EA/MCI), baseline_ravlt (float), baseline_sart (float). On success the patient is added to the list. On validation error the form highlights fields without losing entered data.

FR-2.2: The portal displays a list of patients supporting text search by name (`name` query param) via `GET /patients`, filter by status (`active`/`inactive`) via `status` query param, and a clear empty-state message when no results match.

FR-2.3: Selecting a patient navigates to their profile, which serves as the entry point for session management and analytics.

FR-3.1: The neurologist starts a VR therapy session via `POST /sessions` with the patient's UUID. The returned `session_id` is held in component state for subsequent API calls and the WebSocket connection.

FR-3.2: The neurologist marks a session as complete via `PATCH /sessions/:id/complete`. This triggers a `session_completed` event on the WebSocket channel.

FR-3.3: While a session is active the portal displays a persistent status indicator showing session state and elapsed time.

FR-4.1: After a session is opened, the portal establishes a WebSocket connection to `/sessions/:id/stream`. The session cookie is validated during the HTTP upgrade; no additional auth header is needed.

FR-4.2: On receiving a `level_completed` event, the portal immediately updates the metrics panel for the completed level without a page reload. Fields displayed: ORS, ERS, SCS, RTA, ER, SPS, cognitive classification (`sps_class`), and difficulty recommendation.

FR-4.3: `sps_class` and `recommendation` may be `null` on the immediate REST response. The portal must render a visible pending/loading indicator for these fields — not blank space, not an error. The subsequent `level_completed` WebSocket event will carry the resolved values.

FR-4.4: On receiving a `session_completed` event the portal displays a visible in-app notification prompting post-session review. If the neurologist is on a different screen, the notification appears as a persistent banner on the next screen they visit.

FR-4.5: Live VR view streaming is delivered via Cloudflare Stream. The frontend embeds the Cloudflare Stream player in the session monitoring view alongside the real-time metrics panel. When the stream is unavailable, the player attempts automatic reconnection in a loop with no alternative UI fallback.

FR-4.6: On WebSocket connection loss the portal must: (1) show a visible reconnection indicator, (2) attempt automatic reconnect with exponential backoff (max 3 attempts), (3) fall back to polling `GET /sessions/:id/metrics` if reconnect fails, (4) notify the neurologist if connectivity cannot be restored.

FR-5.1: After each level completes the portal displays 6 computed metrics with cognitive domain labels: ORS (Memoria episódica), ERS (Memoria episódica), SCS (Memoria episódica), RTA (Atención sostenida), ER (Atención sostenida), SPS (Composite).

FR-5.2: Each metric or metric group is visually labeled by domain using the `cognitive_domain_tags` array returned by `GET /sessions/:id/metrics`.

FR-5.3: The current recommendation (`increase_difficulty` / `maintain_difficulty` / `decrease_difficulty`) is displayed prominently after each level. Read-only; no manual override.

FR-6.1: The patient profile page renders an aggregated dashboard from `GET /patients/:id/dashboard`: SPS per session with trend sparkline, global trend indicator (rising/stable/falling), session list with date, SPS, classification, and recommendation.

FR-6.2: A chronological (descending) list of all sessions via `GET /patients/:id/sessions`. Incomplete sessions display a status indicator. Selecting a session navigates to its detail view.

FR-6.3: A chart of SPS evolution over time rendered from `GET /patients/:id/trend`. Trend direction is labeled (rising/stable/falling). When fewer than 2 sessions exist, the portal displays an informational message rather than an empty chart.

FR-6.4: Selecting a session expands the level-by-level breakdown via `GET /sessions/:id/metrics`. Each level shows all 6 metrics, classification, recommendation, and domain tags.

FR-6.5: The dashboard supports filtering to a single session's metrics. Clearing the filter restores the full multi-session consolidated view.

### NonFunctional Requirements

NFR-1 (Performance): Metrics must appear within 5 seconds of a level completing; WebSocket event rendering must complete within 500ms of event receipt; live VR streaming latency must stay below 2 seconds; dashboard page load must complete within 3 seconds on a standard clinical workstation.

NFR-2 (Security): No session token, JWT, or sensitive credential may be stored in localStorage, sessionStorage, or any JavaScript-accessible location. All communication must occur over HTTPS. Client-side error logging must not capture PII.

NFR-3 (Regulatory Compliance — Ley 29733): No personal or clinical data may be persisted on the client beyond the active browser session (no IndexedDB, no long-lived localStorage). Error messages must not expose patient identifiers in URLs or user-visible stack traces.

NFR-4 (Reliability): Backend 5xx responses must surface a user-friendly error without crashing the application. WebSocket disconnection must not crash the active session monitoring view. Null ML fields must never cause a rendering error.

NFR-5 (Usability): Desktop-only: target viewport 1280px and above; no mobile or tablet layout required. Interface language: Spanish throughout. Critical in-session actions must be reachable in 2 clicks or fewer from the session monitoring view.

NFR-6 (Maintainability): A clear architectural pattern (routing, API layer, state management, component structure) must be established before module implementation begins. All API integration points must be encapsulated in a dedicated service/adapter layer; UI components must not contain direct fetch calls.

### Additional Requirements

- **Project already bootstrapped** with `npm create vite@latest aremec-front-end -- --template react-ts`. No new starter template needed; foundation exists.
- **Required library installations before feature work**: React Router v7, TanStack Query v5, Zustand v5, React Hook Form v7 + Zod v3, `@hookform/resolvers`
- **Service layer** (`src/services/`) must be established before any feature module work begins; no `fetch` calls in UI components (NFR-6)
- **Zustand store** (`src/store/app.store.ts`) with `auth`, `activeSession`, and `notifications` slices must be created as foundational infrastructure
- **React Router v7** route structure with `requireAuth` loader wrapping all protected routes must be the sole route protection mechanism
- **AppShell.tsx** layout component (`src/shared/components/AppShell.tsx`) needed to wrap protected routes, render sidebar, LogoutButton, ActiveSessionBanner, and `<Outlet>` (gap resolution from Architecture)
- **PatientProfilePage** tab structure: Tab 1 "Resumen" (patient info + SessionOpenButton), Tab 2 "Historial" (SessionHistory + TrendChart + SessionFilter), Tab 3 "Sesión activa" (visible only when `store.activeSession.sessionId === patient.id`) (gap resolution from Architecture)
- **Environment variables**: `VITE_API_BASE_URL` and `VITE_WS_BASE_URL` — must be env-configurable, never hardcoded; `.env.example` file required
- **Existing monolith** `src/NeurologistDashboard/NeurologistDashboard.tsx` must be decomposed into proper feature modules during implementation
- **snake_case → camelCase transformation** must occur exclusively in the service layer; UI components never receive raw snake_case API fields
- **MLField<T> discriminated union** (`pending` / `resolved` / `error`) must be used for all nullable ML fields (`sps_class`, `recommendation`); never render null directly
- **TanStack Query** used for all server state — `useState + useEffect` pattern for API calls is explicitly forbidden
- **Date display**: always use `Intl.DateTimeFormat` with locale `'es-PE'`; store ISO strings, format at render time
- **Mutation side effects**: always invalidate TanStack Query cache on mutation success — never manually update cache

### UX Design Requirements

No UX Design document found. The portal builds UI from scratch using Tailwind CSS (or custom CSS variables per Architecture) guided by Figma screens referenced in PRD assumptions (no formal design system or tokens defined).

### FR Coverage Map

```
FR-1.1: Epic 1 — Login redirect a GET /auth/login (LoginPage.tsx)
FR-1.2: Epic 1 — requireAuth loader en todas las rutas protegidas
FR-1.3: Epic 1 — Intercepción global 401 en api.ts → redirect a login
FR-1.4: Epic 1 — LogoutButton + reset de Zustand store
FR-1.5: Epic 1 — Link "¿Olvidaste tu contraseña?" en LoginPage
FR-2.1: Epic 2 — PatientRegistrationPage con RHF + Zod
FR-2.2: Epic 2 — PatientListPage con search y filter
FR-2.3: Epic 2 — PatientProfilePage con 3 tabs
FR-3.1: Epic 3 — SessionOpenButton → POST /sessions
FR-3.2: Epic 3 — SessionCloseButton → PATCH /sessions/:id/complete
FR-3.3: Epic 3 — ActiveSessionBanner en AppShell
FR-4.1: Epic 3 — useSessionWebSocket hook (connect post session-open)
FR-4.2: Epic 3 — level_completed → MetricsPanel update sin reload
FR-4.3: Epic 3 — MLFieldDisplay con pending/resolved/error (discriminated union)
FR-4.4: Epic 3 — SessionCompletionToast + notifications slice en Zustand
FR-4.5: Epic 3 — CloudflareStreamPlayer embed
FR-4.6: Epic 3 — Exponential backoff (3 intentos) + polling fallback en useSessionWebSocket
FR-5.1: Epic 3 — MetricsPanel + LevelMetricCard (ORS, ERS, SCS, RTA, ER, SPS)
FR-5.2: Epic 3 — DomainTag component (cognitive_domain_tags array)
FR-5.3: Epic 3 — RecommendationDisplay (increase/maintain/decrease, read-only)
FR-6.1: Epic 4 — PatientDashboard con SPS sparkline y trend indicator
FR-6.2: Epic 4 — SessionHistory cronológico con estado de sesiones incompletas
FR-6.3: Epic 4 — TrendChart con Recharts; mensaje informativo si < 2 sesiones
FR-6.4: Epic 4 — SessionDetailPage + MetricDetailTable (breakdown nivel a nivel)
FR-6.5: Epic 4 — SessionFilter component (filtro por sesión individual)
```

## Epic List

### Epic 1: Foundation & Authentication
The neurologist can securely access the clinical portal. Establishes all foundational infrastructure (routing, service layer, Zustand store, AppShell) and the complete authentication flow. No other epic is functional without this one.
**FRs covered:** FR-1.1, FR-1.2, FR-1.3, FR-1.4, FR-1.5
**Additional:** Project wiring (install deps, main.tsx, QueryClientProvider, RouterProvider), api.ts wrapper, app.store.ts, router/index.tsx with requireAuth loader, AppShell.tsx, .env.example

### Epic 2: Patient Management
The neurologist can register new patients, search and filter the patient list, and navigate to a patient's profile. Patient profile shell with 3 tabs is established here as the entry point for sessions and analytics.
**FRs covered:** FR-2.1, FR-2.2, FR-2.3

### Epic 3: Session Monitoring
The neurologist can open a VR therapy session, monitor real-time cognitive performance level by level, view the live VR feed, and close the session. Includes the complete WebSocket lifecycle, ML pending state handling, and all in-session metric display.
**FRs covered:** FR-3.1, FR-3.2, FR-3.3, FR-4.1, FR-4.2, FR-4.3, FR-4.4, FR-4.5, FR-4.6, FR-5.1, FR-5.2, FR-5.3

### Epic 4: Analytics & Clinical Follow-up
The neurologist can review a patient's longitudinal cognitive evolution, browse session history, visualize SPS trends, and drill into level-by-level detail for any historical session.
**FRs covered:** FR-6.1, FR-6.2, FR-6.3, FR-6.4, FR-6.5

---

## Epic 1: Foundation & Authentication

The neurologist can securely access the clinical portal. Establishes all foundational infrastructure (routing, service layer, Zustand store, AppShell) and the complete authentication flow. No other epic is functional without this one.

### Story 1.1: Project Foundation & Infrastructure

As a neurologist,
I want the clinical portal to have a stable, well-structured foundation,
So that all features work reliably with consistent data-fetching and state management patterns.

**Acceptance Criteria:**

**Given** the project exists with Vite + React-TS bootstrapped
**When** `npm install` is run with the required packages
**Then** the following are installed: `react-router-dom`, `@tanstack/react-query`, `zustand`, `react-hook-form`, `@hookform/resolvers`, `zod`

**Given** `main.tsx` is wired
**When** the app loads
**Then** `QueryClientProvider` wraps the app and `RouterProvider` is the root component

**Given** `src/services/api.ts` exists
**When** any service function calls it
**Then** every request includes `credentials: 'include'`, uses `VITE_API_BASE_URL` from env, and throws a typed `ApiError` on non-2xx responses

**Given** `src/store/app.store.ts` exists
**When** the app initializes
**Then** the Zustand store has `auth` (neurologist + status), `activeSession` (sessionId + wsStatus), and `notifications` slices with correct initial state

**Given** `src/shared/components/` exists
**When** the app encounters an error or empty list
**Then** `<ErrorMessage>`, `<EmptyState>`, and `<LoadingSpinner>` components are available for use

**Given** `.env.example` exists in the project root
**When** a developer sets up the project
**Then** the file documents `VITE_API_BASE_URL` and `VITE_WS_BASE_URL` variable names (no values)

---

### Story 1.2: Application Routing & Layout Shell

As a neurologist,
I want to navigate the portal with protected routes and a consistent layout,
So that I can access my workspace securely and find navigation items in a predictable location.

**Acceptance Criteria:**

**Given** `src/router/index.tsx` defines all routes with `requireAuth` loader
**When** an unauthenticated user navigates to any protected route (`/patients`, `/patients/new`, `/patients/:id`, etc.)
**Then** they are redirected to `/login`

**Given** the user is authenticated
**When** they navigate to `/`
**Then** they are redirected to `/patients`

**Given** `requireAuth` loader runs on a protected route
**When** `auth.status` in Zustand is `'loading'`
**Then** it calls `auth.service.ts#getMe()`, awaits the result, and only redirects on 401

**Given** `AppShell.tsx` wraps all protected routes
**When** the neurologist is on any protected page
**Then** a sidebar with navigation links and a main content area with `<Outlet>` are visible; `<ActiveSessionBanner>` placeholder renders above the Outlet

**Given** `/login` is a public route
**When** an unauthenticated user navigates to it
**Then** `AppShell` does not render; `LoginPage` renders alone

---

### Story 1.3: Login & Logout

As a neurologist,
I want to log in with my institutional credentials and log out when I'm done,
So that I can access my patients' data securely and protect it when I leave the workstation.

**Acceptance Criteria:**

**Given** the neurologist is on `/login`
**When** they click "Iniciar sesión"
**Then** the browser navigates to `GET /auth/login` (backend initiates the Auth0 flow; no token handling on the frontend)

**Given** the neurologist is on `/login`
**When** they click "¿Olvidaste tu contraseña?"
**Then** the Auth0-managed password recovery flow is initiated (external link or redirect to Auth0)

**Given** the neurologist clicks the logout button in AppShell
**When** `POST /auth/logout` completes successfully
**Then** the Zustand store is fully reset, all local UI state is cleared, and the browser navigates to `/login`

**Given** any protected API call returns 401 (session expired or absent)
**When** `api.ts` intercepts the response
**Then** the user is redirected to `/login` without exposing session internals, cookie details, or error stack traces in the UI

**Given** the neurologist lands on `https://portal.aremec.pe` after Auth0 redirects back
**When** the `requireAuth` loader runs
**Then** it calls `getMe()`, receives the neurologist's profile, sets `auth.status = 'authenticated'`, and renders the protected route normally

---

## Epic 2: Patient Management

The neurologist can register new patients, search and filter the patient list, and navigate to a patient's profile.

### Story 2.1: Patient Registration Form

As a neurologist,
I want to register a new patient with their clinical baseline data,
So that I can start managing their VR therapy sessions in the portal.

**Acceptance Criteria:**

**Given** the neurologist navigates to `/patients/new`
**When** `PatientRegistrationPage` renders
**Then** a form with fields name, age, gender, diagnosis (EA/MCI dropdown), baseline_ravlt, and baseline_sart is displayed

**Given** the neurologist submits the form with all valid data
**When** `POST /patients` returns 201
**Then** the patient is added to the list and the neurologist is navigated to `/patients`
**And** the `['patients']` TanStack Query cache is invalidated

**Given** the neurologist submits the form with missing or invalid fields
**When** Zod validation fails
**Then** field-level error messages are shown inline next to each invalid field
**And** previously entered data is preserved (form does not reset)

**Given** `POST /patients` returns a 5xx error
**When** the mutation's error state is set
**Then** `<ErrorMessage>` is displayed without crashing the page
**And** the form data is preserved for retry

---

### Story 2.2: Patient List & Search

As a neurologist,
I want to view my patients, search by name, and filter by status,
So that I can quickly find the patient I need to work with.

**Acceptance Criteria:**

**Given** the neurologist navigates to `/patients`
**When** `GET /patients` returns results
**Then** a list of patient cards is displayed with name, diagnosis, and status visible on each card

**Given** the neurologist types in the search input
**When** the input value changes (debounced)
**Then** `GET /patients?name=<query>` is called and results update accordingly

**Given** the neurologist selects the "Activo" or "Inactivo" filter
**When** the filter is applied
**Then** `GET /patients?status=active` or `?status=inactive` is called and results update

**Given** no patients match the search or filter criteria
**When** the result set is empty
**Then** `<EmptyState>` is displayed with an informational message (not a blank area)

**Given** `GET /patients` returns a 5xx error
**When** TanStack Query sets the error state
**Then** `<ErrorMessage>` is displayed with a retry option

---

### Story 2.3: Patient Profile Page

As a neurologist,
I want to navigate to a patient's profile and see their information organized by tabs,
So that I can access session management and analytics from a single entry point.

**Acceptance Criteria:**

**Given** the neurologist clicks on a patient card in the list
**When** they are navigated to `/patients/:id`
**Then** `PatientProfilePage` renders with the patient's name, age, diagnosis, and baseline scores visible

**Given** `PatientProfilePage` renders
**When** the page loads
**Then** three tabs are visible: "Resumen", "Historial", and "Sesión activa"

**Given** the neurologist is on the "Resumen" tab
**When** it renders
**Then** the patient info card and a `SessionOpenButton` (placeholder — wired in Epic 3) are displayed

**Given** the neurologist is on the "Historial" tab
**When** it renders
**Then** placeholder content is displayed (to be wired in Epic 4)

**Given** `store.activeSession.sessionId` does not match this patient's id
**When** the page renders
**Then** the "Sesión activa" tab is hidden

**Given** `GET /patients/:id` returns 404
**When** TanStack Query sets the error state
**Then** `<ErrorMessage>` is displayed without crashing the page

---

## Epic 3: Session Monitoring

The neurologist can open a VR therapy session, monitor real-time cognitive performance level by level, view the live VR feed, and close the session. Includes the complete WebSocket lifecycle, ML pending state handling, and all in-session metric display.

### Story 3.1: Session Lifecycle — Open, Close & Active Banner

As a neurologist,
I want to open and close VR therapy sessions and see a persistent indicator while a session is active,
So that I know at all times whether a session is in progress and can manage it from any screen.

**Acceptance Criteria:**

**Given** the neurologist is on the "Resumen" tab of `PatientProfilePage`
**When** they click "Iniciar sesión"
**Then** `POST /sessions` is called with the patient's UUID
**And** the returned `sessionId` is stored in `Zustand activeSession.sessionId`
**And** the neurologist is navigated to `/patients/:id/session` (`SessionMonitorPage`)

**Given** a session is active (`sessionId` in Zustand)
**When** any protected page renders with `AppShell`
**Then** `ActiveSessionBanner` shows session state and elapsed time since `startedAt`

**Given** the neurologist clicks "Cerrar sesión" on `SessionMonitorPage`
**When** `PATCH /sessions/:id/complete` returns 200
**Then** `Zustand activeSession` is reset (`sessionId = null`, `wsStatus = 'disconnected'`)
**And** the "Sesión activa" tab on `PatientProfilePage` becomes hidden

**Given** `POST /sessions` returns 5xx
**When** the mutation errors
**Then** `<ErrorMessage>` is displayed and the neurologist remains on `PatientProfilePage`

---

### Story 3.2: WebSocket Lifecycle & Session Events

As a neurologist,
I want the portal to maintain a live connection to the session stream and notify me when events occur,
So that I receive real-time updates and am alerted when the session completes.

**Acceptance Criteria:**

**Given** a session has been opened (`sessionId` in Zustand)
**When** `useSessionWebSocket` mounts inside `SessionMonitorPage`
**Then** a WebSocket connection is established to `wss://.../sessions/:id/stream` using the session cookie (no extra auth header)

**Given** the WebSocket receives a `level_completed` event
**When** `useSessionWebSocket` processes it
**Then** `queryClient.invalidateQueries(['session', sessionId, 'metrics'])` is called
**And** Zustand `activeSession` is updated with the latest level reference

**Given** the WebSocket receives a `session_completed` event
**When** `useSessionWebSocket` processes it
**Then** `notifications.pendingSessionComplete` is set to `true` in Zustand
**And** `SessionCompletionToast` is shown immediately in the current view
**And** on any subsequent page navigation, a persistent notification banner appears until dismissed

**Given** the WebSocket disconnects unexpectedly
**When** `useSessionWebSocket` detects the disconnect
**Then** `WsStatusIndicator` shows a reconnection indicator
**And** reconnect is attempted with exponential backoff: 1s → 2s → 4s (max 3 attempts)

**Given** all 3 reconnect attempts fail
**When** the fallback is triggered
**Then** polling of `GET /sessions/:id/metrics` at 5-second intervals begins
**And** `WsStatusIndicator` shows `'polling'` status
**And** the neurologist is notified that real-time connectivity could not be restored
**And** the `SessionMonitorPage` does not crash

---

### Story 3.3: Real-Time Metrics Panel

As a neurologist,
I want to see the 6 cognitive metrics for each completed level with their domain labels and ML classification,
So that I can monitor the patient's cognitive performance as the session progresses.

**Acceptance Criteria:**

**Given** a `level_completed` event has been received and metrics are fetched via TanStack Query
**When** `MetricsPanel` renders for that level
**Then** 6 metric cards are shown: ORS, ERS, SCS (Memoria episódica), RTA, ER (Atención sostenida), SPS (Composite)
**And** each card shows the metric label, numeric value, and its cognitive domain via `<DomainTag>`

**Given** `sps_class` is `null` on the REST response (ML service has not yet responded)
**When** `MLFieldDisplay` renders
**Then** a visible pending/loading indicator is shown — not blank space, not an error message

**Given** a subsequent `level_completed` WebSocket event carries a resolved `sps_class` value
**When** `MLFieldDisplay` receives the resolved value
**Then** the pending indicator is replaced with the actual classification label

**Given** a difficulty recommendation is available (`increase_difficulty` / `maintain_difficulty` / `decrease_difficulty`)
**When** `RecommendationDisplay` renders
**Then** the recommendation is displayed prominently as a read-only chip; no edit controls are present

**Given** `GET /sessions/:id/metrics` returns a 5xx error
**When** TanStack Query sets the error state
**Then** `<ErrorMessage>` is displayed in the metrics panel area without crashing the session view

---

### Story 3.4: Live VR Stream Embed

As a neurologist,
I want to see the patient's live VR headset feed alongside the metrics panel,
So that I can observe the patient's in-game behavior without interrupting the immersive experience.

**Acceptance Criteria:**

**Given** a session is active and `SessionMonitorPage` is rendered
**When** `CloudflareStreamPlayer` mounts
**Then** the Cloudflare Stream player is embedded in the session monitoring view alongside `MetricsPanel`

**Given** the Cloudflare Stream is unavailable or latency degrades
**When** the player detects the issue
**Then** automatic reconnection is attempted in a loop
**And** no alternative UI fallback is shown to the neurologist during reconnection

**Given** the stream becomes available again after a disconnect
**When** reconnection succeeds
**Then** the live VR feed resumes without requiring neurologist interaction

---

## Epic 4: Analytics & Clinical Follow-up

The neurologist can review a patient's longitudinal cognitive evolution, browse session history, visualize SPS trends, and drill into level-by-level detail for any historical session.

### Story 4.1: Patient Dashboard & SPS Trend

As a neurologist,
I want to see an aggregated dashboard of my patient's cognitive performance across all sessions,
So that I can quickly assess their overall trajectory and identify sessions that need closer review.

**Acceptance Criteria:**

**Given** the neurologist is on the "Historial" tab of `PatientProfilePage`
**When** `PatientDashboard` renders
**Then** `GET /patients/:id/dashboard` is called and the response renders: SPS per session as a sparkline, a global trend indicator (`rising` / `stable` / `falling`), and a session list with date, SPS, classification, and recommendation per row

**Given** `GET /patients/:id/dashboard` resolves
**When** the page renders
**Then** the dashboard loads within 3 seconds on a standard clinical workstation

**Given** the global trend is `rising`, `stable`, or `falling`
**When** the trend indicator renders
**Then** the label and visual direction are shown prominently alongside the sparkline

**Given** `GET /patients/:id/dashboard` returns a 5xx error
**When** TanStack Query sets the error state
**Then** `<ErrorMessage>` is displayed without crashing the page

---

### Story 4.2: Cognitive Trend Chart & Session Filter

As a neurologist,
I want to view a chart of the patient's SPS evolution over time and filter to a specific session,
So that I can analyze cognitive trends and isolate individual session data when needed.

**Acceptance Criteria:**

**Given** `GET /patients/:id/trend` returns data with 2 or more sessions
**When** `TrendChart` renders
**Then** a Recharts `LineChart` displays SPS values over time with the trend direction labeled (`rising` / `stable` / `falling`) and slope as context

**Given** `GET /patients/:id/trend` returns data with fewer than 2 sessions
**When** `TrendChart` renders
**Then** an informational message is displayed instead of an empty chart (never a blank area)

**Given** the neurologist selects a session in `SessionFilter`
**When** the filter is applied
**Then** the dashboard and metrics views update to show only that session's data

**Given** the neurologist clears the session filter
**When** the filter is removed
**Then** the full multi-session consolidated view is restored

---

### Story 4.3: Session History & Per-Session Detail

As a neurologist,
I want to browse the chronological list of a patient's sessions and drill into the level-by-level detail of any session,
So that I can review the complete metric history and inform adaptive therapy decisions.

**Acceptance Criteria:**

**Given** the neurologist is on the "Historial" tab
**When** `SessionHistory` renders
**Then** `GET /patients/:id/sessions` returns sessions in descending chronological order, each row showing date, SPS, classification, recommendation, and a status indicator for incomplete sessions

**Given** the neurologist clicks on a session row
**When** they are navigated to `/sessions/:id`
**Then** `SessionDetailPage` renders and calls `GET /sessions/:id/metrics`

**Given** `GET /sessions/:id/metrics` returns data
**When** `MetricDetailTable` renders
**Then** every level is shown with all 6 metrics (ORS, ERS, SCS, RTA, ER, SPS), classification, recommendation, and domain tags

**Given** an incomplete session appears in the list
**When** `SessionHistory` renders that row
**Then** a visible status indicator distinguishes it from completed sessions

**Given** `GET /patients/:id/sessions` returns a 5xx error
**When** TanStack Query sets the error state
**Then** `<ErrorMessage>` is displayed with a retry option
