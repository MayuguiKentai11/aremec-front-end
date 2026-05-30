import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAppStore } from '../../../store/app.store'
import { usePatient } from '../hooks/usePatient'
import { SessionOpenButton } from '../../sessions/components/SessionOpenButton'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { PatientDashboard } from '../../analytics/components/PatientDashboard'
import { TrendChart } from '../../analytics/components/TrendChart'
import { SessionFilter } from '../../analytics/components/SessionFilter'
import { SessionHistory } from '../../analytics/components/SessionHistory'

type Tab = 'resumen' | 'historial' | 'sesion-activa'

const DIAGNOSIS_LABEL: Record<string, string> = {
  EA: 'Enfermedad de Alzheimer',
  MCI: 'Deterioro Cognitivo Leve',
}

export default function PatientProfilePage() {
  const { id } = useParams<{ id: string }>()
  const activePatientId = useAppStore(s => s.activeSession.patientId)
  const showSessionTab = activePatientId === id

  const [activeTab, setActiveTab] = useState<Tab>('resumen')
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)

  const { data: patient, isPending, error } = usePatient(id ?? '')

  useEffect(() => {
    setActiveTab('resumen')
  }, [id])

  // Reset filter when navigating between patients:
  useEffect(() => {
    setSelectedSessionId(null)
  }, [id])

  useEffect(() => {
    if (!showSessionTab) {
      setActiveTab(prev => prev === 'sesion-activa' ? 'resumen' : prev)
    }
  }, [showSessionTab])

  if (!id) return <ErrorMessage error={new Error('Ruta inválida: falta el ID del paciente')} />
  if (isPending) return <LoadingSpinner />
  if (!patient) return <ErrorMessage error={error ?? new Error('Paciente no encontrado')} />

  return (
    <div className="page">
      {error && <ErrorMessage error={error} />}
      <div className="section-header">
        <h1 className="page-title">{patient.name}</h1>
      </div>

      <div className="tabs">
        <button
          className={`tab${activeTab === 'resumen' ? ' active' : ''}`}
          onClick={() => setActiveTab('resumen')}
        >
          Resumen
        </button>
        <button
          className={`tab${activeTab === 'historial' ? ' active' : ''}`}
          onClick={() => setActiveTab('historial')}
        >
          Historial
        </button>
        {showSessionTab && (
          <button
            className={`tab${activeTab === 'sesion-activa' ? ' active' : ''}`}
            onClick={() => setActiveTab('sesion-activa')}
          >
            Sesión activa
          </button>
        )}
      </div>

      {activeTab === 'resumen' && (
        <div>
          <div className="card" style={{ maxWidth: 520, marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <div className="card-label">NOMBRE</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{patient.name}</div>
              </div>
              <div>
                <div className="card-label">EDAD</div>
                <div style={{ fontSize: 15 }}>{patient.age} años</div>
              </div>
              <div>
                <div className="card-label">DIAGNÓSTICO</div>
                <div style={{ fontSize: 13 }}>
                  {DIAGNOSIS_LABEL[patient.diagnosis] ?? patient.diagnosis}
                </div>
              </div>
              <div>
                <div className="card-label">ESTADO</div>
                <span className={`badge ${patient.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                  {patient.status === 'active' ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div>
                <div className="card-label">RAVLT LÍNEA BASE</div>
                <div className="card-sub" style={{ fontSize: 13 }}>{patient.baselineRavlt}</div>
              </div>
              <div>
                <div className="card-label">SART LÍNEA BASE</div>
                <div className="card-sub" style={{ fontSize: 13 }}>{patient.baselineSart}</div>
              </div>
            </div>
          </div>
          <SessionOpenButton patientId={patient.id} />
        </div>
      )}

      {activeTab === 'historial' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <TrendChart patientId={id} />
          <SessionFilter
            patientId={id}
            selectedSessionId={selectedSessionId}
            onSelect={setSelectedSessionId}
          />
          <PatientDashboard patientId={id} selectedSessionId={selectedSessionId} />
          <SessionHistory patientId={id} />
        </div>
      )}

      {activeTab === 'sesion-activa' && (
        <div className="card">
          <p style={{ color: 'var(--text2)', fontSize: 13 }}>
            Monitoreo de sesión activa — disponible en Epic 3
          </p>
        </div>
      )}
    </div>
  )
}
