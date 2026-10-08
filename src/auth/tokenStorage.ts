import type { AuthToken } from '../types/Auth'

export interface Session {
  accessToken: string
  expiresAt: string
}

const STORAGE_KEY = 'cuy.session'

function browserSessionStorage(): Storage | null {
  try {
    return window.sessionStorage
  } catch {
    // private mode or storage blocked: the session lives only in memory
    return null
  }
}

function isSession(value: unknown): value is Session {
  const candidate = value as Partial<Session> | null
  return typeof candidate?.accessToken === 'string' && typeof candidate.expiresAt === 'string'
}

// The only place that touches the token: memory + sessionStorage (gone when the tab closes).
// Never localStorage, cookies, the URL or the logs.
export class TokenStorage {
  private session: Session | null = null
  private loaded = false
  private readonly storage: Storage | null

  constructor(storage: Storage | null = browserSessionStorage()) {
    this.storage = storage
  }

  read(now: number = Date.now()): Session | null {
    if (!this.loaded) {
      this.session = this.load()
      this.loaded = true
    }
    if (this.session && Date.parse(this.session.expiresAt) <= now) {
      this.clear()
    }
    return this.session
  }

  save(token: AuthToken): Session {
    this.session = { accessToken: token.accessToken, expiresAt: token.expiresAt }
    this.loaded = true
    this.storage?.setItem(STORAGE_KEY, JSON.stringify(this.session))
    return this.session
  }

  clear(): void {
    this.session = null
    this.loaded = true
    this.storage?.removeItem(STORAGE_KEY)
  }

  private load(): Session | null {
    const raw = this.storage?.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }
    try {
      const parsed: unknown = JSON.parse(raw)
      return isSession(parsed) ? parsed : null
    } catch {
      return null
    }
  }
}

export const tokenStorage = new TokenStorage()
