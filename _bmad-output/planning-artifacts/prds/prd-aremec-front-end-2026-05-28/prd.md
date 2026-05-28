---
title: AREMEC Clinical Portal — Frontend Product Requirements
status: final
created: 2026-05-28
updated: 2026-05-28
---

# AREMEC Clinical Portal — Frontend Product Requirements Document

## 1. Overview

AREMEC (Aplicación de Realidad Extendida para Métricas Cognitivas) is a clinical platform that supports neurologists at the Instituto Nacional de Ciencias Neurológicas (INCN) in monitoring and evaluating patients undergoing immersive VR-based cognitive rehabilitation therapy.

This document specifies the product requirements for the **frontend web application** — the clinical portal used by neurologists to manage patients, supervise therapy sessions in real time, and analyze longitudinal cognitive outcomes. It guides the architectural design and implementation of the remaining frontend work.

---

## 2. Problem Statement

Neurologists supervising cognitive rehabilitation therapy at INCN currently lack a unified digital interface to:

- Monitor patient performance during VR sessions without interrupting the immersive experience
- Receive objective, data-driven cognitive classifications to support clinical decision-making
- Track patient cognitive evolution across sessions with trend visualization

The AREMEC frontend is the clinical touchpoint that bridges the VR therapy environment with the neurologist's workflow.

---

## 3. Product Vision

Deliver a desktop web portal that gives INCN neurologists a complete, real-time view of their patients' cognitive performance during and after VR therapy — reducing dependence on manual observation and providing objective data for adaptive clinical decisions.

---

## 4. System Context

The frontend is one component in a multi-system architecture. It communicates exclusively with the AREMEC backend; it has no direct integration with the VR game or ML service.

| Component | Role |
|---|---|
| **Clinical Portal (this document)** | Browser-based web app used by neurologists |
| **AREMEC Backend** | Go/Fiber REST API + WebSocket; handles auth, patient data, session management, metric computation |
| **Unity VR Game** | Patient-facing immersive application; sends level telemetry to the backend on level completion |
| **ML Service** | Classifies cognitive performance (SPS) and generates difficulty recommendations; called asynchronously by the backend |
| **Auth0** | Identity provider; manages authentication via OAuth2 Authorization Code flow |

**Frontend communication channels:**
- REST API at `https://aremec-ws-latest.onrender.com/api/v1/`
- WebSocket at `/sessions/:id/stream` for real-time session events
- Authentication via HttpOnly session cookie — the frontend never handles tokens directly

---

## 5. Target User

**Neurologist at INCN** — a clinical specialist managing a caseload of patients diagnosed with Alzheimer's Disease (EA) or Mild Cognitive Impairment (MCI). During a therapy consultation, the neurologist registers the patient, opens a VR session, monitors performance in real time from a desktop workstation in the consultation room, reviews cognitive classification output, and decides whether to adjust therapy difficulty.

The portal is the neurologist's sole interface throughout this workflow — from patient onboarding to longitudinal outcome review. There is no other user role in scope.

---

## 6. Feature Requirements

### 6.1 Authentication & Session Management

**FR-1.1 — Login flow**
The portal initiates authentication by navigating the browser to `GET /auth/login`. The backend manages the full OAuth2 Authorization Code exchange with Auth0, sets an HttpOnly session cookie on success, and redirects to `https://portal.aremec.pe`. The frontend must not implement any token handling or storage logic.

**FR-1.2 — Route protection**
All portal routes except the login entry point are protected. If the session cookie is absent or the backend returns 401, the frontend redirects to the login flow. This must be enforced via a client-side route guard applied to every protected route.

**FR-1.3 — Session expiry handling**
The session cookie carries a 1-hour TTL managed by the backend. On receiving any 401 response, the frontend clears local UI state and redirects to login without exposing session internals to the user.
The 15-minute inactivity timeout is enforced server-side via cookie expiry. The frontend does not implement an inactivity idle timer or a 2-minute prior warning; it reacts only to 401 responses (see FR-1.2).

**FR-1.4 — Logout**
`POST /auth/logout` clears the server-side session and cookie. After logout the frontend resets all local state and navigates to the login screen.

**FR-1.5 — Password recovery**
A "¿Olvidaste tu contraseña?" link on the login screen invokes the Auth0-managed recovery flow. No additional frontend implementation is required beyond this entry point.

