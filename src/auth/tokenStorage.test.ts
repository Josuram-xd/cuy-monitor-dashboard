import { beforeEach, describe, expect, it } from 'vitest'
import { TokenStorage } from './tokenStorage'

const KEY = 'cuy.session'

function token(expiresInMs: number) {
  return {
    accessToken: 'abc',
    tokenType: 'Bearer' as const,
    expiresAt: new Date(Date.now() + expiresInMs).toISOString(),
  }
}

describe('TokenStorage', () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
  })

  it('keeps the session in sessionStorage, never in localStorage', () => {
    new TokenStorage(sessionStorage).save(token(60_000))

    expect(sessionStorage.getItem(KEY)).toContain('abc')
    expect(localStorage.length).toBe(0)
  })

  it('reads the session back after a reload (new instance, same tab)', () => {
    new TokenStorage(sessionStorage).save(token(60_000))

    expect(new TokenStorage(sessionStorage).read()?.accessToken).toBe('abc')
  })

  it('drops an expired session', () => {
    new TokenStorage(sessionStorage).save(token(-1_000))

    expect(new TokenStorage(sessionStorage).read()).toBeNull()
    expect(sessionStorage.getItem(KEY)).toBeNull()
  })

  it('ignores a broken stored value', () => {
    sessionStorage.setItem(KEY, '{not json')

    expect(new TokenStorage(sessionStorage).read()).toBeNull()
  })

  it('clears memory and storage on logout', () => {
    const storage = new TokenStorage(sessionStorage)
    storage.save(token(60_000))

    storage.clear()

    expect(storage.read()).toBeNull()
    expect(sessionStorage.getItem(KEY)).toBeNull()
  })
})
