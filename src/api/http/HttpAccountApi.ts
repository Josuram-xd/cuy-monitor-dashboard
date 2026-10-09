import type {
  ChangePasswordRequest,
  DeactivateAccountRequest,
  UpdateProfileRequest,
} from '../../types/Account'
import type { User } from '../../types/User'
import type { AccountApi } from '../DashboardApi'
import type { HttpClient } from '../HttpClient'

const BASE = '/api/v1/account'

export class HttpAccountApi implements AccountApi {
  private readonly http: HttpClient

  constructor(http: HttpClient) {
    this.http = http
  }

  getProfile(signal?: AbortSignal): Promise<User> {
    return this.http.get<User>(`${BASE}/profile`, { signal })
  }

  updateProfile(body: UpdateProfileRequest): Promise<User> {
    return this.http.put<User>(`${BASE}/profile`, body)
  }

  changePassword(body: ChangePasswordRequest): Promise<void> {
    return this.http.put<void>(`${BASE}/password`, body)
  }

  deactivate(body: DeactivateAccountRequest): Promise<void> {
    return this.http.delete<void>(BASE, { body })
  }
}
