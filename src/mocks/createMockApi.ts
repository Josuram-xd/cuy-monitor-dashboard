import type { DashboardApi } from '../api/DashboardApi'
import { MockAlertApi } from './MockAlertApi'
import { MockCageApi } from './MockCageApi'
import { MockDatabase } from './MockDatabase'
import { MockGuineaPigApi } from './MockGuineaPigApi'

export function createMockApi(db = new MockDatabase(), delayMs?: number): DashboardApi {
  return {
    cages: new MockCageApi(db, delayMs),
    guineaPigs: new MockGuineaPigApi(db, delayMs),
    alerts: new MockAlertApi(db, delayMs),
  }
}
