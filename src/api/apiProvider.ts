import { tokenStorage } from '../auth/tokenStorage'
import { config } from '../config'
import type { DashboardApi } from './DashboardApi'
import { HttpAlertApi } from './http/HttpAlertApi'
import { HttpAuthApi } from './http/HttpAuthApi'
import { HttpCageApi } from './http/HttpCageApi'
import { HttpGuineaPigApi } from './http/HttpGuineaPigApi'
import { HttpClient } from './HttpClient'
import { unauthorizedNotifier } from './UnauthorizedNotifier'

let api: Promise<DashboardApi> | undefined

function createHttpApi(): DashboardApi {
  const http = new HttpClient(config.apiUrl, {
    getToken: () => tokenStorage.read()?.accessToken ?? null,
    onUnauthorized: (error) => unauthorizedNotifier.notify(error),
  })
  return {
    auth: new HttpAuthApi(http),
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
