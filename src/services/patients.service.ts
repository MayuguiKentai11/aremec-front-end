import { api } from './api'
import type { Patient } from '../features/patients/patient.types'
import type { PatientRegistrationFormData } from '../features/patients/patient.schema'

type PatientRaw = {
  id: string
  name: string
  age: number
  gender: string
  diagnosis: 'EA' | 'MCI'
  status: 'active' | 'inactive'
  baseline_ravlt: number
  baseline_sart: number
}

function toCamel(raw: PatientRaw): Patient {
  return {
    id: raw.id,
    name: raw.name,
    age: raw.age,
    gender: raw.gender,
    diagnosis: raw.diagnosis,
    status: raw.status ?? 'active',
    baselineRavlt: raw.baseline_ravlt,
    baselineSart: raw.baseline_sart,
  }
}

export async function createPatient(data: PatientRegistrationFormData): Promise<Patient> {
  const raw = await api.post<PatientRaw>('/patients', {
    name: data.name,
    age: data.age,
    gender: data.gender,
    diagnosis: data.diagnosis,
    baseline_ravlt: data.baselineRavlt,
    baseline_sart: data.baselineSart,
  })
  return toCamel(raw)
}

export type PatientListParams = {
  name?: string
  status?: 'active' | 'inactive'
}

export async function getPatients(params?: PatientListParams): Promise<Patient[]> {
  const query = new URLSearchParams()
  if (params?.name) query.set('name', params.name)
  if (params?.status) query.set('status', params.status)
  const qs = query.toString()
  const raws = await api.get<PatientRaw[]>(`/patients${qs ? `?${qs}` : ''}`)
  return raws.map(toCamel)
}

export async function getPatient(id: string): Promise<Patient> {
  const raw = await api.get<PatientRaw>(`/patients/${encodeURIComponent(id)}`)
  return toCamel(raw)
}
