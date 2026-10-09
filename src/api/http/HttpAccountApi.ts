import type { User } from '../../types/User'
import type { AccountApi } from '../DashboardApi'
import type { HttpClient } from '../HttpClient'

export class HttpAccountApi implements AccountApi {
  private readonly http: HttpClient

  constructor(http: HttpClient) {
    this.http = http
  }

  getProfile(signal?: AbortSignal): Promise<User> {
    return this.http.get<User>('/api/v1/account/profile', { signal })
  }
}