---

### 6.2 Patient Management

**FR-2.1 — Patient registration**
The neurologist can register a new patient via a form that submits to `POST /patients`. Required fields:

| Field | Type | Notes |
|---|---|---|
| `name` | string | Full name |
| `age` | integer | |
| `gender` | string | |
| `diagnosis` | enum | `EA` or `MCI` |
| `baseline_ravlt` | float | Baseline episodic memory score |
| `baseline_sart` | float | Baseline sustained attention score |

On success the patient is added to the patient list. On validation error the form highlights missing or invalid fields without losing entered data.

**FR-2.2 — Patient list and search**
The portal displays a list of patients supporting:
- Text search by name (`name` query param) via `GET /patients`
- Filter by status (`active` / `inactive`) via the `status` query param
- A clear empty-state message when no results match

**FR-2.3 — Patient profile navigation**
Selecting a patient navigates to their profile, which serves as the entry point for session management and analytics.

---

### 6.3 Session Lifecycle

**FR-3.1 — Open session**
The neurologist starts a VR therapy session via `POST /sessions` with the patient's UUID. The returned `session_id` is held in component state for subsequent API calls and the WebSocket connection.

**FR-3.2 — Close session**
The neurologist marks a session as complete via `PATCH /sessions/:id/complete`. This triggers a `session_completed` event on the WebSocket channel.

**FR-3.3 — Active session indicator**
While a session is active the portal displays a persistent status indicator showing session state and elapsed time.

---

### 6.4 Real-Time Session Monitoring

**FR-4.1 — WebSocket connection**
After a session is opened, the portal establishes a WebSocket connection to `/sessions/:id/stream`. The session cookie is validated during the HTTP upgrade; no additional auth header is needed.

**FR-4.2 — Level completion events**
On receiving a `level_completed` event, the portal immediately updates the metrics panel for the completed level without a page reload. Fields displayed: ORS, ERS, SCS, RTA, ER, SPS, cognitive classification (`sps_class`), and difficulty recommendation.

**FR-4.3 — Null-safe ML field rendering**
`sps_class` and `recommendation` may be `null` on the immediate REST response if the ML service has not yet responded. The portal must render a visible pending/loading indicator for these fields — not blank space, not an error. The subsequent `level_completed` WebSocket event will carry the resolved values.

**FR-4.4 — Session completion notification**
On receiving a `session_completed` event the portal displays a visible in-app notification prompting post-session review. If the neurologist is on a different screen, the notification appears as a persistent banner on the next screen they visit.

**FR-4.5 — VR view display**
Live VR view streaming is delivered via **Cloudflare Stream**. The source is the patient's **Meta Quest 3S** headset, which streams to Cloudflare; the clinical portal embeds the Cloudflare Stream player to display the live feed.

The frontend requirement is to embed the player in the session monitoring view alongside the real-time metrics panel. When the stream is unavailable or latency degrades, the player attempts automatic reconnection in a loop with no alternative UI fallback — the neurologist is not shown a different view while reconnecting.

**FR-4.6 — WebSocket disconnection handling**
On connection loss the portal must:
1. Show a visible reconnection indicator
2. Attempt automatic reconnect with exponential backoff (max 3 attempts)
3. Fall back to polling `GET /sessions/:id/metrics` if reconnect fails
4. Notify the neurologist if connectivity cannot be restored

---

### 6.5 Cognitive Metrics Display

**FR-5.1 — Per-level metrics panel**
After each level completes the portal displays the 6 computed metrics with their cognitive domain labels:

| Metric | Label | Domain |
|---|---|---|
| ORS | Object Recognition Score | Memoria episódica |
| ERS | Event Recognition Score | Memoria episódica |
| SCS | Semantic Comprehension Score | Memoria episódica |
| RTA | Reaction Time Average | Atención sostenida |
| ER | Error Rate | Atención sostenida |
| SPS | Synthesized Performance Score | Composite |

**FR-5.2 — Cognitive domain tagging**
Each metric or metric group is visually labeled by domain using the `cognitive_domain_tags` array returned by `GET /sessions/:id/metrics`.

**FR-5.3 — Difficulty recommendation display**
The current recommendation (`increase_difficulty` / `maintain_difficulty` / `decrease_difficulty`) is displayed prominently after each level. The recommendation is read-only; manual override by the neurologist is out of scope for this implementation.

