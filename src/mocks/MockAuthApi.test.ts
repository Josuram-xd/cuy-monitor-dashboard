import { beforeEach, describe, expect, it } from 'vitest'
import type { DashboardApi } from '../api/DashboardApi'
import { createMockApi } from './createMockApi'
import { MOCK_OTP_CODE } from './MockAuthApi'
import { MockDatabase } from './MockDatabase'

describe('mock auth', () => {
  let db: MockDatabase
  let api: DashboardApi

  beforeEach(() => {
    db = new MockDatabase()
    api = createMockApi(db, 0)
  })

  it('logs in any user and accepts the fixed code', async () => {
    const challenge = await api.auth.login({ username: 'Juan', password: 'any-password' })
    const token = await api.auth.verifyOtp({
      challengeId: challenge.challengeId,
      code: MOCK_OTP_CODE,
    })

    expect(token.tokenType).toBe('Bearer')
    expect(Date.parse(token.expiresAt)).toBeGreaterThan(Date.now())
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
      password: 'secret-pass',
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
      password: 'secret-pass',
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
})
