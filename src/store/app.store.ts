import { create } from 'zustand'

export type Neurologist = { id: string; name: string; email: string }
type Notification = { id: string; type: string; message: string; read: boolean }

type AuthSlice = {
  neurologist: Neurologist | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
}

type ActiveSessionSlice = {
  sessionId: string | null
  startedAt: Date | null
  wsStatus: 'connected' | 'reconnecting' | 'polling' | 'disconnected'
}

type NotificationsSlice = {
  pendingSessionComplete: boolean
  items: Notification[]
}

type AppStore = {
  auth: AuthSlice
  activeSession: ActiveSessionSlice
  notifications: NotificationsSlice
  setAuth: (patch: Partial<AuthSlice>) => void
  setActiveSession: (patch: Partial<ActiveSessionSlice>) => void
  setNotifications: (patch: Partial<NotificationsSlice>) => void
  resetActiveSession: () => void
}

export const useAppStore = create<AppStore>((set) => ({
  auth: { neurologist: null, status: 'loading' },
  activeSession: { sessionId: null, startedAt: null, wsStatus: 'disconnected' },
  notifications: { pendingSessionComplete: false, items: [] },
  setAuth: (patch) => set((s) => ({ auth: { ...s.auth, ...patch } })),
  setActiveSession: (patch) =>
    set((s) => ({ activeSession: { ...s.activeSession, ...patch } })),
  setNotifications: (patch) =>
    set((s) => ({ notifications: { ...s.notifications, ...patch } })),
  resetActiveSession: () =>
    set(() => ({
      activeSession: {
        sessionId: null,
        startedAt: null,
        wsStatus: 'disconnected',
      },
    })),
}))
