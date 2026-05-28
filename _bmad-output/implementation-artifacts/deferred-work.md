# Deferred Work

## Deferred from: code review of 1-1-project-foundation-infrastructure (2026-05-28)

- No `/login` route in router stub — intentional, Story 1.3 will add it [src/router/index.tsx]
- No DELETE/PUT methods on `api` object — future story requirement [src/services/api.ts]
- `LoadingSpinner` has no visual animation — AC-5 criterion met ("no TS errors"); visual polish deferred [src/shared/components/LoadingSpinner.tsx]
- `startedAt: Date` type won't survive serialization if Zustand `persist` middleware is added — no persistence in this story [src/store/app.store.ts]
- `QueryClient` has no `retry`/`staleTime` config — default retries may cause redundant calls on 4xx [src/main.tsx]
- Store allows inconsistent slice state (e.g., `status='authenticated'` with `neurologist=null`) — no invariant enforcement; follows spec blueprint pattern [src/store/app.store.ts]
