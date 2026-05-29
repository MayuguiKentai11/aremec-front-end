import { api } from './api'
import type { Neurologist } from '../store/app.store'

export async function getMe(): Promise<Neurologist> {
  return api.get<Neurologist>('/me')
}

export async function logout(): Promise<void> {
  return api.post<void>('/auth/logout', {})
}
