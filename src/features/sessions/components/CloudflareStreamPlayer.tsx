import { useEffect, useRef, useState } from 'react'
import { Stream } from '@cloudflare/stream-react'

type Props = {
  streamId: string
}

// Single constant driving every recovery timing so the whole loop feels like
// one continuous 3s cadence: how long a frozen feed is tolerated before being
// treated as dropped, and how often a fresh embed is retried while down.
// Cloudflare's embed can go silent on a brief network blip — the iframe stays
// "playing" but stops advancing, without ever firing `onError` — so this is
// what actually catches it instead of leaving a frozen frame on screen.
const RECOVERY_INTERVAL_MS = 3000
// Polling tick for the watchdog check itself — kept well under the recovery
// interval so detection latency stays close to 3s instead of 3s + tick.
const HEALTH_CHECK_INTERVAL_MS = 500

export function CloudflareStreamPlayer({ streamId }: Props) {
  const [attempt, setAttempt] = useState(0)
  const [isLive, setIsLive] = useState(false)
  const [hasBeenLive, setHasBeenLive] = useState(false)
  const lastActivityRef = useRef(0)

  const markAlive = () => {
    lastActivityRef.current = Date.now()
  }

  const handlePlaying = () => {
    markAlive()
    setIsLive(true)
    setHasBeenLive(true)
  }

  // Force a fresh embed every RECOVERY_INTERVAL_MS while not live — this is
  // what actually recovers the feed after a drop, with no page reload required.
  useEffect(() => {
    if (!streamId.trim() || isLive) return

    const timer = setInterval(() => {
      setAttempt((n) => n + 1)
    }, RECOVERY_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [streamId, isLive])

  // Watchdog: while marked live, confirm the feed is still actually advancing.
  useEffect(() => {
    if (!isLive) return
    markAlive()

    const interval = setInterval(() => {
      if (Date.now() - lastActivityRef.current > RECOVERY_INTERVAL_MS) {
        setIsLive(false)
      }
    }, HEALTH_CHECK_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [isLive])

  if (!streamId.trim()) {
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
      {!isLive && (
        <div
          className="live-placeholder"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {hasBeenLive ? 'Reconectando con el stream…' : 'Conectando con el stream…'}
        </div>
      )}
      <Stream
        key={attempt}
        className={`live-background ${isLive ? 'is-live' : 'is-hidden'}`}
        src={streamId}
        title="Stream VR en vivo"
        autoplay
        muted
        responsive={false}
        onPlaying={handlePlaying}
        onCanPlay={markAlive}
        onTimeUpdate={markAlive}
        onProgress={markAlive}
        onError={() => setIsLive(false)}
      />

      {isLive && (
        <div className="live-badge">
          <div className="live-dot" />
          En vivo
        </div>
      )}
    </div>
  )
}
