import { config } from '../../config'
import type {
  ChangePasswordRequest,
  ProfilePhotoRequest,
  DeactivateAccountRequest,
  UpdateProfileRequest,
} from '../../types/Account'
import type { User } from '../../types/User'
import type { AccountApi } from '../DashboardApi'
import type { HttpClient } from '../HttpClient'

const BASE = '/api/v1/account'

// what the backend answers: whether there is a picture, never the picture itself
type ProfileResponse = Omit<User, 'photoUrl'> & { hasPhoto: boolean }

function withPhotoUrl({ hasPhoto, ...profile }: ProfileResponse): User {
  if (!hasPhoto) {
    return { ...profile, photoUrl: null }
  }
  // the session cookie travels with the image request, the same way a cuy's photo already works.
  // The stamp is minted when the profile is read, so a replaced picture is never the cached one.
  return { ...profile, photoUrl: `${config.apiUrl}${BASE}/photo?v=${Date.now()}` }
}

export class HttpAccountApi implements AccountApi {
  private readonly http: HttpClient

  constructor(http: HttpClient) {
    this.http = http
  }

  async getProfile(signal?: AbortSignal): Promise<User> {
    return withPhotoUrl(await this.http.get<ProfileResponse>(`${BASE}/profile`, { signal }))
  }

  async updateProfile(body: UpdateProfileRequest): Promise<User> {
    return withPhotoUrl(await this.http.put<ProfileResponse>(`${BASE}/profile`, body))
  }

  setPhoto(body: ProfilePhotoRequest): Promise<void> {
    return this.http.put<void>(`${BASE}/photo`, body)
  }

  removePhoto(): Promise<void> {
    return this.http.delete<void>(`${BASE}/photo`)
  }

  changePassword(body: ChangePasswordRequest): Promise<void> {
    return this.http.put<void>(`${BASE}/password`, body)
  }

  deactivate(body: DeactivateAccountRequest): Promise<void> {
    return this.http.delete<void>(BASE, { body })
  }
}
