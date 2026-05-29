import { useAppStore } from '../../../store/app.store'

const STATUS_LABEL: Record<string, string> = {
  reconnecting: 'Reconectando...',
  polling: 'Actualización periódica activa',
  disconnected: 'Conexión perdida',
}

export function WsStatusIndicator() {
  const wsStatus = useAppStore((s) => s.activeSession.wsStatus)

  if (wsStatus === 'connected') return null

  return (
    <div
      className={`ws-status-indicator ws-status-${wsStatus}`}
      role="status"
      aria-live="polite"
    >
      {STATUS_LABEL[wsStatus] ?? wsStatus}
    </div>
  )
}
