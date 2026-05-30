---
baseline_commit: 64bfdf25810ef39fa7e5cd27b1a2b6429265cacd
---

# Story 3.4: Live VR Stream Embed

Status: done

## Story

As a neurologist,
I want to see the patient's live VR headset feed alongside the metrics panel,
so that I can observe the patient's in-game behavior without interrupting the immersive experience.

## Acceptance Criteria

1. **Cloudflare Stream player embedded** — Given a session is active and `SessionMonitorPage` is rendered, when `CloudflareStreamPlayer` mounts, then the Cloudflare Stream player is embedded in the session monitoring view alongside `MetricsPanel` using a 16:9 container with a pulsing "EN VIVO" badge overlay.

2. **Automatic reconnection loop — no fallback UI** — Given the Cloudflare Stream is unavailable or latency degrades, when the player detects the issue, then automatic reconnection is attempted in a loop by the Cloudflare player itself; no alternative UI (error message, spinner, placeholder text) replaces the player during reconnection.

3. **Stream resumes without neurologist interaction** — Given the stream becomes available again after a disconnect, when reconnection succeeds, then the live VR feed resumes automatically without requiring any neurologist interaction.

## Tasks / Subtasks

- [x] **Create `src/features/sessions/components/CloudflareStreamPlayer.tsx`** (AC: #1, #2, #3)
  - [x] Define module-level `CF_STREAM_BASE = 'https://iframe.videodelivery.net'` constant
  - [x] Define `Props = { streamId: string }`
  - [x] Export `CloudflareStreamPlayer({ streamId }: Props)`
  - [x] If `streamId` is falsy (empty string), render `.live-wrapper` with `.live-placeholder` text "Stream no configurado" — this guards against misconfiguration only, not the reconnection scenario
  - [x] If `streamId` is non-empty, render `.live-wrapper` containing: (a) `<iframe className="live-background">` pointing to `${CF_STREAM_BASE}/${encodeURIComponent(streamId)}/iframe?autoplay=true&muted=true` with `allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"`, `allowFullScreen`, `style={{ border: 'none' }}`, and `title="Stream VR en vivo"`; (b) `<div className="live-badge">` with `<div className="live-dot" />` and text `EN VIVO`
  - [x] Do NOT add custom reconnection logic — the Cloudflare iframe player handles reconnection natively for live streams

- [x] **Modify `src/features/sessions/pages/SessionMonitorPage.tsx`** (AC: #1)
  - [x] Add module-level constant `const CF_STREAM_ID = import.meta.env.VITE_CF_STREAM_ID as string | undefined`
  - [x] Add import `import { CloudflareStreamPlayer } from '../components/CloudflareStreamPlayer'`
  - [x] Replace the VR placeholder `.card` div (the one containing `<p>Stream VR en vivo — disponible en Story 3.4</p>`) with `<div className="card"><CloudflareStreamPlayer streamId={CF_STREAM_ID ?? ''} /></div>`
  - [x] Preserve all other existing code (imports, hooks, MetricsPanel card, WsStatusIndicator, SessionCloseButton)

- [x] **Modify `.env.example`** (AC: #1)
  - [x] Append line `VITE_CF_STREAM_ID=` after `VITE_WS_BASE_URL`

- [x] **Verify `npm run build` passes (0 TypeScript errors)**

### Review Findings

- [x] [Review][Patch] Whitespace streamId (e.g., `" "`) bypasses `!streamId` guard — renders broken Cloudflare URL silently instead of showing placeholder [src/features/sessions/components/CloudflareStreamPlayer.tsx:8]
- [x] [Review][Patch] `.env.example` missing trailing newline — file ends without `\n` after `VITE_CF_STREAM_ID=` [.env.example]
- [x] [Review][Defer] `pendingSessionComplete` not reset by `resetActiveSession` — stale toast re-appears on patient detail page after normal session close [src/shared/components/AppShell.tsx] — deferred, pre-existing
- [x] [Review][Defer] MetricsPanel TanStack Query not cancelled on session close — in-flight request may complete after unmount [src/features/sessions/components/MetricsPanel.tsx] — deferred, pre-existing

## Dev Notes

### Critical Constraints — Read Before Writing Any Code

**`erasableSyntaxOnly: true` in `tsconfig.app.json`.** No constructor parameter properties. Declare class fields explicitly. (Carry-forward from all prior stories.)

**No `fetch` in components or hooks.** All data access via service layer. `CloudflareStreamPlayer` has no data fetching — it only renders an `<iframe>`. No TanStack Query, no Zustand reads required in this component.

**Cloudflare Stream iframe approach — no npm install.** Do NOT install `@cloudflare/stream-react` or any Cloudflare SDK. The `<iframe>` embed approach requires zero new dependencies and satisfies all ACs. The Cloudflare player's native live-stream behavior handles reconnection automatically — do not build custom reconnect logic.

**Env var access pattern.** `import.meta.env.VITE_CF_STREAM_ID` is read at the module level of `SessionMonitorPage.tsx` (not inside the component). This follows the established pattern of reading env vars at the entry point and passing them as props. Do NOT read `import.meta.env` inside `CloudflareStreamPlayer.tsx` — the value comes in as a prop.

**TypeScript note for `import.meta.env`.** Cast with `as string | undefined` since `VITE_CF_STREAM_ID` is not declared in `vite-env.d.ts`. Example:
```ts
const CF_STREAM_ID = import.meta.env.VITE_CF_STREAM_ID as string | undefined
```

**No test files** — project has no test infrastructure (MVP, single developer). Do not create test files.

**Build must stay green at 0 TypeScript errors.** Run `npm run build` as final verification step.

---

### Current State of Files Being Modified

| File | Status | Current State |
|---|---|---|
| `src/features/sessions/pages/SessionMonitorPage.tsx` | MODIFY | Has a placeholder `.card` div with `<p>Stream VR en vivo — disponible en Story 3.4</p>`. Replace this entire `.card` div with `<div className="card"><CloudflareStreamPlayer streamId={CF_STREAM_ID ?? ''} /></div>`. Keep MetricsPanel card, WsStatusIndicator, and all other existing code untouched. |
| `.env.example` | MODIFY | Currently has 2 lines: `VITE_API_BASE_URL=...` and `VITE_WS_BASE_URL=...`. Append `VITE_CF_STREAM_ID=` as a third line. No value — it's a template. |
| `src/features/sessions/components/CloudflareStreamPlayer.tsx` | CREATE | Does not exist. Create from scratch. |

**What already exists (DO NOT recreate or modify in this story):**
- `src/features/sessions/components/MetricsPanel.tsx` — complete, untouched
- `src/features/sessions/components/WsStatusIndicator.tsx` — complete, untouched
- `src/features/sessions/hooks/useSessionWebSocket.ts` — complete, untouched
- `src/index.css` — already has `.live-wrapper`, `.live-background`, `.live-badge`, `.live-dot`, `.live-placeholder` classes — DO NOT add duplicate CSS

---

### Component Blueprint

#### `src/features/sessions/components/CloudflareStreamPlayer.tsx`

```tsx
const CF_STREAM_BASE = 'https://iframe.videodelivery.net'

type Props = {
  streamId: string
}

export function CloudflareStreamPlayer({ streamId }: Props) {
  if (!streamId) {
    return (
      <div className="live-wrapper">
        <div
          className="live-placeholder"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}
        >
          Stream no configurado
        </div>
      </div>
    )
  }

  return (
    <div className="live-wrapper">
      <iframe
        className="live-background"
        src={`${CF_STREAM_BASE}/${encodeURIComponent(streamId)}/iframe?autoplay=true&muted=true`}
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        style={{ border: 'none' }}
        title="Stream VR en vivo"
      />
      <div className="live-badge">
        <div className="live-dot" />
        EN VIVO
      </div>
    </div>
  )
}
```

**Why `!streamId` guard instead of crashing on empty URL:** When `VITE_CF_STREAM_ID` is not set in `.env.local`, `CF_STREAM_ID` is `undefined`. `undefined ?? ''` produces `''`. An empty string would generate the malformed URL `https://iframe.videodelivery.net//iframe` which shows a Cloudflare 404 in the iframe. The guard prevents this misconfiguration from showing a confusing browser error to the neurologist. It does NOT apply to the reconnection scenario — when the stream ID is configured and the stream is temporarily unavailable, Cloudflare's player loops automatically.

**Why no custom reconnect logic:** Cloudflare's live stream iframe player natively polls the live input and reconnects in a loop when the stream is unavailable. This is built into the Cloudflare player at the CDN level. Adding a custom `setInterval` or key-reset trick would create duplicate reconnect cycles and could interfere with the player's internal state machine.

---

#### `src/features/sessions/pages/SessionMonitorPage.tsx` — Modified

```tsx
import { useParams, Navigate } from 'react-router-dom'
import { useAppStore } from '../../../store/app.store'
import { SessionCloseButton } from '../components/SessionCloseButton'
import { WsStatusIndicator } from '../components/WsStatusIndicator'
import { MetricsPanel } from '../components/MetricsPanel'
import { CloudflareStreamPlayer } from '../components/CloudflareStreamPlayer'
import { useSessionWebSocket } from '../hooks/useSessionWebSocket'

const CF_STREAM_ID = import.meta.env.VITE_CF_STREAM_ID as string | undefined

export default function SessionMonitorPage() {
  const { id: patientId } = useParams<{ id: string }>()
  const sessionId = useAppStore((s) => s.activeSession.sessionId)

  // MUST be called before any conditional return (React hooks rules)
  useSessionWebSocket(sessionId ?? '')

  if (!sessionId) return <Navigate to={`/patients/${patientId ?? ''}`} replace />

  return (
    <div className="page">
      <WsStatusIndicator />
      <div className="section-header">
        <h1 className="page-title">Monitor de sesión</h1>
        <SessionCloseButton sessionId={sessionId} patientId={patientId ?? ''} />
      </div>
      <div className="card" style={{ marginBottom: 24 }}>
        <MetricsPanel sessionId={sessionId} />
      </div>
      <div className="card">
        <CloudflareStreamPlayer streamId={CF_STREAM_ID ?? ''} />
      </div>
    </div>
  )
}
```

**Important:** The `CF_STREAM_ID` constant is declared at module level (outside the component function), not inside. This is consistent with how `VITE_API_BASE_URL` is accessed in `api.ts` — env vars read at the module boundary, not per-render.

---

### Existing CSS Classes to Reuse (DO NOT redefine)

All these classes already exist in `src/index.css` (around line 692 — the `/* ── LIVE STREAM ──` section):

| Class | Purpose |
|---|---|
| `.live-wrapper` | 16:9 aspect ratio container; `position: relative; overflow: hidden; border-radius: var(--radius); border: 1px solid var(--border); background-color: #000` |
| `.live-background` | Absolute fill element: `position: absolute; top:0; left:0; width:100%; height:100%; z-index: 0` — designed for img/video/iframe filling the wrapper |
| `.live-badge` | Absolute overlay badge: top-left, red background, pulsing animation via `@keyframes pulse-badge`, `z-index: 2` |
| `.live-dot` | White 7px circle inside the badge |
| `.live-placeholder` | Mono font, `var(--text3)` color, 13px — used for centered "not configured" text |

**Do NOT add any new CSS for this story.** All required visual styles already exist.

---

### Cloudflare Stream URL Format

For live inputs (the VR headset stream):
```
https://iframe.videodelivery.net/{liveInputUID}/iframe?autoplay=true&muted=true
```

- `{liveInputUID}` — the Cloudflare live input UID (from `VITE_CF_STREAM_ID`)
- `autoplay=true` — starts playing immediately when stream comes online
- `muted=true` — required for autoplay in most browsers; VR session audio is not needed in the portal
- The Cloudflare player shows a dark buffering state when the stream is offline and continuously polls until the headset goes live — this is the native reconnection loop satisfying AC2 and AC3

**Do NOT use** `https://customer-*.cloudflarestream.com/...` (account-specific subdomain) — the `videodelivery.net` domain is the canonical iframe embed URL that works without per-account configuration.

---

### Edge Cases

**`streamId` is empty string (misconfiguration):** `!streamId` is `true` for `''`. Component renders `.live-placeholder` text "Stream no configurado". This is the only scenario where the player UI is replaced — it is NOT triggered during reconnection (when a valid streamId is set, the iframe always renders).

**VR headset not yet streaming when neurologist opens the monitor page:** The Cloudflare iframe shows a dark buffering/loading state internally. No error is surfaced to the neurologist. When the headset starts the stream, the player transitions to live video automatically — satisfying AC3.

**Rapid session open/close:** `SessionMonitorPage` unmounts when session closes (Navigate redirect fires). The iframe is destroyed cleanly on unmount — no lingering connections.

**16:9 aspect ratio in card layout:** `.live-wrapper` uses `aspect-ratio: 16/9`. Inside a `.card` (which has `width: 100%` by default), the player will expand to full card width and constrain its height to 16:9. This is correct for a VR headset stream.

**`object-fit: cover` on iframe:** `.live-background` sets `object-fit: cover` which is a no-op on `<iframe>` elements (it only applies to replaced content elements like `<img>` and `<video>`). The `width:100%; height:100%` with absolute positioning is what actually fills the container for the iframe — correct behavior regardless.

---

### Project Structure for This Story

```
src/
  features/
    sessions/
      components/
        CloudflareStreamPlayer.tsx    ← NEW: Cloudflare live stream iframe embed
        MetricsPanel.tsx              ← no change
        WsStatusIndicator.tsx         ← no change
        (all other components)        ← no change
      pages/
        SessionMonitorPage.tsx        ← MODIFY: add CF_STREAM_ID + CloudflareStreamPlayer import + replace placeholder
.env.example                          ← MODIFY: add VITE_CF_STREAM_ID= line
```

**Do NOT create for this story:**
- Any test files — no test infrastructure
- Any new service files — no API calls in this component
- Any Zustand store changes — streamId is not session state
- Any new CSS — all styles exist in `src/index.css`

---

### Cross-Story Awareness

**What this story completes:** Epic 3 is now functionally complete after this story. All FRs in Epic 3 are covered:
- FR-4.5 (VR stream embed) — this story
- FR-4.6 (WS reconnect + polling fallback) — Story 3.2 ✓
- FR-5.1–5.3 (metrics panel, domain tags, recommendation) — Story 3.3 ✓

**What Epic 4 will need from this codebase:**
- `SessionMonitorPage` is complete — Epic 4 stories touch `PatientProfilePage` tabs (Historial) and new `analytics/` feature components
- `MetricsPanel` components (MLFieldDisplay, DomainTag, LevelMetricCard, RecommendationDisplay) are reusable in `MetricDetailTable` (Story 4.3)

**Previous story learnings (from Story 3.3 review):**
- `SessionCompletionToast` was incorrectly placed in both `AppShell` and `SessionMonitorPage` → double-mount bug. **Fixed in Story 3.3.** The current `SessionMonitorPage.tsx` no longer imports `SessionCompletionToast` — do NOT add it back.
- All `SessionCompletionToast` rendering is owned by `AppShell.tsx` only.

---

### References

- Acceptance criteria source: [epics.md — Story 3.4](_bmad-output/planning-artifacts/epics.md)
- FR-4.5: "Live VR view streaming is delivered via Cloudflare Stream. The frontend embeds the Cloudflare Stream player. When the stream is unavailable, the player attempts automatic reconnection in a loop with no alternative UI fallback." [epics.md — Functional Requirements]
- Architecture — component list: `CloudflareStreamPlayer.tsx` ← FR-4.5 [architecture.md — Project Structure]
- Architecture — env vars: `VITE_CF_STREAM_ID` not in original spec but consistent with `VITE_API_BASE_URL` / `VITE_WS_BASE_URL` pattern [architecture.md — Data Flow]
- Architecture — anti-patterns: "no `fetch` in components" — CloudflareStreamPlayer has no fetch calls; all data is in the iframe src URL [architecture.md — Enforcement Guidelines]
- Existing CSS: `.live-wrapper`, `.live-background`, `.live-badge`, `.live-dot`, `.live-placeholder` [src/index.css ~line 692]
- Current SessionMonitorPage: [src/features/sessions/pages/SessionMonitorPage.tsx](src/features/sessions/pages/SessionMonitorPage.tsx) — replace VR placeholder `.card` only
- Previous story: [3-3-real-time-metrics-panel.md](_bmad-output/implementation-artifacts/3-3-real-time-metrics-panel.md) — SessionCompletionToast double-mount fix, all component blueprints

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Claude Code, bmad-dev-story workflow)

### Debug Log References

- `npm run build` → `tsc -b && vite build` completed with 0 TypeScript errors; 194 modules transformed, built in 322ms.

### Completion Notes List

- **AC #1 (Cloudflare Stream player embedded):** Created `CloudflareStreamPlayer.tsx` rendering a 16:9 `.live-wrapper` with the Cloudflare iframe (`https://iframe.videodelivery.net/{id}/iframe?autoplay=true&muted=true`) and a pulsing `EN VIVO` badge overlay. Wired into `SessionMonitorPage.tsx` alongside the existing `MetricsPanel` card, replacing the Story 3.4 placeholder. Reused existing `.live-*` CSS in `src/index.css` — no new CSS added.
- **AC #2 (automatic reconnection, no fallback UI):** No custom reconnect logic added. The Cloudflare iframe player handles the live-input reconnection loop natively; when a valid `streamId` is set the iframe always renders (no spinner/error/placeholder substitution during reconnection).
- **AC #3 (stream resumes without interaction):** Cloudflare's native player polls the live input and resumes automatically; nothing in the component requires neurologist interaction.
- **Misconfiguration guard:** `streamId === ''` (env var unset) renders `.live-placeholder` "Stream no configurado" to avoid a malformed `//iframe` URL and a confusing Cloudflare 404. This guard does not fire during reconnection.
- **Env var pattern:** `VITE_CF_STREAM_ID` read at module level in `SessionMonitorPage.tsx` (cast `as string | undefined`, not declared in `vite-env.d.ts`) and passed as a prop; the component never reads `import.meta.env`. Added `VITE_CF_STREAM_ID=` template line to `.env.example`.
- **No tests:** Project has no test infrastructure (MVP, single developer) — none created, per Dev Notes.

### File List

- `src/features/sessions/components/CloudflareStreamPlayer.tsx` (new)
- `src/features/sessions/pages/SessionMonitorPage.tsx` (modified)
- `.env.example` (modified)

## Change Log

| Date | Change |
|---|---|
| 2026-05-29 | Story 3.4 implemented: added `CloudflareStreamPlayer` (Cloudflare Stream iframe embed with EN VIVO badge), wired into `SessionMonitorPage` replacing the VR placeholder, added `VITE_CF_STREAM_ID` to `.env.example`. Build green (0 TS errors). Status → review. |
