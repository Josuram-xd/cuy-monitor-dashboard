import type { Alert, AlertStatus } from '../types/Alert'
import type { LoginChallenge, LoginRequest, RegisterRequest, VerifyOtpRequest } from '../types/Auth'
import type { CageHealth } from '../types/CageHealth'
import type { DateRange } from '../types/DateRange'
import type { GuineaPig, GuineaPigHistory, NewGuineaPig } from '../types/GuineaPig'
import type { User } from '../types/User'
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

// /api/v1/auth/*: a 401 here means wrong credentials or wrong code, never a lost session
export interface AuthApi {
  register(body: RegisterRequest): Promise<LoginChallenge>
  // also resends the code of an account that was never verified
  login(body: LoginRequest): Promise<LoginChallenge>
  // the answer is empty: the session arrives as HttpOnly cookies the page cannot read
  verifyOtp(body: VerifyOtpRequest): Promise<void>
  // ends the session on the server; it expires the cookies and revokes the tokens
  logout(): Promise<void>
}

// the account of whoever owns the session cookie; the rest of the account CRUD comes in Task 14.1
export interface AccountApi {
  getProfile(signal?: AbortSignal): Promise<User>
}

export interface DashboardApi {
  auth: AuthApi
  account: AccountApi
  cages: CageApi
  guineaPigs: GuineaPigApi
  alerts: AlertApi
}
