# Deferred Work

## Deferred from: code review of 1-1-project-foundation-infrastructure (2026-05-28)

- No `/login` route in router stub — intentional, Story 1.3 will add it [src/router/index.tsx]
- No DELETE/PUT methods on `api` object — future story requirement [src/services/api.ts]
- `LoadingSpinner` has no visual animation — AC-5 criterion met ("no TS errors"); visual polish deferred [src/shared/components/LoadingSpinner.tsx]
- `startedAt: Date` type won't survive serialization if Zustand `persist` middleware is added — no persistence in this story [src/store/app.store.ts]
- `QueryClient` has no `retry`/`staleTime` config — default retries may cause redundant calls on 4xx [src/main.tsx]
- Store allows inconsistent slice state (e.g., `status='authenticated'` with `neurologist=null`) — no invariant enforcement; follows spec blueprint pattern [src/store/app.store.ts]

## Deferred from: code review of 1-2-application-routing-layout-shell (2026-05-28)

- `/login` route not guarded for authenticated users — Story 1.3 rewrites LoginPage and should add a loader/redirect for already-authenticated users [src/router/index.tsx:22-25]
- `setAuth(Partial<AuthSlice>)` allows incoherent auth state (e.g., `neurologist: undefined, status: 'authenticated'`) — pre-existing from Story 1.1 design; consider discriminated union in a future refactor [src/store/app.store.ts:24,36]

## Deferred from: code review of 1-3-login-logout (2026-05-28)

- `authCheckInFlight` `.finally()` timing — race benign because Zustand `setAuth` is synchronous; new callers after settlement hit `status==='authenticated'` early return [src/router/index.tsx]
- Open redirect via `apiBase` — build-time env var substitution in Vite; not a runtime injection risk; revisit if build pipeline allows untrusted env injection [src/features/auth/pages/LoginPage.tsx]
- `requireAuth` getMe/logout race — AppShell (with LogoutButton) only renders after `status==='authenticated'`; race is practically unreachable in current UX flow [src/router/index.tsx]
- `initials` empty string when `neurologist.name` is `""` — cosmetic avatar fallback only covers `null`/`undefined`, not empty string; low-priority UI polish [src/shared/components/AppShell.tsx]

## Deferred from: code review of 2-1-patient-registration-form (2026-05-29)

- `defaultValue=""` on selects without `useForm({ defaultValues })` — works correctly now (RHF reads DOM ref on submit); becomes defect if `reset()` ever added [src/features/patients/components/PatientRegistrationForm.tsx]
- `toCamel(undefined)` on non-JSON API response — error propagates to TanStack Query `mutation.error`, user sees `<ErrorMessage>`; TypeError message text may be confusing [src/services/patients.service.ts]
- Cancel during in-flight POST — no AbortController; orphaned mutation completes async, double `navigate('/patients')` is no-op in React Router v6 [src/features/patients/components/PatientRegistrationForm.tsx]
- Navigate fires before `invalidateQueries` settles — stale data flash on patients list; only observable once Story 2.2 is implemented [src/features/patients/components/PatientRegistrationForm.tsx]
- `PatientRaw` no runtime shape validation — TypeScript-only API contract, pre-existing architectural pattern [src/services/patients.service.ts]

## Deferred from: code review of 2-2-patient-list-search (2026-05-29)

- `gender` typed as unbounded `string` — no union type enforcing valid values; pre-existing from Story 2.1 design [src/features/patients/patient.types.ts]
- `baseline_ravlt/sart` may be `null` from API — TypeScript types say `number` but API may omit for new patients; silently produces `baselineRavlt: null` in Patient type [src/services/patients.service.ts]
- Cache invalidation in `useCreatePatient` fires only `onSuccess`, not `onSettled` — if `toCamel` throws post-successful POST, patient list is not refetched; pre-existing from Story 2.1 [src/features/patients/hooks/useCreatePatient.ts]
- Stale results briefly visible during 300ms debounce window when clearing search — inherent debounce UX tradeoff; not addressable without changing the debounce architecture [src/shared/hooks/useDebounce.ts]

## Deferred from: code review of 2-3-patient-profile-page (2026-05-29)

