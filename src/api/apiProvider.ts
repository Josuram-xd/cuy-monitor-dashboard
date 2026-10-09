import { config } from '../config'
import type { DashboardApi } from './DashboardApi'
import { HttpAccountApi } from './http/HttpAccountApi'
import { HttpAlertApi } from './http/HttpAlertApi'
import { HttpAuthApi } from './http/HttpAuthApi'
import { HttpCageApi } from './http/HttpCageApi'
import { HttpGuineaPigApi } from './http/HttpGuineaPigApi'
import { HttpClient } from './HttpClient'
import { unauthorizedNotifier } from './UnauthorizedNotifier'

let api: Promise<DashboardApi> | undefined

function createHttpApi(): DashboardApi {
  const http = new HttpClient(config.apiUrl, {
    onUnauthorized: (error) => unauthorizedNotifier.notify(error),
  })
  return {
    auth: new HttpAuthApi(http),
    account: new HttpAccountApi(http),
    cages: new HttpCageApi(http),
    guineaPigs: new HttpGuineaPigApi(http),
    alerts: new HttpAlertApi(http),
  }
}

// Picks the implementation once (backend or fake data) and reuses it.
// The mocks are a dynamic import so they stay out of the production bundle.
export function getDashboardApi(): Promise<DashboardApi> {
  api ??= config.useMocks
    ? import('../mocks/createMockApi').then(({ createMockApi }) => createMockApi())
    : Promise.resolve(createHttpApi())
  return api
}
