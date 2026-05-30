import { api } from './api'
import type { Patient } from '../features/patients/patient.types'
import type { PatientRegistrationFormData } from '../features/patients/patient.schema'
import type { PatientDashboardData, SessionSummary, SessionHistoryItem } from '../features/analytics/analytics.types'

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

type SessionSummaryRaw = {
  session_id: string
  session_date: string
  sps: number
  sps_class: string | null
  recommendation: string | null
}

type PatientDashboardRaw = {
  global_trend: 'rising' | 'stable' | 'falling'
  trend_slope: number
  sessions: SessionSummaryRaw[]
}

function toSessionSummary(raw: SessionSummaryRaw): SessionSummary {
  return {
    sessionId: raw.session_id,
    sessionDate: raw.session_date,
    sps: raw.sps,
    spsClass: raw.sps_class,
    recommendation: raw.recommendation,
  }
}

export async function getDashboard(patientId: string): Promise<PatientDashboardData> {
  const raw = await api.get<PatientDashboardRaw>(
    `/patients/${encodeURIComponent(patientId)}/dashboard`
  )
  return {
    globalTrend: raw.global_trend,
    trendSlope: raw.trend_slope,
    sessions: (raw.sessions ?? []).map(toSessionSummary),
  }
}

type SessionHistoryItemRaw = {
  session_id: string
  session_date: string
  sps: number
  sps_class: string | null
  recommendation: string | null
  status: string
}

export async function getSessionHistory(patientId: string): Promise<SessionHistoryItem[]> {
  const raw = await api.get<SessionHistoryItemRaw[]>(
    `/patients/${encodeURIComponent(patientId)}/sessions`
  )
  return (raw ?? []).map(s => ({
    sessionId: s.session_id,
    sessionDate: s.session_date,
    sps: s.sps,
    spsClass: s.sps_class,
    recommendation: s.recommendation,
    status: s.status === 'complete' ? 'complete' : 'incomplete',
  }))
}