- `status ?? 'active'` fallback is dead code per TypeScript types; empty string from API passes nullish check, silently mis-classifying patient status [src/services/patients.service.ts:21]
- 401 response in `api.get` resolves `undefined as never` instead of throwing — TanStack Query treats it as success, `patient` becomes undefined, shows `<ErrorMessage error={null}>` during auth redirect [src/services/api.ts]
- `age` field could be a float from API — renders as "75.5 años" with no rounding or integer validation [src/services/patients.service.ts:17]
- `useAppStore(s => s.activeSession.sessionId)` lacks optional chaining — if `activeSession` is undefined on store initialization, accessing `.sessionId` throws TypeError [src/features/patients/pages/PatientProfilePage.tsx:18]

## Deferred from: code review of 3-1-session-lifecycle-open-close-active-banner (2026-05-29)

- `status` field on `Session` type is untyped `string` — no union type enforcing valid values; pre-existing architectural pattern [src/features/sessions/session.types.ts]
- `toSession` doesn't validate `raw.started_at` before `new Date()` — API contract assumption; Invalid Date silently propagates to banner timer [src/services/sessions.service.ts]
- Session state (sessionId, startedAt) lost on browser refresh — no persistence layer; accepted MVP limitation [src/store/app.store.ts]
- Initial `00:00:00` flicker on `ActiveSessionBanner` mount — inherent to `useState(0)` + `useEffect` pattern per spec blueprint [src/features/sessions/components/ActiveSessionBanner.tsx]
- `setInterval` clock drift over long sessions — visual only; timer recalculates from `Date.now()` wall clock on each tick [src/features/sessions/components/ActiveSessionBanner.tsx]
- `createSession` called while active session exists in store — API expected to enforce uniqueness; orphaned session risk [src/features/sessions/components/SessionOpenButton.tsx]
- `completeSession` sends `{}` as PATCH body — intentional per api.ts contract; server must accept empty body [src/services/sessions.service.ts]

## Deferred from: code review of 3-3-real-time-metrics-panel (2026-05-29)

- `patientId ?? ''` passes empty string to SessionCloseButton — spec-conformant but fragile; add early return guard when patientId is undefined [src/features/sessions/pages/SessionMonitorPage.tsx:24]
- `MLFieldDisplay` fallthrough `else` branch lacks explicit `'resolved'` guard — TypeScript-safe for current MLField union, but risks rendering `field.value` as undefined if API sends unexpected status [src/features/sessions/components/MLFieldDisplay.tsx:18]
- `RecommendationDisplay` maps API values to label/badge without fallback — unknown recommendation value renders as empty badge with `className="... undefined"` [src/features/sessions/components/RecommendationDisplay.tsx:28-35]
- `LevelMetricCard value.toFixed(2)` call site has no NaN/Infinity/undefined guard — malformed API metric field would throw or render "NaN" on screen [src/features/sessions/components/LevelMetricCard.tsx:10]
- `useSessionMetrics` hook has no `staleTime` or `refetchOnWindowFocus: false` — every window focus fires an extra metrics request alongside WebSocket-driven invalidations [src/features/sessions/hooks/useSession.ts:4-9]
- `WS_BASE_URL` undefined silently falls to polling — configuration error is indistinguishable from connectivity failure in user-facing notifications [src/features/sessions/hooks/useSessionWebSocket.ts:74]
- `encodeURIComponent` applied to `sessionId` in WS URL but not to `patientId` in navigation paths — inconsistent encoding pattern [src/features/sessions/hooks/useSessionWebSocket.ts:80]
- `DomainTag` DOMAIN_CLASS map and `MetricsPanel` METRIC_DOMAINS map share Spanish domain strings as keys with no shared constant — silent fallback to badge-gray on rename/i18n drift [src/features/sessions/components/DomainTag.tsx:1-5, src/features/sessions/components/MetricsPanel.tsx:8-14]

## Deferred from: code review of 3-2-websocket-lifecycle-session-events (2026-05-29)

- Infinite reconnect / no total retry cap across reconnect cycles — production hardening; would require new circuit-breaker logic [src/features/sessions/hooks/useSessionWebSocket.ts]
- No active-session guard in `SessionOpenButton` before creating new session — can overwrite store if second session started while first is active; tracked from Story 3.1 deferred items [src/features/sessions/components/SessionOpenButton.tsx]
- `recommendation` field unsafe cast without runtime validation — TypeScript-only contract per spec design; add Zod validation in a future hardening pass [src/services/metrics.service.ts]
- `Session.status` typed as unbounded `string` — no union type enforcing valid values; pre-existing from Story 3.1 [src/features/sessions/session.types.ts]
- `Session.startedAt` typed as `Date` but API likely returns ISO string — needs investigation of `api.get` deserializer; pre-existing architectural pattern [src/features/sessions/session.types.ts]
