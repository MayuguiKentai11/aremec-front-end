import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '../../../store/app.store'

const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL as string
const WS_MAX_RETRIES = 3
const WS_BASE_DELAY_MS = 1000

type WsRawEvent =
  | {
      type: 'level_completed'
      level: number
      sps_class: string | null
      recommendation: string | null
    }
  | { type: 'session_completed' }

export function useSessionWebSocket(sessionId: string): void {
  const queryClient = useQueryClient()
  const setActiveSession = useAppStore((s) => s.setActiveSession)
  const setNotifications = useAppStore((s) => s.setNotifications)

  useEffect(() => {
    if (!sessionId) return

    let destroyed = false
    let ws: WebSocket | null = null
    let retries = 0
    let retryTimer: ReturnType<typeof setTimeout> | null = null
    let pollInterval: ReturnType<typeof setInterval> | null = null

    function stopPolling() {
      if (pollInterval !== null) {
        clearInterval(pollInterval)
        pollInterval = null
      }
    }

    function startPolling() {
      stopPolling()
      setActiveSession({ wsStatus: 'polling' })
      pollInterval = setInterval(() => {
        queryClient.invalidateQueries({
          queryKey: ['session', sessionId, 'metrics'],
        })
      }, 5000)
      const { notifications } = useAppStore.getState()
      setNotifications({
        items: [
          ...notifications.items,
          {
            id: crypto.randomUUID(),
            type: 'connectivity_failed',
            message:
              'No se pudo restablecer la conexión en tiempo real. Los datos se actualizarán cada 5 segundos.',
            read: false,
          },
        ],
      })
    }

    function connect() {
      if (destroyed) return
      ws = new WebSocket(`${WS_BASE_URL}/sessions/${sessionId}/stream`)

      ws.onopen = () => {
        if (destroyed) return
        retries = 0
        setActiveSession({ wsStatus: 'connected' })
      }

      ws.onmessage = (event: MessageEvent) => {
        if (destroyed) return
        try {
          const data = JSON.parse(event.data as string) as WsRawEvent
          if (data.type === 'level_completed') {
            queryClient.invalidateQueries({
              queryKey: ['session', sessionId, 'metrics'],
            })
            setActiveSession({ currentLevel: data.level })
          } else if (data.type === 'session_completed') {
            setNotifications({ pendingSessionComplete: true })
          }
        } catch {
          // malformed message — ignore
        }
      }

      ws.onerror = () => {
        // onclose fires after onerror — all reconnect logic lives there
      }

      ws.onclose = () => {
        ws = null
        if (destroyed) return
        if (retries < WS_MAX_RETRIES) {
          const delay = WS_BASE_DELAY_MS * 2 ** retries
          retries++
          setActiveSession({ wsStatus: 'reconnecting' })
          retryTimer = setTimeout(connect, delay)
        } else {
          startPolling()
        }
      }
    }

    connect()

    return () => {
      destroyed = true
      if (retryTimer !== null) {
        clearTimeout(retryTimer)
        retryTimer = null
      }
      stopPolling()
      if (ws !== null) {
        ws.onclose = null // prevent reconnect on intentional close
        ws.close()
        ws = null
      }
      setActiveSession({ wsStatus: 'disconnected' })
    }
  }, [sessionId, queryClient, setActiveSession, setNotifications])
}
