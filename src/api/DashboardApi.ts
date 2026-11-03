import type {
  ChangePasswordRequest,
  DeactivateAccountRequest,
  UpdateProfileRequest,
} from '../types/Account'
import type { Alert, AlertStatus } from '../types/Alert'
import type {
  GoogleLoginRequest,
  LoginChallenge,
  LoginRequest,
  RegisterRequest,
  VerifyOtpRequest,
} from '../types/Auth'
import type { Cage, CageInput } from '../types/Cage'
import type { CageHealth } from '../types/CageHealth'
import type { DateRange } from '../types/DateRange'
import type { GuineaPig, GuineaPigHistory, NewGuineaPig } from '../types/GuineaPig'
import type { User } from '../types/User'
import type { CageWeight } from '../types/WeightReading'

// One interface per resource. The hooks only know these, never whether the answer
// comes from the backend (HttpXxxApi) or from the fake data (MockXxxApi).

export interface CageApi {
  // the cages of the account in the session, oldest first
  list(signal?: AbortSignal): Promise<Cage[]>
  get(cageId: string, signal?: AbortSignal): Promise<Cage>
  create(body: CageInput): Promise<Cage>
  update(cageId: string, body: CageInput): Promise<Cage>
  // soft delete: it leaves the list, its cuyes and history are kept. 403 if it is another account's
  remove(cageId: string): Promise<void>
  getHealth(cageId: string, signal?: AbortSignal): Promise<CageHealth>
  getWeight(cageId: string, range?: DateRange, signal?: AbortSignal): Promise<CageWeight>
}

export interface GuineaPigApi {
  list(cageId: string, signal?: AbortSignal): Promise<GuineaPig[]>
  register(cageId: string, body: NewGuineaPig): Promise<GuineaPig>
  getHistory(id: number, range?: DateRange, signal?: AbortSignal): Promise<GuineaPigHistory>
  // soft delete: it leaves the cage and frees its mark color, its history is kept. 404 if it is already gone
  remove(cageId: string, id: number): Promise<void>
}

export interface AlertApi {
  // without cageId: the alerts of every cage of the account
  list(status?: AlertStatus, cageId?: string, signal?: AbortSignal): Promise<Alert[]>
  markReviewed(id: number): Promise<Alert>
}

// /api/v1/auth/*: a 401 here means wrong credentials or wrong code, never a lost session
export interface AuthApi {
  register(body: RegisterRequest): Promise<LoginChallenge>
  // also resends the code of an account that was never verified
  login(body: LoginRequest): Promise<LoginChallenge>
  // sign in or sign up with the ID token of Google's button; no code, the session arrives as cookies
  googleLogin(body: GoogleLoginRequest): Promise<void>
  // the answer is empty: the session arrives as HttpOnly cookies the page cannot read
  verifyOtp(body: VerifyOtpRequest): Promise<void>
  // ends the session on the server; it expires the cookies and revokes the tokens
  logout(): Promise<void>
}

// the account of whoever owns the session cookie
export interface AccountApi {
  getProfile(signal?: AbortSignal): Promise<User>
  updateProfile(body: UpdateProfileRequest): Promise<User>
  // 401 "invalid credentials" when the current password is wrong
  changePassword(body: ChangePasswordRequest): Promise<void>
  // soft delete: the account can no longer log in. Same 401 for a wrong password
  deactivate(body: DeactivateAccountRequest): Promise<void>
}

export interface DashboardApi {
  auth: AuthApi
  account: AccountApi
  cages: CageApi
  guineaPigs: GuineaPigApi
  alerts: AlertApi
}
