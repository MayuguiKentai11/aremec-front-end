export default function LoginPage() {
  const apiBase = import.meta.env.VITE_API_BASE_URL as string | undefined

  return (
    <div className="login-page">
      <div className="login-bg" />
      <div className="login-card" style={{ textAlign: 'center' }}>
        <img src="/aremec_logo.png" alt="Logo de AREMEC" className="login-logo-mark" />
        <div className="login-logo">
          <span className="wm-ink">ARE</span><span className="wm-gray">MEC</span>
        </div>
        <div className="login-sub">PORTAL CLÍNICO</div>
        <div className="login-form">
          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={!apiBase}
            onClick={() => {
              window.location.href = `${apiBase}/auth/login`
            }}
          >
            Iniciar sesión
          </button>
        </div>
      </div>
    </div>
  )
}
