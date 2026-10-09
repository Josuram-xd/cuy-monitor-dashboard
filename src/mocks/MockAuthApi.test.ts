import { beforeEach, describe, expect, it } from 'vitest'
import type { DashboardApi } from '../api/DashboardApi'
import { createMockApi } from './createMockApi'
import { MOCK_OTP_CODE } from './MockAuthApi'
import { MOCK_GOOGLE_TOKEN } from './googleToken'
import { MockDatabase } from './MockDatabase'
import { mockSession } from './mockSession'

describe('mock auth', () => {
  let db: MockDatabase
  let api: DashboardApi

  beforeEach(() => {
    mockSession.end()
    db = new MockDatabase()
    api = createMockApi(db, 0)
  })

  it('logs in any user and accepts the fixed code', async () => {
    const challenge = await api.auth.login({ username: 'Juan', password: 'any-password' })
    await expect(
      api.auth.verifyOtp({ challengeId: challenge.challengeId, code: MOCK_OTP_CODE }),
    ).resolves.toBeUndefined()

    // the "cookie" is now there: the server recognises us
    await expect(api.account.getProfile()).resolves.toEqual({
      username: 'juan',
      fullName: 'juan',
      hasPassword: true,
    })
  })

  it('answers 401 to the profile until the code is verified', async () => {
    await expect(api.account.getProfile()).rejects.toMatchObject({ status: 401 })
  })

  it('returns only what the screens show in the profile', async () => {
    const challenge = await api.auth.login({ username: 'juan', password: 'any-password' })
    await api.auth.verifyOtp({ challengeId: challenge.challengeId, code: MOCK_OTP_CODE })

    const profile = await api.account.getProfile()

    expect(Object.keys(profile).sort()).toEqual(['fullName', 'hasPassword', 'username'])
  })

  it('ends the session on logout', async () => {
    const challenge = await api.auth.login({ username: 'juan', password: 'any-password' })
    await api.auth.verifyOtp({ challengeId: challenge.challengeId, code: MOCK_OTP_CODE })

    await api.auth.logout()

    await expect(api.account.getProfile()).rejects.toMatchObject({ status: 401 })
  })

  it('rejects a wrong code with 401', async () => {
    const challenge = await api.auth.login({ username: 'juan', password: 'any-password' })

    await expect(
      api.auth.verifyOtp({ challengeId: challenge.challengeId, code: '000000' }),
    ).rejects.toMatchObject({ status: 401 })
  })

  it('makes the previous code useless when a new one is asked', async () => {
    const first = await api.auth.login({ username: 'juan', password: 'any-password' })
    await api.auth.login({ username: 'juan', password: 'any-password' })

    await expect(
      api.auth.verifyOtp({ challengeId: first.challengeId, code: MOCK_OTP_CODE }),
    ).rejects.toMatchObject({ status: 401 })
  })

  it('registers as pending and activates the account with the code', async () => {
    const challenge = await api.auth.register({
      username: ' Ana ',
      fullName: 'Ana Ruiz',
      email: 'ANA@mail.com',
      password: 'Secret-pass-1',
    })
    expect(db.findUser('ana')).toMatchObject({
      status: 'PENDING_VERIFICATION',
      email: 'ana@mail.com',
    })

    await api.auth.verifyOtp({ challengeId: challenge.challengeId, code: MOCK_OTP_CODE })

    expect(db.findUser('ana')?.status).toBe('ACTIVE')
  })

  it('answers 409 when the username or email is taken', async () => {
    const body = {
      username: 'ana',
      fullName: 'Ana',
      email: 'ana@mail.com',
      password: 'Secret-pass-1',
    }
    await api.auth.register(body)

    await expect(api.auth.register(body)).rejects.toMatchObject({ status: 409, code: 'conflict' })
  })

  it('answers 400 with the password field when it is too short', async () => {
    await expect(
      api.auth.register({
        username: 'ana',
        fullName: 'Ana',
        email: 'a@mail.com',
        password: 'short',
      }),
    ).rejects.toMatchObject({ status: 400, fields: { password: expect.any(String) } })
  })

  describe('with Google', () => {
    it('opens an account without password and the session', async () => {
      await expect(api.auth.googleLogin({ idToken: MOCK_GOOGLE_TOKEN })).resolves.toBeUndefined()

      await expect(api.account.getProfile()).resolves.toMatchObject({
        username: 'ana.demo',
        hasPassword: false,
      })
      expect(db.users).toHaveLength(1)
      await api.auth.googleLogin({ idToken: MOCK_GOOGLE_TOKEN })
      expect(db.users).toHaveLength(1)
    })

    it('answers 401 to a token it does not know', async () => {
      await expect(api.auth.googleLogin({ idToken: 'forged' })).rejects.toMatchObject({
        status: 401,
      })
      await expect(api.account.getProfile()).rejects.toMatchObject({ status: 401 })
    })

    it('does not let that account log in with a password', async () => {
      await api.auth.googleLogin({ idToken: MOCK_GOOGLE_TOKEN })

      await expect(
        api.auth.login({ username: 'ana.demo', password: 'Whatever-pass-1' }),
      ).rejects.toMatchObject({ status: 401 })
    })

    it('sets a first password without an old one, then asks for it', async () => {
      await api.auth.googleLogin({ idToken: MOCK_GOOGLE_TOKEN })

      await api.account.changePassword({ newPassword: 'Brand-new-pass-9' })
      await expect(api.account.getProfile()).resolves.toMatchObject({ hasPassword: true })
      await expect(
        api.account.changePassword({ currentPassword: 'wrong', newPassword: 'Another-pass-7' }),
      ).rejects.toMatchObject({ status: 401 })
    })
  })
})
