import { createBrowserRouter, redirect, Navigate } from 'react-router-dom'
import { useAppStore } from '../store/app.store'
import { getMe } from '../services/auth.service'
import AppShell from '../shared/components/AppShell'
import LoginPage from '../features/auth/pages/LoginPage'
import PatientRegistrationPage from '../features/patients/pages/PatientRegistrationPage'
import PatientListPage from '../features/patients/pages/PatientListPage'
import PatientProfilePage from '../features/patients/pages/PatientProfilePage'
import SessionMonitorPage from '../features/sessions/pages/SessionMonitorPage'
import SessionDetailPage from '../features/sessions/pages/SessionDetailPage'

let authCheckInFlight: Promise<Response | null> | null = null

async function redirectIfAuthenticated() {
  const { auth } = useAppStore.getState()
  if (auth.status === 'authenticated') return redirect('/patients')
  if (auth.status === 'unauthenticated') return null

  try {
    const neurologist = await getMe()
    useAppStore.getState().setAuth({ neurologist, status: 'authenticated' })
    return redirect('/patients')
  } catch {
    useAppStore.getState().setAuth({ neurologist: null, status: 'unauthenticated' })
    return null
  }
}

async function requireAuth() {
  const { auth } = useAppStore.getState()

  if (auth.status === 'authenticated') return null
  if (auth.status === 'unauthenticated') return redirect('/login')

  if (!authCheckInFlight) {
    authCheckInFlight = getMe()
      .then((neurologist) => {
        useAppStore.getState().setAuth({ neurologist, status: 'authenticated' })
        return null
      })
      .catch(() => {
        useAppStore.getState().setAuth({ neurologist: null, status: 'unauthenticated' })
        return redirect('/login')
      })
      .finally(() => { authCheckInFlight = null })
  }
  return authCheckInFlight
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
    loader: redirectIfAuthenticated,
  },
  {
    path: '/',
    element: <AppShell />,
    loader: requireAuth,
    children: [
      { index: true, element: <Navigate to="/patients" replace /> },
      { path: 'patients', element: <PatientListPage /> },
      { path: 'patients/new', element: <PatientRegistrationPage /> },
      { path: 'patients/:id', element: <PatientProfilePage /> },
      { path: 'patients/:id/session', element: <SessionMonitorPage /> },
      { path: 'sessions/:id', element: <SessionDetailPage /> },
    ],
  },
])

export default router
