import { useState, useEffect } from 'react'
import { useAppStore } from '../../../store/app.store'

function formatElapsed(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

export function ActiveSessionBanner() {
  const sessionId = useAppStore((s) => s.activeSession.sessionId)
  const startedAt = useAppStore((s) => s.activeSession.startedAt)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!startedAt || isNaN(startedAt.getTime())) {
      setElapsed(0)
      return
    }
    setElapsed(Math.max(0, Math.floor((Date.now() - startedAt.getTime()) / 1000)))
    const id = setInterval(() => {
      setElapsed(Math.max(0, Math.floor((Date.now() - startedAt.getTime()) / 1000)))
    }, 1000)
    return () => clearInterval(id)
  }, [startedAt])

  if (!sessionId || !startedAt) return null
  return (
    <div className="active-session-banner">
      Sesión activa — {formatElapsed(elapsed)}
    </div>
  )
}
