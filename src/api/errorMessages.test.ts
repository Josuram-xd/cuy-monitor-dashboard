import { describe, expect, it } from 'vitest'
import { ApiError } from './ApiError'
import { errorMessageKey } from './errorMessages'

describe('errorMessageKey', () => {
  it.each([
    [new ApiError(401, 'unauthorized'), 'login', 'auth.error.invalidCredentials'],
    [new ApiError(401, 'unauthorized'), 'verify', 'auth.error.invalidCode'],
    [new ApiError(409, 'conflict'), 'register', 'auth.error.userExists'],
    [
      new ApiError(400, 'bad_request', 'validation failed', { password: 'size' }),
      'register',
      'auth.error.weakPassword',
    ],
    [new ApiError(400, 'bad_request'), 'general', 'errors.invalidData'],
    [new ApiError(0, 'network_error'), 'login', 'errors.network'],
    [new ApiError(500, 'unknown_error'), 'general', 'errors.generic'],
  ] as const)('maps %o on %s to %s', (error, context, key) => {
    expect(errorMessageKey(error, context)).toBe(key)
  })

  it('never exposes anything that is not an ApiError', () => {
    expect(errorMessageKey(new TypeError('boom'))).toBe('errors.generic')
  })
})
