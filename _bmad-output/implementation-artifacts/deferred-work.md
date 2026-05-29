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
