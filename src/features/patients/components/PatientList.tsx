import type { Patient } from '../patient.types'
import { PatientCard } from './PatientCard'
import { EmptyState } from '../../../shared/components/EmptyState'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'

type Props = {
  patients: Patient[] | undefined
  isPending: boolean
  error: unknown
}

export function PatientList({ patients, isPending, error }: Props) {
  if (isPending) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />
  if (!patients || patients.length === 0) {
    return <EmptyState message="No se encontraron pacientes." />
  }

  return (
    <div className="patients-grid">
      {patients.map((patient) => (
        <PatientCard key={patient.id} patient={patient} />
      ))}
    </div>
  )
}
