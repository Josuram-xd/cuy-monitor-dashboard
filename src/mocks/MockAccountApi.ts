import type { AccountApi } from '../api/DashboardApi'
import {
  NICKNAME_MAX_LENGTH,
  type ChangePasswordRequest,
  type DeactivateAccountRequest,
  type ProfilePhotoRequest,
  type UpdateProfileRequest,
} from '../types/Account'
import { passwordProblems } from '../auth/passwordRules'
import type { User } from '../types/User'
import type { MockUser } from './MockDatabase'
import { mockSession } from './mockSession'
import { MockResource } from './MockResource'

const ACCEPTED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// after a reload the fake database is empty but the fake session survives: answer with a demo user
const DEMO_USER: User = {
  username: 'demo',
  fullName: 'Usuario de prueba',
  nickname: null,
  displayName: 'Usuario de prueba',
  hasPassword: true,
  photoUrl: null,
}

function toProfile(user: MockUser): User {
  const nickname = user.nickname ?? null
  return {
    username: user.username,
    fullName: user.fullName,
    nickname,
    displayName: nickname ?? user.fullName,
    hasPassword: user.password !== null,
    photoUrl: user.photoUrl ?? null,
  }
}

export class MockAccountApi extends MockResource implements AccountApi {
  getProfile(): Promise<User> {
    const user = this.currentUser()
    if (user) {
      return this.respond(toProfile(user))
    }
    // no cookie, no profile: the same 401 the backend gives
    return mockSession.has() ? this.respond(DEMO_USER) : this.fail(401, 'unauthorized')
  }

  updateProfile(body: UpdateProfileRequest): Promise<User> {
    const fullName = body.fullName.trim()
    if (!fullName || fullName.length > 150) {
      return this.fail(400, 'bad_request', { fullName: 'invalid' })
    }
    const nickname = body.nickname?.trim() || null
    if (nickname && nickname.length > NICKNAME_MAX_LENGTH) {
      return this.fail(400, 'bad_request', { nickname: 'invalid' })
    }
    const user = this.currentUser()
    if (user) {
      user.fullName = fullName
      user.nickname = nickname
      return this.respond(toProfile(user))
    }
    return mockSession.has()
      ? this.respond({ ...DEMO_USER, fullName, nickname, displayName: nickname ?? fullName })
      : this.fail(401, 'unauthorized')
  }

  setPhoto(body: ProfilePhotoRequest): Promise<void> {
    const user = this.currentUser()
    if (!user && !mockSession.has()) {
      return this.fail(401, 'unauthorized')
    }
    if (!ACCEPTED_PHOTO_TYPES.includes(body.photoContentType)) {
      return this.fail(400, 'bad_request', { photo: 'invalid' })
    }
    if (user) {
      user.photoUrl = `data:${body.photoContentType};base64,${body.photo}`
    }
    return this.respond(undefined)
  }

  removePhoto(): Promise<void> {
    const user = this.currentUser()
    if (!user && !mockSession.has()) {
      return this.fail(401, 'unauthorized')
    }
    if (user) {
      user.photoUrl = null
    }
    return this.respond(undefined)
  }

  changePassword(body: ChangePasswordRequest): Promise<void> {
    const user = this.currentUser()
    if (!user && !mockSession.has()) {
      return this.fail(401, 'unauthorized')
    }
    // an account without password has nothing to check: its open session is the proof
    if (user && user.password !== null && user.password !== body.currentPassword) {
      return this.fail(401, 'unauthorized')
    }
    const problems = passwordProblems(body.newPassword, {
      username: user?.username,
      email: user?.email,
    })
    if (problems.length > 0) {
      return this.fail(400, 'bad_request', {
        password: problems.map((rule) => (rule === 'LENGTH' ? 'MIN_LENGTH' : rule)).join(','),
      })
    }
    if (user) {
      user.password = body.newPassword
    }
    return this.respond(undefined)
  }

  deactivate(body: DeactivateAccountRequest): Promise<void> {
    const user = this.currentUser()
    if (user && user.password !== null && user.password !== body.currentPassword) {
      return this.fail(401, 'unauthorized')
    }
    if (user) {
      user.status = 'DISABLED'
    }
    this.db.signedInUserId = null
    mockSession.end()
    return this.respond(undefined)
  }

  private currentUser(): MockUser | undefined {
    return this.db.users.find((u) => u.id === this.db.signedInUserId)
  }
}
