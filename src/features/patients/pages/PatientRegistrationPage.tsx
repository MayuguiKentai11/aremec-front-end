import { PatientRegistrationForm } from '../components/PatientRegistrationForm'

export default function PatientRegistrationPage() {
  return (
    <div className="page">
      <div className="page-title">Registrar paciente</div>
      <div className="card">
        <PatientRegistrationForm />
      </div>
    </div>
  )
}
