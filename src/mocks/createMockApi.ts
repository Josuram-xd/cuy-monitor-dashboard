import type { DashboardApi } from '../api/DashboardApi'
import { MockAccountApi } from './MockAccountApi'
import { MockAdminApi } from './MockAdminApi'
import { MockAlertApi } from './MockAlertApi'
import { MockAssistantApi } from './MockAssistantApi'
import { MockAuthApi } from './MockAuthApi'
import { MockCageApi } from './MockCageApi'
import { MockCatalogApi } from './MockCatalogApi'
import { MockDatabase } from './MockDatabase'
import { MockGuineaPigApi } from './MockGuineaPigApi'
import {
  mockCageId,
  mockSimulationCage,
  mockSimulationCageId,
  mockSimulationGuineaPigs,
} from './data'

export function createMockApi(db = new MockDatabase(), delayMs?: number): DashboardApi {
  return {
    auth: new MockAuthApi(db, delayMs),
    account: new MockAccountApi(db, delayMs),
    cages: new MockCageApi(db, delayMs),
    guineaPigs: new MockGuineaPigApi(db, delayMs),
    alerts: new MockAlertApi(db, delayMs),
    catalog: new MockCatalogApi(db, delayMs),
    assistant: new MockAssistantApi(db, delayMs),
    admin: new MockAdminApi(db, delayMs),
  }
}

// VITE_USE_MOCKS=true: the pilot cage has its kit connected and the account has a simulation cage, so the
// switch between them, the camera picture and the video credit can be seen. The tests use createMockApi.
export function createDemoMockApi(delayMs?: number): DashboardApi {
  const db = new MockDatabase()
  db.cages.push(structuredClone(mockSimulationCage))
  db.guineaPigsByCage[mockSimulationCageId] = structuredClone(mockSimulationGuineaPigs)
  const api = createMockApi(db, delayMs)
  // the mock sets it at once, before the answer comes back
  void api.cages.setEquipment(mockCageId, true)
  return api
}
