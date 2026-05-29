import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePatients } from '../hooks/usePatients'
import { useDebounce } from '../../../shared/hooks/useDebounce'
import { PatientList } from '../components/PatientList'
import type { PatientListParams } from '../../../services/patients.service'

export default function PatientListPage() {
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState<PatientListParams['status']>(undefined)

  const debouncedSearch = useDebounce(searchInput, 300)

  const trimmedSearch = debouncedSearch.trim()
  const params: PatientListParams = {
    ...(trimmedSearch ? { name: trimmedSearch } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  }

  const { data, isPending, error } = usePatients(
    Object.keys(params).length > 0 ? params : undefined,
  )

  return (
    <div className="page">
      <div className="section-header">
        <div className="page-title">Pacientes</div>
        <button className="btn btn-primary" onClick={() => navigate('/patients/new')}>
          + Nuevo paciente
        </button>
      </div>

      <div className="search-row">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="input search-input"
            type="text"
            placeholder="Buscar por nombre..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <select
          className="input"
          style={{ width: 160 }}
          aria-label="Filtrar por estado"
          value={statusFilter ?? ''}
          onChange={(e) => {
            const val = e.target.value
            setStatusFilter(val === '' ? undefined : (val as PatientListParams['status']))
          }}
        >
          <option value="">Todos</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
        </select>
      </div>

      <PatientList patients={data} isPending={isPending} error={error} />
    </div>
  )
}
