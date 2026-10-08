import type { Alert, AlertStatus } from '../types/Alert'
import type { CageHealth } from '../types/CageHealth'
import type { DateRange } from '../types/DateRange'
import type { GuineaPig, GuineaPigHistory, NewGuineaPig } from '../types/GuineaPig'
import type { CageWeight } from '../types/WeightReading'

// One interface per resource. The hooks only know these, never whether the answer
// comes from the backend (HttpXxxApi) or from the fake data (MockXxxApi).

export interface CageApi {
  getHealth(cageId: string, signal?: AbortSignal): Promise<CageHealth>
  getWeight(cageId: string, range?: DateRange, signal?: AbortSignal): Promise<CageWeight>
}

export interface GuineaPigApi {
  list(cageId: string, signal?: AbortSignal): Promise<GuineaPig[]>
  register(cageId: string, body: NewGuineaPig): Promise<GuineaPig>
  getHistory(id: number, range?: DateRange, signal?: AbortSignal): Promise<GuineaPigHistory>
}

export interface AlertApi {
  list(status?: AlertStatus, signal?: AbortSignal): Promise<Alert[]>
  markReviewed(id: number): Promise<Alert>
}

export interface DashboardApi {
  cages: CageApi
  guineaPigs: GuineaPigApi
  alerts: AlertApi
}
