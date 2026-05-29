import { useNavigate } from 'react-router-dom'
import type { Patient } from '../patient.types'

type Props = {
  patient: Patient
}

const DIAGNOSIS_LABEL: Record<string, string> = {
  EA: 'Enfermedad de Alzheimer',
  MCI: 'Deterioro Cognitivo Leve',
}

export function PatientCard({ patient }: Props) {
  const navigate = useNavigate()
  const initial = patient.name.trim()[0]?.toUpperCase() ?? '?'

  return (
    <div
      className="patient-card"
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/patients/${patient.id}`)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/patients/${patient.id}`) }}
    >
      <div className="patient-card-header">
        <div className="patient-avatar">{initial}</div>
        <div>
          <div className="patient-name">{patient.name}</div>
          <div className="patient-meta">{DIAGNOSIS_LABEL[patient.diagnosis] ?? patient.diagnosis}</div>
        </div>
        <span
          className={`badge ${patient.status === 'active' ? 'badge-green' : 'badge-gray'}`}
          style={{ marginLeft: 'auto' }}
        >
          {patient.status === 'active' ? 'Activo' : 'Inactivo'}
        </span>
      </div>
    </div>
  )
}
