import { api } from './api'
import type { Neurologist } from '../store/app.store'

export async function getMe(): Promise<Neurologist> {
  return api.get<Neurologist>('/me')
}
