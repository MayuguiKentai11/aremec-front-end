import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { PatientRegistrationSchema } from '../patient.schema'
import type {
  PatientRegistrationFormData,
  PatientRegistrationFormInput,
} from '../patient.schema'
import { useCreatePatient } from '../hooks/useCreatePatient'
import { ErrorMessage } from '../../../shared/components/ErrorMessage'

const errorStyle = { color: 'var(--accent3)', fontSize: '11px', marginTop: '2px' }

export function PatientRegistrationForm() {
  const navigate = useNavigate()
  const { mutate, isPending, error } = useCreatePatient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PatientRegistrationFormInput, unknown, PatientRegistrationFormData>({
    resolver: zodResolver(PatientRegistrationSchema),
  })

  const onSubmit = (data: PatientRegistrationFormData) => {
    mutate(data, {
      onSuccess: () => navigate('/patients'),
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {error && <ErrorMessage error={error} />}
      <div className="form-grid" style={{ marginTop: error ? 16 : 0 }}>
        <div className="input-group span2">
          <label className="input-label">Nombre</label>
          <input className="input" type="text" {...register('name')} />
          {errors.name && <span style={errorStyle}>{errors.name.message}</span>}
        </div>

        <div className="input-group">
          <label className="input-label">Edad</label>
          <input className="input" type="number" min={0} max={120} {...register('age')} />
          {errors.age && <span style={errorStyle}>{errors.age.message}</span>}
        </div>

        <div className="input-group">
          <label className="input-label">Género</label>
          <select className="input" defaultValue="" {...register('gender')}>
            <option value="">Seleccionar...</option>
            <option value="Masculino">Masculino</option>
            <option value="Femenino">Femenino</option>
            <option value="Otro">Otro</option>
          </select>
          {errors.gender && <span style={errorStyle}>{errors.gender.message}</span>}
        </div>

        <div className="input-group">
          <label className="input-label">Diagnóstico</label>
          <select className="input" defaultValue="" {...register('diagnosis')}>
            <option value="">Seleccionar...</option>
            <option value="EA">EA — Enfermedad de Alzheimer</option>
            <option value="MCI">MCI — Deterioro Cognitivo Leve</option>
          </select>
          {errors.diagnosis && <span style={errorStyle}>{errors.diagnosis.message}</span>}
        </div>

        <div className="input-group">
          <label className="input-label">Baseline RAVLT</label>
          <input className="input" type="number" step="0.01" {...register('baselineRavlt')} />
          {errors.baselineRavlt && (
            <span style={errorStyle}>{errors.baselineRavlt.message}</span>
          )}
        </div>

        <div className="input-group">
          <label className="input-label">Baseline SART</label>
          <input className="input" type="number" step="0.01" {...register('baselineSart')} />
          {errors.baselineSart && (
            <span style={errorStyle}>{errors.baselineSart.message}</span>
          )}
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={() => navigate('/patients')}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary" disabled={isPending}>
          {isPending ? 'Registrando...' : 'Registrar paciente'}
        </button>
      </div>
    </form>
  )
}
