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
