import { useAppStore } from '../../../store/app.store'

export function SessionCompletionToast() {
  const pendingSessionComplete = useAppStore(
    (s) => s.notifications.pendingSessionComplete
  )
  const setNotifications = useAppStore((s) => s.setNotifications)

  if (!pendingSessionComplete) return null

  return (
    <div className="session-completion-toast" role="alert">
      <span>La sesión ha finalizado. Revise los resultados del paciente.</span>
      <button
        className="btn btn-sm btn-ghost"
        onClick={() => setNotifications({ pendingSessionComplete: false })}
      >
        Cerrar
      </button>
    </div>
  )
}
