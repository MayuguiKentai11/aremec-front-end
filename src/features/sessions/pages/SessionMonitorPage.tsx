import { useParams, Navigate } from 'react-router-dom'
import { useAppStore } from '../../../store/app.store'
import { usePatient } from '../../patients/hooks/usePatient'
import { SessionCloseButton } from '../components/SessionCloseButton'
import { WsStatusIndicator } from '../components/WsStatusIndicator'
import { MetricsPanel } from '../components/MetricsPanel'
import { CloudflareStreamPlayer } from '../components/CloudflareStreamPlayer'
import { useSessionWebSocket } from '../hooks/useSessionWebSocket'

const CF_STREAM_ID = import.meta.env.VITE_CF_STREAM_ID as string | undefined

const DIAGNOSIS_LABEL: Record<string, string> = {
  EA: 'Enfermedad de Alzheimer',
  MCI: 'Deterioro Cognitivo Leve',
}

export default function SessionMonitorPage() {
  const { id: patientId } = useParams<{ id: string }>()
  const sessionId = useAppStore((s) => s.activeSession.sessionId)

  // MUST be called before any conditional return (React hooks rules)
  useSessionWebSocket(sessionId ?? '')
  const { data: patient } = usePatient(patientId ?? '')

  if (!sessionId) return <Navigate to={`/patients/${patientId ?? ''}`} replace />

  return (
    <div className="page">
      <WsStatusIndicator />
      <div className="section-header">
        <h1 className="page-title">Monitor de sesión</h1>
        <SessionCloseButton sessionId={sessionId} patientId={patientId ?? ''} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20, marginBottom: 20 }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <CloudflareStreamPlayer streamId={CF_STREAM_ID ?? ''} />
        </div>
        <div className="card">
          <div className="card-label">PACIENTE EN SESIÓN</div>
          {patient ? (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div className="patient-avatar" style={{ width: 44, height: 44, fontSize: 15 }}>
                  {patient.name.trim()[0]?.toUpperCase() ?? '?'}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{patient.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', fontFamily: 'var(--mono)', marginTop: 2 }}>
                    {DIAGNOSIS_LABEL[patient.diagnosis] ?? patient.diagnosis}
                  </div>
                </div>
              </div>
              <span className={`badge ${patient.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                {patient.status === 'active' ? 'Activo' : 'Inactivo'}
              </span>

              <dl className="patient-data-list">
                <div className="patient-data-row">
                  <dt>Edad</dt>
                  <dd>{patient.age} años</dd>
                </div>
                <div className="patient-data-row">
                  <dt>Género</dt>
                  <dd>{patient.gender}</dd>
                </div>
                <div className="patient-data-row">
                  <dt>Diagnóstico</dt>
                  <dd>{DIAGNOSIS_LABEL[patient.diagnosis] ?? patient.diagnosis}</dd>
                </div>
                <div className="patient-data-row">
                  <dt>RAVLT (basal)</dt>
                  <dd>{patient.baselineRavlt}</dd>
                </div>
                <div className="patient-data-row">
                  <dt>SART (basal)</dt>
                  <dd>{patient.baselineSart}</dd>
                </div>
              </dl>
            </div>
          ) : (
            <div style={{ color: 'var(--text3)', fontSize: 12, fontFamily: 'var(--mono)', marginTop: 8 }}>
              Cargando paciente…
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <MetricsPanel sessionId={sessionId} />
      </div>
    </div>
  )
}
