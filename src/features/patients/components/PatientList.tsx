import { useNavigate } from 'react-router-dom'
import type { Patient } from '../patient.types'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'

type Props = {
  patients: Patient[] | undefined
  isPending: boolean
  error: unknown
}

const DIAGNOSIS_LABEL: Record<string, string> = {
  EA: 'Enfermedad de Alzheimer',
  MCI: 'Deterioro Cognitivo Leve',
}

export function PatientList({ patients, isPending, error }: Props) {
  const navigate = useNavigate()

  if (isPending) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />
  if (!patients || patients.length === 0) {
    return <EmptyState message="No se encontraron pacientes." />
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Paciente</th>
              <th>Diagnóstico</th>
              <th>Edad</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p.id} onClick={() => navigate(`/patients/${p.id}`)}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="patient-avatar" style={{ width: 34, height: 34, fontSize: 12 }}>
                      {p.name.trim()[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                  </div>
                </td>
                <td style={{ fontSize: 12, color: 'var(--text2)' }}>
                  {DIAGNOSIS_LABEL[p.diagnosis] ?? p.diagnosis}
                </td>
                <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{p.age} años</td>
                <td>
                  <span className={`badge ${p.status === 'active' ? 'badge-green' : 'badge-gray'}`}>
                    {p.status === 'active' ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => navigate(`/patients/${p.id}`)}
                  >
                    Dashboard
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
