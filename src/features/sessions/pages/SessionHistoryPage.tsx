import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePatients } from '../../patients/hooks/usePatients'
import { useSessionHistory } from '../../analytics/hooks/useSessionHistory'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { EmptyState } from '../../../shared/components/EmptyState'
import { formatDate } from '../../../shared/utils/format'

export default function SessionHistoryPage() {
  const navigate = useNavigate()
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const { data: patients, isPending: loadingPatients } = usePatients()
  const { data: sessions, isPending: loadingSessions, error } = useSessionHistory(selectedPatientId)

  return (
    <div className="page">
      <div className="search-row">
        <select
          className="input"
          style={{ width: 280 }}
          aria-label="Seleccionar paciente"
          value={selectedPatientId}
          onChange={(e) => setSelectedPatientId(e.target.value)}
        >
          <option value="">Selecciona un paciente…</option>
          {!loadingPatients && patients?.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {!selectedPatientId && (
        <EmptyState message="Selecciona un paciente para ver su historial de sesiones" />
      )}

      {selectedPatientId && loadingSessions && <LoadingSpinner />}
      {selectedPatientId && error && <ErrorMessage error={error} />}
      {selectedPatientId && !loadingSessions && !error && sessions && sessions.length === 0 && (
        <EmptyState message="Sin sesiones registradas para este paciente" />
      )}

      {selectedPatientId && !loadingSessions && !error && sessions && sessions.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>FECHA</th>
                  <th>ESTADO</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr
                    key={s.sessionId}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/sessions/${s.sessionId}`, { state: { patientId: selectedPatientId } })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        navigate(`/sessions/${s.sessionId}`, { state: { patientId: selectedPatientId } })
                      }
                    }}
                  >
                    <td>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>
                        {formatDate(s.sessionDate, { dateStyle: 'medium' })}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${s.status === 'complete' ? 'badge-green' : 'badge-warn'}`}>
                        {s.status === 'complete' ? 'Completada' : 'Incompleta'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
