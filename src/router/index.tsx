import { createBrowserRouter, redirect, Navigate } from 'react-router-dom'
import { useAppStore } from '../store/app.store'
import { getMe } from '../services/auth.service'
import AppShell from '../shared/components/AppShell'
import LoginPage from '../features/auth/pages/LoginPage'

async function requireAuth() {
  const { auth, setAuth } = useAppStore.getState()

  if (auth.status === 'authenticated') return null
  if (auth.status === 'unauthenticated') return redirect('/login')

  try {
    const neurologist = await getMe()
    setAuth({ neurologist, status: 'authenticated' })
    return null
  } catch {
    setAuth({ neurologist: null, status: 'unauthenticated' })
    return redirect('/login')
  }
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <AppShell />,
    loader: requireAuth,
    children: [
      { index: true, element: <Navigate to="/patients" replace /> },
      { path: 'patients', element: <div className="page"><p>Pacientes — próximamente</p></div> },
      { path: 'patients/new', element: <div className="page"><p>Nuevo paciente — próximamente</p></div> },
      { path: 'patients/:id', element: <div className="page"><p>Perfil del paciente — próximamente</p></div> },
      { path: 'patients/:id/session', element: <div className="page"><p>Monitor de sesión — próximamente</p></div> },
      { path: 'sessions/:id', element: <div className="page"><p>Detalle de sesión — próximamente</p></div> },
    ],
  },
])

export default router
