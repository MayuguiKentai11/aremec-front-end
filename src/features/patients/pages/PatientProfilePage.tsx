import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAppStore } from '../../../store/app.store'
import { usePatient } from '../hooks/usePatient'
import { SessionOpenButton } from '../../sessions/components/SessionOpenButton'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { usePatientSessions } from '../../analytics/hooks/usePatientSessions'
import { KpiStrip } from '../../analytics/components/KpiStrip'
import { SpsTrendChart } from '../../analytics/components/SpsTrendChart'
import { CognitiveDomainPanel } from '../../analytics/components/CognitiveDomainPanel'
import { RecommendationDistribution } from '../../analytics/components/RecommendationDistribution'
import { DashboardFilters } from '../../analytics/components/DashboardFilters'
import { SessionTable } from '../../analytics/components/SessionTable'
import { applySessionFilters, DEFAULT_FILTERS, type SessionFilters } from '../../analytics/analytics.filters'

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
  const [filters, setFilters] = useState<SessionFilters>(DEFAULT_FILTERS)

  // Reset tab + filters when navigating between patients (render-phase pattern,
  // see "You Might Not Need an Effect").
  const [prevId, setPrevId] = useState(id)
  if (id !== prevId) {
    setPrevId(id)
    setActiveTab('resumen')
    setFilters(DEFAULT_FILTERS)
  }

  // Derive the visible tab so a closed active session never leaves us stranded.
  const effectiveTab: Tab =
    activeTab === 'sesion-activa' && !showSessionTab ? 'resumen' : activeTab

  const { data: patient, isPending, error } = usePatient(id ?? '')
  const sessions = usePatientSessions(id ?? '')

  if (!id) return <ErrorMessage error={new Error('Ruta inválida: falta el ID del paciente')} />
  if (isPending) return <LoadingSpinner />
  if (!patient) return <ErrorMessage error={error ?? new Error('Paciente no encontrado')} />

  const initials = patient.name?.trim()
    ? patient.name.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const filteredRows = applySessionFilters(sessions.rows, filters)

  return (
    <div className="page">
      {error && <ErrorMessage error={error} />}

      <div className="card patient-header">
        <div className="patient-avatar patient-avatar-lg">{initials}</div>
        <div className="patient-header-info">
          <div className="patient-header-name">{patient.name}</div>
          <div className="patient-header-meta">
            <span className="mono-muted">{patient.age} años</span>
            <span className="mono-muted">·</span>
            <span className="meta-muted">{DIAGNOSIS_LABEL[patient.diagnosis] ?? patient.diagnosis}</span>
            <span className={`badge ${patient.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
              {patient.status === 'active' ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab${effectiveTab === 'resumen' ? ' active' : ''}`}
          onClick={() => setActiveTab('resumen')}
        >
          Resumen
        </button>
        <button
          className={`tab${effectiveTab === 'historial' ? ' active' : ''}`}
          onClick={() => setActiveTab('historial')}
        >
          Historial
        </button>
        {showSessionTab && (
          <button
            className={`tab${effectiveTab === 'sesion-activa' ? ' active' : ''}`}
            onClick={() => setActiveTab('sesion-activa')}
          >
            Sesión activa
          </button>
        )}
      </div>

      {effectiveTab === 'resumen' && (
        <div className="dashboard-grid">
          {sessions.error && <ErrorMessage error={sessions.error} />}

          <KpiStrip
            rows={sessions.rows}
            globalTrend={sessions.globalTrend}
            trendSlope={sessions.trendSlope}
          />

          <SpsTrendChart rows={sessions.rows} globalTrend={sessions.globalTrend} />

          <div className="dashboard-two-col">
            <CognitiveDomainPanel rows={sessions.rows} />
            <RecommendationDistribution rows={sessions.rows} />
          </div>

          <div className="card">
            <div className="card-label" style={{ marginBottom: 16 }}>FICHA CLÍNICA</div>
            <div className="clinical-grid">
              <div>
                <div className="card-label">DIAGNÓSTICO</div>
                <div className="clinical-value">{DIAGNOSIS_LABEL[patient.diagnosis] ?? patient.diagnosis}</div>
              </div>
              <div>
                <div className="card-label">ESTADO</div>
                <span className={`badge ${patient.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                  {patient.status === 'active' ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div>
                <div className="card-label">RAVLT LÍNEA BASE</div>
                <div className="clinical-value mono">{patient.baselineRavlt}</div>
              </div>
              <div>
                <div className="card-label">SART LÍNEA BASE</div>
                <div className="clinical-value mono">{patient.baselineSart}</div>
              </div>
            </div>
          </div>

          <SessionOpenButton patientId={patient.id} />
        </div>
      )}

      {effectiveTab === 'historial' && (
        <div className="dashboard-grid">
          {sessions.error && <ErrorMessage error={sessions.error} />}
          {sessions.isPending
            ? <LoadingSpinner />
            : (
              <>
                <DashboardFilters
                  filters={filters}
                  onChange={setFilters}
                  resultCount={filteredRows.length}
                  totalCount={sessions.rows.length}
                />
                <SessionTable rows={filteredRows} patientId={id} />
              </>
            )}
        </div>
      )}

      {effectiveTab === 'sesion-activa' && (
        <div className="card">
          <p className="meta-muted">Monitoreo de sesión activa — disponible en Epic 3</p>
        </div>
      )}
    </div>
  )
}
