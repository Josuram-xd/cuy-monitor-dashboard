import type { AuthApi } from '../api/DashboardApi'
import type {
  GoogleLoginRequest,
  LoginChallenge,
  LoginRequest,
  RegisterRequest,
  VerifyOtpRequest,
} from '../types/Auth'
import { passwordProblems } from '../auth/passwordRules'
import { MOCK_GOOGLE_TOKEN } from './googleToken'
import type { MockUser } from './MockDatabase'
import { mockSession } from './mockSession'
import { MockResource } from './MockResource'

// the fake login accepts any user; the code is always this one
export const MOCK_OTP_CODE = '123456'

// the account the demo "Continuar con Google" button opens
const GOOGLE_DEMO = { username: 'ana.demo', fullName: 'Ana Demo', email: 'ana.demo@gmail.com' }

const CODE_TTL_MS = 5 * 60_000

export class MockAuthApi extends MockResource implements AuthApi {
  register(body: RegisterRequest): Promise<LoginChallenge> {
    const username = body.username.trim().toLowerCase()
    const email = body.email.trim().toLowerCase()
    const problems = passwordProblems(body.password, { username, email })
    if (problems.length > 0) {
      // the same codes the backend sends in fields.password
      return this.fail(400, 'bad_request', {
        password: problems.map((rule) => (rule === 'LENGTH' ? 'MIN_LENGTH' : rule)).join(','),
      })
    }
    if (this.db.users.some((u) => u.username === username || u.email === email)) {
      return this.fail(409, 'conflict')
    }
    this.db.users.push({
      id: crypto.randomUUID(),
      username,
      fullName: body.fullName.trim(),
      email,
      password: body.password,
      status: 'PENDING_VERIFICATION',
    })
    return this.respond(this.newChallenge(username))
  }

  login(body: LoginRequest): Promise<LoginChallenge> {
    const username = body.username.trim().toLowerCase()
    const user = this.db.findUser(username) ?? this.createActiveUser(username, body.password)
    // an account made with Google has no password to log in with
    if (user.status === 'DISABLED' || user.password === null) {
      return this.fail(401, 'unauthorized')
    }
    return this.respond(this.newChallenge(username))
  }

  googleLogin(body: GoogleLoginRequest): Promise<void> {
    if (body.idToken !== MOCK_GOOGLE_TOKEN) {
      return this.fail(401, 'unauthorized')
    }
    let user = this.db.users.find((u) => u.email === GOOGLE_DEMO.email)
    if (!user) {
      // first visit: an active account without password, like the backend
      user = { id: crypto.randomUUID(), ...GOOGLE_DEMO, password: null, status: 'ACTIVE' }
      this.db.users.push(user)
    }
    this.db.signedInUserId = user.id
    mockSession.start()
    return this.respond(undefined)
  }

  verifyOtp(body: VerifyOtpRequest): Promise<void> {
    const challenge = this.db.challenges.get(body.challengeId)
    const valid =
      challenge !== undefined &&
      Date.parse(challenge.expiresAt) > Date.now() &&
      body.code === MOCK_OTP_CODE
    if (!valid) {
      return this.fail(401, 'unauthorized')
    }
    this.db.challenges.delete(body.challengeId)
    const user = this.db.findUser(challenge.username)
    if (user) {
      // the code proves the email is theirs, like the backend
      user.status = 'ACTIVE'
      this.db.signedInUserId = user.id
    }
    mockSession.start()
    return this.respond(undefined)
  }

  logout(): Promise<void> {
    this.db.signedInUserId = null
    mockSession.end()
    return this.respond(undefined)
  }

  private newChallenge(username: string): LoginChallenge {
    // a new code invalidates the previous ones of the same user
    for (const [id, challenge] of this.db.challenges) {
      if (challenge.username === username) {
        this.db.challenges.delete(id)
      }
    }
    const challenge = {
      challengeId: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + CODE_TTL_MS).toISOString(),
    }
    this.db.challenges.set(challenge.challengeId, { username, expiresAt: challenge.expiresAt })
    return challenge
  }

  private createActiveUser(username: string, password: string): MockUser {
    const user: MockUser = {
      id: crypto.randomUUID(),
      username,
      fullName: username,
      email: `${username}@example.com`,
      password,
      status: 'ACTIVE',
    }
    this.db.users.push(user)
    return user
  }
}
