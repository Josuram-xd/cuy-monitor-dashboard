import { ApiError } from './ApiError'

const AUTH_PREFIX = '/api/v1/auth/'
// A 401 with this message on a protected call means "wrong current password" (change password, deactivate),
// not a lost session: the user must stay logged in and see the error.
const WRONG_PASSWORD_MESSAGE = 'invalid credentials'

export type QueryParams = Record<string, string | undefined>

export type FetchFn = (input: string, init?: RequestInit) => Promise<Response>

interface RequestOptions {
  body?: unknown
  query?: QueryParams
  signal?: AbortSignal
}

interface ErrorBody {
  error?: unknown
  message?: unknown
  fields?: unknown
}

export interface HttpClientOptions {
  // injected so tests don't need to touch the global fetch
  fetchFn?: FetchFn
  // a protected call got 401 and the session could not be renewed: the session is over
  onUnauthorized?: (error: ApiError) => void
}

export class HttpClient {
  private readonly baseUrl: string
  private readonly fetchFn: FetchFn
  private readonly onUnauthorized: (error: ApiError) => void
  // all the calls that fail at the same time wait for one single refresh
  private refreshing: Promise<boolean> | null = null

  constructor(baseUrl: string, options: HttpClientOptions = {}) {
    this.baseUrl = baseUrl
    this.fetchFn = options.fetchFn ?? ((input, init) => fetch(input, init))
    this.onUnauthorized = options.onUnauthorized ?? (() => {})
  }

  get<T>(path: string, options: Omit<RequestOptions, 'body'> = {}): Promise<T> {
    return this.request<T>('GET', path, options)
  }

  post<T>(path: string, body: unknown, options: RequestOptions = {}): Promise<T> {
    return this.request<T>('POST', path, { ...options, body })
  }

  put<T>(path: string, body: unknown, options: RequestOptions = {}): Promise<T> {
    return this.request<T>('PUT', path, { ...options, body })
  }

  patch<T>(path: string, body: unknown, options: RequestOptions = {}): Promise<T> {
    return this.request<T>('PATCH', path, { ...options, body })
  }

  delete<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>('DELETE', path, options)
  }

  // The session is in HttpOnly cookies, so there is no token to attach: the browser sends them.
  // A 401 on a protected call is first answered with one silent refresh and a retry; only if the
  // refresh also fails the session is over. /api/v1/auth/* never refreshes: there a 401 just means
  // wrong credentials, wrong code or no refresh cookie.
  protected async request<T>(
    method: string,
    path: string,
    options: RequestOptions,
    retried = false,
  ): Promise<T> {
    const { body, query, signal } = options
    const headers: Record<string, string> = { Accept: 'application/json' }
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json'
    }

    const response = await this.send(this.buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })

    if (!response.ok) {
      const error = await this.toApiError(response)
      if (
        error.isUnauthorized &&
        !path.startsWith(AUTH_PREFIX) &&
        error.message !== WRONG_PASSWORD_MESSAGE
      ) {
        if (!retried && (await this.refreshSession(signal))) {
          return this.request<T>(method, path, options, true)
        }
        this.onUnauthorized(error)
      }
      throw error
    }
    if (response.status === 204) {
      return undefined as T
    }
    return (await response.json()) as T
  }

  private async send(url: string, init: RequestInit): Promise<Response> {
    try {
      // include: also works when the API is on another origin (development)
      return await this.fetchFn(url, { ...init, credentials: 'include' })
    } catch (error) {
      // a cancelled query is not a network failure
      if (init.signal?.aborted) {
        throw error
      }
      throw new ApiError(0, 'network_error')
    }
  }

  // true: new cookies are in place. false: there is no valid session to renew.
  // A network failure or a 5xx is not "no session": it throws and the user stays logged in.
  private refreshSession(signal?: AbortSignal): Promise<boolean> {
    this.refreshing ??= this.callRefresh(signal).finally(() => {
      this.refreshing = null
    })
    return this.refreshing
  }

  private async callRefresh(signal?: AbortSignal): Promise<boolean> {
    const response = await this.send(this.buildUrl(`${AUTH_PREFIX}refresh`), {
      method: 'POST',
      headers: { Accept: 'application/json' },
      signal,
    })
    if (response.ok) {
      return true
    }
    if (response.status === 401) {
      return false
    }
    throw await this.toApiError(response)
  }

  private buildUrl(path: string, query?: QueryParams): string {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined && value !== '') {
        params.set(key, value)
      }
    }
    const search = params.toString()
    return `${this.baseUrl}${path}${search ? `?${search}` : ''}`
  }

  private async toApiError(response: Response): Promise<ApiError> {
    try {
      const body = (await response.json()) as ErrorBody
      if (typeof body.error === 'string') {
        const message = typeof body.message === 'string' ? body.message : undefined
        return new ApiError(response.status, body.error, message, this.toFields(body.fields))
      }
    } catch {
      // not JSON, e.g. a 502 page from Caddy
    }
    return new ApiError(response.status, 'unknown_error')
  }

  private toFields(fields: unknown): Record<string, string> {
    if (typeof fields !== 'object' || fields === null) {
      return {}
    }
    return Object.fromEntries(
      Object.entries(fields).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string',
      ),
    )
  }
}
