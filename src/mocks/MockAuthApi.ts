import type { AuthApi } from '../api/DashboardApi'
import type { LoginChallenge, LoginRequest, RegisterRequest, VerifyOtpRequest } from '../types/Auth'
import type { MockUser } from './MockDatabase'
import { mockSession } from './mockSession'
import { MockResource } from './MockResource'

// the fake login accepts any user; the code is always this one
export const MOCK_OTP_CODE = '123456'

const CODE_TTL_MS = 5 * 60_000
const MIN_PASSWORD_BYTES = 8
const MAX_PASSWORD_BYTES = 72

export class MockAuthApi extends MockResource implements AuthApi {
  register(body: RegisterRequest): Promise<LoginChallenge> {
    const username = body.username.trim().toLowerCase()
    const email = body.email.trim().toLowerCase()
    if (!this.validPassword(body.password)) {
      return this.fail(400, 'bad_request', { password: 'size must be between 8 and 72' })
    }
    if (this.db.users.some((u) => u.username === username || u.email === email)) {
      return this.fail(409, 'conflict')
    }
    this.db.users.push({
      id: crypto.randomUUID(),
      username,
      fullName: body.fullName.trim(),
      email,
      status: 'PENDING_VERIFICATION',
    })
    return this.respond(this.newChallenge(username))
  }

  login(body: LoginRequest): Promise<LoginChallenge> {
    const username = body.username.trim().toLowerCase()
    const user = this.db.findUser(username) ?? this.createActiveUser(username)
    if (user.status === 'DISABLED') {
      return this.fail(401, 'unauthorized')
    }
    return this.respond(this.newChallenge(username))
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

  private createActiveUser(username: string): MockUser {
    const user: MockUser = {
      id: crypto.randomUUID(),
      username,
      fullName: username,
      email: `${username}@example.com`,
      status: 'ACTIVE',
    }
    this.db.users.push(user)
    return user
  }

  private validPassword(password: string): boolean {
    const bytes = new TextEncoder().encode(password).length
    return bytes >= MIN_PASSWORD_BYTES && bytes <= MAX_PASSWORD_BYTES
  }
}
