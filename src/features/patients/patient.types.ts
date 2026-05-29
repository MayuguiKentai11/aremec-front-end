export type Diagnosis = 'EA' | 'MCI'
export type PatientStatus = 'active' | 'inactive'

export type Patient = {
  id: string
  name: string
  age: number
  gender: string
  diagnosis: Diagnosis
  status: PatientStatus
  baselineRavlt: number
  baselineSart: number
}