---

### 6.6 Analytics & Clinical Follow-up

**FR-6.1 — Individual patient dashboard**
The patient profile page renders an aggregated dashboard from `GET /patients/:id/dashboard`:
- SPS per session with trend sparkline
- Global trend indicator: `rising` / `stable` / `falling`
- Session list with date, SPS, classification, and recommendation

**FR-6.2 — Session history**
A chronological (descending) list of all sessions via `GET /patients/:id/sessions`. Incomplete sessions display a status indicator. Selecting a session navigates to its detail view.

**FR-6.3 — Cognitive trend visualization**
A chart of SPS evolution over time rendered from `GET /patients/:id/trend`. Trend direction is labeled (rising / stable / falling) and the slope provides context. When fewer than 2 sessions exist, the portal displays an informational message rather than an empty chart.

**FR-6.4 — Per-session metric detail**
Selecting a session expands the level-by-level breakdown via `GET /sessions/:id/metrics`. Each level shows all 6 metrics, classification, recommendation, and domain tags.

**FR-6.5 — Session filter**
The dashboard supports filtering to a single session's metrics. Clearing the filter restores the full multi-session consolidated view.

---

## 7. Non-Functional Requirements

**NFR-1 — Performance**
- Metrics must appear in the portal within 5 seconds of a level completing (HU-10 SLA)
- WebSocket event rendering must complete within 500 ms of event receipt
- Live VR streaming latency must stay below 2 seconds (HU-15 SLA)
- Dashboard page load must complete within 3 seconds on a standard clinical workstation with stable network

**NFR-2 — Security**
- No session token, JWT, or sensitive credential may be stored in `localStorage`, `sessionStorage`, or any JavaScript-accessible location
- All communication must occur over HTTPS; no HTTP fallback
- Client-side error logging must not capture PII (patient name, diagnosis, metric values)

**NFR-3 — Regulatory Compliance — Ley 29733**
- No personal or clinical data may be persisted on the client beyond the active browser session (no IndexedDB, no long-lived `localStorage`)
- Error messages must not expose patient identifiers in URLs or user-visible stack traces

**NFR-4 — Reliability**
- Backend 5xx responses must surface a user-friendly error without crashing the application
- WebSocket disconnection must not crash the active session monitoring view (FR-4.6)
- Null ML fields must never cause a rendering error (FR-4.3)

**NFR-5 — Usability**
- Desktop-only: target viewport 1280 px and above; no mobile or tablet layout required
- Interface language: Spanish throughout
- Critical in-session actions (view metrics, review recommendation) must be reachable in 2 clicks or fewer from the session monitoring view

**NFR-6 — Maintainability**
- A clear architectural pattern (routing, API layer, state management, component structure) must be established before module implementation begins
- All API integration points must be encapsulated in a dedicated service/adapter layer; UI components must not contain direct fetch calls

---

## 8. Integration Constraints

| Constraint | Detail |
|---|---|
| Auth mechanism | Cookie-only (HttpOnly, Secure, SameSite=Lax). Never use `Authorization` headers. |
| Backend base URL | `https://aremec-ws-latest.onrender.com/api/v1/` — must be environment-configurable |
| WebSocket URL | `wss://aremec-ws-latest.onrender.com/api/v1/sessions/:id/stream` |
| ML async results | `sps_class` and `recommendation` are nullable in REST responses; treat null as "pending" state |
| WebSocket rate limit | 60 messages/minute per connection; client must not generate messages above this rate |
| Session cookie TTL | 1 hour; browser manages the cookie automatically |
| CORS | Backend must allow `https://portal.aremec.pe` origin |

---

## 9. Open Questions

| # | Question | Impact | Owner |
|---|---|---|---|
| OQ-1 | What frontend router and state management library will be used? Deferred to architecture phase. | Affects all module implementations | Architecture |

---

## 10. Assumptions

- Baseline RAVLT and SART scores are entered manually by the neurologist at patient registration; they are not computed or imported automatically.
- Backend CORS is configured to allow `https://portal.aremec.pe` as an origin.
- Figma screen designs are available as visual reference for implementation. No formal design system, color tokens, or reusable Figma components are defined; the frontend builds the UI from scratch using Tailwind CSS guided by those screens.
