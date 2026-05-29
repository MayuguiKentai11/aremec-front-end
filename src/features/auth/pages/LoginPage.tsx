export default function LoginPage() {
  const apiBase = import.meta.env.VITE_API_BASE_URL as string | undefined

  return (
    <div
      className="page"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
      }}
    >
      <div
        className="card"
        style={{ maxWidth: 360, width: '100%', textAlign: 'center' }}
      >
        <div className="logo-title" style={{ marginBottom: 4 }}>AREMEC</div>
        <div className="logo-sub" style={{ marginBottom: 28 }}>PORTAL CLÍNICO</div>
        <button
          className="btn btn-primary"
          style={{ width: '100%', marginBottom: 12 }}
          disabled={!apiBase}
          onClick={() => {
            window.location.href = `${apiBase}/auth/login`
          }}
        >
          Iniciar sesión
        </button>
        <button
          className="btn btn-ghost btn-sm"
          style={{ width: '100%' }}
          disabled={!apiBase}
          onClick={() => {
            window.location.href = `${apiBase}/auth/forgot-password`
          }}
        >
          ¿Olvidaste tu contraseña?
        </button>
      </div>
    </div>
  )
}
