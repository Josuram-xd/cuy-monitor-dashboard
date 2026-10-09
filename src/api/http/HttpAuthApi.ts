import type {
  LoginChallenge,
  LoginRequest,
  RegisterRequest,
  VerifyOtpRequest,
} from '../../types/Auth'
import type { AuthApi } from '../DashboardApi'
import type { HttpClient } from '../HttpClient'

const BASE = '/api/v1/auth'

export class HttpAuthApi implements AuthApi {
  private readonly http: HttpClient

  constructor(http: HttpClient) {
    this.http = http
  }

  register(body: RegisterRequest): Promise<LoginChallenge> {
    return this.http.post<LoginChallenge>(`${BASE}/register`, body)
  }

  login(body: LoginRequest): Promise<LoginChallenge> {
    return this.http.post<LoginChallenge>(`${BASE}/login`, body)
  }

  verifyOtp(body: VerifyOtpRequest): Promise<void> {
    return this.http.post<void>(`${BASE}/otp/verify`, body)
  }

  logout(): Promise<void> {
    return this.http.post<void>(`${BASE}/logout`, undefined)
  }
}
