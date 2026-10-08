import { config } from '../config'

export type QueryParams = Record<string, string | undefined>

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface RequestOptions {
  method?: HttpMethod
  body?: unknown
  query?: QueryParams
  signal?: AbortSignal
}

interface ErrorBody {
  error?: unknown
  message?: unknown
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message?: string) {
    super(message ?? code)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, signal } = options
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  let response: Response
  try {
    response = await fetch(buildUrl(path, query), {
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
    throw await toApiError(response)
  }
  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}

function buildUrl(path: string, query?: QueryParams): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== '') {
      params.set(key, value)
    }
  }
  const search = params.toString()
  return `${config.apiUrl}${path}${search ? `?${search}` : ''}`
}

async function toApiError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as ErrorBody
    if (typeof body.error === 'string') {
      const message = typeof body.message === 'string' ? body.message : undefined
      return new ApiError(response.status, body.error, message)
    }
  } catch {
    // not JSON, e.g. a 502 page from Caddy
  }
  return new ApiError(response.status, 'unknown_error')
}
