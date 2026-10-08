import { ApiError } from './ApiError'

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
  // current access token, or null without a session
  getToken?: () => string | null
  // a call that carried a token got 401: the session is over
  onUnauthorized?: (error: ApiError) => void
}

export class HttpClient {
  private readonly baseUrl: string
  private readonly fetchFn: FetchFn
  private readonly getToken: () => string | null
  private readonly onUnauthorized: (error: ApiError) => void

  constructor(baseUrl: string, options: HttpClientOptions = {}) {
    this.baseUrl = baseUrl
    this.fetchFn = options.fetchFn ?? ((input, init) => fetch(input, init))
    this.getToken = options.getToken ?? (() => null)
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

  protected async request<T>(method: string, path: string, options: RequestOptions): Promise<T> {
    const { body, query, signal } = options
    const headers: Record<string, string> = { Accept: 'application/json' }
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json'
    }
    const token = this.getToken()
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    let response: Response
    try {
      response = await this.fetchFn(this.buildUrl(path, query), {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal,
      })
    } catch (error) {
      // a cancelled query is not a network failure
      if (signal?.aborted) {
        throw error
      }
      throw new ApiError(0, 'network_error')
    }

    if (!response.ok) {
      const error = await this.toApiError(response)
      // without a token a 401 is just "wrong credentials" (login, verify): not a lost session
      if (error.isUnauthorized && token) {
        this.onUnauthorized(error)
      }
      throw error
    }
    if (response.status === 204) {
      return undefined as T
    }
    return (await response.json()) as T
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
